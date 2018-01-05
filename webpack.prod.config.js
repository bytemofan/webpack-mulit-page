var path = require('path');
var webpack = require('webpack');
var glob = require('glob');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var ImageminPlugin = require('imagemin-webpack-plugin').default;

var rootPath = path.join(__dirname, '.');
var srcPath = path.join(rootPath, 'src');
var distPath = path.join(rootPath, 'dist');
var node_modules = path.resolve(rootPath, 'node_modules');

var extractCss = new ExtractTextPlugin({
    filename: "css/[name].css",
    allChunks: true,
    disable: false
});

var webpackConfig =  {
    devtool:'source-map',
    entry: {},
    output: {
        path: distPath,
        filename: 'js/[name].min.js',
        publicPath: '/',
        sourceMapFilename: 'sourcemap/[name].map'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader', // es6转译
                include: [srcPath]
            },
            {
                test: /\.css$/,
                use: extractCss.extract({ // 提取css文件
                    fallback: 'style-loader',
                    use: [{
                        loader: 'css-loader',
                        options: {
                            modules: false, // 开启css-modules
                            minimize: false,
                            sourceMap: true, // Sourcemaps
                            camelCase: false // 用CamelCase方式导出类名
                        },
                    }, {
                        loader: 'postcss-loader',
                        options: {
                            plugins: function () {
                                return [
                                    require('autoprefixer') // 自动前缀
                                ];
                            }
                        }
                    }],
                    // publicPath: '../'
                })
            },
            {
                test: /\.less$/,
                use: extractCss.extract({ // 提取less文件
                    fallback: 'style-loader',
                    use: [{
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            modules: false, // 开启css-modules
                            minimize: false,
                            url: false,
                            sourceMap: true, // Sourcemaps
                            camelCase: false // 用CamelCase方式导出类名
                        }
                    }, {
                        loader: 'postcss-loader',
                        options: {
                            plugins: function() {
                                return [
                                    require('autoprefixer') // 自动前缀
                                ];
                            }
                        }
                    }, {
                        loader: 'less-loader',
                        options: {
                            sourceMap: true // Sourcemaps
                        }
                    }],
                    // publicPath: '../'
                    // publicPath: process.env.NODE_ENV === 'prod' ? baseOnlinePath : '/'
                })
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'imgs/[name].[ext]',
                            limit: 8000
                        }
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            name: 'imgs/[name].[ext]',
                            limit: 100000
                        }
                    }
                ]
            },
            {
                test: /\.(htm|html)$/i,
                loader: 'html-withimg-loader?min=false'
            }
        ],
    },
    plugins: [
        extractCss,
        new ImageminPlugin({ test: /\.(jpe?g|png|gif|svg)$/i }),
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.CommonsChunkPlugin({
            names: ['vendors'],
            filename: 'js/[name].min.js',
            minChunks: Infinity
        }),
        new webpack.optimize.UglifyJsPlugin({
            beautify: false,
            mangle: {
                screw_ie8: true,
                keep_fnames: true
            },
            compress: {
                screw_ie8: true
            },
            comments: false,
            sourceMap: true
        })
    ],
    resolve: {
        modules: [srcPath, "node_modules"],
        extensions: ['.js', '.html', '.less', '.css']
    }
};

// 获取指定路径下的入口文件
function getEntries(globPath) {
    var files = glob.sync(globPath),
        entries = {};

    files.forEach(function(filepath) {
        // 取倒数第二层(view下面的文件夹)做包名
        if(filepath.match(/\.js$/)){
            var split = filepath.split('/');
            var fileName = split[split.length - 1];
            var name = fileName.substring(0, fileName.length - 3);
            entries[name] = './' + filepath;
        }
    });

    return entries;
}

var entries = getEntries('src/view/**');

Object.keys(entries).forEach(function(name) {
    // 每个页面生成一个entry，如果需要HotUpdate，在这里修改entry
    webpackConfig.entry[name] = entries[name];

    // 每个页面生成一个html
    var plugin = new HtmlWebpackPlugin({
        // 生成出来的html文件名
        filename: name + '.html',
        // 每个html的模版，这里多个页面使用同一个模版
        template: './src/template/'+ name +'.html',
        // 自动将引用插入html
        inject: true,
        // 每个html引用的js模块，也可以在这里加上vendor等公用模块
        chunks: ['vendors', name]
    });
    webpackConfig.plugins.push(plugin);
});

webpackConfig.entry['vendors'] = ['jquery', 'bootstrap'];

module.exports = webpackConfig;