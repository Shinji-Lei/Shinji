@echo off
:loop
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001
echo Tunnel exited, restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop