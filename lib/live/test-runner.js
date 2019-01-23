'use strict';

exports.__esModule = true;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _lodash = require('lodash');

var _testRunController = require('./test-run-controller');

var _testRunController2 = _interopRequireDefault(_testRunController);

var _controller = require('./controller');

var _controller2 = _interopRequireDefault(_controller);

var _runner = require('../runner');

var _runner2 = _interopRequireDefault(_runner);

var _bootstrapper = require('./bootstrapper');

var _bootstrapper2 = _interopRequireDefault(_bootstrapper);

var _parseFileList = require('../utils/parse-file-list');

var _parseFileList2 = _interopRequireDefault(_parseFileList);

var _runtime = require('../errors/runtime');

var _message = require('../errors/runtime/message');

var _message2 = _interopRequireDefault(_message);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class LiveModeRunner extends _runner2.default {
    constructor(proxy, browserConnectionGateway, options) {
        super(proxy, browserConnectionGateway, options);

        /* EVENTS */
        this.TEST_RUN_DONE_EVENT = 'test-run-done';
        this.REQUIRED_MODULE_FOUND_EVENT = 'require-module-found';

        this.stopping = false;
        this.tcRunnerTaskPromise = null;
        this.stopInfiniteWaiting = _lodash.noop;
        this.preventRunCall = false;

        this.testRunController = new _testRunController2.default();

        this.embeddingOptions({
            TestRunCtor: this.testRunController.TestRunCtor,
            assets: []
        });

        this.controller = this._createController();
    }

    runTests(isFirstRun = false) {
        let runError = null;

        return this._finishPreviousTestRuns().then(() => {
            return this._validateRunnableConfiguration(isFirstRun);
        }).then(() => {
            this.tcRunnerTaskPromise = super.run(this.opts);

            return this.tcRunnerTaskPromise;
        }).catch(err => {
            this.setBootstrappingError(null);

            runError = err;
        }).then(() => {
            this.tcRunnerTaskPromise = null;

            this.emit(this.TEST_RUN_DONE_EVENT, { err: runError });
        });
    }

    _createRunnableConfiguration() {
        if (this.liveConfigurationCache) return _pinkie2.default.resolve(this.liveConfigurationCache);

        return super._createRunnableConfiguration().then(configuration => {
            this.liveConfigurationCache = configuration;

            return configuration;
        });
    }

    setBootstrappingError(err) {
        this.bootstrappingError = err;
    }

    run(options) {
        if (this.preventRunCall) throw new _runtime.GeneralError(_message2.default.cannotRunLiveModeRunnerMultipleTimes);

        this.preventRunCall = true;

        this.opts = (0, _assign2.default)({}, this.opts, options);

        this._setBootstrapperOptions();

        const fileListPromise = (0, _parseFileList2.default)(this.bootstrapper.sources, process.cwd());

        fileListPromise.then(files => this.controller.init(files)).then(() => this._createRunnableConfiguration()).then(() => this.runTests(true));

        return this._waitInfinite().then(() => {
            this.preventRunCall = false;
        });
    }

    stop() {
        if (!this.tcRunnerTaskPromise) return _pinkie2.default.resolve();

        return new _pinkie2.default(resolve => {
            this.testRunController.once(this.testRunController.RUN_STOPPED_EVENT, () => {
                this.stopping = false;
                resolve();

                this.emit(this.TEST_RUN_DONE_EVENT, {});
            });

            this.stopping = true;
            this.testRunController.stop();
            this.tcRunnerTaskPromise.cancel();
        });
    }

    exit() {
        if (this.tcRunnerTaskPromise) this.tcRunnerTaskPromise.cancel();

        return _pinkie2.default.resolve().then(() => this.stopInfiniteWaiting());
    }

    _finishPreviousTestRuns() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (!_this.liveConfigurationCache.tests) return;

            _this.testRunController.run(_this.liveConfigurationCache.tests.filter(function (t) {
                return !t.skip;
            }).length);
        })();
    }

    _validateRunnableConfiguration(isFirstRun) {
        if (isFirstRun) {
            if (this.bootstrappingError) return _pinkie2.default.reject(this.bootstrappingError);

            return _pinkie2.default.resolve();
        }

        return this.bootstrapper._getTests().then(tests => {
            this.liveConfigurationCache.tests = tests;

            return this.bootstrappingError ? _pinkie2.default.reject(this.bootstrappingError) : _pinkie2.default.resolve();
        });
    }

    _createTask(tests, browserConnectionGroups, proxy, opts) {
        opts.live = true;

        return super._createTask(tests, browserConnectionGroups, proxy, opts);
    }

    _createBootstrapper(browserConnectionGateway) {
        return new _bootstrapper2.default(this, browserConnectionGateway);
    }

    _createController() {
        return new _controller2.default(this);
    }

    _waitInfinite() {
        return new _pinkie2.default(resolve => {
            this.stopInfiniteWaiting = resolve;
        });
    }

    _disposeBrowserSet() {
        return _pinkie2.default.resolve();
    }
}

exports.default = LiveModeRunner;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXZlL3Rlc3QtcnVubmVyLmpzIl0sIm5hbWVzIjpbIkxpdmVNb2RlUnVubmVyIiwiUnVubmVyIiwiY29uc3RydWN0b3IiLCJwcm94eSIsImJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSIsIm9wdGlvbnMiLCJURVNUX1JVTl9ET05FX0VWRU5UIiwiUkVRVUlSRURfTU9EVUxFX0ZPVU5EX0VWRU5UIiwic3RvcHBpbmciLCJ0Y1J1bm5lclRhc2tQcm9taXNlIiwic3RvcEluZmluaXRlV2FpdGluZyIsIm5vb3AiLCJwcmV2ZW50UnVuQ2FsbCIsInRlc3RSdW5Db250cm9sbGVyIiwiTGl2ZU1vZGVUZXN0UnVuQ29udHJvbGxlciIsImVtYmVkZGluZ09wdGlvbnMiLCJUZXN0UnVuQ3RvciIsImFzc2V0cyIsImNvbnRyb2xsZXIiLCJfY3JlYXRlQ29udHJvbGxlciIsInJ1blRlc3RzIiwiaXNGaXJzdFJ1biIsInJ1bkVycm9yIiwiX2ZpbmlzaFByZXZpb3VzVGVzdFJ1bnMiLCJ0aGVuIiwiX3ZhbGlkYXRlUnVubmFibGVDb25maWd1cmF0aW9uIiwicnVuIiwib3B0cyIsImNhdGNoIiwiZXJyIiwic2V0Qm9vdHN0cmFwcGluZ0Vycm9yIiwiZW1pdCIsIl9jcmVhdGVSdW5uYWJsZUNvbmZpZ3VyYXRpb24iLCJsaXZlQ29uZmlndXJhdGlvbkNhY2hlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJjb25maWd1cmF0aW9uIiwiYm9vdHN0cmFwcGluZ0Vycm9yIiwiR2VuZXJhbEVycm9yIiwiTUVTU0FHRSIsImNhbm5vdFJ1bkxpdmVNb2RlUnVubmVyTXVsdGlwbGVUaW1lcyIsIl9zZXRCb290c3RyYXBwZXJPcHRpb25zIiwiZmlsZUxpc3RQcm9taXNlIiwiYm9vdHN0cmFwcGVyIiwic291cmNlcyIsInByb2Nlc3MiLCJjd2QiLCJmaWxlcyIsImluaXQiLCJfd2FpdEluZmluaXRlIiwic3RvcCIsIm9uY2UiLCJSVU5fU1RPUFBFRF9FVkVOVCIsImNhbmNlbCIsImV4aXQiLCJ0ZXN0cyIsImZpbHRlciIsInQiLCJza2lwIiwibGVuZ3RoIiwicmVqZWN0IiwiX2dldFRlc3RzIiwiX2NyZWF0ZVRhc2siLCJicm93c2VyQ29ubmVjdGlvbkdyb3VwcyIsImxpdmUiLCJfY3JlYXRlQm9vdHN0cmFwcGVyIiwiTGl2ZU1vZGVCb290c3RyYXBwZXIiLCJMaXZlTW9kZUNvbnRyb2xsZXIiLCJfZGlzcG9zZUJyb3dzZXJTZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7Ozs7QUFFQSxNQUFNQSxjQUFOLFNBQTZCQyxnQkFBN0IsQ0FBb0M7QUFDaENDLGdCQUFhQyxLQUFiLEVBQW9CQyx3QkFBcEIsRUFBOENDLE9BQTlDLEVBQXVEO0FBQ25ELGNBQU1GLEtBQU4sRUFBYUMsd0JBQWIsRUFBdUNDLE9BQXZDOztBQUVBO0FBQ0EsYUFBS0MsbUJBQUwsR0FBbUMsZUFBbkM7QUFDQSxhQUFLQywyQkFBTCxHQUFtQyxzQkFBbkM7O0FBRUEsYUFBS0MsUUFBTCxHQUEyQixLQUEzQjtBQUNBLGFBQUtDLG1CQUFMLEdBQTJCLElBQTNCO0FBQ0EsYUFBS0MsbUJBQUwsR0FBMkJDLFlBQTNCO0FBQ0EsYUFBS0MsY0FBTCxHQUEyQixLQUEzQjs7QUFFQSxhQUFLQyxpQkFBTCxHQUF5QixJQUFJQywyQkFBSixFQUF6Qjs7QUFFQSxhQUFLQyxnQkFBTCxDQUFzQjtBQUNsQkMseUJBQWEsS0FBS0gsaUJBQUwsQ0FBdUJHLFdBRGxCO0FBRWxCQyxvQkFBYTtBQUZLLFNBQXRCOztBQUtBLGFBQUtDLFVBQUwsR0FBa0IsS0FBS0MsaUJBQUwsRUFBbEI7QUFDSDs7QUFFREMsYUFBVUMsYUFBYSxLQUF2QixFQUE4QjtBQUMxQixZQUFJQyxXQUFXLElBQWY7O0FBRUEsZUFBTyxLQUFLQyx1QkFBTCxHQUNGQyxJQURFLENBQ0csTUFBTTtBQUNSLG1CQUFPLEtBQUtDLDhCQUFMLENB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QUFXO0FBQzFCLGlCQUFLekIsbUJBQUwsR0FBMkJ5QixPQUEzQjtBQUNILFNBRk0sQ0FBUDtBQUdIOztBQUVEaUMseUJBQXNCO0FBQ2xCLGVBQU9sQyxpQkFBUUMsT0FBUixFQUFQO0FBQ0g7QUE1SitCOztrQkErSnJCbkMsYyIsImZpbGUiOiJsaXZlL3Rlc3QtcnVubmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFByb21pc2UgZnJvbSAncGlua2llJztcbmltcG9ydCB7IG5vb3AgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IExpdmVNb2RlVGVzdFJ1bkNvbnRyb2xsZXIgZnJvbSAnLi90ZXN0LXJ1bi1jb250cm9sbGVyJztcbmltcG9ydCBMaXZlTW9kZUNvbnRyb2xsZXIgZnJvbSAnLi9jb250cm9sbGVyJztcbmltcG9ydCBSdW5uZXIgZnJvbSAnLi4vcnVubmVyJztcbmltcG9ydCBMaXZlTW9kZUJvb3RzdHJhcHBlciBmcm9tICcuL2Jvb3RzdHJhcHBlcic7XG5pbXBvcnQgcGFyc2VGaWxlTGlzdCBmcm9tICcuLi91dGlscy9wYXJzZS1maWxlLWxpc3QnO1xuaW1wb3J0IHsgR2VuZXJhbEVycm9yIH0gZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUnO1xuaW1wb3J0IE1FU1NBR0UgZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUvbWVzc2FnZSc7XG5cbmNsYXNzIExpdmVNb2RlUnVubmVyIGV4dGVuZHMgUnVubmVyIHtcbiAgICBjb25zdHJ1Y3RvciAocHJveHksIGJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSwgb3B0aW9ucykge1xuICAgICAgICBzdXBlcihwcm94eSwgYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5LCBvcHRpb25zKTtcblxuICAgICAgICAvKiBFVkVOVFMgKi9cbiAgICAgICAgdGhpcy5URVNUX1JVTl9ET05FX0VWRU5UICAgICAgICAgPSAndGVzdC1ydW4tZG9uZSc7XG4gICAgICAgIHRoaXMuUkVRVUlSRURfTU9EVUxFX0ZPVU5EX0VWRU5UID0gJ3JlcXVpcmUtbW9kdWxlLWZvdW5kJztcblxuICAgICAgICB0aGlzLnN0b3BwaW5nICAgICAgICAgICAgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50Y1J1bm5lclRhc2tQcm9taXNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5zdG9wSW5maW5pdGVXYWl0aW5nID0gbm9vcDtcbiAgICAgICAgdGhpcy5wcmV2ZW50UnVuQ2FsbCAgICAgID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy50ZXN0UnVuQ29udHJvbGxlciA9IG5ldyBMaXZlTW9kZVRlc3RSdW5Db250cm9sbGVyKCk7XG5cbiAgICAgICAgdGhpcy5lbWJlZGRpbmdPcHRpb25zKHtcbiAgICAgICAgICAgIFRlc3RSdW5DdG9yOiB0aGlzLnRlc3RSdW5Db250cm9sbGVyLlRlc3RSdW5DdG9yLFxuICAgICAgICAgICAgYXNzZXRzOiAgICAgIFtdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuY29udHJvbGxlciA9IHRoaXMuX2NyZWF0ZUNvbnRyb2xsZXIoKTtcbiAgICB9XG5cbiAgICBydW5UZXN0cyAoaXNGaXJzdFJ1biA9IGZhbHNlKSB7XG4gICAgICAgIGxldCBydW5FcnJvciA9IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmlzaFByZXZpb3VzVGVzdFJ1bnMoKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl92YWxpZGF0ZVJ1bm5hYmxlQ29uZmlndXJhdGlvbihpc0ZpcnN0UnVuKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy50Y1J1bm5lclRhc2tQcm9taXNlID0gc3VwZXIucnVuKHRoaXMub3B0cyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50Y1J1bm5lclRhc2tQcm9taXNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0Qm9vdHN0cmFwcGluZ0Vycm9yKG51bGwpO1xuXG4gICAgICAgICAgICAgICAgcnVuRXJyb3IgPSBlcnI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudGNSdW5uZXJUYXNrUHJvbWlzZSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQodGhpcy5URVNUX1JVTl9ET05FX0VWRU5ULCB7IGVycjogcnVuRXJyb3IgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfY3JlYXRlUnVubmFibGVDb25maWd1cmF0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMubGl2ZUNvbmZpZ3VyYXRpb25DYWNoZSlcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5saXZlQ29uZmlndXJhdGlvbkNhY2hlKTtcblxuICAgICAgICByZXR1cm4gc3VwZXIuX2NyZWF0ZVJ1bm5hYmxlQ29uZmlndXJhdGlvbigpXG4gICAgICAgICAgICAudGhlbihjb25maWd1cmF0aW9uID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpdmVDb25maWd1cmF0aW9uQ2FjaGUgPSBjb25maWd1cmF0aW9uO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZ3VyYXRpb247XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXRCb290c3RyYXBwaW5nRXJyb3IgKGVycikge1xuICAgICAgICB0aGlzLmJvb3RzdHJhcHBpbmdFcnJvciA9IGVycjtcbiAgICB9XG5cbiAgICBydW4gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHRoaXMucHJldmVudFJ1bkNhbGwpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKE1FU1NBR0UuY2Fubm90UnVuTGl2ZU1vZGVSdW5uZXJNdWx0aXBsZVRpbWVzKTtcblxuICAgICAgICB0aGlzLnByZXZlbnRSdW5DYWxsID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLm9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdHMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX3NldEJvb3RzdHJhcHBlck9wdGlvbnMoKTtcblxuICAgICAgICBjb25zdCBmaWxlTGlzdFByb21pc2UgPSBwYXJzZUZpbGVMaXN0KHRoaXMuYm9vdHN0cmFwcGVyLnNvdXJjZXMsIHByb2Nlc3MuY3dkKCkpO1xuXG4gICAgICAgIGZpbGVMaXN0UHJvbWlzZVxuICAgICAgICAgICAgLnRoZW4oZmlsZXMgPT4gdGhpcy5jb250cm9sbGVyLmluaXQoZmlsZXMpKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5fY3JlYXRlUnVubmFibGVDb25maWd1cmF0aW9uKCkpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnJ1blRlc3RzKHRydWUpKTtcblxuXG4gICAgICAgIHJldHVybiB0aGlzLl93YWl0SW5maW5pdGUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJldmVudFJ1bkNhbGwgPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RvcCAoKSB7XG4gICAgICAgIGlmICghdGhpcy50Y1J1bm5lclRhc2tQcm9taXNlKVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHRoaXMudGVzdFJ1bkNvbnRyb2xsZXIub25jZSh0aGlzLnRlc3RSdW5Db250cm9sbGVyLlJVTl9TVE9QUEVEX0VWRU5ULCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wcGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCh0aGlzLlRFU1RfUlVOX0RPTkVfRVZFTlQsIHt9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLnN0b3BwaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudGVzdFJ1bkNvbnRyb2xsZXIuc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy50Y1J1bm5lclRhc2tQcm9taXNlLmNhbmNlbCgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBleGl0ICgpIHtcbiAgICAgICAgaWYgKHRoaXMudGNSdW5uZXJUYXNrUHJvbWlzZSlcbiAgICAgICAgICAgIHRoaXMudGNSdW5uZXJUYXNrUHJvbWlzZS5jYW5jZWwoKTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc3RvcEluZmluaXRlV2FpdGluZygpKTtcbiAgICB9XG5cbiAgICBhc3luYyBfZmluaXNoUHJldmlvdXNUZXN0UnVucyAoKSB7XG4gICAgICAgIGlmICghdGhpcy5saXZlQ29uZmlndXJhdGlvbkNhY2hlLnRlc3RzKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy50ZXN0UnVuQ29udHJvbGxlci5ydW4odGhpcy5saXZlQ29uZmlndXJhdGlvbkNhY2hlLnRlc3RzLmZpbHRlcih0ID0+ICF0LnNraXApLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgX3ZhbGlkYXRlUnVubmFibGVDb25maWd1cmF0aW9uIChpc0ZpcnN0UnVuKSB7XG4gICAgICAgIGlmIChpc0ZpcnN0UnVuKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5ib290c3RyYXBwaW5nRXJyb3IpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHRoaXMuYm9vdHN0cmFwcGluZ0Vycm9yKTtcblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYm9vdHN0cmFwcGVyLl9nZXRUZXN0cygpXG4gICAgICAgICAgICAudGhlbih0ZXN0cyA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5saXZlQ29uZmlndXJhdGlvbkNhY2hlLnRlc3RzID0gdGVzdHM7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ib290c3RyYXBwaW5nRXJyb3IgPyBQcm9taXNlLnJlamVjdCh0aGlzLmJvb3RzdHJhcHBpbmdFcnJvcikgOiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9jcmVhdGVUYXNrICh0ZXN0cywgYnJvd3NlckNvbm5lY3Rpb25Hcm91cHMsIHByb3h5LCBvcHRzKSB7XG4gICAgICAgIG9wdHMubGl2ZSA9IHRydWU7XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLl9jcmVhdGVUYXNrKHRlc3RzLCBicm93c2VyQ29ubmVjdGlvbkdyb3VwcywgcHJveHksIG9wdHMpO1xuICAgIH1cblxuICAgIF9jcmVhdGVCb290c3RyYXBwZXIgKGJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSkge1xuICAgICAgICByZXR1cm4gbmV3IExpdmVNb2RlQm9vdHN0cmFwcGVyKHRoaXMsIGJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNvbnRyb2xsZXIgKCkge1xuICAgICAgICByZXR1cm4gbmV3IExpdmVNb2RlQ29udHJvbGxlcih0aGlzKTtcbiAgICB9XG5cbiAgICBfd2FpdEluZmluaXRlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdG9wSW5maW5pdGVXYWl0aW5nID0gcmVzb2x2ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX2Rpc3Bvc2VCcm93c2VyU2V0ICgpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGl2ZU1vZGVSdW5uZXI7XG4iXX0=
