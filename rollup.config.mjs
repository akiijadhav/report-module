import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      include: ['src/**/*', 'public/**/*'],
      exclude: 'node_modules/**',
    }),
    postcss({ extract: 'styles.min.css', minimize: true }),
    terser(),
    // TypeScript declaration file (.d.ts) configuration
    {
      input: 'src/index.ts',
      output: {
        file: 'dist/index.d.ts',
        format: 'es',
      },
      plugins: [dts()],
    },
  ],
  external: ['react', 'react-dom'],
};
