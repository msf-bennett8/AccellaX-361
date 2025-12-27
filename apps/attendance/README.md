# AccellaX 361° Silicon by Swimming Ducks | Attendance App

> **Mobile Attendance Tracking for Sports Academy Coaches**  
> Offline-first React Native app for marking and managing student attendance

[![React Native](https://img.shields.io/badge/React_Native-0.72-61DAFB?logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-49-000020?logo=expo)](https://expo.dev)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase)](https://firebase.google.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://www.sqlite.org)

---

## 📱 Overview

The AccellaX Attendance App is the mobile companion for sports academy coaches. 
Mark attendance offline, sync when online, and track student progress. It provides a fast, offline-first solution for marking attendance during training sessions.

**Key Features:**
- ✅ **Offline-first**: Mark attendance without internet connection
- ✅ **Quick marking**: Swipe interface for fast attendance entry
- ✅ **Auto-sync**: Automatically syncs when online
- ✅ **Age group filtering**: Organize kids by age groups
- ✅ **Session management**: Create and manage training sessions
- ✅ **Attendance history**: View past sessions
- ✅ **Kid profiles**: Add/edit student information
- ✅ **Notes**: Add session and kid notes
- ✅ **Google OAuth**: Secure authentication

---

## 🏫 Deploying for Your Academy

This app can be customized for any sports academy.

**📖 See**: [Academy Setup Guide](../../ACADEMY_SETUP.md) for complete configuration instructions.

---

## 🏗️ Architecture

### Data Flow
```
Coach marks attendance (offline/online)
    ↓
SQLite (local device storage)
    ↓ auto-sync when online
Firebase Firestore (cloud database)
    ↓ real-time updates
Web Dashboard (admin/parent view)
    ↓ complex queries
Laravel API + MySQL (reports & analytics)
```

### Why This Architecture?
- **SQLite**: Instant offline access, no internet needed
- **Firebase**: Real-time sync, push notifications
- **Laravel/MySQL**: Complex reports, payment tracking, role management
- **Result**: Fast, reliable, works anywhere

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio
- Firebase project with Firestore enabled

### Installation
```bash
# Navigate to attendance app
cd apps/attendance

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure Firebase credentials in .env
```

### Environment Variables (.env)
```bash
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=accellax.firebaseapp.com
FIREBASE_PROJECT_ID=accellax-361
FIREBASE_STORAGE_BUCKET=accellax-361.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:android:abc123
```

### Running the App
```bash
# Start Expo development server
npm start

# Or use shortcuts:
npm run ios        # iOS simulator (Mac only)
npm run android    # Android emulator
npm run web        # Web browser (limited support)
```

**Access on Physical Device:**
1. Install Expo Go from App Store/Play Store
2. Scan QR code from terminal
3. App opens in Expo Go

---

## 📱 Key Features

### 1. 👆 Swipe-to-Mark Attendance
**Fastest way to mark attendance:**
- **Swipe Right** → Mark Present ✅ (green)
- **Swipe Left** → Mark Absent ❌ (red)
- Real-time counter: "15/20 kids present"
- Undo mistakes with long-press
- Works offline, syncs later

**Why Swipe?**
- Marks 20 kids in under 30 seconds
- No accidental taps
- One-handed operation
- Muscle memory for coaches

### 2. 📅 Session Management
**Create Session:**
- Select date & time
- Choose age group
- Add general notes
- One-tap duplicate previous session

**View Sessions:**
- Today's active sessions
- Past sessions with attendance
- Session details & statistics
- Filter by date range

### 3. 👶 Age Group Filtering
Organize kids into age groups:
- **4-6 years** (Foundation)
- **7-9 years** (Development)
- **10-13 years** (Competitive)
- **13+ years** (Elite)

Filter attendance screen by age group for focused marking.

### 4. 👦 Kid Management
**Add New Kid:**
- Full name
- Age & date of birth
- Gender
- Area of residence
- Sponsorship type:
  - 🟢 **SP** (Self-Sponsored)
  - 🔵 **SC** (Scholarship)
- Program type:
  - Elite Training
  - Weekend Warrior
  - Holiday Programme
  - Team Support
- Parent contact (name & phone)
- Coach notes

**Edit Kid Profile:**
- Update information
- Change status:
  - Active
  - Suspended
  - Inactive
  - Expelled
- Add behavioral notes
- Track payment status

### 5. 💾 Offline Support
**How It Works:**
1. All data stored locally in SQLite
2. Mark attendance without internet
3. App detects internet connection
4. Queued changes auto-sync to Firebase
5. Sync status indicator shows progress

**Conflict Resolution:**
- Last-write-wins strategy
- Duplicate prevention
- Error recovery

**Sync Indicators:**
- 🔴 **Offline**: "3 items pending sync"
- 🟢 **Online**: "All synced"
- 🟡 **Syncing**: Animated spinner

### 6. 📊 Attendance History
**View Past Sessions:**
- Calendar view
- List view with filters
- Session summary cards
- Kid attendance trends

**Filters:**
- Date range picker
- Age group filter
- Search by kid name
- Status filter (present/absent)

**Session Details:**
- Date, time, age group
- Present/absent count
- Individual kid status
- Session notes
- Coach who created session

### 7. 📤 Export Functionality
**Export Formats:**
- CSV (Excel-compatible)
- Excel (.xlsx)
- PDF report (coming soon)

**What Can Be Exported:**
- Session attendance records
- Kid list with details
- Attendance history (date range)
- Summary statistics

**Export Example (CSV):**
```csv
Name,Age,Gender,Status,Date,Time,Age Group,Sponsorship
John Doe,10,Male,Present,2024-12-27,4:00 PM,10-13,SP
Jane Smith,8,Female,Absent,2024-12-27,4:00 PM,7-9,SC
```

### 8. 🔐 Google OAuth Authentication
**Sign-in Flow:**
1. Tap "Sign in with Google"
2. Redirects to oauth-backend (Vercel)
3. Backend exchanges code for token
4. Returns to app with token
5. Authenticates with Firebase
6. User logged in & synced

**Security:**
- OAuth 2.0 standard
- Client secrets on server only
- Token refresh handling
- Auto-logout on token expiry

---

## 📁 Project Structure
```
apps/attendance/
├── App.js                          # Entry point
├── index.js                        # Root file
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── eas.json                        # Build configuration
│
├── assets/                         # Static assets
│   ├── icon.png                   # App icon
│   ├── splash-icon.png            # Splash screen
│   └── adaptive-icon.png          # Android adaptive icon
│
└── src/
    ├── components/
    │   ├── attendance/
    │   │   ├── AttendanceCounter.js       # Live counter widget
    │   │   └── SwipeableKidItem.js        # Swipe gesture component
    │   ├── common/
    │   │   ├── Badge.js                   # SP/SC badges
    │   │   ├── Button.js                  # Custom buttons
    │   │   ├── Card.js                    # Content cards
    │   │   ├── FilterBar.js               # Age group filter
    │   │   ├── Header.js                  # Screen headers
    │   │   └── SearchBar.js               # Search input
    │   ├── kids/
    │   │   ├── KidListItem.js             # Kid card component
    │   │   └── KidModal.js                # Add/edit modal
    │   └── modals/
    │       ├── AdminElevationModal.js     # Role elevation
    │       └── SuccessModal.js            # Success feedback
    │
    ├── screens/
    │   ├── Auth/
    │   │   ├── AuthChoiceScreen.js        # Login options
    │   │   └── LoginScreen.js             # Email/password login
    │   ├── Onboarding/
    │   │   └── OnboardingScreen.js        # First-time setup
    │   ├── Home/
    │   │   └── HomeScreen.js              # Dashboard
    │   ├── AgeGroup/
    │   │   └── AgeGroupScreen.js          # Select age group
    │   ├── Attendance/
    │   │   └── AttendanceScreen.js        # Main marking screen
    │   ├── Summary/
    │   │   └── SummaryScreen.js           # Session completion
    │   ├── History/
    │   │   ├── HistoryScreen.js           # Past sessions list
    │   │   ├── SessionDetailScreen.js     # Session details
    │   │   └── AttendanceDetailScreen.js  # Attendance breakdown
    │   ├── MyKids/
    │   │   ├── MyKidsScreen.js            # All kids list
    │   │   └── AddEditKidScreen.js        # Add/edit form
    │   ├── Profile/
    │   │   └── ProfileScreen.js           # Coach profile
    │   └── Settings/
    │       └── SettingsScreen.js          # App settings
    │
    ├── navigation/
    │   ├── AppNavigator.js                # Root navigator
    │   ├── StackNavigator.js              # Stack navigation
    │   ├── DrawerNavigator.js             # Drawer menu
    │   ├── CustomDrawerContent.js         # Custom drawer
    │   ├── HistoryStackNavigator.js       # History stack
    │   └── MyKidsStackNavigator.js        # Kids stack
    │
    ├── database/
    │   ├── db.js                          # SQLite setup
    │   ├── schema.js                      # Database schema
    │   └── sync.js                        # Firebase sync logic
    │
    ├── config/
    │   └── firebase.js                    # Firebase configuration
    │
    ├── utils/
    │   ├── auth.js                        # Auth helpers
    │   ├── constants.js                   # App constants
    │   ├── dateUtils.js                   # Date formatting
    │   ├── exportUtils.js                 # CSV/Excel export
    │   ├── helpers.js                     # General helpers
    │   └── imageUtils.js                  # Image processing
    │
    └── scripts/
        ├── checkFirebaseKids.js           # Firebase data check
        ├── check-user.js                  # User verification
        ├── cleanup-firebase-duplicates.mjs # Remove duplicates
        └── migrate.js                     # Database migration
```

---

## 💾 Database Schema (SQLite)

### Kids Table
```sql
CREATE TABLE kids (
  id TEXT PRIMARY KEY,              -- UUID
  firebase_id TEXT UNIQUE,          -- Firebase document ID
  name TEXT NOT NULL,               -- Full name
  age INTEGER,                      -- Current age
  date_of_birth TEXT,               -- ISO format date
  gender TEXT,                      -- 'Male', 'Female', 'Other'
  age_group TEXT,                   -- '4-6', '7-9', '10-13', '13+'
  area_of_residence TEXT,           -- Home area/neighborhood
  sponsorship_type TEXT DEFAULT 'SP', -- 'SP' or 'SC'
  program_type TEXT DEFAULT 'Weekend Warrior', -- Training program
  status TEXT DEFAULT 'active',     -- 'active', 'suspended', 'inactive', 'expelled'
  parent_name TEXT,                 -- Parent/guardian name
  parent_phone TEXT,                -- Contact number
  notes TEXT,                       -- Coach notes
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT 0          -- 0 = needs sync, 1 = synced
);

CREATE INDEX idx_kids_firebase_id ON kids(firebase_id);
CREATE INDEX idx_kids_age_group ON kids(age_group);
CREATE INDEX idx_kids_status ON kids(status);
CREATE INDEX idx_kids_synced ON kids(synced);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,              -- UUID
  firebase_id TEXT UNIQUE,          -- Firebase document ID
  session_date TEXT NOT NULL,       -- ISO date (YYYY-MM-DD)
  session_time TEXT,                -- Time (HH:MM AM/PM)
  age_group TEXT,                   -- Target age group
  general_notes TEXT,               -- Session notes
  created_by TEXT,                  -- Coach user ID
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT 0
);

CREATE INDEX idx_sessions_firebase_id ON sessions(firebase_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_age_group ON sessions(age_group);
CREATE INDEX idx_sessions_synced ON sessions(synced);
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,              -- UUID
  firebase_id TEXT UNIQUE,          -- Firebase document ID
  session_id TEXT NOT NULL,         -- Foreign key to sessions
  kid_id TEXT NOT NULL,             -- Foreign key to kids
  status TEXT NOT NULL,             -- 'present' or 'absent'
  notes TEXT,                       -- Individual kid notes
  marked_at TEXT DEFAULT CURRENT_TIMESTAMP, -- When marked
  synced BOOLEAN DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (kid_id) REFERENCES kids(id) ON DELETE CASCADE
);

CREATE INDEX idx_attendance_firebase_id ON attendance(firebase_id);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_kid ON attendance(kid_id);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_synced ON attendance(synced);

-- Prevent duplicate attendance records
CREATE UNIQUE INDEX idx_attendance_unique ON attendance(session_id, kid_id);
```

---

## 🔄 Sync Strategy

### How Sync Works

**1. Offline Operations**
- All CRUD operations saved to SQLite
- Records marked `synced = 0` (pending)
- No internet required

**2. Sync Detection**
- App monitors internet connection
- Auto-sync triggered when online
- Manual sync button available

**3. Sync Process**
```
Fetch unsynced records (synced = 0)
    ↓
For each record:
    - Check if exists in Firebase
    - If exists: Update
    - If not: Create
    ↓
On success:
    - Update local record with firebase_id
    - Mark synced = 1
    ↓
On error:
    - Log error
    - Keep synced = 0
    - Retry later
```

**4. Conflict Resolution**
- **Strategy**: Last-write-wins
- **Duplicate Check**: Firebase ID matching
- **Error Recovery**: Retry with exponential backoff

### Sync Triggers
- ✅ App startup (if online)
- ✅ Manual sync button tap
- ✅ After marking attendance
- ✅ After adding/editing kid
- ✅ Background sync (every 5 minutes)
- ✅ Network connection restored

### Sync Status UI
```javascript
// In app header
🔴 Offline - 3 items pending sync
🟢 Online - All synced
🟡 Syncing... 2/5 completed
```

---

## 🎨 UI/UX Design

### Color Palette
```javascript
const colors = {
  primary: '#2196F3',      // Blue - main brand
  success: '#4CAF50',      // Green - present
  danger: '#F44336',       // Red - absent
  warning: '#FF9800',      // Orange - warnings
  info: '#00BCD4',         // Cyan - info
  gray: '#9E9E9E',         // Gray - inactive
  dark: '#212121',         // Almost black - text
  light: '#F5F5F5',        // Light gray - backgrounds
  white: '#FFFFFF',        // Pure white
};
```

### Badge System

**Sponsorship Badges:**
- 🟢 **SP** (Self-Sponsored) - Green badge, solid fill
- 🔵 **SC** (Scholarship) - Blue badge, solid fill

**Program Type Badges:**
- 🥇 **Elite** - Gold badge
- 🥈 **Weekend Warrior** - Silver badge
- 🥉 **Holiday Programme** - Bronze badge
- 💙 **Team Support** - Blue badge

**Status Indicators:**
- ✅ **Active** - Green dot
- ⏸️ **Suspended** - Yellow dot
- 💤 **Inactive** - Gray dot
- ❌ **Expelled** - Red X

### Screen Designs

**Home Screen:**
- Quick stats card (total kids, today's sessions)
- Recent sessions list
- Quick actions (New Session, View Kids)

**Attendance Screen:**
- Swipeable kid cards
- Live counter at top
- Age group filter tabs
- Search bar
- Complete session button

**Summary Screen:**
- Confetti animation 🎉
- Session stats (20/25 present)
- Present/absent lists
- Export button
- View details button

---

## 🔧 Development

### Available Scripts
```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run on web (limited)
npm test               # Run tests
npm run lint           # Lint code
npm run format         # Format with Prettier
```

### Adding New Features

**1. Create Feature Branch:**
```bash
git checkout -b feature/feature-name
```

**2. Make Changes:**
- Add components in `src/components/`
- Add screens in `src/screens/`
- Update navigation if needed
- Add database queries in `src/database/`

**3. Test:**
- Test on iOS simulator
- Test on Android emulator
- Test offline mode
- Test sync functionality

**4. Commit & Push:**
```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/feature-name
```

**5. Create Pull Request**

### Database Migrations

**Run Migration Script:**
```bash
node scripts/migrate.js
```

**What It Does:**
- Creates missing tables
- Adds missing columns
- Updates indexes
- Migrates data format

**Check Firebase Data:**
```bash
node scripts/checkFirebaseKids.js
```

**Clean Duplicates:**
```bash
node scripts/cleanup-firebase-duplicates.mjs
```

---

## 📦 Building for Production

### Using EAS Build (Recommended)

**1. Install EAS CLI:**
```bash
npm install -g eas-cli
```

**2. Login:**
```bash
eas login
```

**3. Configure Project:**
```bash
eas build:configure
```

**4. Build APK (Android):**
```bash
eas build --platform android --profile production
```

**5. Build IPA (iOS - Mac required):**
```bash
eas build --platform ios --profile production
```

**6. Download Build:**
- Check build status: `eas build:list`
- Download from Expo dashboard
- Or use: `eas build:download`

### Build Profiles (eas.json)
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "development": {
      "developmentClient": true,
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Alternative: Local Builds

**Android (requires Android Studio):**
```bash
cd android
./gradlew assembleRelease
# APK in android/app/build/outputs/apk/release/
```

**iOS (requires Xcode on Mac):**
```bash
cd ios
pod install
# Open Xcode → Build
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Sync Not Working
**Symptoms:** "Pending sync" never clears

**Solutions:**
- Check internet connection
- Verify Firebase credentials in `.env`
- Check Firebase console for errors
- Clear app cache:
  ```javascript
  import AsyncStorage from '@react-native-async-storage/async-storage';
  await AsyncStorage.clear();
  ```
- Check Firebase rules allow writes

#### 2. SQLite Errors
**Symptoms:** "Database locked" or query failures

**Solutions:**
- Delete app and reinstall
- Run migration script: `node scripts/migrate.js`
- Check database schema matches code
- Clear app data in device settings

#### 3. Authentication Failed
**Symptoms:** Can't sign in with Google

**Solutions:**
- Verify Firebase credentials
- Check oauth-backend is running
- Test oauth endpoint manually
- Clear AsyncStorage
- Check Google OAuth console settings

#### 4. App Crashes on Startup
**Symptoms:** White screen or immediate crash

**Solutions:**
- Check console logs: `npx react-native log-android` or `log-ios`
- Clear Metro bundler cache: `npm start -- --reset-cache`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for missing environment variables

#### 5. Slow Performance
**Symptoms:** Laggy scrolling, slow responses

**Solutions:**
- Reduce kid list size (pagination)
- Optimize images (compress, resize)
- Clear old sessions from SQLite
- Enable Hermes engine (already enabled in Expo)
- Profile with React DevTools

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Sign in with Google
- [ ] Sign in with email/password
- [ ] Sign out
- [ ] Token refresh on expiry

**Session Management:**
- [ ] Create new session
- [ ] Edit session
- [ ] Delete session
- [ ] View session details

**Attendance:**
- [ ] Mark kid present (swipe right)
- [ ] Mark kid absent (swipe left)
- [ ] Undo mark (long press)
- [ ] Complete session
- [ ] View session summary

**Kid Management:**
- [ ] Add new kid
- [ ] Edit existing kid
- [ ] Change kid status
- [ ] Search for kid
- [ ] Filter by age group

**Offline Mode:**
- [ ] Mark attendance offline
- [ ] Add kid offline
- [ ] Edit kid offline
- [ ] View pending sync count
- [ ] Auto-sync when online

**History:**
- [ ] View past sessions
- [ ] Filter by date
- [ ] Export attendance CSV
- [ ] View kid attendance history

**Sync:**
- [ ] Manual sync button
- [ ] Auto-sync on startup
- [ ] Auto-sync after operations
- [ ] Conflict resolution

### Automated Tests (Future)
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

---

## 📊 Analytics & Monitoring

### Firebase Analytics Events

**Track Key Events:**
```javascript
import analytics from '@react-native-firebase/analytics';

// Session created
await analytics().logEvent('session_created', {
  age_group: '10-13',
  session_date: '2024-12-27',
  created_by: userId,
});

// Attendance marked
await analytics().logEvent('attendance_marked', {
  session_id: sessionId,
  kids_present: 15,
  kids_absent: 5,
  total_kids: 20,
});

// Kid added
await analytics().logEvent('kid_added', {
  age_group: '7-9',
  sponsorship_type: 'SC',
  program_type: 'Elite',
});

// Export completed
await analytics().logEvent('export_completed', {
  format: 'csv',
  record_count: 100,
});
```

### Custom Logging
```javascript
// Log to console and remote service
console.log({
  event: 'sync_success',
  timestamp: new Date().toISOString(),
  records_synced: 10,
  duration_ms: 1234,
});
```

---

## 🤝 Related Projects

### Ecosystem
- **Web Dashboard**: `../../web/` - View attendance online
- **Assessment App**: `../assessment/` - Performance assessments
- **OAuth Backend**: `../../oauth-backend/` - Authentication service

### Integration Flow
```
Mobile App (Attendance)
    ↓ marks attendance
SQLite (local)
    ↓ syncs
Firebase Firestore
    ↓ reads
Web Dashboard (React)
    ↓ queries
Laravel API + MySQL (reports)
```

---

## 📞 Support

- *Developer**: msf_bennett@fedora
- **Company**: Swimming Ducks
- **Brand**: AccellaX 361° | Silicon Ducks
- **Academy**: NextGen Multisport Academy
- **Location**: Nairobi, Kenya
- **Issues**: Contact developer directly

---

## 📄 License

Proprietary - © 2025 AccellaX 361° Silicon by Swimming Ducks

Part of the AccellaX 361° ecosystem. Not licensed for external use.

---

## 🙏 Acknowledgments

- NextGen Multisport Academy coaches
- All the kids and parents
- Firebase team
- Expo team
- React Native community

---

**Built with ❤️ by Swimming Ducks for NextGen Multisport Academy | Nairobi, Kenya**

         *AccellaX 361° | Silicon Ducks*
         
         *Empowering coaches with offline-first attendance tracking*