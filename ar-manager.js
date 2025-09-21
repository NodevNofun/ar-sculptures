class ARManager {
    constructor() {
        this.scene = null;
        this.isARActive = false;
        this.objects = [];
        this.isMobile = this.detectMobile();
    }

    detectMobile() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    init() {
        this.debugLog('Устройство: ' + (this.isMobile ? 'Мобильное' : 'Десктоп'));
        this.disableZoom();
        return this;
    }

    disableZoom() {
        // Предотвращение zoom жестов
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });

        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    async startAR() {
        if (this.isARActive) {
            this.debugLog('AR уже активен');
            return false;
        }

        this.showLoading(true);

        try {
            if (this.isMobile) {
                await this.requestCameraPermission();
            }
            
            this.createARScene();
            return true;
            
        } catch (error) {
            this.showError('Ошибка запуска AR: ' + error.message);
            this.showLoading(false);
            return false;
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
            stream.getTracks().forEach(track => track.stop());
            this.debugLog('Доступ к камере разрешен');
            return true;
        } catch (error) {
            throw new Error('Разрешите доступ к камере в настройках браузера');
        }
    }

    createARScene() {
        const arScene = document.getElementById('ar-scene');
        
        // Очищаем предыдущую сцену
        if (this.scene) {
            arScene.removeChild(this.scene);
        }

        this.scene = document.createElement('a-scene');
        
        if (this.isMobile) {
            this.setupMobileAR();
        } else {
            this.setupDesktopAR();
        }

        this.setupLighting();
        this.setupEventListeners();
        
        arScene.appendChild(this.scene);
    }

    setupMobileAR() {
        this.debugLog('Настройка мобильного AR');
        
        this.scene.setAttribute('embedded', '');
        this.scene.setAttribute('vr-mode-ui', 'enabled: false');
        this.scene.setAttribute('renderer', `
            logarithmicDepthBuffer: true;
            antialias: true;
            precision: mediump;
        `);
        
        this.scene.setAttribute('arjs', `
            sourceType: webcam;
            trackingMethod: best;
            debugUIEnabled: false;
            sourceWidth: 1280;
            sourceHeight: 720;
            displayWidth: 1280;
            displayHeight: 720;
            detectionMode: mono_and_matrix;
            matrixCodeType: 3x3;
            maxDetectionRate: 30;
            cameraParametersUrl: https://raw.githack.com/AR-js-org/AR.js/master/aframe/data/data/camera_para.dat;
        `);

        const camera = document.createElement('a-camera');
        camera.setAttribute('gps-camera', '');
        camera.setAttribute('rotation-reader', '');
        this.scene.appendChild(camera);
    }

    setupDesktopAR() {
        this.debugLog('Настройка десктопного режима');
        
        this.scene.setAttribute('embedded', '');
        this.scene.setAttribute('renderer', 'colorManagement: true;');
        
        const camera = document.createElement('a-camera');
        camera.setAttribute('position', '0 1.6 0');
        camera.setAttribute('cursor', 'rayOrigin: mouse; fuse: false;');
        camera.setAttribute('raycaster', 'objects: .clickable;');
        this.scene.appendChild(camera);
        
        this.createTestEnvironment();
    }

    createTestEnvironment() {
        const floor = document.createElement('a-plane');
        floor.setAttribute('position', '0 0 -2');
        floor.setAttribute('rotation', '-90 0 0');
        floor.setAttribute('width', '4');
        floor.setAttribute('height', '4');
        floor.setAttribute('color', '#7BC8A4');
        floor.setAttribute('class', 'clickable');
        this.scene.appendChild(floor);

        // Добавляем несколько тестовых объектов
        this.createObject({x: -1, y: 0.3, z: -2});
        this.createObject({x: 1, y: 0.3, z: -2});
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

    setupEventListeners() {
        this.scene.addEventListener('loaded', () => {
            this.handleSceneLoaded();
        });

        this.scene.addEventListener('click', (e) => {
            this.handleSceneClick(e);
        });

        if (this.isMobile) {
            this.scene.addEventListener('arReady', () => {
                this.debugLog('AR система готова к работе');
            });
        }
    }

    handleSceneLoaded() {
        this.debugLog('AR сцена загружена');
        this.showLoading(false);
        this.isARActive = true;
        this.showClearButton(true);
        
        if (this.isMobile) {
            this.showMessage('Медленно двигайте камерой вокруг себя');
            setTimeout(() => {
                this.showMessage('Тапните по поверхности для размещения объекта');
            }, 4000);
        }
    }

    handleSceneClick(e) {
        if (e.detail.intersection && e.detail.intersection.point) {
            this.createObject(e.detail.intersection.point);
        }
    }

    createObject(position) {
        const objectTypes = ['box', 'sphere'];
        const randomType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
        
        const object = document.createElement('a-entity');
        object.setAttribute('position', position);
        object.setAttribute('class', 'clickable ar-object');

        let geometry;
        switch (randomType) {
            case 'box':
                geometry = document.createElement('a-box');
                geometry.setAttribute('width', '0.3');
                geometry.setAttribute('height', '0.3');
                geometry.setAttribute('depth', '0.3');
                break;
            case 'sphere':
                geometry = document.createElement('a-sphere');
                geometry.setAttribute('radius', '0.15');
                break;
        }

        geometry.setAttribute('color', this.getRandomColor());
        geometry.setAttribute('shadow', 'cast: true; receive: true;');
        geometry.setAttribute('animation', `
            property: rotation; 
            to: 0 360 0; 
            loop: true; 
            dur: 3000;
            easing: linear
        `);

        object.appendChild(geometry);
        this.scene.appendChild(object);
        this.objects.push(object);

        this.showMessage(`Объект размещен!`);
        this.debugLog(`Создан ${randomType}`);
    }

    clearScene() {
        if (!this.scene) return;

        this.objects.forEach(object => {
            if (object.parentNode) {
                object.parentNode.removeChild(object);
            }
        });
        this.objects = [];
        this.showMessage('Все объекты удалены');
        this.debugLog('Сцена очищена');
    }

    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', '#FB5607'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const startButton = document.getElementById('start-button');
        
        if (loading) loading.style.display = show ? 'block' : 'none';
        if (startButton) startButton.disabled = show;
    }

    showClearButton(show) {
        const clearButton = document.getElementById('clear-button');
        if (clearButton) clearButton.style.display = show ? 'block' : 'none';
    }

    showMessage(text) {
        const message = document.querySelector('.message');
        if (message) {
            message.textContent = text;
        }
    }

    showError(text) {
        this.debugLog('❌ ' + text);
        alert(text);
    }

    debugLog(message) {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            const timestamp = new Date().toLocaleTimeString();
            debugInfo.innerHTML += `[${timestamp}] ${message}<br>`;
            debugInfo.scrollTop = debugInfo.scrollHeight;
        }
        console.log(message);
    }
}