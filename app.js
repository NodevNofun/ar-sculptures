class ARApplication {
    constructor() {
        this.scene = null;
        this.isARActive = false;
        this.objects = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkCompatibility();
    }

    setupEventListeners() {
        document.getElementById('start-button').addEventListener('click', () => this.startAR());
        document.getElementById('clear-button').addEventListener('click', () => this.clearScene());
        document.getElementById('screenshot-button').addEventListener('click', () => this.takeScreenshot());
        
        // Обработка ориентации устройства
        window.addEventListener('deviceorientation', (e) => {
            this.handleDeviceOrientation(e);
        });
    }

    async checkCompatibility() {
        const debugInfo = document.getElementById('debug-info');
        
        // Проверка WebGL
        if (!this.detectWebGL()) {
            this.showError('Ваш браузер не поддерживает WebGL');
            return false;
        }

        // Проверка API камеры
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showError('Камера не доступна в вашем браузере');
            return false;
        }

        debugInfo.innerHTML += '✅ Браузер поддерживает AR<br>';
        return true;
    }

    detectWebGL() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    }

    async startAR() {
        if (this.isARActive) return;

        const loading = document.getElementById('loading');
        const startButton = document.getElementById('start-button');
        
        loading.style.display = 'block';
        startButton.disabled = true;

        try {
            // Запрос доступа к камере
            await this.requestCameraPermission();
            
            // Создание AR сцены
            this.createARScene();
            
            this.isARActive = true;
            this.showMessage('AR активирован! Двигайте устройством');

        } catch (error) {
            this.showError('Ошибка запуска AR: ' + error.message);
            loading.style.display = 'none';
            startButton.disabled = false;
        }
    }

    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // Освобождаем stream после проверки
            stream.getTracks().forEach(track => track.stop());
            
            return true;
        } catch (error) {
            throw new Error('Доступ к камере запрещен');
        }
    }

    createARScene() {
        const arScene = document.getElementById('ar-scene');
        
        // Очищаем предыдущую сцену
        if (this.scene) {
            arScene.removeChild(this.scene);
        }

        this.scene = document.createElement('a-scene');
        this.scene.setAttribute('embedded', '');
        this.scene.setAttribute('arjs', `
            sourceType: webcam;
            trackingMethod: best;
            debugUIEnabled: false;
            sourceWidth: 1280;
            sourceHeight: 720;
            displayWidth: 1280;
            displayHeight: 720;
        `);
        this.scene.setAttribute('vr-mode-ui', 'enabled: false');
        this.scene.setAttribute('renderer', 'logarithmicDepthBuffer: true; colorManagement: true;');

        // Камера
        const camera = document.createElement('a-camera');
        camera.setAttribute('static', 'true');
        this.scene.appendChild(camera);

        // Освещение
        this.setupLighting();

        // Обработчики событий
        this.setupSceneEvents();

        arScene.appendChild(this.scene);
        
        const loading = document.getElementById('loading');
        loading.style.display = 'none';
    }

    setupLighting() {
        // Ambient light
        const ambientLight = document.createElement('a-entity');
        ambientLight.setAttribute('light', {
            type: 'ambient',
            color: '#CCC',
            intensity: 0.6
        });
        this.scene.appendChild(ambientLight);

        // Directional light
        const directionalLight = document.createElement('a-entity');
        directionalLight.setAttribute('light', {
            type: 'directional',
            color: '#FFF',
            intensity: 0.8,
            position: { x: 0, y: 1, z: 1 }
        });
        this.scene.appendChild(directionalLight);
    }

    setupSceneEvents() {
        this.scene.addEventListener('loaded', () => {
            this.debugLog('Сцена загружена');
            this.setupInteractions();
        });

        this.scene.addEventListener('click', (e) => {
            if (e.detail.intersection) {
                this.createObject(e.detail.intersection.point);
            }
        });

        // События отслеживания
        this.scene.addEventListener('markerFound', (e) => {
            this.debugLog('Маркер найден: ' + e.target.id);
        });

        this.scene.addEventListener('markerLost', (e) => {
            this.debugLog('Маркер потерян: ' + e.target.id);
        });
    }

    setupInteractions() {
        // Курсор для взаимодействия
        const cursor = document.createElement('a-entity');
        cursor.setAttribute('cursor', {
            rayOrigin: 'mouse',
            fuse: false
        });
        cursor.setAttribute('raycaster', {
            objects: '.clickable'
        });
        cursor.setAttribute('position', '0 0 -1');

        const cursorRing = document.createElement('a-entity');
        cursorRing.setAttribute('geometry', {
            primitive: 'ring',
            radiusInner: 0.02,
            radiusOuter: 0.03
        });
        cursorRing.setAttribute('material', {
            color: '#00FFFF',
            shader: 'flat'
        });
        cursorRing.setAttribute('position', '0 0 -1');

        cursor.appendChild(cursorRing);
        this.scene.querySelector('a-camera').appendChild(cursor);
    }

    createObject(position) {
        const objectTypes = ['box', 'sphere', 'cylinder', 'cone'];
        const randomType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
        
        const object = document.createElement('a-entity');
        object.setAttribute('position', position);
        object.setAttribute('class', 'clickable');
        object.setAttribute('data-type', randomType);

        let geometry;
        switch (randomType) {
            case 'box':
                geometry = document.createElement('a-box');
                geometry.setAttribute('width', '0.2');
                geometry.setAttribute('height', '0.2');
                geometry.setAttribute('depth', '0.2');
                break;
            case 'sphere':
                geometry = document.createElement('a-sphere');
                geometry.setAttribute('radius', '0.1');
                break;
            case 'cylinder':
                geometry = document.createElement('a-cylinder');
                geometry.setAttribute('radius', '0.1');
                geometry.setAttribute('height', '0.3');
                break;
            case 'cone':
                geometry = document.createElement('a-cone');
                geometry.setAttribute('radius-bottom', '0.15');
                geometry.setAttribute('radius-top', '0.05');
                geometry.setAttribute('height', '0.3');
                break;
        }

        geometry.setAttribute('color', this.getRandomColor());
        geometry.setAttribute('animation', {
            property: 'rotation',
            to: '0 360 0',
            loop: true,
            dur: Math.random() * 3000 + 2000
        });

        object.appendChild(geometry);
        this.scene.appendChild(object);
        this.objects.push(object);

        this.showMessage(`Создан ${randomType}!`);
    }

    clearScene() {
        this.objects.forEach(object => {
            if (object.parentNode) {
                object.parentNode.removeChild(object);
            }
        });
        this.objects = [];
        this.showMessage('Сцена очищена');
    }

    async takeScreenshot() {
        try {
            const canvas = await html2canvas(document.body);
            const link = document.createElement('a');
            link.download = 'ar-screenshot-' + new Date().toISOString() + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            this.showMessage('Скриншот сохранен!');
        } catch (error) {
            this.showError('Ошибка создания скриншота');
        }
    }

    handleDeviceOrientation(e) {
        // Можно использовать для дополнительных взаимодействий
        if (this.isARActive) {
            // Пример: изменение освещения based on device orientation
            const gamma = e.gamma || 0; // -90 to 90
            const beta = e.beta || 0;   // -180 to 180
            
            const intensity = 0.6 + (Math.abs(gamma) / 90) * 0.4;
            const directionalLight = this.scene.querySelector('[light][type="directional"]');
            if (directionalLight) {
                directionalLight.setAttribute('light', 'intensity', intensity);
            }
        }
    }

    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', 
            '#FB5607', '#FF006E', '#8338EC', '#3A86FF'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showMessage(text) {
        const message = document.querySelector('.message');
        if (message) {
            message.textContent = text;
            setTimeout(() => {
                message.textContent = '🚀 Добро пожаловать в AR мир!';
            }, 3000);
        }
    }

    showError(text) {
        this.debugLog('❌ ' + text);
        alert(text);
    }

    debugLog(message) {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.innerHTML += message + '<br>';
            // Автоскролл
            debugInfo.scrollTop = debugInfo.scrollHeight;
        }
        console.log(message);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.arApp = new ARApplication();
});