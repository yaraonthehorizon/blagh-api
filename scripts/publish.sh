#!/bin/bash

# Diagrammers API Publishing Script
echo "🚀 Publishing Diagrammers API..."

# Check if user is logged into npm
if ! npm whoami &> /dev/null; then
    echo "❌ You need to be logged into npm. Run: npm login"
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME=$(node -p "require('./package.json').name")

# Check if this version is already published
echo "🔍 Checking if version $CURRENT_VERSION is already published..."
if npm view "$PACKAGE_NAME@$CURRENT_VERSION" version &> /dev/null; then
    echo "⚠️  Version $CURRENT_VERSION is already published to npm"
    echo "📝 You need to bump the version first. Choose an option:"
    echo "   1. Patch version (1.0.0 → 1.0.1)"
    echo "   2. Minor version (1.0.0 → 1.1.0)"
    echo "   3. Major version (1.0.0 → 2.0.0)"
    echo "   4. Cancel"
    echo ""
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            echo "🔢 Bumping patch version..."
            npm version patch --no-git-tag-version
            ;;
        2)
            echo "🔢 Bumping minor version..."
            npm version minor --no-git-tag-version
            ;;
        3)
            echo "🔢 Bumping major version..."
            npm version major --no-git-tag-version
            ;;
        4)
            echo "❌ Publishing cancelled"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Publishing cancelled"
            exit 1
            ;;
    esac
    
    # Get the new version after bump
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo "✅ Version bumped to $NEW_VERSION"
fi

# Build the project first
echo "🔧 Building API..."
npm run build

# Check if lib directory was created
if [ ! -d "lib" ]; then
    echo "❌ Build failed - lib directory not found"
    exit 1
fi

# Check if package.json is properly configured
if ! grep -q '"name": "@diagramers/api"' package.json; then
    echo "❌ Package name not set correctly in package.json"
    exit 1
fi

# Check if version is set
if ! grep -q '"version":' package.json; then
    echo "❌ Version not set in package.json"
    exit 1
fi

# Show what will be published
echo "📦 Files that will be published:"
npm pack --dry-run

echo ""
echo "📁 Built files in lib directory:"
ls -la lib/

echo ""
echo "⚠️  Review the files above. Continue with publishing? (y/N)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "🚀 Publishing to npm..."
    npm publish --access public
    
    if [ $? -eq 0 ]; then
        FINAL_VERSION=$(node -p "require('./package.json').version")
        echo "✅ Successfully published version $FINAL_VERSION to npm!"
        echo ""
        echo "🎉 Users can now install your API package with:"
        echo "   npm install @diagramers/api@$FINAL_VERSION"
        echo ""
        echo "📚 Or use it in their projects:"
        echo "   import { DiagramersAPI } from '@diagramers/api'"
        echo ""
        echo "🔄 To install the latest version:"
        echo "   npm install @diagramers/api@latest"
        
        # Exit successfully to prevent any further execution
        exit 0
    else
        echo "❌ Failed to publish to npm"
        exit 1
    fi
else
    echo "❌ Publishing cancelled"
    exit 1
fi
