#!/bin/bash

echo "🚀 Vincanto Production Deployment Setup"
echo "======================================="

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Build frontend
echo "🏗️ Building frontend..."
npm run build

echo "✅ Setup completed!"
echo ""
echo "🔧 Remember to:"
echo "   1. Update .env.production with your actual keys"
echo "   2. Update server/.env.production with production credentials"
echo "   3. Configure Vercel environment variables"
echo "   4. Setup webhook endpoints for Stripe/PayPal"
echo ""
echo "🌐 Ready for deployment!"