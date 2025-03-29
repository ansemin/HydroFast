# Coding User Guide

## To Run the App on Phone

This is in a testing environment. If pushed to the app store, additional costs will apply. For now, we'll use the Expo Go app for testing.

### Steps

1. **Download the Expo Go app** on your phone.
2. **On your phone**:
    - Turn on your personal hotspot.
3. **On your laptop**:
    - Connect your Wi-Fi to your phone's hotspot (this ensures both devices are on the same network, which is needed for Expo Go testing to work).
4. Open **2 terminals** (you can use PowerShell if you're using Windows).
5. In both terminals, change directory to the `frontend` folder:
    ```bash
    cd frontend
    ```

---

## Backend Setup

*These steps should be performed in **your first terminal**.*

1. **Activate Virtual Environment**:
    - If you don't have one, create it using the command `xx` and activate using `yy`:
        ```bash
        # Create the virtual environment
        python -m venv env

        # Activate the virtual environment
        # On Windows:
        env\Scripts\activate
        # On macOS/Linux:
        source env/bin/activate
        ```
    - *Note: Replace `xx` and `yy` with your actual commands for creating and activating the virtual environment.*

2. **Install Required Software**:
    - Use the `requirements.txt` file provided:
        ```bash
        pip install -r requirements.txt
        ```

3. **Change Directory**:
    - Move to the backend folder where `manage.py` is located:
        ```bash
        cd backend
        ```

4. **Database Setup (First Time Only)**:
    - Migrate to the database:
        ```bash
        python manage.py makemigrations
        python manage.py migrate
        ```

5. **Create Default Testing Data**:
    ```bash
    python manage.py create_default_user
    python manage.py generate_patients --count=5
    python manage.py create_scans --count=3
    ```

6. **Start the Backend Server**:
    
    You have several options to run the server:
    
    - **Option 1**: Standard Django command (localhost only)
        ```bash
        python manage.py runserver
        ```
    
    - **Option 2**: Run on all network interfaces (for mobile testing)
        ```bash
        python manage.py runserver 0.0.0.0:8000
        ```
    
    - **Option 3**: Use the convenience script (Windows)
        ```bash
        run_server.bat
        ```
    
    - **Option 4**: Use the cross-platform Python script
        ```bash
        python run_server.py
        ```
    
    For mobile testing, you should use Option 2, 3, or 4 to make the server accessible from your phone.

7. **⚠️ IMPORTANT: Note Your Computer's IP Address ⚠️**:
    - When you start the server with options 2, 3, or 4, it will display your computer's IP addresses.
    - **Write down your WiFi/network IP address** (usually starts with 192.168.x.x or 172.x.x.x).
    - You will need this to update the API configuration in the next section.

---

## Frontend Setup

*These steps should be performed in **your second terminal**.*

1. **Change Directory**:
    - Move to the folder containing `App.js`:
        ```bash
        cd frontend
        ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Configure API Connection**:
    - Open the file `api.js` in a text editor
    - Find this section (around line 23):
      ```javascript
      // For mobile (iOS/Android)
      // Use your local network IP address instead of localhost
      return 'http://172.30.1.54:8000/api';  // Update this IP address
      ```
    - Replace the IP address with your computer's IP address (that you noted in step 7 of Backend Setup)
    - Save the file

4. **Start the App**:
    ```bash
    npx expo start
    ```

5. **Test on Phone**:
    - Scan the QR code using your camera app on your phone.

6. **Test on Laptop**:
    - Press `w` on the terminal instead of scanning the QR code.

---

## Troubleshooting

### Connection Issues

1. **Network Error When Logging In**:
   - If you get an "ERR_NETWORK" or "Network Error" message when trying to log in:
   - Double check that you've updated the IP address in `api.js` to match your computer's current IP
   - Verify this by looking at the output of the backend server startup
   - This is especially important if you switch networks or restart your computer, as the IP may change

2. **Checking Your IP Address**:
   - On Windows: Open Command Prompt and type `ipconfig`
   - On macOS/Linux: Open Terminal and type `ifconfig` or `ip addr`
   - Look for the IPv4 address of your WiFi or Ethernet connection
   - Update the `api.js` file with this IP address

3. **Different Networks**:
   - Your phone and computer MUST be on the same network for the connection to work
   - The backend server must be running with the `0.0.0.0:8000` option

### iOS App Issues

If you encounter issues running the app on iOS:

1. **Cannot read property 'hostname' of undefined**:
   - This error has been fixed by using `Platform` from React Native to detect if the app is running on web or mobile.
   - The API configuration now properly handles different platforms.

2. **App entry not found / main not registered**:
   - This can happen if the app entry point is not properly registered.
   - Make sure `index.js` file exists and correctly registers the App component.
   - Verify that `package.json` has the correct main entry point: `"main": "node_modules/expo/AppEntry.js"`

---

## Additional Commands

### Add a Doctor Account

1. Change directory to the backend folder:
    ```bash
    cd frontend/backend
    ```
2. Run:
    ```bash
    python manage.py create_default_user
    ```

### Delete Patients

1. Change directory to the backend folder:
    ```bash
    cd frontend/backend
    ```
2. Use one of the following commands:
    - **Delete all patients**:
        ```bash
        python manage.py delete_patients --all
        ```
    - **Delete by filter**:
        ```bash
        python manage.py delete_patients --filter="first_name=John"
        ```
    - **Delete by ID**:
        ```bash
        python manage.py delete_patients --id=1
        ```

### Generate Random Patients

1. Change directory to the backend folder:
    ```bash
    cd frontend/backend
    ```
2. Run:
    ```bash
    python manage.py generate_patients --count=5
    ```

### Create Random Scan Data

1. Change directory to the backend folder:
    ```bash
    cd frontend/backend
    ```
2. Run:
    ```bash
    python manage.py create_scans --count=3
    ```

---

## Adding AI Models

1. Open `backend/coreViews/views.py`.
2. Locate the `ScanViewSet` class:
    ```python
    class ScanViewSet():
        def process_scan(self, ...):
            # Add your AI models here
    ```
3. Modify the `process_scan` method to integrate your AI models.

---
