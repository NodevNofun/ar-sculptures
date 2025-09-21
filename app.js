// Ждем полной загрузки страницы
window.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы со страницы
    const startButton = document.getElementById('start-button');
    const clearButton = document.getElementById('clear-button');
    const loading = document.getElementById('loading');
    const arScene = document.getElementById('ar-scene');
    const uiContainer = document.getElementById('ui-container');
    
    // Переменная для хранения сцены
    let scene = null;
    
    // Функция запуска AR
    function startAR() {
        // Скрываем кнопку запуска и показываем загрузку
        startButton.style.display = 'none';
        loading.style.display = 'block';
        
        // Создаем сцену A-Frame
        scene = document.createElement('a-scene');
        scene.setAttribute('embedded', '');
        scene.setAttribute('arjs', 'sourceType: webcam; trackingMethod: best; debugUIEnabled: false;');
        scene.setAttribute('vr-mode-ui', 'enabled: false');
        scene.setAttribute('renderer', 'logarithmicDepthBuffer: true;');
        
        // Добавляем камеру
        const camera = document.createElement('a-camera-static');
        scene.appendChild(camera);
        
        // Добавляем освещение
        const ambientLight = document.createElement('a-entity');
        ambientLight.setAttribute('light', 'type: ambient; color: #CCC; intensity: 0.6');
        scene.appendChild(ambientLight);
        
        const directionalLight = document.createElement('a-entity');
        directionalLight.setAttribute('light', 'type: directional; color: #FFF; intensity: 0.8; position: 0 1 1');
        scene.appendChild(directionalLight);
        
        // Добавляем курсор для взаимодействия
        const cursor = document.createElement('a-entity');
        cursor.setAttribute('cursor', 'rayOrigin: mouse; fuse: false;');
        cursor.setAttribute('raycaster', 'objects: .clickable;');
        cursor.setAttribute('position', '0 0 -1');
        
        // Добавляем кольцо курсора
        const cursorRing = document.createElement('a-entity');
        cursorRing.setAttribute('geometry', 'primitive: ring; radiusInner: 0.02; radiusOuter: 0.03');
        cursorRing.setAttribute('material', 'color: cyan; shader: flat');
        cursorRing.setAttribute('position', '0 0 -1');
        cursor.appendChild(cursorRing);
        
        camera.appendChild(cursor);
        
        // Добавляем сцену на страницу
        arScene.appendChild(scene);
        
        // Ждем загрузки сцены
        scene.addEventListener('loaded', function() {
            // Скрываем индикатор загрузки
            loading.style.display = 'none';
            
            // Показываем инструкцию
            showMessage('Наведите камеру вокруг себя. Нажмите на любое место чтобы разместить объект!');
            
            // Добавляем обработчик кликов
            setupInteractions();
        });
    }
    
    // Функция настройки взаимодействий
    function setupInteractions() {
        scene.addEventListener('click', function(evt) {
            if (evt.detail.intersection && evt.detail.intersection.point) {
                // Создаем объект в точке клика
                createObjectAtPoint(evt.detail.intersection.point);
            }
        });
    }
    
    // Функция создания объекта в указанной точке
    function createObjectAtPoint(position) {
        // Создаем контейнер для объекта
        const object = document.createElement('a-entity');
        object.setAttribute('position', position);
        object.setAttribute('class', 'clickable');
        
        // Случайный выбор объекта
        const objectType = Math.random() > 0.5 ? 'sphere' : 'box';
        
        if (objectType === 'sphere') {
            // Создаем сферу
            const sphere = document.createElement('a-sphere');
            sphere.setAttribute('radius', '0.1');
            sphere.setAttribute('color', getRandomColor());
            sphere.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 2000');
            object.appendChild(sphere);
        } else {
            // Создаем куб
            const box = document.createElement('a-box');
            box.setAttribute('width', '0.2');
            box.setAttribute('height', '0.2');
            box.setAttribute('depth', '0.2');
            box.setAttribute('color', getRandomColor());
            box.setAttribute('animation', 'property: rotation; to: 360 360 0; loop: true; dur: 3000');
            object.appendChild(box);
        }
        
        // Добавляем объект на сцену
        scene.appendChild(object);
        
        // Показываем сообщение
        showMessage('Объект размещен! Можно разместить ещё');
    }
    
    // Функция получения случайного цвета
    function getRandomColor() {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Функция показа сообщения
    function showMessage(text) {
        const message = uiContainer.querySelector('.message');
        message.textContent = text;
    }
    
    // Функция очистки сцены
    function clearScene() {
        const objects = scene.querySelectorAll('.clickable');
        objects.forEach(obj => scene.removeChild(obj));
        showMessage('Сцена очищена. Можно размещать новые объекты!');
    }
    
    // Назначаем обработчики кнопок
    startButton.addEventListener('click', startAR);
    clearButton.addEventListener('click', clearScene);
    
    // Проверяем поддержку браузером
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showMessage('Ваш браузер не поддерживает AR. Попробуйте Chrome или Safari на iOS');
        startButton.disabled = true;
    }
});