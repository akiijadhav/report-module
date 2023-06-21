import resolve from '@rollup/plugin-node-resolve'; // Resolves external dependencies
import commonjs from '@rollup/plugin-commonjs'; // Converts CommonJS modules to ES modules
import typescript from 'rollup-plugin-typescript2'; // Transpiles TypeScript code
import babel from '@rollup/plugin-babel'; // Transpiles JavaScript code
import postcss from 'rollup-plugin-postcss'; // Processes CSS files
import { terser } from 'rollup-plugin-terser'; // Minifies the bundled code
import dts from 'rollup-plugin-dts'; // Generates TypeScript declaration files
import copy from 'rollup-plugin-copy'; // Copies files during the build process

export default {
  input: 'src/index.ts', // Entry point of your source code
  output: [
    {
      file: 'dist/index.js', // Output file for CommonJS module format
      format: 'cjs', // CommonJS module format
      exports: 'named', // Named exports
      sourcemap: true, // Generates sourcemap for debugging
    },
    {
      file: 'dist/index.esm.js', // Output file for ES module format
      format: 'esm', // ES module format
      sourcemap: true, // Generates sourcemap for debugging
    },
  ],
  plugins: [
    resolve(), // Resolves external dependencies
    commonjs(), // Converts CommonJS modules to ES modules
    typescript({
      tsconfig: 'tsconfig.json', // TypeScript configuration file
    }),
    babel({
      babelHelpers: 'runtime', // Uses Babel runtime helpers
      extensions: ['.js', '.jsx', '.ts', '.tsx'], // File extensions to transpile
      include: ['pages/**/*', 'components/**/*'], // Paths to include for transpilation
      exclude: ['node_modules/**', 'public/**/*'], // Paths to exclude from transpilation
    }),
    postcss({ extract: 'styles.min.css', minimize: true }), // Processes CSS files
    terser(), // Minifies the bundled code
    copy({
      targets: [
        { src: 'public/*', dest: 'dist' }, // Copies files from the public folder to dist
      ],
      verbose: false, // Set to true to see detailed logs
    }),
    {
      input: 'src/index.ts', // Entry point for generating TypeScript declaration file
      output: {
        file: 'dist/index.d.ts', // Output file for TypeScript declaration
        format: 'es', // ES module format
      },
      plugins: [dts()], // Generates TypeScript declaration files
    },
  ],
  external: ['react', 'react-dom'], // Exclude React and React DOM from bundling
};
