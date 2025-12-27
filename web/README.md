# AccellaX 361° Silicon by Swimming Ducks | Web Platform

> **Sports Academy Attendance & Management System**  
> Real-time dashboard for coaches, parents, kids, sponsors, and academy administrators

[![Laravel](https://img.shields.io/badge/Laravel-10-FF2D20?logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

---

## 🎯 Overview

AccellaX 361° Web Platform visualizes and manages attendance and assessment 
data for sports academies. It provides role-specific dashboards for coaches, 
parents, kids, sponsors, and administrators.

## ⚙️ Academy Configuration

### Branding Your Academy

**1. Update Academy Information (`web/backend/.env`):**
```env
APP_NAME="Your Academy Name"
ACADEMY_NAME="Your Academy Name"
ACADEMY_LOCATION="Your City, Your Country"
ACADEMY_EMAIL="admin@youracademy.com"
ACADEMY_PHONE="+123456789"
```

**2. Update Frontend Branding (`web/frontend/.env`):**
```env
VITE_APP_NAME="Your Academy Name"
VITE_ACADEMY_NAME="Your Academy Name"
VITE_ACADEMY_TAGLINE="Your academy tagline"
```

**3. Replace Logo Files:**
```bash
# Replace these files with your logo:
web/frontend/public/logo.png          # Main logo
web/frontend/public/logo-white.png    # White version
web/frontend/public/favicon.ico       # Favicon
web/frontend/src/assets/images/logo.svg  # SVG logo
```

**4. Update Colors (`web/frontend/tailwind.config.js`):**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#YOUR_PRIMARY_COLOR',
        secondary: '#YOUR_SECONDARY_COLOR',
        accent: '#YOUR_ACCENT_COLOR',
      }
    }
  }
}
```

### Age Groups & Programs

Customize in: `web/backend/config/academy.php`
```php
return [
    'age_groups' => [
        '4-6' => 'Foundation (4-6 years)',
        '7-9' => 'Development (7-9 years)',
        '10-13' => 'Competitive (10-13 years)',
        '13+' => 'Elite (13+ years)',
    ],
    
    'program_types' => [
        'elite' => 'Elite Training',
        'weekend' => 'Weekend Warrior',
        'holiday' => 'Holiday Programme',
        'team' => 'Team Support',
    ],
    
    'sports' => [
        'football' => 'Football',
        'basketball' => 'Basketball',
        'athletics' => 'Athletics',
        // Add your sports
    ],
];
```

**Key Capabilities:**
- ✅ Real-time attendance synchronized from mobile app
- ✅ Role-based dashboards (7 user types)
- ✅ Advanced filtering (chronic absentees, inconsistent, active)
- ✅ Event management & messaging system
- ✅ Analytics with visual reports
- ✅ Progressive Web App (offline-capable)
- ✅ Multi-academy & multi-sport ready

---

## ⚙️ Multi-Academy Deployment

AccellaX 361° supports multiple academies on a single installation.

**📖 See**: [Academy Setup Guide](../ACADEMY_SETUP.md) for step-by-step configuration.

---

## 🏗️ Architecture
```
AccellaX 361°/
├── app/                          # React Native Mobile App (coaches)
│   ├── assessment/               # Performance assessment app
│   └── attendance/               # Attendance marking app
├── oauth-backend/                # Vercel OAuth Service (Google/Strava)
└── web/                          # Web Platform (this folder)
    ├── backend/                  # Laravel API + MySQL
    └── frontend/                 # React SPA + Firebase
```

### Data Flow Architecture
```
Mobile App (React Native)
    ↓ marks attendance offline
SQLite (on device)
    ↓ syncs when online
Firebase Firestore ←→ Laravel API ←→ MySQL
    ↓ real-time            ↓ complex queries
React Web Frontend (reads from both)
```

**Why Hybrid Architecture?**
- **Firebase**: Real-time updates, offline-first, instant sync
- **Laravel**: Complex queries, reports, payments, role management
- **Best of both worlds**: Speed + flexibility + cost-effective

---

## 🚀 Quick Start

### Prerequisites
- PHP 8.1+, Composer
- Node.js 18+, npm
- MySQL 8.0
- Firebase project

### Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Configure database in .env
# Add Firebase credentials

php artisan migrate --seed
php artisan serve
# Backend runs at http://localhost:8000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env

# Configure API and Firebase in .env

npm run dev
# Frontend runs at http://localhost:3000
```

### Access
- **URL**: http://localhost:3000
- **Admin**: admin@accellax.com / password
- **Coach**: coach@accellax.com / password
- **Parent**: parent@accellax.com / password

---

## 👥 User Roles

| Role | Access Level | Dashboard Features |
|------|-------------|-------------------|
| **Super Admin** | Full system | User management, role elevation, all settings |
| **Academy Owner** | Full dashboard | Analytics, financials, coach management |
| **Head Coach** | All sessions | Event planning, analytics, all age groups |
| **Coach** | Own sessions | Assigned age groups, attendance marking |
| **Payment Recorder** | Financial only | Payment tracking, outstanding fees |
| **Parent** | Own kid's data | Attendance history, events, messages |
| **Kid** | Own profile | Gamified attendance, achievements |
| **Sponsor** | Scholarship kids | Impact reports, kid profiles (read-only) |

### Role Elevation Security
Sensitive roles require secret elevation:
1. Click logo 7 times (like Android Developer Options)
2. Enter secret password
3. Prevents unauthorized admin creation

---

## ✨ Core Features

### 1. Real-Time Attendance Dashboard
- Live updates as coaches mark on mobile
- Age group breakdown
- Today's stats: "32/50 kids present"

### 2. Advanced Attendance Filters
- **🔴 Chronic Absentees**: <50% attendance
- **🟡 Inconsistent**: 50-75% attendance  
- **🟢 Active**: >75% attendance
- **⚫ Suspended**: Temporarily not training
- **⚪ Inactive**: 30+ days no attendance
- **❌ Expelled**: Removed from academy

### 3. Kid Profile System
- Personal info (name, age, area of residence)
- Attendance calendar view
- Program type badges: Elite, Weekend Warrior, Holiday, Team Support
- Sponsorship: 🟢 **SP** (Self-Sponsored) | 🔵 **SC** (Scholarship)
- Family background (for sponsors)

### 4. Reports & Analytics
- Daily, monthly, seasonal reports
- Line/bar/pie charts
- Export Excel/PDF
- Attendance trends & patterns

### 5. Events & Activities
- Create tournaments, camps, meetings
- RSVP tracking
- Calendar view
- Automated reminders

### 6. Messaging System
- Group messages (coaches, parents, age groups)
- Individual chats
- Real-time notifications
- Popup notes on sessions/kids

### 7. Coach Attendance Tracking
- Track coach presence
- Late arrivals
- Performance metrics

### 8. Progressive Web App (PWA)
- Installable on any device
- Offline support
- Push notifications
- Native app feel

---

## 🔧 Tech Stack

### Backend
- **Framework**: Laravel 10 (PHP 8.1+)
- **Database**: MySQL 8.0 / PostgreSQL
- **Real-time**: Firebase Admin SDK
- **Authentication**: Laravel Sanctum
- **API**: RESTful JSON

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **Routing**: React Router v6
- **State**: React Context API
- **Real-time**: Firebase SDK v10
- **Charts**: Recharts
- **HTTP**: Axios
- **Notifications**: React Hot Toast

### Mobile Apps (../app/)
- **Framework**: React Native + Expo
- **Local DB**: SQLite
- **Sync**: Firebase Firestore
- **OAuth**: Google, Strava (../oauth-backend)

### Infrastructure
- **Frontend**: Vercel (free)
- **Backend**: Railway ($5/month Hobby)
- **OAuth**: Vercel Serverless
- **Domain**: ~$12/year (.co.ke or .com)
- **Total Cost**: ~KSh 755/month (~$6/month)

---

## 📁 Project Structure
```
web/
├── backend/                      # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── Api/             # REST endpoints
│   │   │   ├── Dashboard/       # Role dashboards
│   │   │   └── Auth/            # Authentication
│   │   ├── Models/              # Eloquent ORM
│   │   ├── Services/            # Business logic
│   │   └── Middleware/          # Role guards
│   ├── database/
│   │   ├── migrations/          # 12 tables
│   │   └── seeders/             # Test data
│   └── routes/api.php           # API routes
│
└── frontend/                     # React SPA
    ├── public/
    │   ├── index.html           # Entry (SEO optimized)
    │   └── manifest.json        # PWA config
    └── src/
        ├── components/
        │   ├── dashboard/       # Role-specific views
        │   │   ├── admin/
        │   │   ├── coach/
        │   │   ├── parent/
        │   │   ├── kid/
        │   │   └── sponsor/
        │   ├── attendance/      # Attendance UI
        │   ├── kids/            # Kid management
        │   ├── events/          # Events
        │   └── messages/        # Messaging
        ├── pages/               # Route pages
        ├── contexts/            # Global state
        ├── hooks/               # Custom hooks
        ├── services/            # API calls
        ├── utils/               # Helpers
        ├── App.jsx              # Main component
        └── index.jsx            # Entry point
```

---

## 🌐 Deployment

### Option 1: Budget-Friendly (Recommended)
**Cost**: ~KSh 755/month (~$6)

- **Frontend**: Vercel (free)
- **Backend**: Railway Hobby ($5/month)
- **Domain**: ~$12/year

### Option 2: Production Scale
**Cost**: ~KSh 3,000/month (~$20-30)

- **Frontend**: Vercel Pro
- **Backend**: Railway Developer
- **Database**: Larger instance
- **CDN**: Cloudflare

### Deployment Steps

#### Backend (Railway)
```bash
# 1. Push to GitHub
git push origin main

# 2. Railway dashboard
- Import from GitHub
- Root Directory: web/backend
- Add environment variables
- Deploy

# 3. Run migrations
railway run php artisan migrate --force
```

#### Frontend (Vercel)
```bash
# 1. Push to GitHub
git push origin main

# 2. Vercel dashboard
- Import from GitHub
- Root Directory: web/frontend
- Framework: Vite
- Add environment variables
- Deploy
```

---

## 🔐 Environment Variables

### Backend (.env)
```bash
APP_NAME="AccellaX 361°"
APP_URL=https://api.accellax.co.ke
DB_CONNECTION=mysql
DB_HOST=                          # Railway provides
DB_DATABASE=accellax_db
FIREBASE_CREDENTIALS=path/to/credentials.json
FIREBASE_PROJECT_ID=your-project-id
FRONTEND_URL=https://accellax.co.ke
```

### Frontend (.env)
```bash
VITE_APP_NAME="AccellaX 361°"
VITE_API_URL=https://api.accellax.co.ke/api
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_PROJECT_ID=your-project
# ... other Firebase config
```

---

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/login              Login
POST   /api/auth/register           Register
POST   /api/auth/elevate-role       Elevate to admin
GET    /api/auth/profile            User profile
```

### Kids Management
```
GET    /api/kids                    List (filtered)
POST   /api/kids                    Create kid
GET    /api/kids/:id                Details
PUT    /api/kids/:id                Update
POST   /api/kids/:id/suspend        Suspend
GET    /api/kids/:id/statistics     Stats
```

### Attendance
```
GET    /api/sessions                List sessions
POST   /api/sessions/:id/attendance Mark attendance
GET    /api/attendance/filters      Get filters
GET    /api/attendance/reports      Reports
GET    /api/attendance/export       Export CSV/PDF
```

### Analytics
```
GET    /api/analytics/dashboard     Dashboard stats
GET    /api/analytics/attendance-patterns
GET    /api/analytics/sponsorship   SP vs SC breakdown
```

Full documentation: [API.md](./backend/docs/API.md)

---

## 💻 Development

### Backend Commands
```bash
php artisan migrate              # Run migrations
php artisan db:seed              # Seed data
php artisan test                 # Run tests
php artisan cache:clear          # Clear cache
php artisan make:controller Name # New controller
```

### Frontend Commands
```bash
npm run dev                      # Dev server
npm run build                    # Production build
npm run preview                  # Preview build
npm run lint                     # Lint code
```

---

## 📱 Mobile App Integration

The mobile apps (attendance & assessment) are located in `../app/`.

### Sync Flow
1. Coaches mark attendance on mobile (offline-first)
2. Data stored in SQLite locally
3. When online, syncs to Firebase
4. Web platform reads from Firebase (real-time)
5. Laravel copies to MySQL (for reports/analytics)

### OAuth Integration
Google & Strava authentication handled by `../oauth-backend/` (Vercel).

---

## 🎯 Roadmap

### ✅ Phase 1 - MVP (Current)
- Authentication & role management
- Attendance tracking & filters
- Kid profiles & dashboards
- Real-time sync

### 🔄 Phase 2 - Enhanced (In Progress)
- Events & RSVP system
- Messaging & notifications
- Analytics & reports
- Payment tracking

### 📋 Phase 3 - Advanced
- Coach attendance
- Sponsor portal
- PWA optimization
- Export functionality

### 📋 Phase 4 - Scale
- Multi-academy support
- Multi-sport support
- Advanced analytics
- Mobile app downloads from web

---

## 🤝 Contributing

Private project for NextGen Multisport Academy.

**Internal contributors:**
1. Branch naming: `feature/name` or `fix/name`
2. Commit format: `feat: add filters` / `fix: resolve bug`
3. Always create PR for review
4. All tests must pass

---

## 📞 Support

- **Developer**: msf_bennett@fibonacci
- **Company**: Swimming Ducks
- **Brand**: AccellaX 361° | Silicon Ducks
- **Academy**: NextGen Multisport Academy
- **Location**: Nairobi, Kenya
- **Website**: [Coming Soon]

---

## 📄 License

Proprietary - © 2025 AccellaX 361° Silicon by Swimming Ducks

All rights reserved. Unauthorized copying, modification, or distribution prohibited.

---

## 🙏 Acknowledgments

- NextGen Multisport Academy team
- All coaches using the mobile app
- Parents & kids for feedback
- Open source community (Laravel, React, Firebase)

---

**Built with ❤️ by Swimming Ducks for NextGen Multisport Academy | Nairobi, Kenya**

         *AccellaX 361° | Silicon Ducks*

*Empowering youth through sports & technology*
