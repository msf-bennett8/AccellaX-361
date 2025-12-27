# AccellaX 361° Silicon by Swimming Ducks | Assessment App

> **Comprehensive Performance Assessment for Young Athletes**  
> Track fitness metrics, benchmarks, and athlete progress with industry-standard tests

[![React Native](https://img.shields.io/badge/React_Native-0.72-61DAFB?logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-49-000020?logo=expo)](https://expo.dev)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase)](https://firebase.google.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://www.sqlite.org)

---

## 📱 Overview

The AccellaX Assessment App provides professional-grade fitness assessments 
for sports academies. Conduct standardized tests, track progress, and benchmark 
against age/gender norms. It provides standardized tests, real-time tracking, and comprehensive reporting for athlete development.

**Key Features:**
- ✅ **Standardized Tests**: Beep test, Cooper test, sprint tests
- ✅ **Live Tracking**: Real-time beep test with audio cues
- ✅ **Benchmarking**: Compare against age/gender norms
- ✅ **Progress Tracking**: Historical data & trends
- ✅ **Video Analysis**: Record and review technique
- ✅ **Offline-first**: All assessments work offline
- ✅ **Auto-sync**: Firebase cloud synchronization
- ✅ **Comprehensive Reports**: Export detailed reports
- ✅ **Leaderboards**: Top performers and most improved

---

## 🏫 Customizing Benchmarks

Assessment benchmarks can be customized for your region/standards.

**📖 See**: [Academy Setup Guide](../../ACADEMY_SETUP.md#assessment-benchmarks) for configuration details.

---

## 🏗️ Architecture

### Data Flow
```
Coach conducts assessment
    ↓
SQLite (local storage)
    ↓ when online
Firebase Firestore (cloud sync)
    ↓
Web Dashboard (analytics & reports)
    ↓
Laravel API + MySQL (advanced analytics)
```

### Tech Stack
- **Framework**: React Native + Expo
- **Local Database**: SQLite (expo-sqlite)
- **Cloud Sync**: Firebase Firestore
- **Authentication**: Firebase Auth + Google/Strava OAuth
- **Media**: Expo Camera, Expo AV (audio/video)
- **Charts**: Victory Native (performance charts)
- **State Management**: React Context API
- **Audio**: Expo AV (beep test audio)

---

## 🔊 IMPORTANT: Beep Test Audio Setup

### ⚠️ REQUIRED: Add Beep Audio File

The app **requires** a `beep.mp3` file for the beep test to work.

**Location**: `apps/assessment/assets/sounds/beep.mp3`

### How to Get Beep Audio

#### Option 1: Download Free Beep Sound
1. Visit: **https://freesound.org/search/?q=beep**
2. Search for "beep test" or "timer beep"
3. Download as MP3
4. Rename to `beep.mp3`
5. Place in `apps/assessment/assets/sounds/`

#### Option 2: Generate Beep Online
1. Visit: **https://onlinetonegenerator.com/**
2. Set frequency: **1000-2000 Hz**
3. Duration: **0.5-1 second**
4. Click "Play" to preview
5. Download as MP3
6. Save as `beep.mp3`

#### Option 3: Record Your Own
```bash
# Using ffmpeg (if installed)
ffmpeg -f lavfi -i "sine=frequency=1000:duration=1" beep.mp3
```

### Recommended Audio Specifications
- **Format**: MP3 or WAV
- **Duration**: 0.5-1 second (short beep)
- **Frequency**: 1000-2000 Hz (clear, audible)
- **Volume**: Moderate (not too loud)
- **Bitrate**: 128 kbps
- **Sample Rate**: 44.1 kHz

### File Structure
```
apps/assessment/
└── assets/
    └── sounds/
        └── beep.mp3  ← ADD THIS FILE
```

---

## 🏃 Beep Test Instructions

### What is the Beep Test?

The **20-meter beep test** (also called Multi-Stage Fitness Test, PACER test, or Bleep test) is a maximal running test that assesses cardiovascular endurance.

**How It Works:**
Athletes run back and forth between two lines positioned 20 meters apart. The running speed is controlled by audio beeps that get progressively faster each minute. The goal is to keep pace with the beeps for as long as possible.

### Setup Requirements

**What You Need:**
1. ✅ **Flat, non-slip surface** (indoor gym or outdoor field)
2. ✅ **20-meter distance** (measure accurately with tape)
3. ✅ **Cones or markers** for each end line
4. ✅ **Measuring tape** (20 meters long)
5. ✅ **This app** (with beep.mp3 loaded!)
6. ✅ **Optional**: Whiteboard to track scores

**Space Requirements:**
- Minimum: 20m x 2m
- Recommended: 20m x 4m (multiple lanes)
- Allow 2m clearance at each end

### Test Rules & Protocol

#### Starting the Test
1. **Position**: Stand at one end with **one foot touching the line**
2. **Countdown**: Listen for **5-second countdown**
3. **Start Signal**: **Triple beep (beep-beep-beep)** signals start
4. **First Run**: Sprint to opposite line when beep sounds

#### During the Test
- ✅ **Reach the line** before or on the beep
- ✅ **Touch the line** with one foot
- ✅ **Wait if early** - don't start next shuttle until beep
- ✅ **Turn and run back** when next beep sounds
- ✅ **Keep pace** - speed increases each level (~1 minute)
- ✅ **Triple beep** indicates new level (faster pace)

#### Test Ends When:
- ❌ You **miss two consecutive beeps** (didn't reach line in time)
- ❌ You **can no longer maintain the pace**
- ❌ You **voluntarily stop** (exhaustion)

#### Scoring
- **Format**: Level.Shuttle (e.g., **8.5** = Level 8, Shuttle 5)
- **Higher is better**: More endurance
- **Record**: Highest level + shuttle reached

### Beep Test Levels & Speeds

| Level | Shuttles | Speed (km/h) | Time/Shuttle | Cumulative Time | Difficulty |
|-------|----------|--------------|--------------|-----------------|------------|
| 1 | 7 | 8.0 | 9.0s | 1:03 | Easy |
| 2 | 8 | 9.0 | 8.0s | 2:07 | Easy |
| 3 | 8 | 9.5 | 7.6s | 3:08 | Moderate |
| 4 | 9 | 10.0 | 7.2s | 4:13 | Moderate |
| 5 | 9 | 10.5 | 6.9s | 5:15 | Moderate |
| 6 | 10 | 11.0 | 6.5s | 6:20 | Challenging |
| 7 | 10 | 11.5 | 6.3s | 7:23 | Challenging |
| 8 | 11 | 12.0 | 6.0s | 8:29 | Hard |
| 9 | 11 | 12.5 | 5.8s | 9:33 | Hard |
| 10 | 11 | 13.0 | 5.5s | 10:34 | Very Hard |
| 11 | 12 | 13.5 | 5.3s | 11:38 | Very Hard |
| 12 | 12 | 14.0 | 5.1s | 12:39 | Extreme |
| 13 | 13 | 14.5 | 5.0s | 13:44 | Extreme |
| 14 | 13 | 15.0 | 4.8s | 14:46 | Elite |
| 15 | 13 | 15.5 | 4.6s | 15:46 | Elite |
| 16 | 14 | 16.0 | 4.5s | 16:49 | Elite |
| 17 | 14 | 16.5 | 4.4s | 17:50 | Elite |
| 18 | 15 | 17.0 | 4.2s | 18:54 | Professional |
| 19 | 15 | 17.5 | 4.1s | 19:56 | Professional |
| 20 | 16 | 18.0 | 4.0s | 21:00 | Professional |
| 21 | 16 | 18.5 | 3.9s | 22:02 | World Class |

### Age & Gender Benchmarks

#### Boys (10-12 years)
- 🥇 **Excellent**: >10.0 (>13.0 km/h)
- 🥈 **Good**: 8.0-10.0 (12.0-13.0 km/h)
- 🥉 **Average**: 6.0-8.0 (11.0-12.0 km/h)
- 📊 **Below Average**: <6.0 (<11.0 km/h)

#### Girls (10-12 years)
- 🥇 **Excellent**: >8.0 (>12.0 km/h)
- 🥈 **Good**: 6.5-8.0 (11.0-12.0 km/h)
- 🥉 **Average**: 5.0-6.5 (10.5-11.0 km/h)
- 📊 **Below Average**: <5.0 (<10.5 km/h)

#### Boys (13-15 years)
- 🥇 **Excellent**: >12.0 (>14.0 km/h)
- 🥈 **Good**: 10.0-12.0 (13.0-14.0 km/h)
- 🥉 **Average**: 8.0-10.0 (12.0-13.0 km/h)
- 📊 **Below Average**: <8.0 (<12.0 km/h)

#### Girls (13-15 years)
- 🥇 **Excellent**: >9.0 (>12.5 km/h)
- 🥈 **Good**: 7.5-9.0 (11.5-12.5 km/h)
- 🥉 **Average**: 6.0-7.5 (11.0-11.5 km/h)
- 📊 **Below Average**: <6.0 (<11.0 km/h)

*Full benchmark data available in `src/config/benchmarks.js`*

### Safety & Best Practices

**Pre-Test:**
- ✅ Proper warm-up (5-10 minutes of light jogging)
- ✅ Dynamic stretching (leg swings, high knees)
- ✅ Hydrate well (drink water 30 mins before)
- ✅ Medical clearance for at-risk individuals
- ✅ Explain test protocol clearly

**During Test:**
- ⚠️ Monitor for signs of distress (pale face, dizziness)
- ⚠️ Stop if experiencing chest pain or breathing difficulty
- ⚠️ Encourage but don't force continuation
- ⚠️ Have water available nearby
- ⚠️ Ensure adequate ventilation (if indoors)

**Post-Test:**
- ✅ Cool down (5-10 minutes of walking)
- ✅ Static stretching (hamstrings, calves, quads)
- ✅ Rehydrate immediately
- ✅ Record results promptly
- ✅ Provide feedback to athlete

**Contraindications:**
- ❌ Recent illness or injury
- ❌ Heart conditions (without medical clearance)
- ❌ Severe asthma (uncontrolled)
- ❌ High fever
- ❌ Extreme fatigue

---

## 🎯 Assessment Types

### 1. 🏃 Cardiovascular Endurance

#### Beep Test (20m Multi-Stage Fitness)
- **What**: Run 20m shuttles at progressively faster speeds
- **Scoring**: Level.Shuttle (e.g., 8.5)
- **App Feature**: Live tracker with audio beeps
- **Duration**: Until exhaustion (5-20 minutes)
- **Equipment**: 20m distance, cones, this app

#### Cooper Test (12-minute run)
- **What**: Run as far as possible in 12 minutes
- **Scoring**: Distance in meters
- **App Feature**: GPS tracking + manual entry
- **Duration**: 12 minutes
- **Equipment**: Track or measured route

### 2. ⚡ Speed & Agility

#### Sprint Tests
- **10m Sprint**: Acceleration (1.5-2.5 seconds)
- **20m Sprint**: Speed (3.0-4.5 seconds)
- **30m Sprint**: Top speed (4.5-6.0 seconds)
- **Scoring**: Time in seconds (to 0.01s)
- **Equipment**: Cones, stopwatch

#### Agility Tests
- **T-Test**: Change of direction (8-12 seconds)
- **5-10-5 Shuttle**: Lateral agility (4-6 seconds)
- **Illinois Agility**: Complex movements (14-18 seconds)

### 3. 💪 Strength & Power

#### Upper Body
- **Push-ups**: Max reps in 60s (10-50)
- **Pull-ups**: Max reps (0-15)
- **Medicine Ball Throw**: Distance in meters (3-10m)

#### Lower Body
- **Standing Long Jump**: Power (1.0-2.5m)
- **Vertical Jump**: Explosive power (20-60cm)
- **Single Leg Hop**: Balance + power (0.8-2.0m)

#### Core
- **Plank**: Max hold time (30s-5min)
- **Sit-ups**: Max reps in 60s (15-50)

### 4. 🧘 Flexibility
- **Sit & Reach**: Hamstring flexibility (-5 to +25cm)
- **Shoulder Flexibility**: Range of motion

### 5. ⚽ Sport-Specific
- **Soccer**: Dribbling speed, shooting accuracy
- **Basketball**: Suicide drill, free throw percentage
- **Volleyball**: Approach jump, serve accuracy
- **Track**: 400m, 800m, 1500m times

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio
- Firebase project

### Installation
```bash
# Navigate to assessment app
cd apps/assessment

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure Firebase in .env

# IMPORTANT: Add beep.mp3 file
# Download from freesound.org or generate online
# Place in: assets/sounds/beep.mp3
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

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator
npm run android

# Test beep audio playback
# Navigate to Beep Test screen and tap Play Test
```

---

## 📱 Key Features

### 1. 🔴 Live Beep Test Tracker
**Real-time tracking during beep test:**
- Audio beep playback (requires beep.mp3)
- Visual countdown timer
- Current level & shuttle display
- Running speed indicator
- Distance covered calculation
- Auto-advance levels
- Pause/resume functionality
- Final score calculation

**How to Use:**
1. Select kid(s) from list
2. Tap "Start Beep Test"
3. Press "Begin Test" button
4. Audio beeps guide running pace
5. Tap "Miss" if kid doesn't reach line
6. Tap "Finish" when kid stops
7. Score auto-saved

### 2. 📊 Batch Assessments
**Assess multiple kids at once:**
- Select multiple kids
- Enter all scores on one screen
- Quick save (no duplicate entry)
- Time-efficient for groups
- Ideal for team testing days

### 3. 📈 Progress Tracking
**Historical performance view:**
- Line charts showing improvement
- Percentile rankings over time
- Best performance highlights
- Comparison to benchmarks
- Export progress reports

### 4. 🏆 Leaderboards
**Competitive motivation:**
- **Top Performers**: Highest scores
- **Most Improved**: Biggest gains
- **Age Group Rankings**: Fair comparison
- **Sport-Specific**: Filter by sport
- **Time Period**: Last week, month, year

### 5. 🎥 Video Analysis
**Record and review technique:**
- Record test performance
- Slow-motion playback
- Frame-by-frame analysis
- Side-by-side comparison
- Share with parents/athletes
- Store in cloud (Firebase Storage)

### 6. 📑 Comprehensive Reports
**Detailed performance reports:**
- Individual kid reports
- Team summaries
- Progress over time
- Benchmark comparisons
- Export to PDF/Excel
- Share via email/WhatsApp

### 7. 💾 Offline Support
**Works without internet:**
- All assessments saved locally (SQLite)
- Auto-sync when online
- No data loss
- Sync status indicator

---

## 📁 Project Structure
```
apps/assessment/
├── App.js                          # Entry point
├── app.json                        # Expo config
├── package.json
├── eas.json
│
├── assets/
│   ├── sounds/
│   │   └── beep.mp3               # ⚠️ REQUIRED - Add this file
│   ├── videos/                     # Tutorial videos
│   ├── icon.png
│   └── splash-icon.png
│
└── src/
    ├── components/
    │   ├── assessment/
    │   │   ├── AssessmentCard.js
    │   │   ├── AssessmentForm.js
    │   │   ├── AssessmentTimer.js
    │   │   ├── BatchAssessment.js         # Multi-kid entry
    │   │   └── QuickAssessment.js
    │   ├── badges/
    │   │   ├── PercentileBadge.js         # Ranking badges
    │   │   ├── ImprovementBadge.js
    │   │   └── RankBadge.js
    │   ├── camera/
    │   │   ├── CameraCapture.js
    │   │   ├── VideoRecorder.js
    │   │   └── VideoPlayer.js
    │   ├── charts/
    │   │   ├── LineChart.js               # Progress over time
    │   │   ├── RadarChart.js              # Multi-metric view
    │   │   ├── PercentileChart.js
    │   │   └── ComparisonChart.js         # Compare kids
    │   ├── metrics/
    │   │   ├── BeepTestInput.js
    │   │   ├── BeepTestLiveTracker.js    # Real-time beep test
    │   │   ├── CooperTestInput.js
    │   │   ├── CooperTestLiveTracker.js
    │   │   ├── TimedTestInput.js          # Sprint tests
    │   │   ├── CountedRepsInput.js        # Push-ups, sit-ups
    │   │   └── MetricInput.js             # Generic metric
    │   └── common/
    │       ├── Button.js
    │       ├── Card.js
    │       ├── Header.js
    │       └── Modal.js
    │
    ├── screens/
    │   ├── AssessmentEntry/
    │   │   └── AssessmentEntryScreen.js  # Main entry screen
    │   ├── AssessmentSetup/
    │   │   └── AssessmentSetupScreen.js  # Select kids & tests
    │   ├── BeepTest/
    │   │   └── BeepTestLiveTrackerScreen.js # Live beep test
    │   ├── CooperTest/
    │   │   └── CooperTestLiveTrackerScreen.js
    │   ├── History/
    │   │   ├── HistoryScreen.js
    │   │   └── AssessmentDetailScreen.js
    │   ├── KidProgress/
    │   │   ├── KidProgressScreen.js
    │   │   └── ProgressChartScreen.js
    │   ├── Leaderboards/
    │   │   ├── LeaderboardsScreen.js
    │   │   ├── TopPerformersScreen.js
    │   │   └── MostImprovedScreen.js
    │   ├── Reports/
    │   │   └── ReportsScreen.js
    │   └── VideoReview/
    │       └── VideoReviewScreen.js
    │
    ├── database/
    │   ├── db.js                          # SQLite setup
    │   ├── schema.js                      # Database schema
    │   └── sync.js                        # Firebase sync
    │
    ├── services/
    │   ├── assessmentService.js
    │   ├── benchmarkService.js            # Age/gender benchmarks
    │   ├── metricService.js
    │   ├── videoService.js
    │   └── audioService.js                # Beep playback
    │
    ├── utils/
    │   ├── benchmarks.js                  # Benchmark calculations
    │   ├── calculations.js                # Score calculations
    │   ├── percentiles.js                 # Percentile rankings
    │   └── validators.js
    │
    ├── config/
    │   ├── benchmarks.js                   # Benchmark data
    │   ├── metrics.js                      # Test definitions
    │   └── sports.js                       # Sport-specific tests
    │
    └── scripts/
        ├── listAssessments.js              # View assessments
        └── add-test-assessments.js         # Seed test data
```

---

## 🔧 Utility Scripts

### View Assessments
```bash
# Navigate to scripts folder
cd apps/assessment/scripts/

# Show everything (default)
node listAssessments.js

# Summary table only
node listAssessments.js 1

# Detailed view only
node listAssessments.js 2

# Statistics only
node listAssessments.js 3

# Top performers only
node listAssessments.js 4

# Complete report
node listAssessments.js 5
```

### Add Test Data
```bash
node add-test-assessments.js
```

---

## 💾 Database Schema (SQLite)

### Assessments Table
```sql
CREATE TABLE assessments (
  id TEXT PRIMARY KEY,
  firebase_id TEXT UNIQUE,
  kid_id TEXT NOT NULL,
  assessment_type TEXT NOT NULL,   -- 'beep_test', 'cooper_test', etc.
  score REAL NOT NULL,              -- Numeric score
  units TEXT,                       -- 'level.shuttle', 'meters', 'seconds', etc.
  percentile INTEGER,               -- 0-100
  benchmark_category TEXT,          -- 'Excellent', 'Good', 'Average', etc.
  notes TEXT,
  video_url TEXT,                   -- Firebase Storage URL
  assessed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  assessed_by TEXT,                 -- Coach user ID
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT 0,
  FOREIGN KEY (kid_id) REFERENCES kids(id) ON DELETE CASCADE
);

CREATE INDEX idx_assessments_kid ON assessments(kid_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_assessments_date ON assessments(assessed_at);
CREATE INDEX idx_assessments_synced ON assessments(synced);
```

### Kids Table (shared with attendance app)
```sql
-- Same schema as attendance app
-- See attendance README for full schema
```

---

## 📊 Benchmarking System

### How Benchmarks Work

1. **Age Calculation**: Calculate exact age from date of birth
2. **Gender Match**: Use gender-specific benchmarks
3. **Score Comparison**: Compare score to benchmark ranges
4. **Percentile Rank**: Calculate where score falls (0-100)
5. **Category Assignment**: Assign category (Excellent, Good, etc.)

### Benchmark Categories

- 🥇 **Excellent**: >90th percentile (top 10%)
- 🥈 **Good**: 70-90th percentile
- 🥉 **Average**: 30-70th percentile
- 📊 **Below Average**: 10-30th percentile
- 🔴 **Needs Improvement**: <10th percentile

---

## 🧪 Testing

### Manual Testing Checklist

**Beep Test:**
- [ ] Audio beep plays correctly
- [ ] Timer counts down accurately
- [ ] Level advances automatically
- [ ] Can pause/resume
- [ ] Final score calculated correctly
- [ ] Score saved to database

**Batch Assessment:**
- [ ] Select multiple kids
- [ ] Enter scores for all
- [ ] Quick save works
- [ ] No duplicate entries

**Progress Tracking:**
- [ ] Charts display correctly
- [ ] Historical data loads
- [ ] Percentiles calculated
- [ ] Benchmarks shown

**Offline Mode:**
- [ ] Assess offline
- [ ] Data saved locally
- [ ] Auto-sync when online

---

## 📞 Support

- **Developer**: msf_bennett@fedora
- **Company**: Swimming Ducks
- **Brand**: AccellaX 361° | Silicon Ducks
- **Academy**: NextGen Multisport Academy
- **Location**: Nairobi, Kenya

---

## 📄 License

Proprietary - © 2025 AccellaX 361° Silicon by Swimming Ducks

---

**Built with ❤️ by Swimming Ducks for NextGen Multisport Academy | Nairobi, Kenya**

         *AccellaX 361° | Silicon Ducks*
         
         *Empowering coaches with professional-grade assessment tools*
