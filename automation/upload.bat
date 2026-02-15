@echo off
REM Windows batch file for storage upload automation
REM Usage: upload.bat image.png [category]
REM Example: upload.bat photo.jpg finance

if "%1"=="" (
    echo Usage: upload.bat ^<filePath^> [category] [options]
    echo Example: upload.bat image.png finance
    echo.
    echo Options:
    echo   --no-confirm    Skip confirmation
    echo   --provider      Provider name (default/alphaone)
    exit /b 1
)

node automation/run-upload.js %*
