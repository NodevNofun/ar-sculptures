$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "1. Останавливаем и удаляем старый контейнер (если есть)..." -ForegroundColor Green
docker-compose down

Write-Host "2. Запускаем Minio в фоновом режиме..." -ForegroundColor Green
docker-compose up -d

Write-Host "3. Ждем, пока Minio полностью запустится..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$isReady = $false

while ($attempt -lt $maxAttempts -and -not $isReady) {
    $attempt++
    Write-Host "Попытка $attempt/$maxAttempts..." -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $isReady = $true
            Write-Host "Minio запущен и готов!" -ForegroundColor Green
            Start-Sleep -Seconds 2
            break
        }
    }
    catch {
        Write-Host "Minio еще не готов, ждем..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $isReady) {
    Write-Host "Не удалось дождаться запуска Minio. Проверьте логи: docker-compose logs minio" -ForegroundColor Red
    exit 1
}

if (-Not (Test-Path -Path "./mc.exe")) {
    Write-Host "4. Скачиваем утилиту 'mc'..." -ForegroundColor Green
    Invoke-WebRequest -Uri "https://dl.min.io/client/mc/release/windows-amd64/mc.exe" -OutFile "./mc.exe"
}

Write-Host "5. Настраиваем подключение к локальному Minio..." -ForegroundColor Green
./mc.exe alias set localminio http://localhost:9000 admin very_secret_pass_lol

Write-Host "6. Создаем бакет 'ar-content'..." -ForegroundColor Green
./mc.exe mb localminio/ar-content

Write-Host "7. Настраиваем публичный доступ на чтение для бакета..." -ForegroundColor Green
./mc.exe anonymous set download localminio/ar-content

Write-Host "8. Загружаем тестовые файлы в Minio..." -ForegroundColor Green

./mc.exe mb localminio/ar-content/models
./mc.exe mb localminio/ar-content/markers

# Копируем ВСЕ файлы из папки models
if (Test-Path -Path "./assets/models" -PathType Container) {
    $modelFiles = Get-ChildItem -Path "./assets/models" -File
    if ($modelFiles.Count -gt 0) {
        Write-Host "Загружаем файлы из папки models..." -ForegroundColor Green
        foreach ($file in $modelFiles) {
            try {
                ./mc.exe cp "$($file.FullName)" "localminio/ar-content/models/"
                Write-Host "   ✅ $($file.Name) загружен" -ForegroundColor Green
            }
            catch {
                Write-Host "   ❌ Ошибка загрузки $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "В папке models нет файлов" -ForegroundColor Yellow
    }
}
else {
    Write-Host "Папка models не существует: ./assets/models/" -ForegroundColor Red
}

# Копируем ВСЕ файлы из папки markers
if (Test-Path -Path "./assets/markers" -PathType Container) {
    $markerFiles = Get-ChildItem -Path "./assets/markers" -File
    if ($markerFiles.Count -gt 0) {
        Write-Host "Загружаем файлы из папки markers..." -ForegroundColor Green
        foreach ($file in $markerFiles) {
            try {
                ./mc.exe cp "$($file.FullName)" "localminio/ar-content/markers/"
                Write-Host "   ✅ $($file.Name) загружен" -ForegroundColor Green
            }
            catch {
                Write-Host "   ❌ Ошибка загрузки $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "В папке markers нет файлов" -ForegroundColor Yellow
    }
}
else {
    Write-Host "Папка markers не существует: ./assets/markers/" -ForegroundColor Red
}

# Показываем итоговое содержимое бакета
Write-Host "`nИтоговое содержимое бакета ar-content:" -ForegroundColor Cyan
try {
    ./mc.exe ls localminio/ar-content --recursive
}
catch {
    Write-Host "Не удалось получить список файлов" -ForegroundColor Red
}


Write-Host "`nГотово! Minio инициализирован." -ForegroundColor Green
Write-Host "Веб-интерфейс: http://localhost:9001 (логин: admin, пароль: very_secret_pass_lol)" -ForegroundColor Cyan
Write-Host "API: http://localhost:9000" -ForegroundColor Cyan
Write-Host "`nФайлы доступны по путям:" -ForegroundColor Yellow
Write-Host "Модель: http://localhost:9000/ar-content/models/placeholder.glb" -ForegroundColor Yellow
Write-Host "Маркер: http://localhost:9000/ar-content/markers/placeholder.patt" -ForegroundColor Yellow