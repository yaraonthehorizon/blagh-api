'use strict'

const path = require('path')
const nodeExternals = require('webpack-node-externals')
const isDevelopment = process.env.NODE_ENV !== 'production'

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
    externals: [nodeExternals(), { nodemailer: 'commonjs nodemailer' }],
    ...(isDevelopment && {
        devtool: 'eval-source-map',
        stats: {
            colors: true,
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false,
        },
    }),
    performance: {
        hints: isDevelopment ? false : 'warning',
    },
    optimization: {
        ...(isDevelopment && {
            removeAvailableModules: false,
            removeEmptyChunks: false,
            splitChunks: false,
        }),
    },
}
