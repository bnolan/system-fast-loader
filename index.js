var System = {
	_config: {},

	config: function (c) {
		Object.assign(this._config, c);
	},

	modules: {},

	_skip: function (name) {
		if (name === 'github:jspm/nodelibs-process@0.1.2') {
			return true;
		}

		if (name === 'npm:chai-param@0.1.1') {
			return true;
		}

		return false;
	},

	_import: function (name) {
		var self = this;

		var originalName = name;

		if (this._skip(name)) {
			return { skippedModule: true };
		}

		if (!this.modules[name]) {
			name = this._config.map[name];
		}

		if (!this.modules[name]) {
			throw new Error('Loader cannot find: ' + originalName);
			return null;
		}

		var module = this.modules[name];

		if (module.cached) {
			return module.cached;
		}

		// console.log('import', originalName);

		var func;

		var exports = {}

		$P.log('loading ' + originalName);

		var m = {
			exports: exports
		};

		if (module.func.toString().slice(0,80).match(/__require/)){
			var $__require = this._import.bind(this);

			func = module.func($__require, exports, m);
		} else {
			var exportFunc = function (key, value) {
				exports[key] = value;
			}

			func = module.func(exportFunc, exports, m);
		}

		if (!func) {
			return null;
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

		if (module.cached && !module.cached.default) {
			module.cached.default = module.cached;
		}

		$P.log('loaded ' + originalName);

		return module.cached;
	},

	import: function (name) {
		var result = this._import(name);

		return {
			then: function (func) {
				func(result);
			}
		}
	},

	register: function (name, dependencies, func) {
		// console.log('register', arguments);

		this.modules[name] = {
			dependencies: dependencies,
			func: func
		};
	},

	registerDynamic: function (name, dependencies, bool, func) {
		// console.log('registerDynamic', arguments);

		this.modules[name] = {
			dependencies: dependencies,
			func: func
		};
	},

	get: function (arg) {
		if (arg === '@@amd-helpers') {
			return {
				createDefine : function () {
					return function () {};
				}
			};
		}
		if (arg === '@@global-helpers') {
			return {
				prepareGlobal : function () {
					return function () {};
				}
			};
		}
	}
};

var define = function (name, dependencies, func) {
	System.register(name, dependencies, func);
}