import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import nodeBuiltins from 'rollup-plugin-node-builtins';

export default {
  input: 'public/js/index.js',
  output: {
    file: 'public/js//bundle.min.js',
    format: 'esm',
    name: 'MyBundle',
    plugins: [terser()], // Minify output
  },
  plugins: [
    nodeResolve({
      browser: true, // Ensure it's resolving browser-compatible versions
      preferBuiltins: false,
    }),
    commonjs(),
    json(),
    nodeBuiltins(),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env'], // Transpile for older browsers
    }),
  ],
};
