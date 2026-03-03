#!/bin/bash

# Script to set up dynamic permissions for the USERS module
# This script initializes the permission system with default permissions

echo "🎯 Setting up Dynamic Permissions for USERS Module"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the api directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if the permission setup file exists
if [ ! -f "src/modules/permission/scripts/setup-user-permissions.ts" ]; then
    echo "❌ Error: Permission setup file not found"
    echo "Make sure you have run the permission module setup first"
    exit 1
fi

echo "✅ Environment check passed"
echo ""

# Build the project first
echo "🔨 Building project..."
npm run build:dev

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix any compilation errors first."
    exit 1
fi

echo "✅ Build successful"
echo ""

# Run the permission setup
echo "🚀 Running permission setup..."
npx ts-node src/modules/permission/scripts/setup-user-permissions.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Permission setup completed successfully!"
    echo ""
    echo "📋 What was created:"
    echo "   • Basic CRUD permissions (CREATE, READ, UPDATE, DELETE)"
    echo "   • Profile and search permissions"
    echo "   • Cross-module permissions (orders, favorites)"
    echo "   • Export/Import permissions"
    echo "   • Analytics permissions"
    echo "   • Custom conditional permissions"
    echo "   • Department-based permissions"
    echo ""
    echo "🔗 Next steps:"
    echo "   1. Visit http://localhost:3000/api-docs to see the new endpoints"
    echo "   2. Use the permission endpoints to manage permissions"
    echo "   3. Test permissions with different users and roles"
    echo "   4. Create custom permissions for your specific needs"
    echo ""
    echo "💡 Tip: You can now modify permissions through the admin interface"
    echo "   without changing any code!"
else
    echo ""
    echo "❌ Permission setup failed. Please check the error messages above."
    exit 1
fi
