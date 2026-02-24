# 1. 取得當前時間作為 Commit 訊息
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$message = "Hardware List Auto-Update: $date"

Write-Host "--- 開始同步硬體清單到 GitHub ---" -ForegroundColor Cyan

# 2. 執行 Git 指令
git add .
git commit -m "$message"
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "--- 同步成功！ ---" -ForegroundColor Green
} else {
    Write-Host "--- 同步失敗，請檢查錯誤訊息 ---" -ForegroundColor Red
}

# 暫停一下讓你看到結果
Start-Sleep -Seconds 3