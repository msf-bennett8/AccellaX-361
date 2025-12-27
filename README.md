# AccellaX 361° Silicon by Swimming Ducks

> **Complete Sports Academy Management Ecosystem**  
> Attendance tracking, performance assessments, and data-driven insights for youth sports development

[![React Native](https://img.shields.io/badge/React_Native-0.72-61DAFB?logo=react)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Laravel](https://img.shields.io/badge/Laravel-10-FF2D20?logo=laravel)](https://laravel.com)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

---

## 🎯 Overview

AccellaX 361° Silicon by Swimming Ducks is a comprehensive sports academy 
management platform that provides coaches, parents, kids, sponsors, and 
administrators with powerful tools to track attendance, assess performance, 
and drive athlete development. It provides coaches, parents, kids, sponsors, and administrators with powerful tools to track attendance, assess performance, and drive athlete development.

**"360° + 1° = Complete view plus continuous improvement"**

### 🏆 What Makes AccellaX 361° Special?

- **Offline-First**: Works without internet, syncs when available
- **Real-Time**: Live updates across all platforms
- **Role-Based**: Tailored experiences for 8 user types
- **Data-Driven**: Benchmarks, analytics, and progress tracking
- **Professional**: Industry-standard fitness assessments
- **Scalable**: Ready for multiple academies and sports

---

## 🏫 Deploying for Your Academy

AccellaX 361° is designed to work for any sports academy, regardless of size or sport focus.

### What You Can Customize:
- ✅ Academy name and branding
- ✅ Age groups (default: 4-6, 7-9, 10-13, 13+)
- ✅ Sports types (football, basketball, swimming, etc.)
- ✅ Sponsorship types (Self-Sponsored, Scholarship, Grant, etc.)
- ✅ Program types (Elite, Weekend, Holiday, etc.)
- ✅ Payment structures
- ✅ Assessment benchmarks
- ✅ User roles and permissions

### Quick Setup for New Academy:
```bash
# 1. Clone and setup
git clone https://github.com/swimming-ducks/AccellaX-361.git
cd AccellaX-361

# 2. Configure your academy
cp .env.example .env
# Edit .env with your academy details

# 3. Customize branding
# Update logo, colors, academy name in config files

# 4. Deploy
# Follow deployment guide in docs/DEPLOYMENT.md
```

### Need Help?
Contact Swimming Ducks for academy onboarding: msf_bennett@fedora

---

# AccellaX 361° Silicon by Swimming Ducks

> **Complete Sports Academy Management Ecosystem**  
> Attendance tracking, performance assessments, and data-driven insights for youth sports development

---

> **🏫 New Academy?** Check out our [Academy Setup Guide](./ACADEMY_SETUP.md) to get started!

---

## 🏗️ System Architecture

```
AccellaX 361° Ecosystem
├── Mobile Apps (React Native + Expo)
│   ├── Attendance App ────────► Mark attendance offline/online
│   └── Assessment App ────────► Fitness tests & benchmarking
│
├── OAuth Backend (Vercel)
│   └── Google/Strava Auth ────► Secure authentication
│
└── Web Platform (React + Laravel)
    ├── Frontend (Vercel) ─────► Role-based dashboards
    └── Backend (Railway) ─────► API, reports, analytics
```

### Data Flow Architecture

```
Mobile Apps (React Native)
    ↓ marks attendance/assessments
SQLite (local device storage)
    ↓ auto-sync when online
Firebase Firestore (real-time database)
    ↓ reads/writes
Web Frontend (React SPA)
    ↓ complex queries
Laravel API + MySQL (reports & analytics)
```

**Why This Architecture?**
- ✅ **SQLite**: Instant offline access, no internet dependency
- ✅ **Firebase**: Real-time sync, push notifications, instant updates
- ✅ **Laravel/MySQL**: Complex reports, payment tracking, role management
- ✅ **Result**: Fast, reliable, works anywhere, cost-effective

---

## 📱 Project Components

### 1. 📲 Mobile Apps (`/apps/`)

#### Attendance App (`/apps/attendance/`)
**For coaches to mark attendance during training sessions**

**Key Features:**
- Swipe-to-mark interface (fastest way to mark 20+ kids)
- Offline-first with auto-sync
- Age group filtering
- Session management
- Kid profiles with sponsorship badges
- Export to CSV/Excel
- Google OAuth authentication

**Tech Stack:** React Native, Expo, SQLite, Firebase

**[📖 Full Documentation](./apps/attendance/README.md)**

---

#### Assessment App (`/apps/assessment/`)
**Professional fitness assessments for athletes**

**Key Features:**
- Live beep test tracker with audio cues
- Cooper test (12-min run)
- Sprint tests (10m, 20m, 30m)
- Strength tests (push-ups, pull-ups, plank)
- Age/gender benchmarking
- Progress tracking & leaderboards
- Video analysis
- Batch assessments

**Tech Stack:** React Native, Expo, SQLite, Firebase, Victory Charts

**[📖 Full Documentation](./apps/assessment/README.md)**

---

### 2. 🌐 Web Platform (`/web/`)

#### Frontend (`/web/frontend/`)
**Role-specific dashboards for all stakeholders**

**8 User Roles:**
1. **Super Admin** - Full system access, user management
2. **Academy Owner** - All analytics, financials, coach management
3. **Head Coach** - All sessions, event planning, analytics
4. **Coach** - Assigned age groups, attendance marking
5. **Payment Recorder** - Financial tracking, outstanding fees
6. **Parent** - Own kid's data, attendance history, messages
7. **Kid** - Gamified attendance view, achievements
8. **Sponsor** - Scholarship kids, impact reports

**Key Features:**
- Real-time attendance dashboard
- Advanced filters (chronic absentees, inconsistent, active)
- Event management & RSVP
- Messaging system (group & individual)
- Analytics with charts (Recharts)
- Progressive Web App (PWA)
- Export functionality

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, Firebase SDK

**[📖 Full Documentation](./web/README.md)**

---

#### Backend (`/web/backend/`)
**Laravel API powering the web platform**

**Key Features:**
- RESTful JSON API
- Laravel Sanctum authentication
- Firebase Admin SDK integration
- Role-based middleware
- Complex queries & reports
- Payment tracking
- Notification system

**Database Tables (12):**
- academies, users, kids, sessions
- attendance, coach_attendance, events
- message_groups, messages, notifications
- notes, payments

**Tech Stack:** Laravel 10, PHP 8.1+, MySQL 8.0, Firebase Admin SDK

**[📖 Full Documentation](./web/README.md#backend)**

---

### 3. 🔐 OAuth Backend (`/oauth-backend/`)
**Serverless authentication service**

**Providers:**
- Google OAuth 2.0
- Strava OAuth 2.0

**Architecture:**
- Vercel Serverless Functions
- Node.js 18
- Free tier (generous limits)

**Why Separate OAuth Backend?**
- Keeps client secrets secure (server-side only)
- Centralized authentication for mobile & web
- Scalable & cost-effective

**[📖 Full Documentation](./oauth-backend/README.md)**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PHP 8.1+ (for backend)
- MySQL 8.0 (for backend)
- Expo CLI (for mobile apps)
- Firebase project

### Clone Repository
```bash
git clone https://github.com/your-org/AccellaX-361.git
cd AccellaX-361
```

### Setup Mobile Apps

**Attendance App:**
```bash
cd apps/attendance
npm install
cp .env.example .env
# Configure Firebase credentials in .env
npm start
```

**Assessment App:**
```bash
cd apps/assessment
npm install
cp .env.example .env
# Add beep.mp3 to assets/sounds/
npm start
```

### Setup OAuth Backend

```bash
cd oauth-backend
npm install
cp .env.example .env
# Add Google & Strava credentials
vercel dev
```

### Setup Web Platform

**Backend:**
```bash
cd web/backend
composer install
cp .env.example .env
php artisan key:generate
# Configure database & Firebase
php artisan migrate --seed
php artisan serve
```

**Frontend:**
```bash
cd web/frontend
npm install
cp .env.example .env
# Configure API & Firebase URLs
npm run dev
```

---

## 🎨 User Roles & Features

### For Coaches
- ✅ Mark attendance on mobile (offline-first)
- ✅ Conduct fitness assessments
- ✅ View age group dashboards
- ✅ Message parents
- ✅ Track kid progress
- ✅ Export reports

### For Parents
- ✅ View kid's attendance history
- ✅ See upcoming events
- ✅ Receive notifications
- ✅ Message coaches
- ✅ Track payment status

### For Kids
- ✅ Gamified attendance view
- ✅ Earn achievements
- ✅ See progress charts
- ✅ View upcoming events

### For Sponsors
- ✅ View scholarship kids
- ✅ Impact reports
- ✅ Attendance statistics
- ✅ Progress tracking

### For Admins
- ✅ User management
- ✅ Role elevation
- ✅ System-wide analytics
- ✅ Financial reports
- ✅ Multi-academy setup (future)

---

## 💾 Database Architecture

### SQLite (Mobile Apps)
**Local offline storage:**
- Kids table
- Sessions table
- Attendance table
- Assessments table

### Firebase Firestore (Real-Time Sync)
**Cloud database:**
- Real-time updates
- Offline persistence
- Auto-sync
- Push notifications

### MySQL (Web Backend)
**Complex queries & reports:**
- 12 relational tables
- Full-text search
- Advanced filtering
- Payment tracking

---

## 🔄 Sync Strategy

### How It Works
1. **Offline Operations**: Saved to SQLite with `synced=0`
2. **Online Detection**: App monitors internet connection
3. **Auto-Sync**: Queued changes pushed to Firebase
4. **Conflict Resolution**: Last-write-wins strategy
5. **Mark Synced**: Local records marked `synced=1`

### Sync Triggers
- App startup (if online)
- Manual sync button
- After marking attendance/assessments
- Network connection restored
- Background sync (every 5 minutes)

---

## 💰 Infrastructure & Costs

### Development (Free)
- Vercel (OAuth backend) - Free tier
- Firebase (database & auth) - Free tier
- Local development - Free

### Production (Budget-Friendly)
**Monthly Costs:**
| Service | Plan | Cost |
|---------|------|------|
| Vercel (Frontend) | Free | $0 |
| Railway (Backend) | Hobby | $5 |
| Firebase | Free tier | $0 |
| Domain | Annual | ~$1/month |
| **Total** | | **~$6/month** |

### Production (Scale)
**For larger deployments:**
| Service | Plan | Cost |
|---------|------|------|
| Vercel (Frontend) | Pro | $20 |
| Railway (Backend) | Developer | $20 |
| Firebase | Pay as you go | ~$10 |
| CDN | Cloudflare | $0 |
| **Total** | | **~$50/month** |

---

## 📊 Key Metrics & Analytics

### Attendance Tracking
- Real-time attendance rates
- Chronic absentee identification (<50%)
- Inconsistent patterns (50-75%)
- Active kids (>75%)
- Age group breakdowns

### Performance Assessments
- Beep test scores with percentiles
- Sprint times & improvements
- Strength metrics
- Progress over time
- Peer comparisons

### Financial
- Payment tracking
- Outstanding fees
- Sponsorship breakdown (Self-Sponsored vs Scholarship)

---

## 🛠️ Technology Stack

### Mobile (React Native + Expo)
```javascript
{
  "framework": "React Native 0.72",
  "runtime": "Expo 49",
  "database": "SQLite (expo-sqlite)",
  "sync": "Firebase SDK 10",
  "auth": "Firebase Auth + OAuth",
  "charts": "Victory Native",
  "navigation": "React Navigation v6"
}
```

### Web Frontend (React SPA)
```javascript
{
  "framework": "React 18",
  "build": "Vite 5",
  "styling": "Tailwind CSS 3",
  "router": "React Router v6",
  "state": "Context API",
  "realtime": "Firebase SDK 10",
  "charts": "Recharts",
  "http": "Axios"
}
```

### Web Backend (Laravel API)
```php
{
  "framework": "Laravel 10",
  "language": "PHP 8.1+",
  "database": "MySQL 8.0",
  "auth": "Laravel Sanctum",
  "api": "RESTful JSON",
  "firebase": "Firebase Admin SDK",
  "queue": "Laravel Queues"
}
```

### OAuth Backend (Serverless)
```javascript
{
  "platform": "Vercel Serverless",
  "runtime": "Node.js 18",
  "providers": ["Google OAuth 2.0", "Strava OAuth 2.0"]
}
```

---

## 📚 Documentation

### Main Documentation
- **[Project Overview](./README.md)** ← You are here
- **[Web Platform](./web/README.md)** - Frontend & backend docs
- **[Attendance App](./apps/attendance/README.md)** - Mobile attendance
- **[Assessment App](./apps/assessment/README.md)** - Fitness assessments
- **[OAuth Backend](./oauth-backend/README.md)** - Authentication service

### Technical Docs
- **[Architecture](./docs/ARCHITECTURE.md)** - System design
- **[API Reference](./web/backend/docs/API.md)** - REST endpoints
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Table structures
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production setup

### User Guides
- **[Coach Guide](./docs/COACH_GUIDE.md)** - How to use apps
- **[Admin Guide](./docs/ADMIN_GUIDE.md)** - Dashboard management
- **[Parent Guide](./docs/PARENT_GUIDE.md)** - Parent portal

---

## 🧪 Testing

### Mobile Apps
```bash
# Attendance app
cd apps/attendance
npm test

# Assessment app
cd apps/assessment
npm test
```

### Web Platform
```bash
# Backend tests
cd web/backend
php artisan test

# Frontend tests (when configured)
cd web/frontend
npm test
```

---

## 🚀 Deployment

### Mobile Apps (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Build Android APK
cd apps/attendance  # or assessment
eas build --platform android --profile production

# Build iOS IPA (Mac required)
eas build --platform ios --profile production
```

### Web Frontend (Vercel)
```bash
cd web/frontend
vercel --prod
```

### Web Backend (Railway)
```bash
# Push to GitHub
git push origin main

# Railway auto-deploys from GitHub
# Or use Railway CLI
railway up
```

### OAuth Backend (Vercel)
```bash
cd oauth-backend
vercel --prod
```

---

## 🔐 Security

### Authentication
- Firebase Auth (email/password)
- Google OAuth 2.0
- Strava OAuth 2.0
- Laravel Sanctum (API tokens)

### Role-Based Access Control
- 8 distinct user roles
- Middleware protection
- Firebase security rules
- Secret elevation for admin roles

### Data Protection
- HTTPS enforced everywhere
- Client secrets server-side only
- Token refresh handling
- CORS configuration
- Input validation & sanitization

---

## 🤝 Contributing

This is a private project for NextGen Multisport Academy.

**For internal contributors:**

### Branch Naming
```
feature/feature-name
fix/bug-name
docs/documentation-update
```

### Commit Messages
Use conventional commits:
```
feat: add attendance filters
fix: resolve dashboard loading issue
docs: update README
refactor: improve sync logic
test: add unit tests for calculations
```

### Pull Request Process
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Create PR with description
5. Request review
6. Address feedback
7. Merge when approved

---

## 🐛 Troubleshooting

### Common Issues

**Sync Not Working**
- Check internet connection
- Verify Firebase credentials
- Check Firebase security rules
- Clear app cache

**Authentication Failed**
- Verify OAuth backend is running
- Check Firebase config
- Clear AsyncStorage/LocalStorage

**Build Errors**
- Delete `node_modules` and reinstall
- Clear Metro bundler cache
- Check environment variables

**Database Issues**
- Run migrations: `php artisan migrate`
- Check database credentials
- Verify MySQL is running

See individual README files for detailed troubleshooting.

---

## 📞 Support

### Contact Information
- **Developer**: msf_bennett@fibonacci
- **Company**: Swimming Ducks
- **Product**: AccellaX 361° | Silicon Ducks
- **Academy**: NextGen Multisport Academy
- **Location**: Nairobi, Kenya
- **Website**: [Coming Soon]

### Getting Help
1. Check documentation (README files)
2. Search existing issues
3. Contact developer directly
4. Create detailed bug report

---

## 🎯 Roadmap

### ✅ Phase 1 - MVP (Completed)
- Attendance tracking (mobile + web)
- Basic fitness assessments
- Role-based dashboards
- Firebase sync
- Google OAuth

### 🔄 Phase 2 - Enhanced Features (In Progress)
- Event management & RSVP
- Messaging system
- Advanced analytics
- Payment tracking
- Export functionality

### 📋 Phase 3 - Advanced
- Coach attendance tracking
- Video analysis
- Progressive Web App optimization
- Advanced benchmarking
- Injury tracking

### 📋 Phase 4 - Scale
- Multi-academy support
- Multi-sport support
- Parent mobile app
- Kid mobile app
- Advanced AI insights

---

## 📄 License

**Proprietary - © 2025 AccellaX 361° Silicon by Swimming Ducks**

All rights reserved. This software is the property of NextGen Multisport Academy. Unauthorized copying, modification, distribution, or use is strictly prohibited.

---

## 🙏 Acknowledgments

### People
- **NextGen Multisport Academy** - Vision & requirements
- **All coaches** - Field testing & feedback
- **Parents & kids** - User feedback
- **Sponsors** - Supporting youth development

### Technology
- Firebase team - Real-time database & auth
- Expo team - React Native framework
- Laravel team - PHP framework
- Vercel team - Serverless hosting
- Railway team - Backend hosting
- Open source community

---

## 🏅 About NextGen Multisport Academy

NextGen Multisport Academy is a youth sports development program based in Nairobi, Kenya. We provide:

- **Multi-sport training** for kids aged 4-18
- **Scholarship programs** for talented kids
- **Professional coaching** with qualified coaches
- **Life skills development** beyond sports
- **Community impact** through sports

**Our Mission:** Empowering youth through sports, education, and character development.

---

## 📊 Project Statistics

```
Project Size:
- Total Files: 758
- Total Directories: 222
- Lines of Code: ~150,000+
- Languages: JavaScript, PHP, SQL, HTML, CSS

Components:
- Mobile Apps: 2 (Attendance + Assessment)
- Web Platform: 1 (Frontend + Backend)
- OAuth Service: 1
- Databases: 3 (SQLite, Firebase, MySQL)

Contributors:
- Primary Developer: 1
- Coaches (Testing): 10+
- Kids (Users): 100+
- Parents (Users): 150+
```

---

## 🌟 Made with Love

**Built with ❤️ by Swimming Ducks (Silicon Solutions)**

For **NextGen Multisport Academy** | Nairobi, Kenya

*Empowering youth through sports & technology*

---

## 📱 Get Started Now

```bash
# Clone the repository
git clone https://github.com/your-org/AccellaX-361.git

# Choose your component
cd AccellaX-361

# Mobile apps
cd apps/attendance   # or apps/assessment

# Web platform
cd web/frontend      # or web/backend

# OAuth backend
cd oauth-backend

# Install & run (see component READMEs)
```

**Welcome to AccellaX 361° - Where Performance Meets Potential! 🚀**

---

## 🙏 Acknowledgments

### Founding Academy
**NextGen Multisport Academy** - Nairobi, Kenya  
*The visionaries who made AccellaX 361° possible. First academy, first believers, forever grateful.*

- Vision & requirements definition
- Real-world testing & feedback  
- Ongoing partnership & innovation
- Empowering 200+ youth through sports

**Website**: [refer to thier website]  
**Location**: Nairobi, Kenya

### Technology Partners
- Firebase team - Real-time database & authentication
- Expo team - React Native framework
- Laravel team - PHP framework
- Vercel team - Serverless hosting
- Railway team - Backend hosting
- Open source community

---

**Built with ❤️ by Swimming Ducks**

*AccellaX 361° | Silicon Ducks*

**Empowering youth sports academies worldwide through technology**
