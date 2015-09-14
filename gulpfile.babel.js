/* jshint node:true, esnext:true */

import _ from 'underscore';
import del from 'del';
import { exec } from 'child_process';
import streamqueue from 'streamqueue';

import gulp from 'gulp';
import livereload from 'gulp-livereload';
import rename from 'gulp-rename';
import runSequence from 'run-sequence';
import sass from 'gulp-sass';

const BASE_BOOTPLATE_PATH = './k2e/bootplate';
const BASE_SOURCE_PATH = './k2e/bootplate/source';
const BASE_DEPLOY_PATH = 'k2e/bootplate/deploy/bootplate';

gulp.task('sass', sassCompile);

gulp.task('watch', watch);

gulp.task('build-backend', buildBackend);

gulp.task('build-frontend', ['sass'], buildFrontend);

gulp.task('dist-scripts', distScripts);

gulp.task('dist-css', distCss);

gulp.task('dist-assets', distAssets);

gulp.task('dist-bin', ['build-backend'], distBin);

gulp.task('dist-aspx', distAspx);

gulp.task('dist-config', distConfig);

gulp.task('dist-frontend', distFrontend);

gulp.task('dist-clean', (cb) => { del('dist/*', { dot: true }, cb); });

gulp.task('dist', dist);

//////////////////////////////////////////////////////////////

function sassCompile() {
  return gulp.src(BASE_SOURCE_PATH + '/scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(BASE_SOURCE_PATH))
    .pipe(livereload());
}

function watch() {
  livereload.listen();
  gulp.watch(`${BASE_SOURCE_PATH}/scss/*.scss`, ['sass']);
  gulp.watch(`${BASE_SOURCE_PATH}/*.js`, livereload.reload);
}

function buildBackend(cb) {
  exec('xbuild /p:Configuration=Release k2e/k2e.csproj',
    _.partial(execCallback, cb)
  );
}

function buildFrontend(cb) {
  exec('./tools/deploy.sh',
    { cwd: BASE_BOOTPLATE_PATH },
    _.partial(execCallback, cb)
  );
}

function distScripts() {
  return gulp.src(`${BASE_DEPLOY_PATH}/build/*.js`)
    .pipe(gulp.dest('./dist/build'));
}

function distCss() {
  return gulp.src(`${BASE_DEPLOY_PATH}/build/*.css`)
    .pipe(gulp.dest('./dist/build')); 
}

function distAssets() {
  return streamqueue({ objectMode: true },
    gulp.src('./k2e/assets/*')
      .pipe(rename({ dirname: 'assets' })),
    gulp.src(`${BASE_BOOTPLATE_PATH}/lib/onyx/images/*`)
      .pipe(rename({ dirname: 'lib/onyx/images' })),
    gulp.src(`${BASE_BOOTPLATE_PATH}/icon.png`)
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
    gulp.src('./k2e/Auth.aspx')
  )
  .pipe(gulp.dest('./dist'));
}

function distConfig() {
  return gulp.src(['./k2e/EvernoteCredentials.config','./k2e/Web.config', './k2e/Web.Release.config'])
    .pipe(gulp.dest('./dist'));
}

function distFrontend(cb) {
  runSequence('build-frontend', ['dist-scripts', 'dist-css'], cb);
}

function dist(cb) {
  runSequence(
    'dist-clean',
    ['dist-frontend', 'dist-assets', 'dist-aspx', 'dist-config', 'dist-bin'],
    cb
  );
}

function execCallback(errCb, err, stdout, stderr) {
  console.log(stdout);
  console.log(stderr);
  errCb(err);
}