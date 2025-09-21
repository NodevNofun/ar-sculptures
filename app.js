class ARApplication {
    constructor() {
        this.arManager = new ARManager().init();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Кнопка запуска AR
        document.getElementById('start-button').addEventListener('click', () => {
            this.startAR();
        });

        // Кнопка очистки сцены
        document.getElementById('clear-button').addEventListener('click', () => {
            this.arManager.clearScene();
        });

        // Предотвращение масштабирования на iOS
        document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Горячие клавиши для разработки
        document.addEventListener('keydown', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                this.arManager.clearScene();
            }
        });
    }

    async startAR() {
        const success = await this.arManager.startAR();
        if (success) {
            this.arManager.showMessage('AR запущен!');
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.arApp = new ARApplication();
    console.log('AR приложение инициализировано');
});

// Обработка ошибок
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        debugInfo.innerHTML += `❌ Ошибка: ${e.message}<br>`;
    }
});