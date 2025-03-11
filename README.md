# Coding User Guide

## To Run the App on Phone

This is in a testing environment. If pushed to the app store, additional costs will apply. For now, we'll use the Expo Go app for testing.

### Steps

1. **Download the Expo Go app** on your phone.
2. **On your phone**:
    - Turn on your personal hotspot.
3. **On your laptop**:
    - Connect your Wi-Fi to your phone’s hotspot (this ensures both devices are on the same network, which is needed for Expo Go testing to work).
4. Open **2 terminals** (you can use PowerShell if you’re using Windows).
5. In both terminals, change directory to the `woundApp2` folder:
    ```bash
    cd woundApp2
    ```

---

## Backend Setup

*These steps should be performed in **your first terminal**.*

1. **Activate Virtual Environment**:
    - If you don’t have one, create it using the command `xx` and activate using `yy`:
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
    ```bash
    python manage.py runserver
    ```

---

## Frontend Setup

*These steps should be performed in **your second terminal**.*

1. **Change Directory**:
    - Move to the folder containing `App.js`:
        ```bash
        cd woundapp2
        ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Start the App**:
    ```bash
    npx expo start
    ```

4. **Test on Phone**:
    - Scan the QR code using your camera app on your phone.

5. **Test on Laptop**:
    - Press `w` on the terminal instead of scanning the QR code.

---

## Additional Commands

### Add a Doctor Account

1. Change directory to the backend folder:
    ```bash
    cd WoundApp2/backend
    ```
2. Run:
    ```bash
    python manage.py create_default_user
    ```

### Delete Patients

1. Change directory to the backend folder:
    ```bash
    cd WoundApp2/backend
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
    cd WoundApp2/backend
    ```
2. Run:
    ```bash
    python manage.py generate_patients --count=5
    ```

### Create Random Scan Data

1. Change directory to the backend folder:
    ```bash
    cd WoundApp2/backend
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
