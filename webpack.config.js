var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    context: __dirname + "/views",
    entry: {
        app: ["./jsx/main.jsx"],
        vendor: ['bootstrap', 'jquery', 'react', 'react-dom', 'react-router', 'moment', 'js-cookie']
    },
    output: {
        path: __dirname + "/public",
        publicPath: '/public/',
        filename: "bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.jsx$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                query: {
                    presets: ['react', 'es2015']
                }
            },
            // To properly load fonts we need to put the styles in a separate file, as reported
            // here: http://goo.gl/gbueKt
            {test: /\.scss$/, loader: ExtractTextPlugin.extract("style", 'css!sass')},
            {test: /\.css$/, loader: ExtractTextPlugin.extract('css')},

            // required for bootstrap icons
            { test: /\.(woff|woff2)$/,       loader: "url-loader" },
            { test: /\.(png|ttf|eot|svg)$/,  loader: "url-loader" },
        ]
    },
    resolve: {
        root: [
            path.resolve('.'),
            path.resolve('./node_modules'),
            path.resolve('./vendor')
        ],
        extensions: ['', '.js', '.jsx', 'css']
    },
    plugins: [
        new ExtractTextPlugin("styles.css"),
        new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.js'),
        new webpack.ProvidePlugin({
            // Automatically detect jQuery and $ as free var in modules
            // and inject the jquery library
            // This is required by many jquery plugins
            jQuery: "jquery",
            $: "jquery"
        })
    ],
    externals: {
    }
};