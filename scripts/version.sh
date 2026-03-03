#!/bin/bash

# Version Management Script for Diagrammers API Template

# Function to update version in package.json
update_version() {
    local new_version=$1
    local file=$2
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$file"
    else
        # Linux
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$file"
    fi
}

# Function to show current version
show_version() {
    echo "📦 Current versions:"
    echo "Main package: $(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
    echo "CLI package: $(grep '"version"' cli/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
}

# Function to update both versions
update_both_versions() {
    local new_version=$1
    echo "🔄 Updating version to $new_version..."
    
    update_version "$new_version" "package.json"
    update_version "$new_version" "cli/package.json"
    
    echo "✅ Versions updated successfully!"
    show_version
}

# Main script logic
case "$1" in
    "show")
        show_version
        ;;
    "patch")
        current_version=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
        new_version=$(echo "$current_version" | awk -F. '{print $1"."$2"."$3+1}')
        update_both_versions "$new_version"
        ;;
    "minor")
        current_version=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
        new_version=$(echo "$current_version" | awk -F. '{print $1"."$2+1".0"}')
        update_both_versions "$new_version"
        ;;
    "major")
        current_version=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
        new_version=$(echo "$current_version" | awk -F. '{print $1+1".0.0"}')
        update_both_versions "$new_version"
        ;;
    "set")
        if [ -z "$2" ]; then
            echo "❌ Please provide a version number"
            echo "Usage: ./version.sh set 1.2.3"
            exit 1
        fi
        update_both_versions "$2"
        ;;
    *)
        echo "📋 Version Management Script"
        echo ""
        echo "Usage:"
        echo "  ./version.sh show          - Show current versions"
        echo "  ./version.sh patch         - Increment patch version (1.0.0 -> 1.0.1)"
        echo "  ./version.sh minor         - Increment minor version (1.0.0 -> 1.1.0)"
        echo "  ./version.sh major         - Increment major version (1.0.0 -> 2.0.0)"
        echo "  ./version.sh set <version> - Set specific version (e.g., 1.2.3)"
        echo ""
        echo "Examples:"
        echo "  ./version.sh patch"
        echo "  ./version.sh set 1.5.0"
        ;;
esac 