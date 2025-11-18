# AccellaX 361° Web Platform

Sports Academy Attendance & Management System

## 🏗️ Architecture
```
web/
├── backend/     Laravel API (PHP 8.1+)
└── frontend/    React SPA (Vite + Tailwind)
```

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 👥 User Roles
- Super Admin
- Academy Owner
- Head Coach
- Coach
- Payment Recorder
- Parent
- Kid
- Sponsor

## 🔧 Tech Stack
- **Backend:** Laravel 10, MySQL, Firebase Admin SDK
- **Frontend:** React 18, Vite, Tailwind CSS, Firebase
- **Mobile:** React Native (../app)

## 📱 Mobile App
Coach attendance marking app located in `../app`

---
Built with ❤️ for NextGen Multisport Academy