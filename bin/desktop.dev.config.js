const path                    = require('path');
const FlowCheckWebpackPlugin  = require('flow-check-webpack-plugin');
const ProgressBarPlugin       = require('progress-bar-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const HtmlWebpackPlugin       = require('html-webpack-plugin');
const FaviconsWebpackPlugin   = require('favicons-webpack-plugin');
const webpack                 = require('webpack');
const fs                      = require('fs');
const buildConfig             = JSON.parse(fs.readFileSync('../build.json', 'utf8'));
const scopedConfig            = buildConfig['dev'];
const appConfig               = JSON.parse(fs.readFileSync('../app.json', 'utf8'));

const webpackDefinedConstants = {
  'process.env': {
    NODE_ENV: JSON.stringify('development'),
    PLATFORM_ENV: JSON.stringify('desktop')
  }
};

if(scopedConfig.define) {
  Object.keys(scopedConfig.define).forEach(function(key){
    webpackDefinedConstants[key] = JSON.stringify(scopedConfig.define[key]);
  });
}

let webpackPlugins = [];
let webpackLoaders = [];

/*if(process.env.REACT_BUILD_DEV_LINT != 'disabled' && false) {
  console.log('[Webpack] Linting is enabled.');
  webpackLoaders.push(
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'eslint-loader'
    }
  );
}*/

if(process.env.REACT_BUILD_DEV_CACHE == 'enabled') {
  console.log('[Webpack] Hard cache is enabled.');
  webpackPlugins.push(
    new HardSourceWebpackPlugin({
      cacheDirectory: path.join('../../build-cache', 'desktop-dev', '[confighash]'),
      recordsPath: path.join('../../build-cache', 'desktop-dev', '[confighash]', 'records.json'),
      
      configHash: function(webpackConfig) {
        return `webpack-desktop-dev`;
      },
      
      environmentHash: {
        root: '../..',
        directories: ['node_modules'],
        files: [
          'package.json'
        ],
      },
    })
  );
};


const options = {
  devtool: 'cheap-module-eval-source-map',
  target: 'electron-renderer',
  entry: [
    'babel-polyfill',
    path.join(__dirname, '../src/desktop/index'),
  ],
  output: {
    path: path.join(__dirname, '../src/desktop'),
    filename: 'desktop-bundle.js',
    publicPath: './',
  },
  module: {
    loaders: ([
      {
        test: /\.scss$/,
        loader:
          'style-loader!css-loader!autoprefixer-loader?browsers=last 2 version!sass-loader',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        include: /src/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react', 'stage-0'],
          plugins: [
            [
              'react-transform',
              {
                transforms: [
                  {
                    transform: 'react-transform-hmr',
                    imports: ['react'],
                    locals: ['module'],
                  },
                ],
              },
            ],
          ],
        },
      }
    ]).concat(webpackLoaders),
  },
  plugins: webpackPlugins.concat([
    new ProgressBarPlugin(),
    new HtmlWebpackPlugin({
      title: appConfig.expo.name
    }),
    //new FlowCheckWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env': webpackDefinedConstants,
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ]),
};

module.exports = options;
