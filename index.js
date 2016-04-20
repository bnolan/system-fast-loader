function ProxyComponent () {
  // do magic here

  this.default = {
    name: 'ProxyComponent'
  };
}

var System = {
  config: function (c) {
    Object.assign(this._config, c);
  },

  modules: {},

  globalHelper: function () {
  },

  normalize: function () {
    return {
      then: function () {
      }
    }
  },

  import: function (name) {
    var result = this._import(name);

    var proxy = {};

    proxy.then = function (func) {
      func(result);
      return proxy;
    };

    proxy.catch = function (func) {
      // todo: Throw something here
      return proxy;
    };

    return proxy;
  },

  register: function (name, dependencies, func) {
    this.modules[name] = {
      dependencies: dependencies,
      func: func
    };
  },

  registerDynamic: function (name, dependencies, bool, func) {
    this.modules[name] = {
      dependencies: dependencies,
      func: func
    };
  },

  get: function (arg) {
    if (arg === '@@amd-helpers') {
      return {
        createDefine: function () {
          return function () {};
        }
      };
    }
    if (arg === '@@global-helpers') {
      return {
        prepareGlobal: function (moduleId, exportName) {
          return System.globalHelper.bind(this, moduleId, exportName);
        }
      };
    }
  },

  _config: {},

  _skip: function (name) {
    // Skip loading modules. You should probably take them out of your
    // build, but this is available as a blunt tool at the end of the chain.
    if (name === 'github:jspm/some-module') {
      return {
        some: 'values that you want to return as a stub for this'
      };
    }

    return false;
  },

  _import: function (name) {
    var self = this;

    var originalName = name;

    var skipped = this._skip(name);

    if (skipped) {
      return skipped;
    }

    if (!this.modules[name]) {
      name = this._config.map[name];
    }

    // Search for typescript files
    if (!this.modules[name]) {
      name = originalName + '.ts';
    }

    if (!this.modules[name]) {
      console.error('Loader cannot find: ' + originalName + ' as ' + name);
      return new ProxyComponent();
    }

    var module = this.modules[name];

    if (module.cached) {
      return module.cached;
    }

    if (module.loading) {
      console.log('Circular dependency in ' + name);
      return;
    }

    var func;
    var exports = {};
    var m = {
      exports: exports
    };

    if (module.func.toString().slice(0, 80).match(/__require/)) {
      System.globalHelper = function (moduleId, key) {
        var value = window[key];
        exports[key] = value;
        exports.default = value;
      }

      var $__require = this._import.bind(this);
      func = module.func($__require, exports, m);
    } else {
      var exportFunc = function (key, value) {
        exports[key] = value;
      };
      func = module.func(exportFunc, exports, m);
    }

    if (func === null || func === undefined && (Object.keys(exports).length === 0)) {
      console.log('WARNING: ' + originalName + ' has no exports.');
      return null;
    } else if (func === null || func === undefined) {
      module.cached = exports;
    } else if (func.setters) {
      var dependencies = module.dependencies;
      var i = 0;

      func.setters.forEach(function (setter) {
        var dependency = self._import(dependencies[i]);
        setter(dependency);
        i++;
      });

      func.execute();
      module.cached = exports;
    } else {
      module.cached = func;
    }

    if (typeof module.cached === 'string') {
      module.cached = {
        default: module.cached
      };
    }

    if (module.cached && !module.cached.default) {
      module.cached.default = module.cached;
    }

    module.loading = false;

    return module.cached;
  }
};

var define = function (name, dependencies, func) {
  System.register(name, dependencies, func);
};