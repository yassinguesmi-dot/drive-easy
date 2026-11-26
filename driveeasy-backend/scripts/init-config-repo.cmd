@echo off
setlocal
set "CONFIG_REPO=%~dp0..\config-repo"
if exist "%CONFIG_REPO%\.git" goto ready

git -C "%CONFIG_REPO%" init -b master
if errorlevel 1 exit /b %errorlevel%
git -C "%CONFIG_REPO%" add .
if errorlevel 1 exit /b %errorlevel%
git -C "%CONFIG_REPO%" -c user.name=DriveEasy -c user.email=driveeasy@localhost commit -m "Add centralized service configuration" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
if errorlevel 1 exit /b %errorlevel%

:ready
echo Config repository ready at "%CONFIG_REPO%"
