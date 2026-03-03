"use strict";

const path = require('path');
const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: './src/main.ts',
  target: 'node',
  mode: process.env.NODE_ENV || 'development',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'main.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    // Exclude nodemailer from bundling to use the installed version
    'nodemailer': 'commonjs nodemailer'
  },
  
  // Development optimizations
  ...(isDevelopment && {
    devtool: 'eval-source-map',
    watch: true,
    watchOptions: {
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: 1000,
    },
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
    },
  }),
  
  // Performance optimizations
  performance: {
    hints: isDevelopment ? false : 'warning',
  },
  
  // Optimization for development
  optimization: {
    ...(isDevelopment && {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    }),
  },
};
