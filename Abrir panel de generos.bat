@echo off
setlocal
cd /d "%~dp0"
title PulseRoots - Panel de generos
node scripts\genre-studio.mjs
if errorlevel 1 pause
