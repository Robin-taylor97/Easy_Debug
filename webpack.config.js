const path = require('path');
const webpack = require('webpack');

module.exports = {
    target: 'electron-renderer',
    entry: {
        app: './renderer/scripts/app.js',
        'performance-utils': './renderer/scripts/performance-utils.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist/renderer'),
        filename: '[name].bundle.js',
        clean: true
    },
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['@babel/plugin-transform-runtime']
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            minimize: process.env.NODE_ENV === 'production'
                        }
                    }
                ]
            }
        ]
    },
    optimization: {
        minimize: process.env.NODE_ENV === 'production',
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor',
                    chunks: 'all'
                }
            }
        },
        usedExports: true,
        sideEffects: false
    },
    resolve: {
        extensions: ['.js', '.json'],
        alias: {
            '@': path.resolve(__dirname, 'renderer'),
            '@terminal': path.resolve(__dirname, 'terminal')
        }
    },
    externals: {
        'electron': 'require("electron")',
        'fs': 'require("fs")',
        'path': 'require("path")',
        'os': 'require("os")',
        'child_process': 'require("child_process")'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        }),
        ...(process.env.NODE_ENV === 'production' ? [
            new webpack.optimize.ModuleConcatenationPlugin()
        ] : [])
    ],
    stats: {
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false
    }
};