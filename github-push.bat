@echo off
echo ===================================================
echo    PawRescue Hub - Push to GitHub Setup Script
echo ===================================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed on this system.
    echo Please download and install Git from: https://git-scm.com/
    echo Once installed, restart your command prompt and run this script again.
    echo.
    pause
    exit /b
)

:: Get GitHub details
set /p username="Enter your GitHub username: "
if "%username%"=="" (
    echo [ERROR] Username cannot be blank.
    pause
    exit /b
)

set /p repo="Enter your GitHub repository name [pawrescue-hub]: "
if "%repo%"=="" set repo=pawrescue-hub

echo.
echo [1/5] Initializing local Git repository...
if not exist .git (
    git init
) else (
    echo Repository already initialized.
)

echo.
echo [2/5] Staging files...
git add index.html styles.css app.js README.md .gitignore github-push.bat

echo.
echo [3/5] Committing changes...
git commit -m "Initialize PawRescue Hub community rescue portal"

echo.
echo [4/5] Setting main branch and remote target...
git branch -M main
git remote remove origin >nul 2>nul
git remote add origin https://github.com/%username%/%repo%.git

echo.
echo [5/5] Pushing files to GitHub...
echo (A browser window or popup may open asking you to authorize Git)
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo    SUCCESS! Your code has been uploaded!
    echo    Visit: https://github.com/%username%/%repo%
    echo    
    echo    Next steps:
    echo    1. Open repository settings on GitHub.
    echo    2. Go to 'Pages' in the left menu.
    echo    3. Set Branch to 'main' and Folder to '/' (root).
    echo    4. Click 'Save' to publish your website!
    echo ===================================================
) else (
    echo.
    echo [ERROR] Push failed. Make sure you created the empty repository on github.com first!
)
echo.
pause
