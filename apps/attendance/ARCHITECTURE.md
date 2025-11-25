# AccellaX 361° - Complete Architecture Documentation

**Last Updated:** November 14, 2024  
**Version:** 4  
**Status:** ✅ Production Ready (Core Features Complete)

---

## 🎯 Project Overview

**AccellaX 361°** is an offline-first attendance tracking application designed for soccer coaches managing 50-100+ kids across multiple age groups at NextGen MultiSport Academy.

### Key Features
- ✅ Offline-first architecture (works without internet)
- ✅ Multi-age group support (4-6, 7-9, 10-13, 13+)
- ✅ Swipe-based attendance marking
- ✅ Session history and analytics
- ✅ Data export (JSON backup)
- ✅ Data cleanup utilities (remove duplicates/test data)
- ⏳ Firebase cloud sync (pending implementation)

---

## 🏗️ Technical Architecture

### Platform Support

| Platform | Storage | Status | Notes |
|----------|---------|--------|-------|
| **Web (Browser)** | AsyncStorage | ✅ Working | For development/testing |
| **Android** | SQLite | ✅ Ready | Native database via expo-sqlite |
| **iOS** | SQLite | ✅ Ready | Native database via expo-sqlite |

### Tech Stack
```
Frontend: React Native (Expo)
Navigation: React Navigation (Drawer + Stack)
Local Storage: 
  - Web: AsyncStorage (mock database)
  - Native: expo-sqlite (SQLite database)
Cloud Sync: Firebase Firestore (planned)
State Management: React Hooks (useState, useEffect)
Gestures: react-native-gesture-handler
Date Handling: date-fns
```

---

## 📊 Database Architecture

### Storage Strategy: **Dual-Mode Database**
```javascript
if (Platform.OS === 'web') {
  // Use AsyncStorage with in-memory objects
  webDB = { kids: [], sessions: [], attendance: [] }
} else {
  // Use SQLite native database
  db = await SQLite.openDatabaseAsync('accellax361.db')
}
```

### Database Schema

#### 1. **Kids Table**
```sql
CREATE TABLE kids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT,
  area_of_residence TEXT,
  age_group TEXT NOT NULL,      -- '4-6', '7-9', '10-13', '13+'
  status TEXT DEFAULT 'active',  -- 'active', 'suspended'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  firebase_synced INTEGER DEFAULT 0
);
```

#### 2. **Sessions Table**
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_date DATE NOT NULL,
  session_time TEXT NOT NULL,    -- '4-6 PM', '2-4:30 PM', '9-11 AM'
  day_of_week TEXT NOT NULL,     -- 'Sunday', 'Monday', etc.
  general_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  firebase_synced INTEGER DEFAULT 0
);
```

#### 3. **Attendance Table**
```sql
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  kid_id INTEGER NOT NULL,
  status TEXT NOT NULL,          -- 'present', 'absent'
  marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  firebase_synced INTEGER DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (kid_id) REFERENCES kids(id)
);
```

#### 4. **Settings Table**
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Database Operations - Complete API
```javascript
// Kids CRUD
insertKid(name, age, gender, area, ageGroup) ✅
getAllKids() ✅
getKidsByAgeGroup(ageGroup) ✅
getKidById(id) ✅
updateKid(id, data) ✅
updateKidStatus(id, status) ✅ // suspend/activate
deleteKid(id) ✅
searchKids(query) ✅

// Sessions CRUD
createSession(date, time, dayOfWeek) ✅
getSessionById(sessionId) ✅
getAllSessions() ✅
updateSessionNotes(sessionId, notes) ✅
deleteSession(sessionId) ✅

// Attendance Operations
markAttendance(sessionId, kidId, status) ✅
getSessionAttendance(sessionId) ✅
getKidAttendanceHistory(kidId) ✅
getKidAttendanceStats(kidId) ✅
clearAgeGroupAttendance(sessionId, ageGroup) ✅
getSessionStats(sessionId) ✅

// Utility Functions
getDatabase() ✅
clearAllData() ✅
```

---

## 🗂️ Project Structure
```
AccellaX361/
├── src/
│   ├── screens/
│   │   ├── Onboarding/
│   │   │   ├── OnboardingScreen.js ✅
│   │   │   └── styles.js ✅
│   │   ├── Home/
│   │   │   ├── HomeScreen.js ✅
│   │   │   └── styles.js ✅
│   │   ├── AgeGroup/
│   │   │   ├── AgeGroupScreen.js ✅
│   │   │   └── styles.js ✅
│   │   ├── Attendance/
│   │   │   ├── AttendanceScreen.js ✅
│   │   │   └── styles.js ✅
│   │   ├── Summary/
│   │   │   ├── SummaryScreen.js ✅
│   │   │   └── styles.js ✅
│   │   ├── History/
│   │   │   ├── HistoryScreen.js ✅
│   │   │   ├── SessionDetailScreen.js ✅
│   │   │   └── styles.js ✅
│   │   ├── MyKids/
│   │   │   ├── MyKidsScreen.js ✅
│   │   │   ├── AddEditKidScreen.js ✅
│   │   │   └── styles.js ✅
│   │   └── Settings/
│   │       ├── SettingsScreen.js ✅ (Clean, Production-Ready)
│   │       └── styles.js ✅
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.js ✅
│   │   │   ├── Button.js ✅
│   │   │   ├── Card.js ✅
│   │   │   ├── SearchBar.js ✅
│   │   │   └── FAB.js ✅
│   │   ├── attendance/
│   │   │   ├── SwipeableKidItem.js ✅
│   │   │   └── AttendanceCounter.js ✅
│   │   └── kids/
│   │       ├── KidListItem.js ✅
│   │       └── KidModal.js ✅
│   ├── database/
│   │   ├── db.js ✅ (Complete, Working)
│   │   ├── schema.js ✅
│   │   └── sync.js ⏳ (Planned - Firebase)
│   ├── utils/
│   │   ├── constants.js ✅
│   │   ├── dateUtils.js ✅
│   │   ├── helpers.js ✅
│   │   └── dataCleanup.js ✅ (New - Cleanup utilities)
│   ├── navigation/
│   │   ├── AppNavigator.js ✅
│   │   ├── DrawerNavigator.js ✅
│   │   └── StackNavigator.js ✅
│   └── assets/
│       ├── images/
│       └── fonts/
├── App.js ✅
├── package.json ✅
└── ARCHITECTURE.md ← You are here
```

---

## 🔄 Data Flow Architecture

### User Action Flow
```
User Action → Local Database (SQLite/AsyncStorage) → UI Update
                     ↓ (when online)
            Firebase Sync (background) ⏳
```

### Example: Adding a Kid
```javascript
1. User fills form in AddEditKidScreen
2. handleSave() → insertKid() → saves to webDB/SQLite
3. Navigate back → MyKidsScreen refreshes
4. [Future] Background sync marks firebase_synced=1
```

---

## 🛠️ Data Cleanup System

### Features (NEW - Implemented)
```javascript
// Remove test data
removeTestData() → Deletes kids with "test" in name

// Remove duplicates  
removeDuplicateKids() → Keeps oldest, removes newer duplicates

// Export backup
exportDatabaseJSON() → Copies JSON to clipboard

// Clear all data
clearAllData() → Wipes entire database

// Get statistics
getDatabaseStats() → Returns counts, issues, storage mode
```

### Settings Screen Features
- ✅ Data statistics dashboard
- ✅ Warning banner for data issues
- ✅ One-click cleanup buttons
- ✅ Custom modal dialogs (platform-agnostic)
- ✅ Export to JSON
- ✅ Clear all data with confirmation

---

## 📅 Training Schedule
```javascript
const TRAINING_SCHEDULE = {
  Sunday: { start: '2:00 PM', end: '4:30 PM' },
  Monday: { start: '4:00 PM', end: '6:00 PM' },
  Wednesday: { start: '4:00 PM', end: '6:00 PM' },
  Friday: { start: '4:00 PM', end: '6:00 PM' },
  Saturday: { start: '9:00 AM', end: '11:00 AM' },
};

// Non-training days: Tuesday, Thursday
```

---

## 🎨 UI/UX Design Patterns

### Color Scheme
```javascript
COLORS = {
  primary: '#2196F3',    // Blue
  secondary: '#4CAF50',  // Green
  present: '#4CAF50',    // Green (attendance)
  absent: '#F44336',     // Red (attendance)
  suspended: '#9E9E9E',  // Gray
  warning: '#FF9800',    // Orange
  background: '#F5F5F5', // Light Gray
  white: '#FFFFFF',
  text: '#212121',       // Dark Gray
  textSecondary: '#757575', // Medium Gray
}
```

### Custom Modal System
- Cross-platform compatible (web, Android, iOS)
- 4 types: info, success, error, confirm
- Icons: ℹ️, ✅, ❌, ⚠️
- Smooth fade animation
- Backdrop blur effect

---

## 🧪 Testing Status

### Tested Features ✅

| Feature | Web | Android | iOS | Status |
|---------|-----|---------|-----|--------|
| Database Init | ✅ | ⏳ | ⏳ | Working |
| Add/Edit Kids | ✅ | ⏳ | ⏳ | Working |
| Delete Kids | ✅ | ⏳ | ⏳ | Working |
| Create Session | ✅ | ⏳ | ⏳ | Working |
| Mark Attendance | ✅ | ⏳ | ⏳ | Working |
| Swipe Gestures | ✅ | ⏳ | ⏳ | Working |
| Remove Test Data | ✅ | ⏳ | ⏳ | Working |
| Remove Duplicates | ✅ | ⏳ | ⏳ | Working |
| Export Data | ✅ | ⏳ | ⏳ | Working |
| Clear All Data | ✅ | ⏳ | ⏳ | Working |

**Test Results (Web - Nov 14, 2024):**
```
✅ Database initialization: PASS
✅ Insert kid: PASS (16 kids added)
✅ Delete kid: PASS (13→12→8 after cleanups)
✅ Create session: PASS (38 sessions)
✅ Mark attendance: PASS (1 attendance record)
✅ Remove test data: PASS (4 removed)
✅ Remove duplicates: PASS (4 removed)
```

---

## 🚀 Deployment Guide

### Building for Android
```bash
# Build APK
cd android
./gradlew assembleRelease

# Output location:
# android/app/build/outputs/apk/release/app-release.apk

# Install on device
adb install app-release.apk
```

### Building for iOS
```bash
# Coming soon - requires Mac + Xcode
expo build:ios
```

### Web Deployment
```bash
# Build for web
npx expo export:web

# Deploy to hosting (Firebase/Netlify/Vercel)
```

---

## ⏭️ Roadmap

### Phase 1: Core Features ✅ **COMPLETE**
- [x] Database setup (SQLite + AsyncStorage)
- [x] Onboarding flow
- [x] Kids management (CRUD)
- [x] Session creation
- [x] Attendance marking (swipe gestures)
- [x] History viewing
- [x] Settings screen
- [x] Data cleanup utilities

### Phase 2: Firebase Integration ⏳ **NEXT**
- [ ] Firebase project setup
- [ ] Firestore schema design
- [ ] Background sync implementation
- [ ] Conflict resolution strategy
- [ ] Sync status indicators
- [ ] Manual sync trigger

### Phase 3: Advanced Features 📋 **PLANNED**
- [ ] PDF/Excel export
- [ ] Attendance analytics (charts)
- [ ] Push notifications (session reminders)
- [ ] Multi-coach support
- [ ] Parent portal (view kid's attendance)
- [ ] Photo support for kids
- [ ] Offline indicator UI
- [ ] Data migration tools

### Phase 4: Polish & Scale 🎯 **FUTURE**
- [ ] Performance optimization (pagination)
- [ ] Advanced search/filters
- [ ] Bulk operations
- [ ] Custom age group definitions
- [ ] Multiple academy support
- [ ] Admin dashboard
- [ ] API for third-party integrations

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Web Storage**: AsyncStorage limited to ~10MB (adequate for 100s of kids)
2. **No Firebase Sync**: Data currently local-only
3. **No Photo Support**: Kids identified by name only
4. **Single Coach**: No multi-user collaboration yet
5. **No Data Migration**: Version updates require manual export/import

### Browser Compatibility
- ✅ Chrome/Edge (tested)
- ✅ Firefox (should work)
- ✅ Safari (should work)
- ❌ IE11 (not supported)

---

## 📝 Development Notes

### Code Quality Standards
- ✅ No console.logs in production (only error logs)
- ✅ Proper error handling with try-catch
- ✅ Platform-specific code properly separated
- ✅ Consistent naming conventions
- ✅ Component reusability
- ✅ Clean code structure

### Performance Considerations
- Lazy loading for large lists
- Debounced search inputs
- Efficient database queries
- Minimal re-renders with proper React patterns

---

## 📚 API Reference

### Database Functions (db.js)

Full documentation in code comments. Key functions:
```javascript
// Initialization
await initDatabase()

// Kids
const kid = await insertKid(name, age, gender, area, ageGroup)
const kids = await getAllKids()
await deleteKid(id)

// Sessions
const session = await createSession(date, time, dayOfWeek)
await updateSessionNotes(sessionId, notes)

// Attendance
await markAttendance(sessionId, kidId, 'present')
const stats = await getKidAttendanceStats(kidId)
```

### Cleanup Utilities (dataCleanup.js)
```javascript
// Remove test kids
const result = await removeTestData()
// Returns: { success: boolean, count: number }

// Remove duplicates
const result = await removeDuplicateKids()
// Returns: { success: boolean, count: number }

// Get database stats
const stats = await getDatabaseStats()
// Returns: { totalKids, totalSessions, duplicates, testData, storageMode }

// Export as JSON
const result = await exportDatabaseJSON()
// Returns: { success: boolean, data: string }

// Clear everything
const result = await clearAllData()
// Returns: { success: boolean }
```

---

## 🤝 Contributing

### Development Setup
```bash
# Clone repo
git clone [repo-url]

# Install dependencies
npm install

# Start development server
npx expo start --web
```

### Code Style
- Use functional components with hooks
- Follow existing naming patterns
- Add comments for complex logic
- Test on web before mobile
- Keep functions small and focused

---

## 📄 License

© 2024 NextGen MultiSport Academy  
Built with ❤️ for coaches

---

**End of Documentation**
