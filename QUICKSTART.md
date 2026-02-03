# HappyTalk PWA - Quick Start Guide

## 📦 Installation

```bash
git clone https://github.com/VladyslavNap/Chat-HappyTalk.git
cd Chat-HappyTalk
npm install
```

## 🚀 Development

```bash
npm start
# App runs at http://localhost:4200
```

## 🏗️ Build

```bash
npm run build
# Output: dist/happy-talk/browser/
```

## 🧪 Test

```bash
npm test
# All 6 tests should pass
```

## 🌐 Deploy

### Option 1: Interactive Script
```bash
./deploy.sh
# Choose from: local, Netlify, Vercel, Firebase, GitHub Pages
```

### Option 2: Specific Platform

**Netlify:**
```bash
npm run build
cd dist/happy-talk/browser
netlify deploy --prod
```

**Vercel:**
```bash
npm run build
vercel --prod
```

**Firebase:**
```bash
npm run build
firebase deploy
```

**GitHub Pages:**
```bash
ng build --base-href=/Chat-HappyTalk/
npx angular-cli-ghpages --dir=dist/happy-talk/browser
```

## ✨ Features

- ✅ Progressive Web App (installable)
- ✅ Service Worker (offline support)
- ✅ Responsive design
- ✅ Accessible (WCAG compliant)
- ✅ Three pages: Home, Chat, About
- ✅ Route guards
- ✅ Modern Angular 21

## 📱 PWA Installation

After deploying, users can install the app:
- **Desktop**: Click install button in browser
- **Android**: "Add to Home Screen"
- **iOS**: Share → "Add to Home Screen"

## 🔧 Tech Stack

- Angular 21.1.0
- TypeScript 5.9.2
- SCSS
- Angular PWA
- Service Workers
- Vitest for testing

## 📄 License

MIT
