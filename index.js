var System = {
	_config: {},

	config: function (c) {
		Object.assign(this._config, c);
	},

	modules: {},

	import: function (name) {
		var self = this;

		var originalName = name;

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

		if (module.func.toString().match(/__require/)){
			var $__require = this.import.bind(this);
			var m = {
				exports: exports
			};

			func = module.func($__require, exports, m);
		} else {
			var exportFunc = function (key, value) {
				exports[key] = value;
			}

			func = module.func(exportFunc);
		}

		if (!func) {
			return null;
		} else if (func.setters) {
			var dependencies = module.dependencies;
			var i = 0;

			func.setters.forEach(function (setter) {
				var dependency = self.import(dependencies[i]);
				setter(dependency);
				i++;
			});

			func.execute();
			module.cached = exports;
		} else {
			module.cached = func;
		}

		if (module.cached) {
			module.cached.default = module.cached;
		}

		$P.log('loaded ' + originalName);

		return module.cached;
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