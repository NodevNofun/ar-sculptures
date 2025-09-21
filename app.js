class ARApplication {
    constructor() {
        this.scene = null;
        this.isARActive = false;
        this.objects = [];
        this.isDevelopment = true; // Режим разработки на компьютере
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkCompatibility();
    }

    setupEventListeners() {
        document.getElementById('start-button').addEventListener('click', () => this.startAR());
        document.getElementById('clear-button').addEventListener('click', () => this.clearScene());
        
        // Горячие клавиши для разработки
        document.addEventListener('keydown', (e) => {
            if (e.key === 'd') this.toggleDevMode();
            if (e.key === 'c') this.clearScene();
        });
    }

    async checkCompatibility() {
        if (!this.detectWebGL()) {
            this.showError('Ваш браузер не поддерживает WebGL');
            return false;
        }
        this.debugLog('✅ Браузер поддерживает AR');
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
            if (!this.isDevelopment) {
                await this.requestCameraPermission();
            }
            
            this.createARScene();
            this.isARActive = true;
            this.showMessage('AR активирован!');

        } catch (error) {
            this.showError('Ошибка запуска AR: ' + error.message);
            loading.style.display = 'none';
            startButton.disabled = false;
        }
    }

    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            throw new Error('Доступ к камере запрещен');
        }
    }

    createARScene() {
        const arScene = document.getElementById('ar-scene');
        
        if (this.scene) {
            arScene.removeChild(this.scene);
        }

        if (this.isDevelopment) {
            this.createDevelopmentScene();
        } else {
            this.createProductionScene();
        }

        arScene.appendChild(this.scene);
        document.getElementById('loading').style.display = 'none';
    }

    createProductionScene() {
        this.scene = document.createElement('a-scene');
        this.scene.setAttribute('embedded', '');
        this.scene.setAttribute('arjs', `
            sourceType: webcam;
            trackingMethod: best;
            debugUIEnabled: false;
        `);
        this.scene.setAttribute('vr-mode-ui', 'enabled: false');
        this.scene.setAttribute('renderer', 'logarithmicDepthBuffer: true;');

        const camera = document.createElement('a-camera');
        camera.setAttribute('static', 'true');
        this.scene.appendChild(camera);

        this.setupLighting();
        this.setupSceneEvents();
    }

    createDevelopmentScene() {
        this.debugLog('🚧 Режим разработки - эмуляция AR');
        
        this.scene = document.createElement('a-scene');
        this.scene.setAttribute('embedded', '');
        this.scene.setAttribute('renderer', 'colorManagement: true;');
        
        const camera = document.createElement('a-camera');
        camera.setAttribute('position', '0 1.6 0');
        this.scene.appendChild(camera);
        
        this.setupLighting();
        this.createTestEnvironment();
        this.setupSceneEvents();
    }

    createTestEnvironment() {
        // Пол
        const floor = document.createElement('a-plane');
        floor.setAttribute('position', '0 0 -2');
        floor.setAttribute('rotation', '-90 0 0');
        floor.setAttribute('width', '4');
        floor.setAttribute('height', '4');
        floor.setAttribute('color', '#7BC8A4');
        this.scene.appendChild(floor);

        // Несколько тестовых объектов
        this.createObject({x: -1, y: 0.5, z: -2});
        this.createObject({x: 0, y: 0.5, z: -2});
        this.createObject({x: 1, y: 0.5, z: -2});
    }

    setupLighting() {
        const ambientLight = document.createElement('a-entity');
        ambientLight.setAttribute('light', {
            type: 'ambient',
            color: '#CCC',
            intensity: 0.6
        });
        this.scene.appendChild(ambientLight);

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
    }

    setupInteractions() {
        const cursor = document.createElement('a-entity');
        cursor.setAttribute('cursor', { rayOrigin: 'mouse', fuse: false });
        cursor.setAttribute('raycaster', { objects: '.clickable' });
        cursor.setAttribute('position', '0 0 -1');

        const cursorRing = document.createElement('a-entity');
        cursorRing.setAttribute('geometry', {
            primitive: 'ring',
            radiusInner: 0.02,
            radiusOuter: 0.03
        });
        cursorRing.setAttribute('material', { color: '#00FFFF', shader: 'flat' });
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

    toggleDevMode() {
        this.isDevelopment = !this.isDevelopment;
        this.debugLog(this.isDevelopment ? '🔧 Режим разработки' : '📱 AR режим');
        this.clearScene();
        this.createARScene();
    }

    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', '#FB5607', '#FF006E'];
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
            debugInfo.scrollTop = debugInfo.scrollHeight;
        }
        console.log(message);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.arApp = new ARApplication();
});