import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import image from '@rollup/plugin-image';
import copy from 'rollup-plugin-copy';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    json(),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
    babel({
      babelHelpers: 'bundled', 
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      include: ['src/**/*', 'components/**/*', 'pages/**/*']
    }),
    image(),
    postcss({
      extract: true,
    }),
    copy({
      targets: [
        { src: 'public/*', dest: 'dist' },
        { src: 'styles/globals.css', dest: 'dist/styles' },
      ]
    })
  ],
  external: ['react', 'react-dom'],
};
