
CLINIGUIDE FINAL - ALL FIXES - DEPLOY AND TEST STEPS
-----------------------------------------------------

WHAT IS INSIDE:
frontend/index.html - PWA with 2 upload buttons (Camera + Gallery) + Time editable + Patient phone compulsory + Guardian optional + Zero hallucination
backend/server.js - Auto WhatsApp backend (MOCK mode works without Twilio, REAL mode with Twilio)

STEP 1: DEPLOY BACKEND TO RENDER.COM (5 mins) - For fully auto WhatsApp (heart attack safe)
1. Go to render.com -> Sign up with GitHub
2. New + -> Web Service -> Upload backend folder OR connect GitHub repo
3. Settings:
   Name: cliniguide-backend
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   Instance: Free
4. Environment Variables -> Add:
   PORT = 10000
   (Leave Twilio vars EMPTY for now - it will run in MOCK mode and log messages to console - perfect for idea round demo)
   If you have Twilio free: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
5. Deploy -> Wait 2 mins -> You get link: https://cliniguide-backend-xxxx.onrender.com
6. Copy that link

STEP 2: DEPLOY FRONTEND TO NETLIFY DROP (2 mins)
1. Go to app.netlify.com/drop
2. Drag frontend folder (just index.html inside)
3. You get link: https://cliniguide-final-xxxx.netlify.app
4. Open that link -> Top yellow bar -> Paste your Render backend link -> Save

STEP 3: TEST MEDICINE MESSAGE RECEIVING (10 mins) - DO THIS BEFORE SUBMITTING
Test A - Registration:
- Open Netlify link
- Patient Name: Test
- Patient WhatsApp COMPULSORY: YOUR OWN NUMBER 919xxxxxxxxx (without +)
- Guardian 1 COMPULSORY: FRIEND'S NUMBER 919yyyyyyyyy (different phone for testing)
- Guardian 2,3 OPTIONAL: leave empty or add
- Save

Test B - Upload buttons:
- Scan page -> You see 2 buttons: Take Photo (camera) and Gallery
- Tap Take Photo -> Should open camera app
- Tap Gallery -> Should open file picker
- Upload any prescription photo -> Preview shows
- Click Review

Test C - Zero hallucination + Time editable:
- Confirm page shows [UNKNOWN] red badge NOT Paracetamol
- Type exact medicine name from photo e.g. Atorva 10mg
- Time shows 08:00 with time picker - Tap it -> Change to 2 mins from now e.g. if now 15:10 set 15:12
- Tap + Time to add more times if needed
- Click Verified

Test D - Auto WhatsApp receiving:
- Today page shows your medicine with edited time 15:12
- Wait till 15:12 -> Check YOUR patient phone (919xxxxxxxxx) -> Should get WhatsApp
  - If backend in MOCK mode: Check Render.com -> Logs -> You will see [MOCK WA to 919xxx]: CliniGuide Time for...
  - If frontend only (no backend): It will open wa.me link - Tap Send -> You get message
- After 1 min (15:13) -> Patient phone gets 1st Reminder (only patient)
- After 2 mins (15:14) -> Patient phone gets 2nd Reminder (only patient)
- After 3 mins (15:15) -> Guardian phone (friend's) gets WARNING (only guardian, not patient) - This is your new rule!

Test E - TAKEN auto to guardian:
- In Today page Tap TAKEN button
- Check Guardian phone -> Should get SAFE message: Patient took Atorva...
- If backend: Auto sent, check Render logs
- If frontend only: Opens WhatsApp -> Tap Send

Test F - SOS:
- Double-tap SOS red button quickly
- Guardian phone gets 🚨 SOS EMERGENCY with patient phone number

STEP 4: RECORD VIDEO FOR HACKATHON (3 mins)
Record screen with 2 phones visible:
0:00 Problem
0:15 Register showing patient compulsory + guardian optional + backend URL saved
0:30 Scan showing 2 buttons Camera + Gallery working
0:45 Upload + shows UNKNOWN red (not Paracetamol) + you typing correct name + editing time
1:00 Today page showing editable time
1:15 Wait for auto WhatsApp - show patient phone receiving message + voice
1:30 Show 1min,2min reminders to patient only, 3min warning to guardian only (show both phones)
1:45 Tap TAKEN -> show guardian phone receiving SAFE
1:55 Double-tap SOS -> show guardian phone receiving SOS

STEP 5: SUBMIT
- Live Demo: Your Netlify link
- Backend: Your Render link (say MOCK mode for idea round, REAL with Twilio for prod)
- GitHub: Upload this whole folder to github.com/new repo cliniguide-ai-final
- PDF: Use CliniGuide_AI_Final_Submission_Fixed.pdf

If any test fails, tell me which step fails and I fix.
