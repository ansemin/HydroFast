@echo off
echo Starting Django server on all network interfaces (0.0.0.0:8000)...
echo This will make the server accessible from your mobile device
echo Use the same IP address that your computer has on the WiFi network

echo.
echo =================== YOUR NETWORK INFO ===================
ipconfig | findstr /i "IPv4"
echo =========================================================
echo.

echo Access the API from your mobile app using: http://YOUR_IP_ADDRESS:8000/api
echo Where YOUR_IP_ADDRESS is your computer's IP on the WiFi network (see above)
echo.
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver 0.0.0.0:8000 