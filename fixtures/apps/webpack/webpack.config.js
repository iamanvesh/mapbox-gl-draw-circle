import HtmlWebpackPlugin from 'html-webpack-plugin';

// webpack 5 without Node polyfills: 1.1.x failed here with "Can't resolve 'fs'/'path'" (#40, #52).
export default {
  mode: 'production',
  entry: './src/index.js',
  output: { clean: true },
  module: {
    rules: [{ test: /\.css$/, use: ['style-loader', 'css-loader'] }],
  },
  plugins: [
    new HtmlWebpackPlugin({ templateContent: '<!doctype html><html><body><div id="map" style="position:absolute;inset:0"></div></body></html>' }),
    {
      // Any warning (e.g. a missing export or a Node built-in) fails the fixture.
      apply(compiler) {
        compiler.hooks.done.tap('fail-on-warnings', (stats) => {
          if (stats.hasWarnings()) {
            console.error(stats.toString('errors-warnings'));
            process.exitCode = 1;
          }
        });
      },
    },
  ],
  performance: false, // mapbox-gl alone is larger than webpack's default size hints
};
