const path                    = require('path');
const FlowCheckWebpackPlugin  = require('flow-check-webpack-plugin');
const ProgressBarPlugin       = require('progress-bar-webpack-plugin');
const HtmlWebpackPlugin       = require('html-webpack-plugin');
const FaviconsWebpackPlugin   = require('favicons-webpack-plugin');
const webpack                 = require('webpack');
const fs                      = require('fs');
const buildConfig             = JSON.parse(fs.readFileSync('../build.json', 'utf8'));
const scopedConfig            = buildConfig['release'];
const appConfig               = JSON.parse(fs.readFileSync('../app.json', 'utf8'));


const webpackDefinedConstants = {
  'process.env': {
    NODE_ENV: JSON.stringify('production'),
    PLATFORM_ENV: JSON.stringify('web')
  }
};

if(scopedConfig.define) {
  Object.keys(scopedConfig.define).forEach(function(key){
    webpackDefinedConstants[key] = JSON.stringify(scopedConfig.define[key]);
  });
}

let webpackLoaders = [];

if(process.env.REACT_BUILD_PROD_LINT != 'disabled') {
  console.log('[Webpack] Linting is enabled.');
  webpackLoaders.push(
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'eslint-loader'
    }
  );
}

module.exports = {
  entry: [path.join(__dirname, '../src/web/index')],
  output: {
    path: path.join(__dirname, '../build/'),
    filename: 'bundle.js',
    publicPath: '/',
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
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react', 'stage-0'],
        },
      }
    ]).concat(webpackLoaders),
  },
  plugins: [
    new ProgressBarPlugin(),
    new HtmlWebpackPlugin({
      title: appConfig.expo.name
    }),
    new FaviconsWebpackPlugin({
      logo: path.join('..', appConfig.expo.icon)
    }),
    new webpack.DefinePlugin({
      'process.env': webpackDefinedConstants,
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    }),
  ],
};
