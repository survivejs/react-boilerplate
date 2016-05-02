const path = require('path');
const merge = require('webpack-merge');
const validate = require('webpack-validator');

const parts = require('./lib/parts');

const ENABLE_POLLING = process.env.ENABLE_POLLING;
const PATHS = {
  app: path.join(__dirname, 'app'),
  style: [
    path.join(__dirname, 'app', 'main.css')
  ],
  build: path.join(__dirname, 'build'),
  test: path.join(__dirname, 'tests')
};

const common = merge({
    // Entry accepts a path or an object of entries.
    // We'll be using the latter form given it's
    // convenient with more complex configurations.
    entry: {
      style: PATHS.style,
      app: PATHS.app
    },
    output: {
      path: PATHS.build,
      filename: '[name].js'
    },
    resolve: {
      extensions: ['', '.js', '.jsx']
    }
  },
  parts.indexTemplate({
    title: 'Kanban demo',
    appMountId: 'app'
  }),
  parts.loadJSX(PATHS.app),
  parts.lintJSX(PATHS.app)
);

var config;

// Detect how npm is run and branch based on that
switch(process.env.npm_lifecycle_event) {
  case 'build':
  case 'stats':
    config = merge(
      common,
      {
        devtool: 'source-map',
        output: {
          path: PATHS.build,
          filename: '[name].[chunkhash].js',
          chunkFilename: '[chunkhash].js'
        }
      },
      parts.clean(PATHS.build),
      parts.setFreeVariable(
        'process.env.NODE_ENV',
        'production'
      ),
      parts.extractBundle({
        name: 'vendor',
        entries: ['react', 'react-dom']
      }),
      parts.minify(),
      parts.extractCSS(PATHS.style)
    );
    break;
  case 'test':
  case 'test:tdd':
    config = merge(
      common,
      {
        devtool: 'inline-source-map'
      },
      parts.loadIsparta(PATHS.app),
      parts.loadJSX(PATHS.test)
    );
    break;
  default:
    config = merge(
      common,
      {
        devtool: 'eval-source-map'
      },
      parts.setupCSS(PATHS.style),
      parts.devServer({
        // Customize host/port here if needed
        host: process.env.HOST,
        port: process.env.PORT,
        poll: ENABLE_POLLING
      }),
      parts.npmInstall({
        save: true
      })
    );
}

module.exports = validate(config);
