import pkg from './package.json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';

function bundle(filename, options = {}) {
  return {
    input: 'index.js',
    output: {
      file: filename,
      format: 'umd',
      name: 'MapboxDrawCircle',
      sourcemap: true,
      globals: {
        '@mapbox/mapbox-gl-draw': 'MapboxDraw',
      },
    },
    external: [
      ...Object.keys(pkg.peerDependencies),
      'fs',
      'path'
    ],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      options.minimize ? terser() : false,
      options.stats ? visualizer({
        filename: filename + '.stats.html',
      }) : false,
    ],
  };
}

export default [
  bundle(pkg.browser.replace('.min', ''), { stats: true }),
  bundle(pkg.browser, { minimize: true }),
];
