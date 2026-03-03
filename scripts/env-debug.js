#!/usr/bin/env node

/**
 * Environment Configuration Debug Script
 * 
 * This script helps developers understand how environment variables are being loaded
 * and troubleshoot configuration issues.
 * 
 * Usage:
 *   node scripts/env-debug.js
 *   node scripts/env-debug.js --validate
 *   node scripts/env-debug.js --check-files
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldValidate = args.includes('--validate');
const shouldCheckFiles = args.includes('--check-files');

console.log('🔍 Diagramers Environment Configuration Debug\n');

// Get current working directory
const cwd = process.cwd();
const environment = process.env.NODE_ENV || 'development';

console.log(`📁 Working Directory: ${cwd}`);
console.log(`🌍 Environment: ${environment}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'not set'}\n`);

// Define environment file loading order
const envFiles = [
  '.env.example',
  '.env',
  `.env.${environment}`,
  '.env.local'
];

console.log('📋 Environment File Loading Order:');
console.log('(Later files override earlier ones)\n');

let loadedFiles = [];
let availableFiles = [];

// Check each environment file
for (const envFile of envFiles) {
  const envPath = path.join(cwd, envFile);
  const exists = fs.existsSync(envPath);
  
  if (exists) {
    availableFiles.push(envFile);
    loadedFiles.push(envFile);
    console.log(`✅ ${envFile} - EXISTS`);
    
    // Load the file to see what variables it contains
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.log(`   ⚠️  Warning: ${result.error.message}`);
    } else {
      console.log(`   📝 Loaded successfully`);
    }
  } else {
    console.log(`❌ ${envFile} - NOT FOUND`);
  }
}

console.log('\n📊 Summary:');
console.log(`   Available files: ${availableFiles.length}/${envFiles.length}`);
console.log(`   Loaded files: ${loadedFiles.length}`);

if (availableFiles.length === 0) {
  console.log('\n⚠️  No environment files found!');
  console.log('   Consider creating:');
  console.log('   - .env.example (template)');
  console.log('   - .env (local configuration)');
  console.log(`   - .env.${environment} (environment-specific)`);
}

// Check for required environment variables
if (shouldValidate) {
  console.log('\n🔍 Validating Required Environment Variables:');
  
  const requiredVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'PORT',
    'NODE_ENV'
  ];
  
  const missingVars = [];
  const presentVars = [];
  
  for (const requiredVar of requiredVars) {
    if (process.env[requiredVar]) {
      presentVars.push(requiredVar);
      console.log(`✅ ${requiredVar} - SET`);
    } else {
      missingVars.push(requiredVar);
      console.log(`❌ ${requiredVar} - MISSING`);
    }
  }
  
  console.log(`\n📊 Required Variables: ${presentVars.length}/${requiredVars.length} present`);
  
  if (missingVars.length > 0) {
    console.log('\n⚠️  Missing required variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
  }
}

// Show current environment variables (filtered)
if (shouldCheckFiles) {
  console.log('\n🔍 Current Environment Variables:');
  console.log('(Showing only Diagramers-related variables)\n');
  
  const diagramersVars = Object.keys(process.env)
    .filter(key => 
      key.startsWith('DIAGRAMERS_') ||
      key.startsWith('DB_') ||
      key.startsWith('DATABASE_') ||
      key.startsWith('JWT_') ||
      key.startsWith('AUTH_') ||
      key.startsWith('EMAIL_') ||
      key.startsWith('LOG_') ||
      key.startsWith('CORS_') ||
      key.startsWith('RATE_LIMIT_') ||
      key === 'PORT' ||
      key === 'HOST' ||
      key === 'NODE_ENV'
    )
    .sort();
  
  if (diagramersVars.length === 0) {
    console.log('No Diagramers-related environment variables found.');
  } else {
    diagramersVars.forEach(varName => {
      const value = process.env[varName];
      const displayValue = varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('KEY')
        ? value ? '***HIDDEN***' : 'not set'
        : value || 'not set';
      console.log(`${varName}=${displayValue}`);
    });
  }
}

// Recommendations
console.log('\n💡 Recommendations:');
console.log('1. Always create a .env.example file as a template');
console.log('2. Use .env for local development settings');
console.log(`3. Use .env.${environment} for environment-specific settings`);
console.log('4. Use .env.local for local overrides (add to .gitignore)');
console.log('5. Never commit sensitive values to version control');

console.log('\n📖 For more information, see the developer guide:');
console.log('   - diagramers-api/DEVELOPER_GUIDE.md');
console.log('   - diagramers-api/README.md');

console.log('\n✨ Environment debug complete!\n'); 