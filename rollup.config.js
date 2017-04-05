/**
 * Created by colinhan on 23/03/2017.
 */
var fs = require('fs');
var babel = require('rollup-plugin-babel');
var commonjs = require('rollup-plugin-commonjs');
var nodeResolve = require('rollup-plugin-node-resolve');
var pkg = require('./package.json');

let external = Object.keys(pkg.dependencies);
if (pkg.peerDependencies) {
  external = external.concat(Object.keys(pkg.peerDependencies));
}
var config = {
  entry: 'src/message-view-react-native.js',
  dest: 'build/main/message-view-react-native.js',
  format: 'cjs',
  external: [...external, 'react-native-vector-icons/Ionicons'],
  plugins: [
    babel({
      exclude: 'node_modules/**',
      runtimeHelpers: false,
    }),
    nodeResolve({
      main: true,
      skip: external
    }),
    commonjs()
  ],
  exports: 'named',
};

delete pkg.private;
delete pkg.devDependencies;
delete pkg.scripts;
delete pkg.eslintConfig;
delete pkg.babel;
Object.keys(pkg)
    .filter(n=>n.match(/^_.*$/))
    .map(n=>{delete pkg[n]});
if (!fs.existsSync('build')) {
  fs.mkdirSync('build');
}
fs.writeFileSync('build/package.json', JSON.stringify(pkg, null, '  '), 'utf-8');

module.exports = config;