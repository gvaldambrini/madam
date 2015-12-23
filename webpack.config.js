var webpack = require('webpack');

module.exports = {
    context: __dirname + "/views",
    entry: {
        app: ["./jsx/main.jsx"],
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
    ],
    externals: {
        'react': 'React'
    },
};