const pathTo = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');
const cssnext = require('postcss-cssnext');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const entry = {};
const hasPluginInstalled = fs.existsSync('./web/plugin.js');
var isWin = /^win/.test(process.platform);


// 多页面配置
const webEntries = {};
const chunks = [];
const htmlWebpackPluginArray = [];
glob.sync('./src/views/**/app.js').forEach(path => {
  const chunk = path.split('./src/views/')[1].split('/app.js')[0];
  webEntries[chunk] = path;
  chunks.push(chunk);

  const filename = chunk + '.html';
  const htmlConf = {
    filename: filename,
    template: path.replace(/.js/g, '.html'),
    inject: 'body',
    hash: true,
    isDevServer: true,
    chunksSortMode: 'dependency',
    chunks: ['commons', chunk]
  }
  htmlWebpackPluginArray.push(new HtmlWebpackPlugin(htmlConf));
});

console.log(htmlWebpackPluginArray);

console.log(webEntries);


function getEntryFileContent(entryPath, vueFilePath) {
  let relativePath = pathTo.relative(pathTo.join(entryPath, '../'), vueFilePath);
  let contents = '';
  if (hasPluginInstalled) {
    const plugindir = pathTo.resolve('./web/plugin.js');
    contents = 'require(\'' + plugindir + '\') \n';
  }
  if (isWin) {
    relativePath = relativePath.replace(/\\/g, '\\\\');
  }
  contents += 'var App = require(\'' + relativePath + '\')\n';
  contents += 'App.el = \'#root\'\n';
  contents += 'new Vue(App)\n';
  return contents;
}

var fileType = '';

function walk(dir) {
  dir = dir || '.';
  const directory = pathTo.join(__dirname, './src', dir);
  const entryDirectory = pathTo.join(__dirname, './src/entry');
  fs.readdirSync(directory)
    .forEach((file) => {
      const fullpath = pathTo.join(directory, file);
      const stat = fs.statSync(fullpath);
      const extname = pathTo.extname(fullpath);
      if (stat.isFile() && extname === '.vue') {
        if (!fileType) {
          fileType = extname;
        }
        if (fileType && extname !== fileType) {
          console.log('Error: This is not a good practice when you use ".we" and ".vue" togither!');
        }
        const name = pathTo.join(dir, pathTo.basename(file, extname));
        if (extname === '.vue') {
          const entryFile = pathTo.join(entryDirectory, dir, pathTo.basename(file, extname) + '.js');
          fs.outputFileSync(pathTo.join(entryFile), getEntryFileContent(entryFile, fullpath));

          // entry[name] = pathTo.join(__dirname, entryFile) + '?entry=true';
          entry[name] = entryFile + '?entry=true';
        }
        // weexEntry[name] = fullpath + '?entry=true';
      } else if (stat.isDirectory() && file !== 'build' && file !== 'include') {
        const subdir = pathTo.join(dir, file);
        walk(subdir);
      }
    });
}

walk();
// web need vue-loader
const plugins = [
  new webpack.optimize.UglifyJsPlugin({
    minimize: true
  }),
  new webpack.BannerPlugin({
    banner: '// { "framework": ' + (fileType === '.vue' ? '"Vue"' : '"Weex"') + '} \n',
    raw: true
    // exclude: 'Vue'
  }),
  new webpack.LoaderOptionsPlugin({
    vue: {
      // postcss: [cssnext({
      //   features: {
      //     autoprefixer: false
      //   }
      // })]
    }
  }, ...htmlWebpackPluginArray)
];

function getBaseConfig() {
  return {
    entry: webEntries,
    output: {
      path: 'dist'
    },
    resolve: {
      extensions: ['.js', '.vue'],
      alias: {
        'asserts': pathTo.resolve(__dirname, './src/asserts'),
        'components': pathTo.resolve(__dirname, './src/components/'),
        'constants': pathTo.resolve(__dirname, './src/constants/'),
        'api': pathTo.resolve(__dirname, './src/api/'),
        'router': pathTo.resolve(__dirname, './src/router/'),
        'store': pathTo.resolve(__dirname, './src/store/'),
        'views': pathTo.resolve(__dirname, './src/views/'),
        'mixins': pathTo.resolve(__dirname, './src/mixins'),
        'config': pathTo.resolve(__dirname, './config'),
        'utils': pathTo.resolve(__dirname, './src/utils/')
      }
    },
    module: {
      rules: [{
        test: /\.js$/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['es2015']
          }
        }],
        exclude: /node_modules/
      }, {
        test: /\.vue(\?[^?]+)?$/,
        loaders: [{
          loader: 'vue-loader'
        }]
      }],
    },
    plugins: plugins
  };
}


const webConfig = getBaseConfig();
// webConfig.entry = {
//   entry: [pathTo.resolve('./src/entry.js')]
// };
webConfig.output = {
  path: pathTo.join(__dirname, '../dist/web'),
  // filename: '[name].js'
  filename: 'asserts/js/[name].js',
  publicPath: '/'
};
// webConfig.module.rules[1].loaders.push('vue-loader');

// const webConfig = {
//   context: pathTo.join(__dirname, ''),
//   entry: pathTo.resolve('./src/entry.js'),
//   output: {
//     path: pathTo.join(__dirname, 'dist'),
//     filename: '[name].web.js',
//   },
//   module: {
//     // webpack 2.0 
//     rules: [{
//         test: /\.js$/,
//         use: [{
//           loader: 'babel-loader'
//         }],
//         exclude: /node_modules/
//       },
//       {
//         test: /\.vue(\?[^?]+)?$/,
//         use: [{
//           loader: 'vue-loader'
//         }]
//       }
//     ]
//   },
//   plugins: plugins
// };
const weexConfig = {
  entry: entry,
  output: {
    path: pathTo.join(__dirname, './dist'),
    filename: 'weex/[name].js',
  },
  module: {
    rules: [{
        test: /\.js$/,
        use: [{
          loader: 'babel-loader',
        }],
        exclude: /node_modules/
      },
      {
        test: /\.vue(\?[^?]+)?$/,
        use: [{
          loader: 'weex-loader'
        }]
      },
      {
        test: /\.we(\?[^?]+)?$/,
        use: [{
          loader: 'weex-loader'
        }]
      }
    ]
  },
  plugins: plugins
};

var exports = [webConfig, weexConfig];
module.exports = exports;