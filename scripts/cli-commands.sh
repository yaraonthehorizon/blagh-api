#!/bin/bash

# Diagrammers API CLI Commands
# This script provides commands for the main @diagramers/cli package

COMMAND=$1
MODULE_NAME=$2
ENDPOINT_NAME=$3

show_help() {
    echo "Diagrammers API CLI Commands"
    echo ""
    echo "Usage: diagramers-api <command> [options]"
    echo ""
    echo "Commands:"
    echo "  generate:module <name>                Generate a new module with entity, schema, service, controller, and routes"
    echo "  generate:endpoint <module> <endpoint> Generate a new endpoint for an existing module"
    echo "  process:template <name>               Process template files for a new project"
    echo "  help                                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  diagramers-api generate:module product"
    echo "  diagramers-api generate:module user-profile"
    echo "  diagramers-api generate:endpoint product search"
    echo "  diagramers-api generate:endpoint user activate"
    echo "  diagramers-api process:template my-api-project"
    echo ""
}

case $COMMAND in
    "generate:module")
        if [ -z "$MODULE_NAME" ]; then
            echo "❌ Module name is required"
            echo "Usage: diagramers-api generate:module <module-name>"
            exit 1
        fi
        ./scripts/generate-module.sh "$MODULE_NAME"
        ;;
    "generate:endpoint")
        if [ -z "$MODULE_NAME" ] || [ -z "$ENDPOINT_NAME" ]; then
            echo "❌ Module name and endpoint name are required"
            echo "Usage: diagramers-api generate:endpoint <module-name> <endpoint-name>"
            exit 1
        fi
        ./scripts/generate-endpoint.sh "$MODULE_NAME" "$ENDPOINT_NAME"
        ;;
    "process:template")
        if [ -z "$MODULE_NAME" ]; then
            echo "❌ Project name is required"
            echo "Usage: diagramers-api process:template <project-name>"
            exit 1
        fi
        ./scripts/process-template.sh "$MODULE_NAME"
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac 