const path = require('path');
const HTMLPlugin = require('html-webpack-plugin');
const WorkerPlugin = require('worker-plugin');

var config = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          //   options: {
          //     transpileOnly: true,
          //   },
        },
      },
      {
        test: /\.s?css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json', '.mjs', '.wasm'],
  },
  plugins: [
    new HTMLPlugin({
      template: path.join(__dirname, 'src/index.html'),
    }),
    new WorkerPlugin(),
  ],
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.mode = 'development'
    config.devtool = 'source-map';
  }

  if (argv.mode === 'production') {
    config.mode = 'production'
  }

  return config;
};