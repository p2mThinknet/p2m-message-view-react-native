/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const del = require('del');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const pkg = require('../package.json');

// The source files to be compiled by Rollup
const files = [
  {
    format: 'cjs',
    ext: '.js',
    presets: ['es2015-rollup', 'react'],
    plugins: [
      'external-helpers',
      //'transform-class-properties'
      //'transform-runtime',
    ],
  },
];

let promise = Promise.resolve();

// Clean up the output directory
promise = promise.then(() => del(['build/*']));

// Compile source code into a distributable format with Babel
let external = Object.keys(pkg.dependencies);
for (const file of files) {
  for (const entry of pkg._entries) {
    promise = promise.then(() => rollup.rollup({
      entry: `src/${entry}.js`,
      external,
      plugins: [
        nodeResolve({
          browser: file.format === 'umd',
          skip: external,
        }),
        commonjs(),
        babel({
          //babelrc: false,
          exclude: 'node_modules/**',
          runtimeHelpers: false,
          //presets: file.presets,
          //plugins: file.plugins,
        }),
        ...file.minify ? [uglify()] : [],
      ],
    }).then(bundle => bundle.write({
      dest: `build/${file.output || 'main'}/${entry}${file.ext}`,
      format: file.format,
      sourceMap: !file.minify,
      exports: 'named',
      moduleName: file.moduleName,
      globals: {
        'whatwg-fetch': 'fetch'
      },
    })));
  }
}

// Copy package.json and LICENSE.txt
promise = promise.then(() => {
  delete pkg.private;
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.eslintConfig;
  delete pkg.babel;
  Object.keys(pkg)
      .filter(n=>n.match(/^_.*$/))
      .map(n=>{delete pkg[n]});
  fs.writeFileSync('build/package.json', JSON.stringify(pkg, null, '  '), 'utf-8');
});

promise.catch(err => console.error(err.stack)); // eslint-disable-line no-console