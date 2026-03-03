#!/bin/bash

# Development Environment Setup Script
echo "🚀 Setting up development environment for real-time updates..."

# Set development environment variables
export NODE_ENV=development
export WEBPACK_WATCH=true
export WEBPACK_DEVTOOL=eval-source-map

# Create logs directory if it doesn't exist
mkdir -p logs

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf lib dist

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm install

# Build initial development version
echo "🔨 Building initial development version..."
npm run build:dev

echo "✅ Development environment ready!"
echo ""
echo "Available commands:"
echo "  npm run dev          - Start real-time development server"
echo "  npm run dev:debug    - Start with debug mode"
echo "  npm run build:watch  - Watch mode only"
echo "  npm run start:realtime - Full real-time experience"
echo ""
echo "The server will automatically restart when you make changes to:"
echo "  - src/**/*.ts files"
echo "  - src/**/*.js files" 
echo "  - src/**/*.json files"
echo "  - .env files"
echo ""
echo "Press Ctrl+C to stop the development server"
