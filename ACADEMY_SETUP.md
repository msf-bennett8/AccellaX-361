# Academy Setup Guide

> Complete guide for deploying AccellaX 361° for your sports academy

---

## 🎯 Overview

This guide will help you configure AccellaX 361° for your academy. 
Estimated setup time: **2-4 hours**

---

## ✅ Pre-Setup Checklist

Before you begin, ensure you have:

- [ ] Academy name and branding materials (logo, colors)
- [ ] List of age groups your academy uses
- [ ] Sports/programs you offer
- [ ] Payment structure (fees, sponsorship types)
- [ ] Firebase project created
- [ ] Domain name (optional but recommended)
- [ ] List of initial coaches/admins

---

## 1️⃣ Branding Configuration

### Logo Replacement

Replace these files with your academy logo:
```bash
# Mobile Apps
apps/attendance/assets/icon.png           # 1024x1024 PNG
apps/attendance/assets/splash-icon.png    # 1284x2778 PNG
apps/assessment/assets/icon.png           # 1024x1024 PNG
apps/assessment/assets/splash-icon.png    # 1284x2778 PNG

# Web Frontend
web/frontend/public/logo.png              # 512x512 PNG
web/frontend/public/favicon.ico           # 32x32 ICO
```

### Color Scheme

**Edit:** `web/frontend/tailwind.config.js`
```javascript
colors: {
  primary: {
    50: '#YOUR_PRIMARY_LIGHT',
    500: '#YOUR_PRIMARY_MAIN',
    700: '#YOUR_PRIMARY_DARK',
  },
  // Add your colors
}
```

---

## 2️⃣ Academy Information

### Backend Configuration

**Edit:** `web/backend/.env`
```env
# Academy Details
ACADEMY_NAME="Your Academy Name"
ACADEMY_SHORT_NAME="YAN"
ACADEMY_LOCATION="Your City, Country"
ACADEMY_EMAIL="info@youracademy.com"
ACADEMY_PHONE="+123456789"
ACADEMY_WEBSITE="https://youracademy.com"

# Social Media (optional)
ACADEMY_FACEBOOK="youracademy"
ACADEMY_INSTAGRAM="youracademy"
ACADEMY_TWITTER="youracademy"
```

### Frontend Configuration

**Edit:** `web/frontend/.env`
```env
VITE_ACADEMY_NAME="Your Academy Name"
VITE_ACADEMY_TAGLINE="Your mission statement"
VITE_ACADEMY_DESCRIPTION="Brief description of your academy"
```

---

## 3️⃣ Age Groups & Programs

**Edit:** `web/backend/config/academy.php`
```php
return [
    // Your age groups
    'age_groups' => [
        'u6' => 'Under 6',
        'u8' => 'Under 8',
        'u10' => 'Under 10',
        'u12' => 'Under 12',
        'u15' => 'Under 15',
        'u18' => 'Under 18',
    ],

    // Your programs
    'program_types' => [
        'regular' => 'Regular Training',
        'advanced' => 'Advanced Program',
        'elite' => 'Elite Squad',
        'recreational' => 'Recreational',
    ],

    // Your sports
    'sports' => [
        'football' => 'Football',
        'basketball' => 'Basketball',
        'volleyball' => 'Volleyball',
        // Add more sports
    ],

    // Sponsorship types
    'sponsorship_types' => [
        'full' => 'Full Scholarship',
        'partial' => 'Partial Scholarship',
        'self' => 'Self-Sponsored',
        'grant' => 'Grant Funded',
    ],
];
```

---

## 4️⃣ Assessment Benchmarks

**Edit:** `apps/assessment/src/config/benchmarks.js`

Customize fitness benchmarks for your region/standards:
```javascript
export const BENCHMARKS = {
  beep_test: {
    boys: {
      '10-12': {
        excellent: 10.0,
        good: 8.0,
        average: 6.0,
        below: 4.0,
      },
      // Add your age groups
    },
    girls: {
      // Your benchmarks
    },
  },
  // Add other tests
};
```

---

## 5️⃣ Database Seeding

### Create Initial Admin User
```bash
cd web/backend
php artisan tinker
```
```php
// Create super admin
User::create([
    'name' => 'Your Name',
    'email' => 'admin@youracademy.com',
    'password' => bcrypt('secure_password'),
    'role' => 'super_admin',
    'academy_id' => 1,
]);
```

### Add Your Academy
```php
Academy::create([
    'name' => 'Your Academy Name',
    'location' => 'Your City, Country',
    'email' => 'info@youracademy.com',
    'phone' => '+123456789',
]);
```

---

## 6️⃣ Mobile App Configuration

### App Names & Identifiers

**Attendance App:** `apps/attendance/app.json`
```json
{
  "name": "YourAcademy Attendance",
  "slug": "youracademy-attendance",
  "ios": {
    "bundleIdentifier": "com.youracademy.attendance"
  },
  "android": {
    "package": "com.youracademy.attendance"
  }
}
```

**Assessment App:** `apps/assessment/app.json`
```json
{
  "name": "YourAcademy Assessment",
  "slug": "youracademy-assessment",
  "ios": {
    "bundleIdentifier": "com.youracademy.assessment"
  },
  "android": {
    "package": "com.youracademy.assessment"
  }
}
```

---

## 7️⃣ Deployment

Follow the main deployment guide with your academy details:

**[📖 Full Deployment Guide](./docs/DEPLOYMENT.md)**

---

## 8️⃣ Testing

### Test Checklist

- [ ] Admin can login to web dashboard
- [ ] Coach can login to mobile apps
- [ ] Attendance marking works offline
- [ ] Data syncs to web dashboard
- [ ] Assessment benchmarks display correctly
- [ ] Academy branding appears everywhere
- [ ] Email notifications work

---

## 🆘 Need Help?

**Swimming Ducks Support:**
- Email: zablonbennett.nextgen@gmail.com
- Setup consultation available
- Custom configuration assistance
- Training for your team

---

## 🙏 About This Platform

AccellaX 361° was originally developed for **NextGen Multisport Academy** 
in Nairobi, Kenya. We're grateful for their vision and partnership in 
creating this platform.

Your academy is now part of the AccellaX 361° family! 🎉

---

**Built with ❤️ by Swimming Ducks**

*AccellaX 361° | Silicon Ducks*
```

---

## 📋 Summary of Changes

| File | Change Type | Purpose |
|------|-------------|---------|
| All READMEs | Overview sections | Make generic, acknowledge NextGen |
| All READMEs | Footer | Dedicated acknowledgment section |
| Root README | New section | "Deploying for Your Academy" |
| Web README | New section | "Academy Configuration" |
| New file | `ACADEMY_SETUP.md` | Complete setup guide for new academies |

---

## ✅ Final Structure
```
AccellaX 361°/
├── README.md                    # Generic + NextGen acknowledgment
├── ACADEMY_SETUP.md            # NEW: Setup guide for new academies
├── apps/
│   ├── attendance/README.md    # Generic + NextGen mention
│   └── assessment/README.md    # Generic + NextGen mention
├── oauth-backend/README.md     # Generic
└── web/README.md               # Generic + config guide + NextGen acknowledgment