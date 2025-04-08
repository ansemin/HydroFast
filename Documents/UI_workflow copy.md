
### Complete UI Workflow for HydroFast Application

#### 1. Login Page
- **Screen Title/Logo**: "HydroFast" (displayed at the top in green text)
- **Fields**:
  - Email (text input field, placeholder text: "Email")
  - Password (text input field, placeholder text: "Password", with a lock icon on the right)
- **Buttons**:
  - "Login" (green button with a right arrow, submits the login credentials)
- **Links**:
  - "Forget Password? Recover here" (Notification to contact admin pops up)
  - "Don't have an account? Sign up here" (text link below the "Forget Password?" link, navigates to the Sign-Up page)
- **Navigation**:
  - On successful login, the user is directed to the **Patient Directory** (Step 2.2).
  - Clicking "Sign up here" navigates to the **Sign-Up Page** (Step 2.1).

---

#### 2.1. Sign-Up Page
- **Screen Title**: "Sign up" (displayed at the top in black text)
- **Fields**:
  - First Name (text input field, placeholder text: "First Name")
  - Last Name (text input field, placeholder text: "Last Name")
  - Email (text input field, placeholder text: "Email")
  - Password (text input field, placeholder text: "Password")
  - Retype (text input field, placeholder text: "Retype", likely for retyping the password to confirm)
- **Buttons**:
  - "SIGN UP" (green button, submits the sign-up form)
  - Back arrow (top left, cancels the sign-up process and returns to the Login Page)
- **Navigation**:
  - On successful sign-up, the user is directed to the **Login Page** (Step 1).
  - Clicking the back arrow returns the user to the **Login Page** (Step 1).

---

#### 2.2. Patient Directory
- **Screen Title**: "Patients Directory"
- **Elements**:
  - Search bar (at the top, with a magnifying glass icon and placeholder text "Search for patient")
  - List of patients (scrollable list with entries):
    - Each entry includes:
      - Patient ID (e.g., "Patient XX")
      - MRN (Medical Record Number) (e.g., "SX1364X4F")
    - Example entries:
      - Patient XX, SX1364X4F
      - Patient XX, SX1364X4F
      - (Repeated entries with the same MRN, likely placeholders)
  - Alphabetical index (on the right side of the list):
    - A vertical list of letters (A to Z) for quick navigation.
    - Letters displayed: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z.
    - Tapping a letter scrolls the patient list to entries starting with that letter, or users can just scroll.
- **Buttons**:
  - "+" (floating action button at the top right, navigates to the Add New Patient page)
  - Back arrow (top left, logs the user out and returns to the Login Page, requiring re-authentication)
- **Navigation**:
  - Clicking the "+" button navigates to the **Add New Patient** page (Step 3).
  - Clicking on a patient entry navigates to the **View Patient** page (Step 4).
  - Clicking the back arrow logs the user out and returns to the **Login Page** (Step 1).

---

#### 3. Add New Patient
- **Screen Title**: "Add New Patient"
- **Fields**:
  - First Name (text input field, placeholder text: "First Name")
  - Last Name (text input field, placeholder text: "Last Name")
  - NRIC/Passport No. (text input field, placeholder text: "NRIC/Passport No.")
  - Contact No. (Optional) (text input field, placeholder text: "Contact No. (Optional)")
- **Buttons**:
  - "SUBMIT" (green button, submits the new patient form)
  - Back arrow (top left, returns to the previous page)
- **Navigation**:
  - On successful submission, the user is directed to the **Patient Directory** page (Step 2.2) for the newly added patient.
  - Clicking the back arrow returns the user to the **Patient Directory** (Step 2.2).

---

#### 4. View Patient
- **Screen Title**: "Patient Detail"
- **Fields**:
  - First Name (displayed as text, e.g., "Peter")
  - Last Name (displayed as text, e.g., "Parker")
  - NRIC/Passport No. (displayed as text, e.g., "S5668560I")
  - Contact No. (Optional) (displayed as text, e.g., "12346789")
- **Buttons**:
  - "EDIT" (green button on the left, likely allows editing of the patient details)
  - Camera (center button with a camera icon, opens the camera interface to capture a photo)
  - "DELETE" (green button on the right, likely deletes the patient record)
  - "Scan results" (a button below the patient details, likely a green button to match the app's style, navigates to the Scan Results page if scan results are available)
  - Back arrow (top left, returns to the previous page)
- **Navigation**:
  - Clicking the "Camera" button navigates to the **Camera Page** (Step 4.1).
  - Clicking "EDIT" likely allows the user to modify the patient details (not shown in the workflow, but would return to this page after saving).
  - Clicking "DELETE" likely deletes the patient record and returns the user to the **Patient Directory** (Step 2.2).
  - Clicking the "Scan results" button navigates to the **Scan Results Page** (Step 4.2).
  - Clicking the back arrow returns the user to the **Patient Directory** (Step 2.2).

---

#### 4.1. Camera Page
- **Screen Title**: None explicitly shown (assumed to be the camera interface)
- **Elements**:
  - Camera view (displays a live feed, e.g., showing a skin lesion or area of interest).
- **Buttons**:
  - Back arrow (top left, returns to the previous page).
  - Upload Photo (bottom left, circular button with a thumbnail preview, allows the user to upload a photo from their mobile album).
  - Take Picture (bottom center, large circular button labeled "CAMERA", captures the photo).
  - Flip Camera (bottom right, circular button with a flip icon, switches between front and rear cameras).
- **Navigation**:
  - Clicking the "Take Picture" button captures a photo and navigates to the **Photo Preview** page (Step 5).
  - Clicking the "Upload Photo" button allows the user to select a photo from their mobile album, which then navigates to the **Photo Preview** page (Step 5) with the selected photo.
  - Clicking the "Flip Camera" button switches the camera view between front and rear cameras.
  - Clicking the back arrow returns the user to the **View Patient** page (Step 4).

---

#### 4.2. Scan Results Page
- **Screen Title**: "Scan Results"
- **Elements**:
  - Header text: "Previous Scans"
  - List of scans for the patient (scrollable list with entries):
    - Each entry includes:
      - Scan ID (e.g., "Scan #001")
      - Scan Date (e.g., "15 Mar 2025")
      - Files:
        - STL file (e.g., "HydroFast_STL_001", labeled as "3D Model", 2.4MB, with a download icon)
        - G-code file (e.g., "HydroFast_GCODE_001", labeled as "Print File", 5.1MB, with a download icon)
    - Example entries:
      - Scan #001, 15 Mar 2025
        - "HydroFast_STL_001", 3D Model, 2.4MB, with a download icon
        - "HydroFast_GCODE_001", Print File, 5.1MB, with a download icon
      - Scan #002, 10 Mar 2025
        - "HydroFast_STL_002", 3D Model, 3.1MB, with a download icon
        - "HydroFast_GCODE_002", Print File, 4.8MB, with a download icon
- **Buttons**:
  - Back arrow (top left, returns to the previous page)
  - Download icons (one per file, allows downloading the individual file directly)
- **Navigation**:
  - Clicking a download icon next to a file (e.g., "HydroFast_STL_001") initiates the download of that specific file.
  - Clicking the back arrow returns the user to the **View Patient** page (Step 4).
  - **Note**: The scan entries (e.g., "Scan #001", "Scan #002") are not clickable and do not navigate to the **Download Files Page**.

---

#### 5. Photo Preview
- **Screen Title**: "Photo preview"
- **Elements**:
  - The captured or uploaded photo is displayed (e.g., an image of a skin lesion).
- **Buttons**:
  - "Retake" (gray button on the left, allows the user to retake the photo)
  - "SUBMIT" (green button on the right, submits the photo for processing)
- **Navigation**:
  - Clicking "SUBMIT" navigates to the **Processing Page** (Step 6).
  - Clicking "Retake" returns the user to the **Camera Page** (Step 4.1).

---

#### 6. Processing Page
- **Screen Title**: "Processing..."
- **Elements**:
  - A circular loading animation is displayed in the center.
  - Text below the animation: "Please kindly wait while processing"
- **Buttons**:
  - None
- **Navigation**:
  - After processing is complete, the user is directed to the **Mesh Preview** page (Step 7).

---

#### 7. Mesh Preview
- **Screen Title**: "Mesh preview"
- **Elements**:
  - A 3D mesh or processed image is displayed (e.g., a green 3D outline of the lesion or area of interest).
- **Buttons**:
  - "Retake" (gray button on the left, allows the user to retake the photo)
  - "SUBMIT" (green button on the right, submits the mesh for further processing or saving)
- **Navigation**:
  - Clicking "SUBMIT" navigates to another **Processing Page** (Step 8).
  - Clicking "Retake" returns the user to the **Camera Page** (Step 4.1).

---

#### 8. Processing Page (Second Instance)
- **Screen Title**: "Processing..."
- **Elements**:
  - A circular loading animation is displayed in the center.
  - Text below the animation: "Please kindly wait while processing"
- **Buttons**:
  - None
- **Navigation**:
  - After processing is complete, the user is directed to the **Download Files Page** (Step 9).

---

#### 9. Download Files Page
- **Screen Title**: "Download Files"
- **Elements**:
  - List of downloadable files:
    - "YOUR FILES ARE READY!" (header text)
    - File 1: "HydroFast_STL" (labeled as "3D Model", 2.4MB, with a download icon)
    - File 2: "HydroFast_GCODE" (labeled as "Print File", 5.1MB, with a download icon)
- **Buttons**:
  - "DOWNLOAD ALL" (green button at the bottom, downloads all listed files)
  - Back arrow (top left, returns to the previous page)
- **Navigation**:
  - Clicking "DOWNLOAD ALL" initiates the download of all files.
  - Clicking the back arrow always returns the user to the **View Patient** page (Step 4).

---

### Summary of Workflow
1. **Login Page** → User logs in, recovers password, or signs up (no back arrow).
2. **Sign-Up Page (2.1)** or **Patient Directory (2.2)** → After login, the user sees the patient list (back button logs out and returns to Login Page) or signs up (with back arrow).
3. **Add New Patient** → User adds a new patient (with back arrow, no Cancel button).
4. **View Patient** → User views patient details, can edit, delete, capture a photo, or click "Scan results" to navigate to the Scan Results page (with back arrow).
5. **Camera Page (4.1)** → User captures a photo or uploads one from their album (with back arrow).
6. **Scan Results Page (4.2)** → User views a list of previous scans for the patient (e.g., "Scan #001", "Scan #002") with individual download buttons for each file (STL and G-code); clicking a download button downloads that file directly; the scan entries themselves are not clickable (with back arrow to View Patient).
7. **Photo Preview** → User reviews the captured or uploaded photo (no back arrow, uses "Retake" to return to Camera Page).
8. **Processing Page** → The photo is processed (no back arrow).
9. **Mesh Preview** → User reviews the processed 3D mesh (no back arrow, uses "Retake" to return to Camera Page).
10. **Processing Page (Second Instance)** → Further processing occurs (no back arrow).
11. **Download Files Page** → User downloads the processed files "HydroFast_STL" (3D Model, 2.4MB) and "HydroFast_GCODE" (Print File, 5.1MB) after completing a new scan, then returns to the **View Patient** page (with back arrow).

---