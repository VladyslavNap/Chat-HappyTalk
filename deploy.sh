#!/bin/bash

# HappyTalk Deployment Script
# This script helps deploy the application to various platforms

set -e

echo "🚀 HappyTalk Deployment Helper"
echo "================================"
echo ""

# Build the application
echo "📦 Building application for production..."
npm run build
echo "✅ Build completed successfully!"
echo ""

# Show available deployment options
echo "Choose a deployment option:"
echo "1) Test locally (http-server)"
echo "2) Deploy to Netlify"
echo "3) Deploy to Vercel"
echo "4) Deploy to Firebase"
echo "5) Deploy to GitHub Pages"
echo "6) Just show build location"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Starting local server..."
        echo "Access your app at: http://localhost:8080"
        echo "Press Ctrl+C to stop the server"
        echo ""
        npx http-server dist/happy-talk/browser -p 8080 -c-1
        ;;
    2)
        echo ""
        echo "📤 Deploying to Netlify..."
        if ! command -v netlify &> /dev/null; then
            echo "Installing Netlify CLI..."
            npm install -g netlify-cli
        fi
        cd dist/happy-talk/browser
        netlify deploy --prod
        ;;
    3)
        echo ""
        echo "📤 Deploying to Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "Installing Vercel CLI..."
            npm install -g vercel
        fi
        vercel --prod
        ;;
    4)
        echo ""
        echo "📤 Deploying to Firebase..."
        if ! command -v firebase &> /dev/null; then
            echo "Installing Firebase CLI..."
            npm install -g firebase-tools
        fi
        firebase deploy
        ;;
    5)
        echo ""
        echo "📤 Deploying to GitHub Pages..."
        echo "Building with GitHub Pages base href..."
        ng build --base-href=/Chat-HappyTalk/
        if ! command -v angular-cli-ghpages &> /dev/null; then
            echo "Installing angular-cli-ghpages..."
            npm install -g angular-cli-ghpages
        fi
        npx angular-cli-ghpages --dir=dist/happy-talk/browser
        ;;
    6)
        echo ""
        echo "📁 Build location: dist/happy-talk/browser/"
        echo ""
        echo "Files ready for deployment:"
        ls -lh dist/happy-talk/browser/
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"
