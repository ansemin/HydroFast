### Complete UI Workflow for HydroFast Application (Based on 1.png)

#### 1. Login Page
-   **Screen Title/Logo**: "HydroFast" (displayed at the top in green text)
-   **Fields**:
    -   Email (text input field, placeholder text: "Email")
    -   Password (text input field, placeholder text: "Password", with a lock icon on the right)
-   **Buttons**:
    -   "Login" (green button with a right arrow, submits the login credentials)
-   **Links**:
    -   "Forget Password? Recover here" (Notification to contact admin pops up)
    -   "Don't have an account? Sign up here" (text link below the "Forget Password?" link, navigates to the Sign-Up page)
-   **Navigation**:
    -   On successful login, the user is directed to the **Patient Directory** (Step 2.2).
    -   Clicking "Sign up here" navigates to the **Sign-Up Page** (Step 2.1).

---

#### 2.1. Sign-Up Page
-   **Screen Title**: "Sign up" (displayed at the top in black text)
-   **Fields**:
    -   First Name (text input field, placeholder text: "First Name")
    -   Last Name (text input field, placeholder text: "Last Name")
    -   Email (text input field, placeholder text: "Email")
    -   Password (text input field, placeholder text: "Password")
    -   Retype (text input field, placeholder text: "Retype", likely for retyping the password to confirm)
-   **Buttons**:
    -   "SIGN UP" (green button, submits the sign-up form)
    -   Back arrow (top left, cancels the sign-up process and returns to the Login Page)
-   **Navigation**:
    -   On successful sign-up, the user is directed to the **Login Page** (Step 1).
    -   Clicking the back arrow returns the user to the **Login Page** (Step 1).

---

#### 2.2. Patient Directory
-   **Screen Title**: "Patients Directory"
-   **Elements**:
    -   Search bar (at the top, with a magnifying glass icon and placeholder text "Search for patient")
    -   List of patients (scrollable list with entries):
        -   Each entry includes: Patient ID, MRN.h
-   **Buttons**:
    -   "+" (floating action button, top right, navigates to Add New Patient)
    -   Back arrow (top left, logs out, returns to Login Page)
-   **Navigation**:
    -   Clicking "+" navigates to **Add New Patient** (Step 3).
    -   Clicking a patient entry navigates to **View Patient** (Step 4).
    -   Clicking the back arrow navigates to **Login Page** (Step 1).

---

#### 3. Add New Patient
-   **Screen Title**: "Add New Patient"
-   **Fields**: First Name, Last Name, NRIC/Passport No., Contact No. (Optional).
-   **Buttons**: "SUBMIT", Back arrow (top left).
-   **Navigation**:
    -   On submission -> **Patient Directory** (Step 2.2).
    * Clicking back arrow -> **Patient Directory** (Step 2.2).

---

#### 4. View Patient
-   **Screen Title**: "Patient Detail"
-   **Fields**: Displays First Name, Last Name, NRIC/Passport No., Contact No. (Optional).
-   **Buttons**: "EDIT", Camera icon, "DELETE", "Scan results", Back arrow (top left).
-   **Navigation**:
    -   Clicking Camera icon -> **Camera Page** (Step 4.1).
    -   Clicking "EDIT" -> (Edit Mode - not detailed, returns here).
    -   Clicking "DELETE" -> (Deletes patient, returns to Patient Directory 2.2).
    -   Clicking "Scan results" -> **Scan Results Page** (Step 4.2).
    -   Clicking back arrow -> **Patient Directory** (Step 2.2).

---

#### 4.1. Camera Page
-   **Screen Title**: "Camera"
-   **Elements**: Camera live view with focus box.
-   **Buttons**: Back arrow (top left), Upload Photo, Take Picture, Flip Camera.
-   **Navigation**:
    -   Clicking Take Picture / Upload Photo -> **Photo Preview** (Step 5).
    -   Clicking Flip Camera -> (Switches camera).
    -   Clicking back arrow -> **View Patient** (Step 4).

---

#### 4.2. Scan Results Page
-   **Screen Title**: "Scan Results"
-   **Elements**: Header "Previous Scans", List of past scans (ID, Date, STL file details + download icon, G-code file details + download icon).
-   **Buttons**: Back arrow (top left), Download icons per file.
-   **Navigation**:
    -   Clicking download icon -> (Initiates file download).
    -   Clicking back arrow -> **View Patient** (Step 4).
    -   Note: Scan entries are not clickable.

---

#### 5. Photo Preview
-   **Screen Title**: "Photo preview"
-   **Elements**: Captured/uploaded photo displayed.
-   **Buttons**:
    -   "Retake" (gray button on the left, or similar back/cancel action)
    -   "SUBMIT" (green button on the right, or similar proceed action)
-   **Navigation**:
    -   Clicking "SUBMIT" -> **Processing Page (1st Instance)** (Step 6).
    -   Clicking "Retake" -> **Camera Page** (Step 4.1).

---

#### 6. Processing Page (1st Instance)
-   **Screen Title**: "Processing..."
-   **Elements**: Loading animation, "Please kindly wait..." text.
-   **Buttons**: None.
-   **Navigation**: On complete -> **Wound Detection Preview** (Step 7).

---

#### 7. Wound Detection Preview
-   **Screen Title**: "Wound Detection"
-   **Elements**: Photo with wound area highlighted/outlined.
-   **Buttons**:
    -   "Process" (green button, proceed action)
-   **Navigation**:
    -   Clicking "Process" -> **Processing Page (2nd Instance)** (Step 8).

---

#### 8. Processing Page (2nd Instance)
-   **Screen Title**: "Processing..."
-   **Elements**: Loading animation, "Please kindly wait..." text.
-   **Buttons**: None.
-   **Navigation**: On complete -> **Depth Detection Preview** (Step 9).

---

#### 9. Depth Detection Preview
-   **Screen Title**: "Depth Detection"
-   **Elements**: Displays depth map representation (e.g., grayscale image).
-   **Buttons**:
    -   "Process" (green button, proceed action)
-   **Navigation**:
    -   Clicking "Process" -> **Processing Page (3rd Instance)** (Step 10).

---

#### 10. Processing Page (3rd Instance)
-   **Screen Title**: "Processing..."
-   **Elements**: Loading animation, "Please kindly wait..." text.
-   **Buttons**: None.
-   **Navigation**: On complete -> **Mesh Preview** (Step 11).

---

#### 11. Mesh Preview
-   **Screen Title**: "Mesh Detection" (or "Mesh preview")
-   **Elements**: 3D mesh representation displayed.
-   **Buttons**:
    -   "Process" (green button, proceed action)
-   **Navigation**:
    -   Clicking "Process" -> **Processing Page (4th Instance)** (Step 12).

---

#### 12. Processing Page (4th Instance)
-   **Screen Title**: "Processing..."
-   **Elements**: Loading animation, "Please kindly wait..." text.
-   **Buttons**: None.
-   **Navigation**: On complete -> **Download Files Page** (Step 13).

---

#### 13. Download Files Page
-   **Screen Title**: "Download Files"
-   **Elements**: Header "YOUR FILES ARE READY!", List of files (STL - 3D Model, G-code - Print File) with details and download icons.
-   **Buttons**: "DOWNLOAD ALL", Back arrow (top left).
-   **Navigation**:
    -   Clicking "DOWNLOAD ALL" -> (Initiates download of all listed files).
    * Clicking back arrow -> **View Patient** (Step 4).

---

### Updated Summary of Workflow

1.  **Login Page** → User logs in, recovers password, or signs up.
2.  **Sign-Up Page (2.1)** or **Patient Directory (2.2)** → After login, user sees patient list or signs up. Back from Directory logs out.
3.  **Add New Patient (3)** → User adds patient. Back returns to Directory.
4.  **View Patient (4)** → User views details, can Edit, Delete, go to Camera (4.1), or Scan Results (4.2). Back returns to Directory.
5.  **Camera Page (4.1)** → Capture/upload photo. Back returns to View Patient.
6.  **Scan Results Page (4.2)** → View/download previous scan files. Back returns to View Patient.
7.  **Photo Preview (5)** → Review photo. **Retake -> Camera (4.1)**. Submit -> Processing (6).
8.  **Processing Page (6)** → Loading. Complete -> Wound Detection (7).
9.  **Wound Detection Preview (7)** → Review detection. **Submit -> Processing (8)**. (No Retake)
10. **Processing Page (8)** → Loading. Complete -> Depth Detection (9).
11. **Depth Detection Preview (9)** → Review depth map. **Submit -> Processing (10)**. (No Retake)
12. **Processing Page (10)** → Loading. Complete -> Mesh Preview (11).
13. **Mesh Preview (11)** → Review mesh. **Submit -> Processing (12)**. (No Retake)
14. **Processing Page (12)** → Loading. Complete -> Download Files (13).
15. **Download Files Page (13)** → Download STL/G-code files. Back -> View Patient (4).