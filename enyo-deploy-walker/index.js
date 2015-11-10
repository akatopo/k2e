/* jshint node:true */

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import util from 'util';
import _ from 'underscore';
import chalk from 'chalk';

let sandbox = {
  enyo: {
    depends: (...args) => { return args; }
  }
};

let log = _.noop;

module.exports = {
  getDependencies: (base, opts) => {
    opts = opts || { verbose: false };
    log = opts.verbose ? console.log.bind(console) : _.noop;

    return parseDir(base);
  },
  mergeDependencyCollections,
  pushDependecyCollection,
  createDependencyCollection
};

/////////////////////////////////////////////////////////////

function parseDir(base) {
  let stats = fs.statSync(base);
  let packageFileHandler;

  if (!stats.isDirectory()) {
    throw new Error(`${base} is not a directory`);
  }

  try {
    fs.statSync(`${base}/deploy.json`);
    packageFileHandler = _.partial(parseDeployjson, `${base}/deploy.json`);
  }
  catch (ex) {
    try {
      fs.statSync(`${base}/package.js`);
      packageFileHandler = _.partial(parsePackagejs, `${base}/package.js`);
    }
    catch (ex) {
      let message = `could not find 'deploy.json' or 'package.js' in directory '${base}'`;
      throw new Error(message);
    }
  }

  return packageFileHandler();
}

function parseDeployjson(location) {
  let base = path.dirname(location);
  log(`\nparsing deploy.json at ${chalk.magenta(location)}\n`);
  let manifest = JSON.parse(fs.readFileSync(location, 'utf8'));
  let packagejsDependencyCollection = parsePackagejs(`${base}/${manifest.packagejs}`);
  let assetDependencyCollection = createAssetDependencyCollection(base, manifest.assets);

  return pushDependecyCollection(packagejsDependencyCollection, assetDependencyCollection);
}

function parsePackagejs(location) {
  let base = path.dirname(location);
  log(`\nparsing package.js at ${chalk.magenta(location)}\n`);

  vm.runInNewContext(`var dependencies = ${fs.readFileSync(location, 'utf8')}`, sandbox);
  let dependencies = sandbox.dependencies;

  let dependencyCollection = dependencies.reduce(
    _.partial(dependencyReducer, base), createDependencyCollection()
  );

  return dependencyCollection;

  /////////////////////////////////////////////////////////////

  function dependencyReducer(base, dependencyCollection, dependencyLocation) {
    let push = (d, type, location) => {
      d[type].push(location);
      return d;
    };
    let pushCollection = _.partial(pushDependecyCollection, dependencyCollection);
    let extensionDispatcher = {
      '.js': _.partial(push, dependencyCollection, 'scripts'),
      '.css': _.partial(push, dependencyCollection, 'css'),
      // by enyo convention, where there is a .less dependency there
      // should be a file with the same name and .css extension
      '.less': _.compose(
        _.partial(push, dependencyCollection, 'css'),
        (location) => { return location.replace(/\.less$/, '.css'); }
      ),
      '': _.compose(pushCollection, parseDir)
    };
    let extension = path.extname(dependencyLocation);
    let handleLocation = _.compose(extensionDispatcher[extension] || _.noop, path.normalize);
    log(`${chalk.gray('script/css:')} \
${extensionDispatcher[extension] ? '' : chalk.yellow('ignoring ')}${chalk.magenta(dependencyLocation)}`);
    handleLocation(`${base}/${dependencyLocation}`);
    return dependencyCollection;
  }
}

function createAssetDependencyCollection(base, locations) {
  log(`\ncollecting assets at ${chalk.magenta(base)}\n`);
  let assetDependencyCollection =
    locations.reduce(_.partial(assetReducer, base), createDependencyCollection());

  return assetDependencyCollection;

  /////////////////////////////////////////////////////////////

  function assetReducer(base, dependencyCollection, assetLocation) {
    let push = (d, location) => {
      d.assets.push(location);
      return d;
    };
    let pushCollection = _.partial(pushDependecyCollection, dependencyCollection);
    let fullLocation = `${base}/${assetLocation}`;
    let handler;

    if (fs.statSync(fullLocation).isDirectory()) {
      handler = _.compose(
        pushCollection,
        _.partial(createAssetDependencyCollection, fullLocation),
        fs.readdirSync,
        path.normalize
      );
    }
    else {
      handler = _.compose(
        _.partial(push, dependencyCollection),
        path.normalize
      );
    }
    log(`${chalk.gray('asset:')} ${chalk.magenta(assetLocation)}`);
    handler(fullLocation);

    return dependencyCollection;
  }
}

function createDependencyCollection() {
  return {
    scripts: [],
    css: [],
    assets: []
  };
}

function mergeDependencyCollections(c1, c2) {
  return {
    scripts: c1.scripts.concat(c2.scripts),
    css: c1.css.concat(c2.css),
    assets: c1.assets.concat(c2.assets)
  };
}

function pushDependecyCollection(c, p) {
  c.scripts.push(...p.scripts);
  c.css.push(...p.css);
  c.assets.push(...p.assets);

  return c;
}
