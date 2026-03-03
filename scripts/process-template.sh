#!/bin/bash

# Diagrammers API Template Processor
# Usage: ./scripts/process-template.sh <project-name>

PROJECT_NAME=$1

if [ -z "$PROJECT_NAME" ]; then
    echo "❌ Project name is required"
    echo "Usage: ./scripts/process-template.sh <project-name>"
    exit 1
fi

# Convert project name to database-friendly format (lowercase, replace spaces/hyphens with underscores)
DB_NAME=$(echo $PROJECT_NAME | tr '[:upper:]' '[:lower:]' | sed 's/[^a-zA-Z0-9]/_/g' | sed 's/__*/_/g' | sed 's/^_//' | sed 's/_$//')

echo "🔧 Processing template for project: $PROJECT_NAME"
echo "🗄️ Database name will be: $DB_NAME"

# Process configuration files
echo "📝 Updating configuration files..."

# Update development config
if [ -f "src/config/development.ts" ]; then
    sed -i '' "s/mongodb:\/\/127\.0\.0\.1:27017\/tactic-development/mongodb:\/\/127.0.0.1:27017\/${DB_NAME}-development/g" src/config/development.ts
    echo "   ✅ Updated development.ts"
fi

# Update staging config
if [ -f "src/config/staging.ts" ]; then
    sed -i '' "s/sendifier-staging/${DB_NAME}-staging/g" src/config/staging.ts
    echo "   ✅ Updated staging.ts"
fi

# Update production config
if [ -f "src/config/production.ts" ]; then
    sed -i '' "s/sendifier-production/${DB_NAME}-production/g" src/config/production.ts
    echo "   ✅ Updated production.ts"
fi

# Update package.json
if [ -f "package.json" ]; then
    sed -i '' "s/\"name\": \"@diagramers\/api\"/\"name\": \"${PROJECT_NAME}\"/g" package.json
    sed -i '' "s/\"description\": \"Diagramers API - A comprehensive Node.js API template with TypeScript, Firebase Functions, and Socket.io\"/\"description\": \"${PROJECT_NAME} - API project\"/g" package.json
    echo "   ✅ Updated package.json"
fi

# Update README.md
if [ -f "README.md" ]; then
    sed -i '' "s/# @diagramers\/api/# ${PROJECT_NAME}/g" README.md
    sed -i '' "s/A comprehensive Node.js API template with TypeScript, Firebase Functions, and Socket.io./${PROJECT_NAME} - API project./g" README.md
    echo "   ✅ Updated README.md"
fi

# Create .env file template
echo "📄 Creating .env template..."
cat > ".env.example" << 'EOF'
# =============================================================================
# DIAGRAMERS API - ENVIRONMENT CONFIGURATION
# =============================================================================
#
# This file contains ALL possible environment variables for the Diagramers API.
# For simplified configuration examples, see the README.md file.
#
# README Quick Start Examples:
# - Basic auth: JWT_SECRET, JWT_EXPIRATION (maps to JWT_EXPIRES_IN below)
# - Firebase: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
# - SMS: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
# - OAuth: AUTH_OAUTH_GOOGLE_CLIENT_ID, AUTH_OAUTH_GOOGLE_CLIENT_SECRET
#
# =============================================================================

# =============================================================================
# GENERAL APPLICATION SETTINGS
# =============================================================================

# Application environment (development, staging, production, uat)
NODE_ENV=development

# Server configuration
PORT=3000
HOST=localhost

# Application URL (used for callbacks and redirects)
APP_URL=http://localhost:3000

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# Primary database configuration
DATABASE_TYPE=mongodb
DATABASE_URL=mongodb://localhost:27017/DB_NAME_PLACEHOLDER
DATABASE_NAME=DB_NAME_PLACEHOLDER

# SQL Database configuration (if using SQL instead of MongoDB)
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=
DATABASE_DIALECT=mysql

# Database connection pool settings
DATABASE_POOL_MAX=10
DATABASE_POOL_MIN=0
DATABASE_POOL_ACQUIRE=60000
DATABASE_POOL_IDLE=10000

# MongoDB specific settings
MONGODB_URI=mongodb://127.0.0.1:27017/DB_NAME_PLACEHOLDER-development
MONGODB_OPTIONS_RETRY_WRITES=true
MONGODB_OPTIONS_W=1
MONGODB_OPTIONS_JOURNAL=true
MONGODB_OPTIONS_READ_PREFERENCE=primary
MONGODB_OPTIONS_MAX_POOL_SIZE=10
MONGODB_OPTIONS_MIN_POOL_SIZE=0
MONGODB_OPTIONS_MAX_IDLE_TIME_MS=30000
MONGODB_OPTIONS_CONNECT_TIMEOUT_MS=10000
MONGODB_OPTIONS_SOCKET_TIMEOUT_MS=45000
MONGODB_OPTIONS_SERVER_SELECTION_TIMEOUT_MS=30000
MONGODB_OPTIONS_HEARTBEAT_FREQUENCY_MS=10000
MONGODB_OPTIONS_APP_NAME=diagramers-api

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

# Logging level (error, warn, info, debug, trace)
LOG_LEVEL=info

# Logging format (json, simple, colored)
LOG_FORMAT=colored

# Enable colored output
LOG_COLORS=true

# File logging
LOG_FILE_ENABLED=false
LOG_FILE_PATH=./logs/app.log
LOG_FILE_MAX_SIZE=10m
LOG_FILE_MAX_FILES=5

# Database logging
LOG_DATABASE_ENABLED=false
LOG_DATABASE_COLLECTION=logs

# External logging services
LOG_EXTERNAL_ENABLED=false
LOG_EXTERNAL_TYPE=serilog
LOG_EXTERNAL_URL=
LOG_EXTERNAL_API_KEY=
LOG_EXTERNAL_APP_NAME=

# =============================================================================
# SOCKET.IO CONFIGURATION
# =============================================================================

# Enable Socket.IO
SOCKETIO_ENABLED=true

# CORS settings for Socket.IO
SOCKETIO_CORS_ORIGIN=*
SOCKETIO_CORS_METHODS=GET,POST
SOCKETIO_CORS_CREDENTIALS=false

# Socket.IO transport settings
SOCKETIO_TRANSPORTS=polling,websocket
SOCKETIO_ALLOW_UPGRADES=true
SOCKETIO_PING_TIMEOUT=60000
SOCKETIO_PING_INTERVAL=25000

# =============================================================================
# FIREBASE CONFIGURATION
# =============================================================================

# Enable Firebase integration
FIREBASE_ENABLED=false

# Firebase project settings
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Firebase service account (for server-side operations)
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Firebase Functions settings
FIREBASE_FUNCTIONS_REGION=us-central1
FIREBASE_FUNCTIONS_TIMEOUT=540

# =============================================================================
# JWT CONFIGURATION
# =============================================================================

# JWT secret key (REQUIRED for authentication)
JWT_SECRET=your-jwt-secret-key

# JWT expiration settings
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# JWT issuer and audience
JWT_ISSUER=diagramers-api
JWT_AUDIENCE=diagramers-users

# JWT algorithm
JWT_ALGORITHM=HS256

# =============================================================================
# OAUTH CONFIGURATION
# =============================================================================

# Enable OAuth authentication
OAUTH_ENABLED=false

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Twitter OAuth
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
TWITTER_CALLBACK_URL=http://localhost:3000/api/auth/twitter/callback

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=http://localhost:3000/api/auth/linkedin/callback

# =============================================================================
# TWILIO CONFIGURATION (SMS)
# =============================================================================

# Enable Twilio SMS
TWILIO_ENABLED=false

# Twilio account settings
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Twilio Verify service
TWILIO_VERIFY_SERVICE_SID=your-verify-service-sid

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================

# Enable email functionality
EMAIL_ENABLED=false

# SMTP settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false

# Email settings
EMAIL_FROM=noreply@yourdomain.com
EMAIL_TEMPLATES_PATH=./src/assets/email-templates
EMAIL_VERIFICATION_ENABLED=true
EMAIL_VERIFICATION_EXPIRES_IN=24h

# Email providers (alternative to SMTP)
SENDGRID_API_KEY=your-sendgrid-api-key
AWS_SES_ACCESS_KEY_ID=your-aws-ses-access-key
AWS_SES_SECRET_ACCESS_KEY=your-aws-ses-secret-key
AWS_SES_REGION=us-east-1

# =============================================================================
# INTERNAL API CONFIGURATION
# =============================================================================

# Internal request header for API-to-API communication
INTERNAL_REQUEST_HEADER_VALUE=your-secret-header-value

# API rate limiting
API_RATE_LIMIT_ENABLED=true
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# =============================================================================
# DATABASE SEEDING
# =============================================================================

# Database seeding settings
DB_SEED=false
DB_SEED_FORCE=false
DB_SEED_TRUNCATE=false
DB_SEED_RESET=false
DB_SEED_PATH=./src/scripts/seeds

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# CORS settings
CORS_ENABLED=true
CORS_ORIGIN=*
CORS_CREDENTIALS=false
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With

# Security middleware
SECURITY_ENABLED=true
HELMET_ENABLED=true
COMPRESSION_ENABLED=true

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Password settings
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=true

# =============================================================================
# SESSION CONFIGURATION
# =============================================================================

# Session settings
SESSION_ENABLED=true
SESSION_SECRET=your-session-secret
SESSION_COOKIE_NAME=diagramers-session
SESSION_COOKIE_MAX_AGE=86400000
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_HTTP_ONLY=true
SESSION_COOKIE_SAME_SITE=lax

# =============================================================================
# FILE UPLOAD CONFIGURATION
# =============================================================================

# File upload settings
FILE_UPLOAD_ENABLED=true
FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf
FILE_UPLOAD_PATH=./uploads
FILE_UPLOAD_TEMP_PATH=./uploads/temp
FILE_UPLOAD_BACKUP_ENABLED=true
FILE_UPLOAD_BACKUP_PATH=./uploads/backup

# =============================================================================
# CACHE CONFIGURATION
# =============================================================================

# Cache settings
CACHE_ENABLED=false
CACHE_TYPE=memory
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# Redis settings
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=diagramers:

# =============================================================================
# QUEUE CONFIGURATION
# =============================================================================

# Queue settings
QUEUE_ENABLED=false
QUEUE_TYPE=memory
QUEUE_RETRY_ATTEMPTS=3
QUEUE_RETRY_DELAY=5000

# Bull queue settings
BULL_REDIS_HOST=localhost
BULL_REDIS_PORT=6379
BULL_REDIS_PASSWORD=
BULL_REDIS_DB=1

# =============================================================================
# OPTIONAL CONFIGURATION
# =============================================================================

# Base site URL
BASE_SITE_URL=http://localhost:3000

# Local tunnel URLs (for development)
LOCAL_API_TUNNEL_URL=https://your-ngrok-url.ngrok-free.app
LOCAL_UI_TUNNEL_URL=https://your-ui-ngrok-url.ngrok-free.app

# Backup settings
BACKUP_DATABASES_FOLDER_PATH=/path/to/backup/folder

# External HTTP request timeout
EXTERNAL_HTTP_REQUEST_TIMEOUT=5000

# =============================================================================
# AUTHENTICATION CONFIGURATION
# =============================================================================

# Internal authentication
AUTH_INTERNAL_ENABLED=true
AUTH_INTERNAL_USER_TABLE=users
AUTH_INTERNAL_PASSWORD_MIN_LENGTH=8
AUTH_INTERNAL_PASSWORD_REQUIRE_UPPERCASE=true
AUTH_INTERNAL_PASSWORD_REQUIRE_LOWERCASE=true
AUTH_INTERNAL_PASSWORD_REQUIRE_NUMBERS=true
AUTH_INTERNAL_PASSWORD_REQUIRE_SYMBOLS=true

# Firebase authentication
AUTH_FIREBASE_ENABLED=false
AUTH_FIREBASE_PROJECT_ID=your-firebase-project-id
AUTH_FIREBASE_PRIVATE_KEY=your-firebase-private-key
AUTH_FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# OAuth authentication
AUTH_OAUTH_ENABLED=false
AUTH_OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
AUTH_OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
AUTH_OAUTH_GOOGLE_SCOPE=email profile
AUTH_OAUTH_FACEBOOK_CLIENT_ID=your-facebook-client-id
AUTH_OAUTH_FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
AUTH_OAUTH_FACEBOOK_SCOPE=email public_profile
AUTH_OAUTH_GITHUB_CLIENT_ID=your-github-client-id
AUTH_OAUTH_GITHUB_CLIENT_SECRET=your-github-client-secret
AUTH_OAUTH_GITHUB_SCOPE=user:email
AUTH_OAUTH_TWITTER_CLIENT_ID=your-twitter-client-id
AUTH_OAUTH_TWITTER_CLIENT_SECRET=your-twitter-client-secret
AUTH_OAUTH_TWITTER_SCOPE=tweet.read,users.read

# SMS authentication
AUTH_SMS_ENABLED=false
AUTH_SMS_TWILIO_ACCOUNT_SID=your-twilio-account-sid
AUTH_SMS_TWILIO_AUTH_TOKEN=your-twilio-auth-token
AUTH_SMS_TWILIO_PHONE_NUMBER=+1234567890
AUTH_SMS_TWILIO_VERIFY_SERVICE_SID=your-twilio-verify-service-sid

# Email authentication
AUTH_EMAIL_ENABLED=false
AUTH_EMAIL_SMTP_HOST=smtp.gmail.com
AUTH_EMAIL_SMTP_PORT=587
AUTH_EMAIL_SMTP_USER=your-email@gmail.com
AUTH_EMAIL_SMTP_PASS=your-app-password
AUTH_EMAIL_FROM=noreply@yourdomain.com
AUTH_EMAIL_VERIFICATION_EXPIRES_IN=24h

# =============================================================================
# NOTIFICATION CONFIGURATION
# =============================================================================

# Email notifications
NOTIFICATIONS_EMAIL_ENABLED=false
NOTIFICATIONS_EMAIL_SMTP_HOST=smtp.gmail.com
NOTIFICATIONS_EMAIL_SMTP_PORT=587
NOTIFICATIONS_EMAIL_SMTP_USER=your-email@gmail.com
NOTIFICATIONS_EMAIL_SMTP_PASS=your-app-password
NOTIFICATIONS_EMAIL_FROM=noreply@yourdomain.com
NOTIFICATIONS_EMAIL_TEMPLATES_PATH=./src/assets/email-templates

# SMS notifications
NOTIFICATIONS_SMS_ENABLED=false
NOTIFICATIONS_SMS_TWILIO_ACCOUNT_SID=your-twilio-account-sid
NOTIFICATIONS_SMS_TWILIO_AUTH_TOKEN=your-twilio-auth-token
NOTIFICATIONS_SMS_TWILIO_PHONE_NUMBER=+1234567890

# Push notifications
NOTIFICATIONS_PUSH_ENABLED=false
NOTIFICATIONS_PUSH_FIREBASE_PROJECT_ID=your-firebase-project-id
NOTIFICATIONS_PUSH_FIREBASE_PRIVATE_KEY=your-firebase-private-key
NOTIFICATIONS_PUSH_FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# =============================================================================
# AUDIT LOGGING CONFIGURATION
# =============================================================================

# Audit logging
AUDIT_ENABLED=false
AUDIT_DATABASE_COLLECTION=audit_logs
AUDIT_FILE_ENABLED=false
AUDIT_FILE_PATH=./logs/audit.log
AUDIT_EXTERNAL_ENABLED=false
AUDIT_EXTERNAL_URL=
AUDIT_EXTERNAL_API_KEY=

# =============================================================================
# CRON JOBS CONFIGURATION
# =============================================================================

# Cron jobs
CRON_ENABLED=false
CRON_TIMEZONE=UTC
CRON_JOBS_PATH=./src/cron

# =============================================================================
# PLUGIN CONFIGURATION
# =============================================================================

# Plugin system
PLUGINS_ENABLED=true
PLUGINS_PATH=./src/plugins
PLUGINS_AUTO_LOAD=true

# =============================================================================
# DEPLOYMENT CONFIGURATION
# =============================================================================

# Deployment settings
DEPLOYMENT_ENVIRONMENT=development
DEPLOYMENT_VERSION=1.0.0
DEPLOYMENT_BUILD_NUMBER=1

# Health check settings
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PATH=/health
HEALTH_CHECK_TIMEOUT=5000

# =============================================================================
# MONITORING CONFIGURATION
# =============================================================================

# Application monitoring
MONITORING_ENABLED=false
MONITORING_TYPE=prometheus
MONITORING_PORT=9090
MONITORING_PATH=/metrics

# Error tracking
ERROR_TRACKING_ENABLED=false
ERROR_TRACKING_SENTRY_DSN=your-sentry-dsn
ERROR_TRACKING_SENTRY_ENVIRONMENT=development

# Performance monitoring
PERFORMANCE_MONITORING_ENABLED=false
PERFORMANCE_MONITORING_NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
PERFORMANCE_MONITORING_NEW_RELIC_APP_NAME=diagramers-api

# =============================================================================
# DEVELOPMENT CONFIGURATION
# =============================================================================

# Development settings
DEV_MODE=true
DEV_HOT_RELOAD=true
DEV_DEBUG_MODE=false
DEV_PROFILING_ENABLED=false

# Testing settings
TEST_ENABLED=false
TEST_DATABASE_URL=mongodb://localhost:27017/DB_NAME_PLACEHOLDER-test
TEST_DATABASE_NAME=DB_NAME_PLACEHOLDER-test

# =============================================================================
# PRODUCTION CONFIGURATION
# =============================================================================

# Production settings
PROD_MODE=false
PROD_SSL_ENABLED=false
PROD_SSL_KEY_PATH=./certs/private.key
PROD_SSL_CERT_PATH=./certs/certificate.crt
PROD_SSL_CA_PATH=./certs/ca_bundle.crt

# Load balancer settings
PROD_LOAD_BALANCER_ENABLED=false
PROD_LOAD_BALANCER_TRUST_PROXY=true
PROD_LOAD_BALANCER_FORWARDED_HEADERS=true

# =============================================================================
# STAGING CONFIGURATION
# =============================================================================

# Staging settings
STAGING_MODE=false
STAGING_DATABASE_URL=mongodb://localhost:27017/DB_NAME_PLACEHOLDER-staging
STAGING_DATABASE_NAME=DB_NAME_PLACEHOLDER-staging

# =============================================================================
# UAT CONFIGURATION
# =============================================================================

# UAT settings
UAT_MODE=false
UAT_DATABASE_URL=mongodb://localhost:27017/DB_NAME_PLACEHOLDER-uat
UAT_DATABASE_NAME=DB_NAME_PLACEHOLDER-uat

# =============================================================================
# END OF CONFIGURATION
# =============================================================================
EOF

# Replace placeholders with actual database name
sed -i '' "s/DB_NAME_PLACEHOLDER/${DB_NAME}/g" .env.example

echo "✅ Template processing completed!"
echo ""
echo "📋 Summary:"
echo "   Project Name: $PROJECT_NAME"
echo "   Database Name: $DB_NAME"
echo "   Development DB: ${DB_NAME}-development"
echo "   Staging DB: ${DB_NAME}-staging"
echo "   Production DB: ${DB_NAME}-production"
echo ""
echo "🚀 Next steps:"
echo "   1. Copy .env.example to .env and configure your environment variables"
echo "   2. Install dependencies: npm install"
echo "   3. Build the project: npm run build:dev"
echo "   4. Start the server: npm start" 