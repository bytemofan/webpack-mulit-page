var path = require('path');
var webpack = require('webpack');
var glob = require('glob');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var ImageminPlugin = require('imagemin-webpack-plugin').default;

var rootPath = path.join(__dirname, '.');
var srcPath = path.join(rootPath, 'src');
var node_modules = path.resolve(rootPath, 'node_modules');

var extractCss = new ExtractTextPlugin({
    filename: "css/[name].css",
    allChunks: true,
    disable: false
});

var webpackConfig = {
    devtool: 'eval-source-map',
    entry: [],
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
                        }
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
                    publicPath: '../'
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
                    publicPath: '../'
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
                            limit: 100000
                        }
                    }
                ]
            },
            {
                test: /\.(htm|html)$/i,
                use: [
                    'html-withimg-loader?min=false'
                ]
            }
        ],
    },
    devServer: {
        host: '0.0.0.0',
        port: 8080,
        historyApiFallback: true,
        hot: true,
        stats: {
            colors: true
        },
        disableHostCheck: true,
        inline: true,
        contentBase: path.join(rootPath, 'dist'),
        publicPath: '/',
        clientLogLevel: 'none', // 日志
        proxy: [
            {
                context: ['/test/**'],
                target: 'localhost',
                changeOrigin: true,
                secure: false,
                pathRewrite: {
                    '^/test' : ''
                }
            },
        ]
    },
    plugins: [
        extractCss,
        new ImageminPlugin({ test: /\.(jpe?g|png|gif|svg)$/i }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            Popper: ['popper.js', 'default'],
            // In case you imported plugins individually, you must also require them here:
            Util: "exports-loader?Util!bootstrap/js/dist/util",
            Dropdown: "exports-loader?Dropdown!bootstrap/js/dist/dropdown",
        }),
        new webpack.HotModuleReplacementPlugin(), // HMR全局启用
        new webpack.NamedModulesPlugin(), // 在HMR更新的浏览器控制台中打印更易读的模块名称
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('dev')
            }
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

webpackConfig.entry.push('webpack-dev-server/client?http://0.0.0.0:8090');
webpackConfig.entry.push('webpack/hot/only-dev-server');

Object.keys(entries).forEach(function(name) {
    // 每个页面生成一个entry，如果需要HotUpdate，在这里修改entry
    webpackConfig.entry.push(entries[name]);

    // 每个页面生成一个html
    var plugin = new HtmlWebpackPlugin({
        // 生成出来的html文件名
        filename: name + '.html',
        // 每个html的模版，这里多个页面使用同一个模版
        template: './src/template/'+ name +'.html',
        // 自动将引用插入html
        inject: true
    });
    webpackConfig.plugins.push(plugin);
});

module.exports = webpackConfig;