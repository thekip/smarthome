/**
 * Created by mask0 on 02.09.2015.
 */
var gulp = require("gulp");
var gutil = require("gulp-util");
var webpack = require("webpack");
var WebpackDevServer = require("webpack-dev-server");
var path = require('path');
var _ = require('lodash');
var node_modules_dir = path.resolve(__dirname, 'node_modules');

function getNPMPackageIds() {
    // read package.json and get dependencies' package ids
    var packageManifest = require(path.resolve('./package.json'));
    return _.keys(packageManifest.dependencies) || [];
}

console.log(getNPMPackageIds());

var webpackConf = {
    entry: {
        app: "./src/js/app",
        vendors: getNPMPackageIds()
    },
    output: {
        path: "./public/js",
        filename: "app.js",
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin('vendors', 'vendors.js'),
        new webpack.ProvidePlugin({
            $: "jquery",
           _: "lodash"

        })
    ]
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: [node_modules_dir],
                loader: "babel-loader"
            }
        ]
    }
};

gulp.task("webpack", function(callback) {
    // run webpack
    webpack(webpackConf, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack", err);
        gutil.log("[webpack]", stats.toString({
            // output options
        }));
        callback();
    });
});