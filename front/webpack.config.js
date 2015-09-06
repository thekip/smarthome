var webpack = require("webpack");
var path = require('path');
var _ = require('lodash');
var nodeModulesDir = path.resolve(__dirname, 'node_modules');
var IndexHtmlPlugin = require('indexhtml-webpack-plugin');

function getNPMPackageIds() {
    // read package.json and get dependencies' package ids
    var packageManifest = require(path.resolve('./package.json'));
    return _.keys(packageManifest.dependencies) || [];
}

module.exports = {
    entry: {
        //'index.html': './index.html',
        app: "./src/js/index",
        vendors: getNPMPackageIds()
    },
    output: {
        path: "./public/js",
        publicPath: "/js/",
        filename: "app.js",
    },
    devtool: "sourcemap",
    plugins: [
        new webpack.optimize.CommonsChunkPlugin('vendors', 'vendors.js'),
        new webpack.ProvidePlugin({
            $: "jquery",
            _: "lodash"

        }),
        //new IndexHtmlPlugin('index.html', 'index.html')
    ],
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: [nodeModulesDir],
                loader: "babel-loader"
            },

            {
                test: /\.html$/,
                loader: "ng-cache?prefix=[dir]/[dir]"
            }
        ]
    },
    devServer: {
        contentBase: "public",
        proxy: [{
            path: /\/foo(.*)/,
            target: "http://localhost:3000"
        }]

        //historyApiFallback: {
        //    index: 'index.html',
        //    rewrites: [
        //        { from: '/foo/socket.io.js', to: '/foo/socket.io.js'}
        //    ]
        //}
    }
};