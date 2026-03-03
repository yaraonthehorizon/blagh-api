#!/bin/bash

# Diagrammers API Template Setup Script
echo "🚀 Setting up Diagrammers API Template..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies for the main template
echo "📦 Installing template dependencies..."
npm install

# Build and setup CLI
echo "🔧 Setting up CLI tool..."
cd cli
npm install
npm run build
npm link
cd ..

echo "✅ Setup complete!"
echo ""
echo "🎉 You can now use the CLI to create new projects:"
echo "   diagrammers-api init my-new-project"
echo ""
echo "📚 For more information, see the README.md file"
echo "🔧 To start development: npm start" 