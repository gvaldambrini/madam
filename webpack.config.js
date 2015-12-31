var webpack = require('webpack');

module.exports = {
    context: __dirname + "/views",
    entry: {
        app: ["./javascripts/confirm-popover.js", "./jsx/main.jsx"],
        vendor: ['react', 'react-dom', 'react-router', 'moment', 'js-cookie']
    },
    output: {
        path: __dirname + "/public",
        publicPath: "/public/",
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
            }
        ]
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.js')
    ],
    externals: {
    }
};