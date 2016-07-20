/* jshint node:true */

import _ from 'underscore';
import del from 'del';
import { exec } from 'child_process';
import streamqueue from 'streamqueue';
import jshintStylish from 'jshint-stylish';
import enyoWalker from './enyo-deploy-walker';

import gulp from 'gulp';
import livereload from 'gulp-livereload';
import rename from 'gulp-rename';
import runSequence from 'run-sequence';
import sass from 'gulp-sass';
import msbuild from 'gulp-msbuild';
import jshint from 'gulp-jshint';
import cached from 'gulp-cached';
import autoprefixer from 'gulp-autoprefixer';
import jscs from 'gulp-jscs';
import babel from 'gulp-babel';
import sourcemaps from 'gulp-sourcemaps';
import concat from 'gulp-concat';
import rework from 'gulp-rework';
import urlPlugin from 'rework-plugin-url';
import rebaseCssUrls from 'gulp-css-rebase-urls';
import uglify from 'gulp-uglify';
import csso from 'gulp-csso';

const BASE_BOOTPLATE_PATH = './k2e/bootplate';
const BASE_SOURCE_PATH = './k2e/bootplate/source';
const BASE_DEPLOY_PATH = './k2e/bootplate/deploy';
const BOWER_COMPONENTS = 'lib';
const AUTOPREFIXER_OPTIONS = {
  // Taken directly from bootstrap's grunt file
  browsers: [
    'Android 2.3',
    'Android >= 4',
    'Chrome >= 20',
    'Firefox >= 24', // Firefox 24 is the latest ESR
    'Explorer >= 8',
    'iOS >= 6',
    'Opera >= 12',
    'Safari >= 6'
  ]
};

// get dependencies once for any arguments

let getEnyoDeps = _.memoize(() => {
  let boot = enyoWalker.getDependencies(`${BASE_BOOTPLATE_PATH}/lib/enyo/source/boot`);
  let source = enyoWalker.getDependencies(`${BASE_BOOTPLATE_PATH}/lib/enyo/source`);

  return enyoWalker.mergeDependencyCollections(boot, source);
}, _.noop);

let getK2eDeps = _.memoize(() => {
  return enyoWalker.getDependencies(`${BASE_BOOTPLATE_PATH}`);
}, _.noop);

// using a subset of babel's es2015 preset since enyo does not support strict mode
// (essentialy everything minus modules-commonjs)

const BABEL_PLUGINS = [
  'transform-es2015-arrow-functions',
  'transform-es2015-block-scoped-functions',
  'transform-es2015-block-scoping',
  'transform-es2015-classes',
  'transform-es2015-computed-properties',
  'transform-es2015-constants',
  'transform-es2015-destructuring',
  'transform-es2015-for-of',
  'transform-es2015-function-name',
  'transform-es2015-literals',
  // 'transform-es2015-modules-commonjs',
  'transform-es2015-object-super',
  'transform-es2015-parameters',
  'transform-es2015-shorthand-properties',
  'transform-es2015-spread',
  'transform-es2015-sticky-regex',
  'transform-es2015-template-literals',
  'transform-es2015-typeof-symbol',
  'transform-es2015-unicode-regex',
  'transform-regenerator'
];

const BABEL_IGNORE = [
  `${BASE_BOOTPLATE_PATH}/lib/**/*.js`,
  './node_modules/babel-polyfill/dist/polyfill.js'
];

/////////////////////////////////////////////////////////////

gulp.task('lint', lint);

gulp.task('compile-sass', compileSass);

gulp.task('compile-babel', compileBabel);

gulp.task('watch', ['compile-babel', 'compile-sass'], watch);

gulp.task('build-backend', buildBackend);

gulp.task('dist-bin', ['build-backend'], distBin);

gulp.task('dist-aspx', distAspx);

gulp.task('dist-config', distConfig);

gulp.task('dist-clean', (cb) => { del('dist/*', { dot: true }, cb); });

gulp.task('dist-scripts', ['compile-babel'], distScripts);

gulp.task('dist-css', ['compile-sass'], distCss);

gulp.task('dist-assets', distAssets);

gulp.task('dist', (cb) => {
  runSequence(
    ['lint', 'dist-clean'],
    ['dist-scripts', 'dist-css', 'dist-assets', 'dist-aspx', 'dist-config', 'dist-bin'],
    cb
  );
});

//////////////////////////////////////////////////////////////

function lint() {
  return gulp.src(`${BASE_SOURCE_PATH}/**/*.js`)
    .pipe(cached('linting'))
    .pipe(jshint())
    .pipe(jscs())
    .pipe(jscs.reporter())
    .pipe(jscs.reporter('fail'))
    .pipe(jshint.reporter(jshintStylish))
    .pipe(jshint.reporter('fail'));
}

function compileSass() {
  return gulp.src([
      `${BASE_SOURCE_PATH}/scss/*.scss`,
      `!${BASE_SOURCE_PATH}/scss/_*.scss`
    ])
    // removing cache until workaround for files that import partials appearing unchanged
    // when the imported partial's changed is found
    // .pipe(cached('sass'))
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer(AUTOPREFIXER_OPTIONS))
    .pipe(gulp.dest(BASE_SOURCE_PATH))
    .pipe(gulp.dest(`${BASE_BOOTPLATE_PATH}/source-compiled`))
    .pipe(livereload());
}

function compileBabel() {
  return streamqueue({ objectMode: true },
    gulp.src(`${BASE_SOURCE_PATH}/**/*.js`, { base: BASE_SOURCE_PATH })
      .pipe(cached('compileBabel-scripts'))
      .pipe(sourcemaps.init())
      .pipe(babel({ babelrc: false, plugins: BABEL_PLUGINS, ignore: BABEL_IGNORE }))
      .pipe(sourcemaps.write('.')),
    gulp.src('./node_modules/babel-polyfill/dist/polyfill.js')
      .pipe(cached('compileBabel-polyfill')),
    gulp.src(`${BASE_SOURCE_PATH}/**/*.css`, { base: BASE_SOURCE_PATH })
      .pipe(cached(('compileBabel-css')))
  )
  .pipe(gulp.dest(`${BASE_BOOTPLATE_PATH}/source-compiled`))
  .pipe(livereload());
}

function watch() {
  // relative path for watch, https://github.com/floatdrop/gulp-watch/issues/104

  let sourcePath = BASE_SOURCE_PATH.substr(2);

  livereload.listen();
  gulp.watch(`${sourcePath}/scss/*.scss`, ['compile-sass']);
  gulp.watch(`${sourcePath}/**/*.js`, ['compile-babel']);
}

function buildBackend() {
  return gulp.src('./k2e.sln')
    .pipe(msbuild({
      configuration: 'Release'
    }));
}

function distScripts() {
  return streamqueue({ objectMode: true },
    gulp.src(getK2eDeps().scripts)
      .pipe(sourcemaps.init())
      .pipe(babel({ babelrc: false, plugins: BABEL_PLUGINS, ignore: BABEL_IGNORE }))
      .pipe(concat('app.js'))
      .pipe(uglify({ mangle: true }))
      .pipe(sourcemaps.write('.')),
    gulp.src(getEnyoDeps().scripts)
      .pipe(concat('enyo.js'))
      .pipe(uglify({ mangle: true })),
    gulp.src('./node_modules/babel-polyfill/dist/polyfill.min.js')
  )
  .pipe(gulp.dest('./dist/build'));
}

function distCss() {
  return streamqueue({ objectMode: true },
    gulp.src(getK2eDeps().css)
      .pipe(rebaseCssUrls({ root: BASE_BOOTPLATE_PATH }))
      .pipe(concat('app.css'))
      // assets are a level up in dist build
      .pipe(rework(urlPlugin((url) => {
        if (isUrlOrUri(url)) { return url; }
        return /^\.\./.test(url) ?
          url : `../${url}`;
      })))
      .pipe(csso()),
    gulp.src(getEnyoDeps().css)
      .pipe(concat('enyo.css'))
      .pipe(csso()),
    gulp.src(`${BASE_SOURCE_PATH}/print.css`)
      .pipe(csso())
  )
  .pipe(gulp.dest('./dist/build'));

  /////////////////////////////////////////////////////////////

  function isUrlOrUri(url) {
    // borrowed from enyo's minifier
    // skip an external url (one that starts with <protocol>: or just //, includes data:)
    return /^([\w-]*:)|(\/\/)/.test(url);
  }
}

function distAssets() {
  return streamqueue({ objectMode: true },
    gulp.src('./k2e/assets/**/*', { base: './k2e' }),
    gulp.src(getK2eDeps().assets, { base: BASE_BOOTPLATE_PATH }),
    gulp.src(getEnyoDeps().assets, { base: `${BASE_BOOTPLATE_PATH}/lib/enyo` })
  )
  .pipe(gulp.dest('./dist'));
}

function distBin() {
  return gulp.src('./k2e/bin/release/*')
    .pipe(gulp.dest('./dist/bin'));
}

function distAspx() {
  return streamqueue({ objectMode: true },
    gulp.src('./k2e/Default-dist.aspx')
      .pipe(rename('Default.aspx')),
    gulp.src('./k2e/Auth.aspx'),
    gulp.src('./k2e/Global.asax')
  )
  .pipe(gulp.dest('./dist'));
}

function distConfig() {
  return gulp.src([
    './k2e/EvernoteCredentials.config',
    './k2e/Web.config',
    './k2e/Web.Release.config'
  ])
  .pipe(gulp.dest('./dist'));
}

function execCallback(errCb, err, stdout, stderr) {
  console.log(stdout);
  console.log(stderr);
  errCb(err);
}
