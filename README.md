# Chat-HappyTalk

A modern Progressive Web Application (PWA) for chat built with Angular 21.

## 🚀 Features

- **Progressive Web App (PWA)**: Installable on any device, works offline
- **Service Worker**: Caches assets and API routes for offline functionality
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Accessibility First**: WCAG compliant with ARIA labels, keyboard navigation, and semantic HTML
- **Modern UI**: Clean, gradient-based design with smooth animations
- **Route Guards**: Protected routes with authentication guards
- **Three Main Pages**:
  - Home: Landing page with features overview
  - Chat: Interactive chat interface with message history
  - About: Application information and version details

## 📋 Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Angular CLI 21.x

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/VladyslavNap/Chat-HappyTalk.git
cd Chat-HappyTalk
```

2. Install dependencies:
```bash
npm install
```

## 🏃‍♂️ Development

To run the development server:

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

**Note**: Service Worker is disabled in development mode for easier debugging.

## 🏗️ Build

### Production Build

Build the project for production with PWA features enabled:

```bash
npm run build
# or
ng build --configuration production
```

The build artifacts will be stored in the `dist/happy-talk/browser/` directory.

### Development Build

Build without optimizations:

```bash
ng build --configuration development
```

## 🧪 Testing

Run unit tests:

```bash
npm test
# or
ng test
```

## 📦 PWA Configuration

### Service Worker

The service worker is configured in `ngsw-config.json` and includes:

- **Asset Groups**: Caches application shell and assets
- **Data Groups**: Caches API routes (`/api/**`) with freshness strategy
- **Install Mode**: Prefetch for app shell, lazy for assets
- **Cache Strategy**: Freshness with 1-hour max age for API calls

### Manifest

The web app manifest (`public/manifest.webmanifest`) defines:

- **Name**: HappyTalk - Chat Application
- **Short Name**: HappyTalk
- **Theme Color**: #2196F3 (Blue)
- **Background Color**: #ffffff (White)
- **Display Mode**: Standalone
- **Icons**: Multiple sizes from 72x72 to 512x512

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Static Hosting

The `dist/happy-talk/browser/` directory contains all the files needed for deployment.

#### Deploy to Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
cd dist/happy-talk/browser
netlify deploy --prod
```

#### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

#### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Firebase:
```bash
firebase init hosting
```

3. Configure `firebase.json`:
```json
{
  "hosting": {
    "public": "dist/happy-talk/browser",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

4. Deploy:
```bash
firebase deploy
```

#### Deploy to GitHub Pages

1. Build with base href:
```bash
ng build --base-href=/Chat-HappyTalk/
```

2. Install angular-cli-ghpages:
```bash
npm install -g angular-cli-ghpages
```

3. Deploy:
```bash
npx angular-cli-ghpages --dir=dist/happy-talk/browser
```

### Testing Production Build Locally

Use a simple HTTP server to test the production build:

```bash
npx http-server dist/happy-talk/browser -p 8080 -c-1
```

Navigate to `http://localhost:8080/`

## 🎨 Project Structure

```
Chat-HappyTalk/
├── src/
│   ├── app/
│   │   ├── guards/
│   │   │   └── auth-guard.ts          # Route guard
│   │   ├── pages/
│   │   │   ├── home/                  # Home page component
│   │   │   ├── chat/                  # Chat page component
│   │   │   └── about/                 # About page component
│   │   ├── app.config.ts              # App configuration
│   │   ├── app.routes.ts              # Route definitions
│   │   ├── app.ts                     # Root component
│   │   ├── app.html                   # Root template
│   │   └── app.scss                   # Root styles
│   ├── index.html                     # Main HTML file
│   ├── main.ts                        # Application entry point
│   └── styles.scss                    # Global styles
├── public/
│   ├── icons/                         # PWA icons
│   ├── manifest.webmanifest           # PWA manifest
│   └── favicon.ico                    # Favicon
├── ngsw-config.json                   # Service worker config
├── angular.json                       # Angular CLI config
├── package.json                       # Dependencies
└── tsconfig.json                      # TypeScript config
```

## ♿ Accessibility Features

- **ARIA Labels**: All interactive elements have proper ARIA labels
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Semantic HTML**: Proper use of HTML5 semantic elements
- **Screen Reader Support**: Compatible with major screen readers
- **Skip Links**: Skip to main content link for keyboard users
- **Color Contrast**: WCAG AA compliant color contrast ratios

## 🔒 Security

- **Content Security Policy**: Configure CSP headers in your hosting
- **HTTPS**: Always use HTTPS in production for service workers
- **Route Guards**: Protected routes with authentication guards

## 📱 PWA Installation

Users can install the app:

1. **Desktop**: Click the install button in the browser's address bar
2. **Android**: Tap "Add to Home Screen" from the browser menu
3. **iOS**: Tap the share button and select "Add to Home Screen"

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run unit tests |
| `ng generate component <name>` | Generate a new component |
| `ng generate service <name>` | Generate a new service |
| `ng generate guard <name>` | Generate a new guard |

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## 📞 Support

For issues and questions, please open an issue in the GitHub repository.

---

Built with ❤️ using Angular 21