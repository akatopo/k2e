/* eslint-env node */

import _ from 'underscore';
import del from 'del';
import streamqueue from 'streamqueue';
import enyoWalker from 'enyo-deploy-walker';
import fs from 'fs';
import escapeRegExp from 'lodash.escaperegexp';

import gulp from 'gulp';
import livereload from 'gulp-livereload';
import rename from 'gulp-rename';
import runSequence from 'run-sequence';
import sass from 'gulp-sass';
import msbuild from 'gulp-msbuild';
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
import eslint from 'gulp-eslint';
import rev from 'gulp-rev';
import mustache from 'gulp-mustache';

const BASE_BOOTPLATE_PATH = './k2e/bootplate';
const BASE_SOURCE_PATH = './k2e/bootplate/source';
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
    'Safari >= 6',
  ],
};
const LIVERELOAD_PORT = 10666;
let isWatching = false;

// get dependencies once for any arguments

const getEnyoDeps = _.memoize(() => {
  const boot = enyoWalker.getDependencies(`${BASE_BOOTPLATE_PATH}/lib/enyo/source/boot`);
  const source = enyoWalker.getDependencies(`${BASE_BOOTPLATE_PATH}/lib/enyo/source`);

  return enyoWalker.mergeDependencyCollections(boot, source);
}, _.noop);

const getK2eDeps = _.memoize(() =>
  enyoWalker.getDependencies(`${BASE_BOOTPLATE_PATH}`), _.noop
);

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
  'transform-regenerator',
];

const BABEL_IGNORE = [
  `${BASE_BOOTPLATE_PATH}/lib/**/*.js`,
  './node_modules/babel-polyfill/dist/polyfill.js',
];

/////////////////////////////////////////////////////////////

gulp.task('lint', lint);

gulp.task('compile-sass', compileSass);

gulp.task('compile-babel', compileBabel);

gulp.task('watch', ['compile-babel', 'compile-sass'], watch);

gulp.task('build-backend', buildBackend);

gulp.task('build-backend-debug', buildBackendDebug);

gulp.task('dist-bin', ['build-backend'], distBin);

gulp.task('dist-aspx', distAspx);

gulp.task('dist-config', distConfig);

gulp.task('dist-clean', (cb) => { del('dist/*', { dot: true }, cb); });

gulp.task('dist-scripts', ['compile-babel'], distScripts);

gulp.task('dist-css', ['compile-sass'], distCss);

gulp.task('dist-assets', distAssets);

gulp.task('rev-scripts', revScripts);

gulp.task('rev-css', revCss);

gulp.task('rev-assets', revAssets);

gulp.task('rev-lib', revLib);

gulp.task('rev-default-aspx', revDefaultAspx);

gulp.task('dist-service-worker', distServiceWorker);

gulp.task('dist', (cb) => {
  runSequence(
    ['lint', 'dist-clean'],
    ['dist-scripts', 'dist-css', 'dist-assets', 'dist-aspx', 'dist-config', 'dist-bin'],
    ['rev-assets', 'rev-lib'],
    ['rev-scripts'],
    ['rev-css'],
    ['rev-default-aspx'],
    ['dist-service-worker'],
    cb
  );
});

gulp.task('build', (cb) => {
  runSequence(
    ['lint'],
    ['compile-babel', 'compile-sass', 'build-backend-debug'],
    cb
  );
});

//////////////////////////////////////////////////////////////

function lint() {
  return gulp.src(`${BASE_SOURCE_PATH}/**/*.js`)
    .pipe(cached('linting'))
    .pipe(eslint())
    .pipe(jscs.reporter())
    .pipe(jscs.reporter('fail'))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

function compileSass() {
  return gulp.src([
      `${BASE_SOURCE_PATH}/scss/*.scss`,
      `!${BASE_SOURCE_PATH}/scss/_*.scss`,
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
  const babelStream = gulp.src(`${BASE_SOURCE_PATH}/**/*.js`, { base: BASE_SOURCE_PATH })
    .pipe(cached('compileBabel-scripts'))
    .pipe(sourcemaps.init())
    .pipe(babel({ babelrc: false, plugins: BABEL_PLUGINS, ignore: BABEL_IGNORE }));
  babelStream.on('error', (err) => {
    console.error(err.stack);
    if (isWatching) {
      babelStream.emit('end');
    }
    else {
      throw err;
    }
  });

  return streamqueue({ objectMode: true },
    babelStream.pipe(sourcemaps.write('.')),
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

  const sourcePath = BASE_SOURCE_PATH.substr(2);

  isWatching = true;

  livereload.listen({ port: LIVERELOAD_PORT });
  gulp.watch(`${sourcePath}/scss/*.scss`, ['compile-sass']);
  gulp.watch(`${sourcePath}/**/*.js`, ['compile-babel']);
}

function buildBackend() {
  return gulp.src('./k2e.sln')
    .pipe(msbuild({
      configuration: 'Release',
    }));
}

function buildBackendDebug() {
  return gulp.src('./k2e.sln')
    .pipe(msbuild({
      configuration: 'Debug',
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
    gulp.src('./node_modules/babel-polyfill/dist/polyfill.min.js'),
    gulp.src(`${BASE_BOOTPLATE_PATH}/lib/sw-toolbox/sw-toolbox.js`)
  )
  .pipe(gulp.dest('./dist/build'));
}

function distServiceWorker() {
  const manifestPaths = [
    './dist/build/rev-manifest.json',
    './dist/lib/rev-manifest.json',
    './dist/assets/rev-manifest.json',
  ];

  const [buildManifest, libManifest, assetsManifest] = readManifests(manifestPaths);
  const cacheFirst = Object.keys(buildManifest)
    .map((orig) => `/build/${buildManifest[orig]}`);
  const preCacheLib = Object.keys(libManifest)
    .map((orig) => `/lib/${libManifest[orig]}`);
  const preCacheAssets = Object.keys(assetsManifest)
    .map((orig) => `/assets/${assetsManifest[orig]}`);
  const preCache = preCacheLib.concat(preCacheAssets);

  // const manifest = Object.assign({}, assetManifest, buildManifest);
  return gulp.src(`${BASE_BOOTPLATE_PATH}/sw.mustache`)
    .pipe(mustache({ cacheFirst, preCache }, { extension: '.js' }))
    .pipe(gulp.dest('./dist/'));
}

function readManifests(_manifestPaths) {
  const manifestPaths = Array.isArray(_manifestPaths) ?
    _manifestPaths : [_manifestPaths];

  return manifestPaths
    .map((manifestPath) => JSON.parse(fs.readFileSync(manifestPath, 'utf8')));
}

function revCss() {
  const manifestPaths = [
    './dist/assets/rev-manifest.json',
    './dist/lib/rev-manifest.json',
  ];

  const [assetManifest, libManifest] = readManifests(manifestPaths);

  const manifest = Object.assign({}, assetManifest, libManifest);

  const substituteRevUrl = (url) => {
    let res = url;
    Object.keys(manifest).some((orig) => {
      const regEx = new RegExp(`${escapeRegExp(orig)}$`);
      if (regEx.test(url)) {
        res = url.replace(orig, manifest[orig]);
        return true;
      }
      return false;
    });

    return res;
  };

  return gulp.src('./dist/build/*.css')
    .pipe(rework(urlPlugin(substituteRevUrl)))
    .pipe(csso())
    .pipe(rev())
    .pipe(gulp.dest('./dist/build'))
    .pipe(rev.manifest(
      'dist/build/rev-manifest.json',
      { base: `${process.cwd()}/dist/build`, merge: true })
    )
    .pipe(gulp.dest('./dist/build'));
}

function revScripts() {
  return gulp.src('./dist/build/*.js')
    .pipe(rev())
    .pipe(gulp.dest('./dist/build'))
    .pipe(rev.manifest(
      'dist/build/rev-manifest.json',
      { base: `${process.cwd()}/dist/build`, merge: true })
    )
    .pipe(gulp.dest('./dist/build'));
}

function revAssets() {
  return gulp.src('./dist/assets/*')
    .pipe(rev())
    .pipe(gulp.dest('./dist/assets'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./dist/assets'));
}

function revLib() {
  return gulp.src(['./dist/lib/**/*.png', './dist/lib/**/*.gif'])
    .pipe(rev())
    .pipe(gulp.dest('./dist/lib'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./dist/lib'));
}

function revDefaultAspx() {
  const manifestPaths = [
    './dist/assets/rev-manifest.json',
    './dist/build/rev-manifest.json',
  ];

  const [assetManifest, buildManifest] = readManifests(manifestPaths);

  const manifest = Object.assign({}, assetManifest, buildManifest);

  const getRevName = () => (
    (text, render) => (
      manifest && manifest[text] ?
        render(manifest[text]) :
        render(text)
    )
  );

  return gulp.src('./k2e/Default-dist.mustache')
    .pipe(rename('Default.mustache'))
    .pipe(mustache({ getRevName }, { extension: '.aspx' }))
    .pipe(gulp.dest('./dist'));
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
    gulp.src('./k2e/Auth.aspx'),
    gulp.src('./k2e/Global.asax')
  )
  .pipe(gulp.dest('./dist'));
}

function distConfig() {
  return gulp.src([
    './k2e/EvernoteCredentials.config',
    './k2e/Web.config',
    './k2e/Web.Release.config',
  ])
  .pipe(gulp.dest('./dist'));
}
