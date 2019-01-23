'use strict';

exports.__esModule = true;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lodash = require('lodash');

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _compiler = require('../compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _connection = require('../browser/connection');

var _connection2 = _interopRequireDefault(_connection);

var _runtime = require('../errors/runtime');

var _pool = require('../browser/provider/pool');

var _pool2 = _interopRequireDefault(_pool);

var _message = require('../errors/runtime/message');

var _message2 = _interopRequireDefault(_message);

var _browserSet = require('./browser-set');

var _browserSet2 = _interopRequireDefault(_browserSet);

var _testedApp = require('./tested-app');

var _testedApp2 = _interopRequireDefault(_testedApp);

var _parseFileList = require('../utils/parse-file-list');

var _parseFileList2 = _interopRequireDefault(_parseFileList);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _makeDir = require('make-dir');

var _makeDir2 = _interopRequireDefault(_makeDir);

var _resolvePathRelativelyCwd = require('../utils/resolve-path-relatively-cwd');

var _resolvePathRelativelyCwd2 = _interopRequireDefault(_resolvePathRelativelyCwd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Bootstrapper {
    constructor(browserConnectionGateway) {
        this.browserConnectionGateway = browserConnectionGateway;

        this.concurrency = null;
        this.sources = [];
        this.browsers = [];
        this.reporters = [];
        this.filter = null;
        this.appCommand = null;
        this.appInitDelay = null;
        this.disableTestSyntaxValidation = false;
    }

    static _splitBrowserInfo(browserInfo) {
        const remotes = [];
        const automated = [];

        browserInfo.forEach(browser => {
            if (browser instanceof _connection2.default) remotes.push(browser);else automated.push(browser);
        });

        return { remotes, automated };
    }

    _getBrowserInfo() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (!_this.browsers.length) throw new _runtime.GeneralError(_message2.default.browserNotSet);

            const browserInfo = yield _pinkie2.default.all(_this.browsers.map(function (browser) {
                return _pool2.default.getBrowserInfo(browser);
            }));

            return (0, _lodash.flatten)(browserInfo);
        })();
    }

    _createAutomatedConnections(browserInfo) {
        if (!browserInfo) return [];

        return browserInfo.map(browser => (0, _lodash.times)(this.concurrency, () => new _connection2.default(this.browserConnectionGateway, browser)));
    }

    _getBrowserConnections(browserInfo) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            var _Bootstrapper$_splitB = Bootstrapper._splitBrowserInfo(browserInfo);

            const automated = _Bootstrapper$_splitB.automated,
                  remotes = _Bootstrapper$_splitB.remotes;


            if (remotes && remotes.length % _this2.concurrency) throw new _runtime.GeneralError(_message2.default.cannotDivideRemotesCountByConcurrency);

            let browserConnections = _this2._createAutomatedConnections(automated);

            browserConnections = browserConnections.concat((0, _lodash.chunk)(remotes, _this2.concurrency));

            return yield _browserSet2.default.from(browserConnections);
        })();
    }

    _getTests() {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (!_this3.sources.length) throw new _runtime.GeneralError(_message2.default.testSourcesNotSet);

            const parsedFileList = yield (0, _parseFileList2.default)(_this3.sources, process.cwd());
            const compiler = new _compiler2.default(parsedFileList, _this3.disableTestSyntaxValidation);
            let tests = yield compiler.getTests();

            const testsWithOnlyFlag = tests.filter(function (test) {
                return test.only;
            });

            if (testsWithOnlyFlag.length) tests = testsWithOnlyFlag;

            if (_this3.filter) tests = tests.filter(function (test) {
                return _this3.filter(test.name, test.fixture.name, test.fixture.path, test.meta, test.fixture.meta);
            });

            if (!tests.length) throw new _runtime.GeneralError(_message2.default.noTestsToRun);

            return tests;
        })();
    }

    _ensureOutStream(outStream) {
        return (0, _asyncToGenerator3.default)(function* () {
            if (typeof outStream !== 'string') return outStream;

            const fullReporterOutputPath = (0, _resolvePathRelativelyCwd2.default)(outStream);

            yield (0, _makeDir2.default)(_path2.default.dirname(fullReporterOutputPath));

            return _fs2.default.createWriteStream(fullReporterOutputPath);
        })();
    }

    static _addDefaultReporter(reporters) {
        reporters.push({
            name: 'spec',
            file: process.stdout
        });
    }

    _getReporterPlugins() {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const stdoutReporters = (0, _lodash.filter)(_this4.reporters, function (r) {
                return (0, _lodash.isUndefined)(r.file) || r.file === process.stdout;
            });

            if (stdoutReporters.length > 1) throw new _runtime.GeneralError(_message2.default.multipleStdoutReporters, stdoutReporters.map(function (r) {
                return r.name;
            }).join(', '));

            if (!_this4.reporters.length) Bootstrapper._addDefaultReporter(_this4.reporters);

            return _pinkie2.default.all(_this4.reporters.map((() => {
                var _ref = (0, _asyncToGenerator3.default)(function* ({ name, file }) {
                    let pluginFactory = name;

                    const outStream = yield _this4._ensureOutStream(file);

                    if (typeof pluginFactory !== 'function') {
                        try {
                            pluginFactory = require('testcafe-reporter-' + name);
                        } catch (err) {
                            throw new _runtime.GeneralError(_message2.default.cantFindReporterForAlias, name);
                        }
                    }

                    return {
                        plugin: pluginFactory(),
                        outStream
                    };
                });

                return function (_x) {
                    return _ref.apply(this, arguments);
                };
            })()));
        })();
    }

    _startTestedApp() {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this5.appCommand) {
                const testedApp = new _testedApp2.default();

                yield testedApp.start(_this5.appCommand, _this5.appInitDelay);

                return testedApp;
            }

            return null;
        })();
    }

    _canUseParallelBootstrapping(browserInfo) {
        return (0, _asyncToGenerator3.default)(function* () {
            const isLocalPromises = browserInfo.map(function (browser) {
                return browser.provider.isLocalBrowser(null, browserInfo.browserName);
            });
            const isLocalBrowsers = yield _pinkie2.default.all(isLocalPromises);

            return isLocalBrowsers.every(function (result) {
                return result;
            });
        })();
    }

    _bootstrapSequence(browserInfo) {
        var _this6 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const tests = yield _this6._getTests();
            const testedApp = yield _this6._startTestedApp();
            const browserSet = yield _this6._getBrowserConnections(browserInfo);

            return { tests, testedApp, browserSet };
        })();
    }

    _wrapBootstrappingPromise(promise) {
        return promise.then(result => ({ error: null, result })).catch(error => ({ result: null, error }));
    }

    _handleBootstrappingError([browserSetStatus, testsStatus, testedAppStatus]) {
        return (0, _asyncToGenerator3.default)(function* () {
            if (!browserSetStatus.error) yield browserSetStatus.result.dispose();

            if (!testedAppStatus.error && testedAppStatus.result) yield testedAppStatus.result.kill();

            if (testsStatus.error) throw testsStatus.error;else if (testedAppStatus.error) throw testedAppStatus.error;else throw browserSetStatus.error;
        })();
    }

    _bootstrapParallel(browserInfo) {
        var _this7 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            let bootstrappingPromises = [_this7._getBrowserConnections(browserInfo), _this7._getTests(), _this7._startTestedApp()];

            bootstrappingPromises = bootstrappingPromises.map(function (promise) {
                return _this7._wrapBootstrappingPromise(promise);
            });

            const bootstrappingStatuses = yield _pinkie2.default.all(bootstrappingPromises);

            if (bootstrappingStatuses.some(function (status) {
                return status.error;
            })) yield _this7._handleBootstrappingError(bootstrappingStatuses);

            var _bootstrappingStatuse = bootstrappingStatuses.map(function (status) {
                return status.result;
            });

            const browserSet = _bootstrappingStatuse[0],
                  tests = _bootstrappingStatuse[1],
                  testedApp = _bootstrappingStatuse[2];


            return { browserSet, tests, testedApp };
        })();
    }

    // API
    createRunnableConfiguration() {
        var _this8 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const reporterPlugins = yield _this8._getReporterPlugins();

            // NOTE: If a user forgot to specify a browser, but has specified a path to tests, the specified path will be
            // considered as the browser argument, and the tests path argument will have the predefined default value.
            // It's very ambiguous for the user, who might be confused by compilation errors from an unexpected test.
            // So, we need to retrieve the browser aliases and paths before tests compilation.
            const browserInfo = yield _this8._getBrowserInfo();

            if (yield _this8._canUseParallelBootstrapping(browserInfo)) return (0, _extends3.default)({ reporterPlugins }, (yield _this8._bootstrapParallel(browserInfo)));

            return (0, _extends3.default)({ reporterPlugins }, (yield _this8._bootstrapSequence(browserInfo)));
        })();
    }
}
exports.default = Bootstrapper;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydW5uZXIvYm9vdHN0cmFwcGVyLmpzIl0sIm5hbWVzIjpbIkJvb3RzdHJhcHBlciIsImNvbnN0cnVjdG9yIiwiYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5IiwiY29uY3VycmVuY3kiLCJzb3VyY2VzIiwiYnJvd3NlcnMiLCJyZXBvcnRlcnMiLCJmaWx0ZXIiLCJhcHBDb21tYW5kIiwiYXBwSW5pdERlbGF5IiwiZGlzYWJsZVRlc3RTeW50YXhWYWxpZGF0aW9uIiwiX3NwbGl0QnJvd3NlckluZm8iLCJicm93c2VySW5mbyIsInJlbW90ZXMiLCJhdXRvbWF0ZWQiLCJmb3JFYWNoIiwiYnJvd3NlciIsIkJyb3dzZXJDb25uZWN0aW9uIiwicHVzaCIsIl9nZXRCcm93c2VySW5mbyIsImxlbmd0aCIsIkdlbmVyYWxFcnJvciIsIk1FU1NBR0UiLCJicm93c2VyTm90U2V0IiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsImJyb3dzZXJQcm92aWRlclBvb2wiLCJnZXRCcm93c2VySW5mbyIsIl9jcmVhdGVBdXRvbWF0ZWRDb25uZWN0aW9ucyIsIl9nZXRCcm93c2VyQ29ubmVjdGlvbnMiLCJjYW5ub3REaXZpZGVSZW1vdGVzQ291bnRCeUNvbmN1cnJlbmN5IiwiYnJvd3NlckNvbm5lY3Rpb25zIiwiY29uY2F0IiwiQnJvd3NlclNldCIsImZyb20iLCJfZ2V0VGVzdHMiLCJ0ZXN0U291cmNlc05vdFNldCIsInBhcnNlZEZpbGVMaXN0IiwicHJvY2VzcyIsImN3ZCIsImNvbXBpbGVyIiwiQ29tcGlsZXIiLCJ0ZXN0cyIsImdldFRlc3RzIiwidGVzdHNXaXRoT25seUZsYWciLCJ0ZXN0Iiwib25seSIsIm5hbWUiLCJmaXh0dXJlIiwicGF0aCIsIm1ldGEiLCJub1Rlc3RzVG9SdW4iLCJfZW5zdXJlT3V0U3RyZWFtIiwib3V0U3RyZWFtIiwiZnVsbFJlcG9ydGVyT3V0cHV0UGF0aCIsImRpcm5hbWUiLCJmcyIsImNyZWF0ZVdyaXRlU3RyZWFtIiwiX2FkZERlZmF1bHRSZXBvcnRlciIsImZpbGUiLCJzdGRvdXQiLCJfZ2V0UmVwb3J0ZXJQbHVnaW5zIiwic3Rkb3V0UmVwb3J0ZXJzIiwiciIsIm11bHRpcGxlU3Rkb3V0UmVwb3J0ZXJzIiwiam9pbiIsInBsdWdpbkZhY3RvcnkiLCJyZXF1aXJlIiwiZXJyIiwiY2FudEZpbmRSZXBvcnRlckZvckFsaWFzIiwicGx1Z2luIiwiX3N0YXJ0VGVzdGVkQXBwIiwidGVzdGVkQXBwIiwiVGVzdGVkQXBwIiwic3RhcnQiLCJfY2FuVXNlUGFyYWxsZWxCb290c3RyYXBwaW5nIiwiaXNMb2NhbFByb21pc2VzIiwicHJvdmlkZXIiLCJpc0xvY2FsQnJvd3NlciIsImJyb3dzZXJOYW1lIiwiaXNMb2NhbEJyb3dzZXJzIiwiZXZlcnkiLCJyZXN1bHQiLCJfYm9vdHN0cmFwU2VxdWVuY2UiLCJicm93c2VyU2V0IiwiX3dyYXBCb290c3RyYXBwaW5nUHJvbWlzZSIsInByb21pc2UiLCJ0aGVuIiwiZXJyb3IiLCJjYXRjaCIsIl9oYW5kbGVCb290c3RyYXBwaW5nRXJyb3IiLCJicm93c2VyU2V0U3RhdHVzIiwidGVzdHNTdGF0dXMiLCJ0ZXN0ZWRBcHBTdGF0dXMiLCJkaXNwb3NlIiwia2lsbCIsIl9ib290c3RyYXBQYXJhbGxlbCIsImJvb3RzdHJhcHBpbmdQcm9taXNlcyIsImJvb3RzdHJhcHBpbmdTdGF0dXNlcyIsInNvbWUiLCJzdGF0dXMiLCJjcmVhdGVSdW5uYWJsZUNvbmZpZ3VyYXRpb24iLCJyZXBvcnRlclBsdWdpbnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRWUsTUFBTUEsWUFBTixDQUFtQjtBQUM5QkMsZ0JBQWFDLHdCQUFiLEVBQXVDO0FBQ25DLGFBQUtBLHdCQUFMLEdBQWdDQSx3QkFBaEM7O0FBRUEsYUFB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RUQ7QUFDTTZCLCtCQUFOLEdBQXFDO0FBQUE7O0FBQUE7QUFDakMsa0JBQU1DLGtCQUFrQixNQUFNLE9BQUt6QyxtQkFBTCxFQUE5Qjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFNbEQsY0FBYyxNQUFNLE9BQUtPLGVBQUwsRUFBMUI7O0FBRUEsZ0JBQUksTUFBTSxPQUFLeUQsNEJBQUwsQ0FBa0NoRSxXQUFsQyxDQUFWLEVBQ0ksZ0NBQVMyRixlQUFULEtBQTZCLE1BQU0sT0FBS04sa0JBQUwsQ0FBd0JyRixXQUF4QixDQUFuQzs7QUFFSiw0Q0FBUzJGLGVBQVQsS0FBNkIsTUFBTSxPQUFLbkIsa0JBQUwsQ0FBd0J4RSxXQUF4QixDQUFuQztBQVppQztBQWFwQztBQWpONkI7a0JBQWJaLFkiLCJmaWxlIjoicnVubmVyL2Jvb3RzdHJhcHBlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzVW5kZWZpbmVkLCBmaWx0ZXIsIGZsYXR0ZW4sIGNodW5rLCB0aW1lcyB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICdwaW5raWUnO1xuaW1wb3J0IENvbXBpbGVyIGZyb20gJy4uL2NvbXBpbGVyJztcbmltcG9ydCBCcm93c2VyQ29ubmVjdGlvbiBmcm9tICcuLi9icm93c2VyL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHsgR2VuZXJhbEVycm9yIH0gZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUnO1xuaW1wb3J0IGJyb3dzZXJQcm92aWRlclBvb2wgZnJvbSAnLi4vYnJvd3Nlci9wcm92aWRlci9wb29sJztcbmltcG9ydCBNRVNTQUdFIGZyb20gJy4uL2Vycm9ycy9ydW50aW1lL21lc3NhZ2UnO1xuaW1wb3J0IEJyb3dzZXJTZXQgZnJvbSAnLi9icm93c2VyLXNldCc7XG5pbXBvcnQgVGVzdGVkQXBwIGZyb20gJy4vdGVzdGVkLWFwcCc7XG5pbXBvcnQgcGFyc2VGaWxlTGlzdCBmcm9tICcuLi91dGlscy9wYXJzZS1maWxlLWxpc3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IG1ha2VEaXIgZnJvbSAnbWFrZS1kaXInO1xuaW1wb3J0IHJlc29sdmVQYXRoUmVsYXRpdmVseUN3ZCBmcm9tICcuLi91dGlscy9yZXNvbHZlLXBhdGgtcmVsYXRpdmVseS1jd2QnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCb290c3RyYXBwZXIge1xuICAgIGNvbnN0cnVjdG9yIChicm93c2VyQ29ubmVjdGlvbkdhdGV3YXkpIHtcbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbkdhdGV3YXkgPSBicm93c2VyQ29ubmVjdGlvbkdhdGV3YXk7XG5cbiAgICAgICAgdGhpcy5jb25jdXJyZW5jeSAgICAgICAgICAgICAgICAgPSBudWxsO1xuICAgICAgICB0aGlzLnNvdXJjZXMgICAgICAgICAgICAgICAgICAgICA9IFtdO1xuICAgICAgICB0aGlzLmJyb3dzZXJzICAgICAgICAgICAgICAgICAgICA9IFtdO1xuICAgICAgICB0aGlzLnJlcG9ydGVycyAgICAgICAgICAgICAgICAgICA9IFtdO1xuICAgICAgICB0aGlzLmZpbHRlciAgICAgICAgICAgICAgICAgICAgICA9IG51bGw7XG4gICAgICAgIHRoaXMuYXBwQ29tbWFuZCAgICAgICAgICAgICAgICAgID0gbnVsbDtcbiAgICAgICAgdGhpcy5hcHBJbml0RGVsYXkgICAgICAgICAgICAgICAgPSBudWxsO1xuICAgICAgICB0aGlzLmRpc2FibGVUZXN0U3ludGF4VmFsaWRhdGlvbiA9IGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBfc3BsaXRCcm93c2VySW5mbyAoYnJvd3NlckluZm8pIHtcbiAgICAgICAgY29uc3QgcmVtb3RlcyAgID0gW107XG4gICAgICAgIGNvbnN0IGF1dG9tYXRlZCA9IFtdO1xuXG4gICAgICAgIGJyb3dzZXJJbmZvLmZvckVhY2goYnJvd3NlciA9PiB7XG4gICAgICAgICAgICBpZiAoYnJvd3NlciBpbnN0YW5jZW9mIEJyb3dzZXJDb25uZWN0aW9uKVxuICAgICAgICAgICAgICAgIHJlbW90ZXMucHVzaChicm93c2VyKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBhdXRvbWF0ZWQucHVzaChicm93c2VyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHsgcmVtb3RlcywgYXV0b21hdGVkIH07XG4gICAgfVxuXG4gICAgYXN5bmMgX2dldEJyb3dzZXJJbmZvICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmJyb3dzZXJzLmxlbmd0aClcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoTUVTU0FHRS5icm93c2VyTm90U2V0KTtcblxuICAgICAgICBjb25zdCBicm93c2VySW5mbyA9IGF3YWl0IFByb21pc2UuYWxsKHRoaXMuYnJvd3NlcnMubWFwKGJyb3dzZXIgPT4gYnJvd3NlclByb3ZpZGVyUG9vbC5nZXRCcm93c2VySW5mbyhicm93c2VyKSkpO1xuXG4gICAgICAgIHJldHVybiBmbGF0dGVuKGJyb3dzZXJJbmZvKTtcbiAgICB9XG5cbiAgICBfY3JlYXRlQXV0b21hdGVkQ29ubmVjdGlvbnMgKGJyb3dzZXJJbmZvKSB7XG4gICAgICAgIGlmICghYnJvd3NlckluZm8pXG4gICAgICAgICAgICByZXR1cm4gW107XG5cbiAgICAgICAgcmV0dXJuIGJyb3dzZXJJbmZvXG4gICAgICAgICAgICAubWFwKGJyb3dzZXIgPT4gdGltZXModGhpcy5jb25jdXJyZW5jeSwgKCkgPT4gbmV3IEJyb3dzZXJDb25uZWN0aW9uKHRoaXMuYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5LCBicm93c2VyKSkpO1xuICAgIH1cblxuICAgIGFzeW5jIF9nZXRCcm93c2VyQ29ubmVjdGlvbnMgKGJyb3dzZXJJbmZvKSB7XG4gICAgICAgIGNvbnN0IHsgYXV0b21hdGVkLCByZW1vdGVzIH0gPSBCb290c3RyYXBwZXIuX3NwbGl0QnJvd3NlckluZm8oYnJvd3NlckluZm8pO1xuXG4gICAgICAgIGlmIChyZW1vdGVzICYmIHJlbW90ZXMubGVuZ3RoICUgdGhpcy5jb25jdXJyZW5jeSlcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoTUVTU0FHRS5jYW5ub3REaXZpZGVSZW1vdGVzQ291bnRCeUNvbmN1cnJlbmN5KTtcblxuICAgICAgICBsZXQgYnJvd3NlckNvbm5lY3Rpb25zID0gdGhpcy5fY3JlYXRlQXV0b21hdGVkQ29ubmVjdGlvbnMoYXV0b21hdGVkKTtcblxuICAgICAgICBicm93c2VyQ29ubmVjdGlvbnMgPSBicm93c2VyQ29ubmVjdGlvbnMuY29uY2F0KGNodW5rKHJlbW90ZXMsIHRoaXMuY29uY3VycmVuY3kpKTtcblxuICAgICAgICByZXR1cm4gYXdhaXQgQnJvd3NlclNldC5mcm9tKGJyb3dzZXJDb25uZWN0aW9ucyk7XG4gICAgfVxuXG4gICAgYXN5bmMgX2dldFRlc3RzICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnNvdXJjZXMubGVuZ3RoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihNRVNTQUdFLnRlc3RTb3VyY2VzTm90U2V0KTtcblxuICAgICAgICBjb25zdCBwYXJzZWRGaWxlTGlzdCA9IGF3YWl0IHBhcnNlRmlsZUxpc3QodGhpcy5zb3VyY2VzLCBwcm9jZXNzLmN3ZCgpKTtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgICAgICAgPSBuZXcgQ29tcGlsZXIocGFyc2VkRmlsZUxpc3QsIHRoaXMuZGlzYWJsZVRlc3RTeW50YXhWYWxpZGF0aW9uKTtcbiAgICAgICAgbGV0IHRlc3RzICAgICAgICAgICAgPSBhd2FpdCBjb21waWxlci5nZXRUZXN0cygpO1xuXG4gICAgICAgIGNvbnN0IHRlc3RzV2l0aE9ubHlGbGFnID0gdGVzdHMuZmlsdGVyKHRlc3QgPT4gdGVzdC5vbmx5KTtcblxuICAgICAgICBpZiAodGVzdHNXaXRoT25seUZsYWcubGVuZ3RoKVxuICAgICAgICAgICAgdGVzdHMgPSB0ZXN0c1dpdGhPbmx5RmxhZztcblxuICAgICAgICBpZiAodGhpcy5maWx0ZXIpXG4gICAgICAgICAgICB0ZXN0cyA9IHRlc3RzLmZpbHRlcih0ZXN0ID0+IHRoaXMuZmlsdGVyKHRlc3QubmFtZSwgdGVzdC5maXh0dXJlLm5hbWUsIHRlc3QuZml4dHVyZS5wYXRoLCB0ZXN0Lm1ldGEsIHRlc3QuZml4dHVyZS5tZXRhKSk7XG5cbiAgICAgICAgaWYgKCF0ZXN0cy5sZW5ndGgpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKE1FU1NBR0Uubm9UZXN0c1RvUnVuKTtcblxuICAgICAgICByZXR1cm4gdGVzdHM7XG4gICAgfVxuXG4gICAgYXN5bmMgX2Vuc3VyZU91dFN0cmVhbSAob3V0U3RyZWFtKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3V0U3RyZWFtICE9PSAnc3RyaW5nJylcbiAgICAgICAgICAgIHJldHVybiBvdXRTdHJlYW07XG5cbiAgICAgICAgY29uc3QgZnVsbFJlcG9ydGVyT3V0cHV0UGF0aCA9IHJlc29sdmVQYXRoUmVsYXRpdmVseUN3ZChvdXRTdHJlYW0pO1xuXG4gICAgICAgIGF3YWl0IG1ha2VEaXIocGF0aC5kaXJuYW1lKGZ1bGxSZXBvcnRlck91dHB1dFBhdGgpKTtcblxuICAgICAgICByZXR1cm4gZnMuY3JlYXRlV3JpdGVTdHJlYW0oZnVsbFJlcG9ydGVyT3V0cHV0UGF0aCk7XG4gICAgfVxuXG4gICAgc3RhdGljIF9hZGREZWZhdWx0UmVwb3J0ZXIgKHJlcG9ydGVycykge1xuICAgICAgICByZXBvcnRlcnMucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiAnc3BlYycsXG4gICAgICAgICAgICBmaWxlOiBwcm9jZXNzLnN0ZG91dFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBfZ2V0UmVwb3J0ZXJQbHVnaW5zICgpIHtcbiAgICAgICAgY29uc3Qgc3Rkb3V0UmVwb3J0ZXJzID0gZmlsdGVyKHRoaXMucmVwb3J0ZXJzLCByID0+IGlzVW5kZWZpbmVkKHIuZmlsZSkgfHwgci5maWxlID09PSBwcm9jZXNzLnN0ZG91dCk7XG5cbiAgICAgICAgaWYgKHN0ZG91dFJlcG9ydGVycy5sZW5ndGggPiAxKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihNRVNTQUdFLm11bHRpcGxlU3Rkb3V0UmVwb3J0ZXJzLCBzdGRvdXRSZXBvcnRlcnMubWFwKHIgPT4gci5uYW1lKS5qb2luKCcsICcpKTtcblxuICAgICAgICBpZiAoIXRoaXMucmVwb3J0ZXJzLmxlbmd0aClcbiAgICAgICAgICAgIEJvb3RzdHJhcHBlci5fYWRkRGVmYXVsdFJlcG9ydGVyKHRoaXMucmVwb3J0ZXJzKTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwodGhpcy5yZXBvcnRlcnMubWFwKGFzeW5jICh7IG5hbWUsIGZpbGUgfSkgPT4ge1xuICAgICAgICAgICAgbGV0IHBsdWdpbkZhY3RvcnkgPSBuYW1lO1xuXG4gICAgICAgICAgICBjb25zdCBvdXRTdHJlYW0gPSBhd2FpdCB0aGlzLl9lbnN1cmVPdXRTdHJlYW0oZmlsZSk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luRmFjdG9yeSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHBsdWdpbkZhY3RvcnkgPSByZXF1aXJlKCd0ZXN0Y2FmZS1yZXBvcnRlci0nICsgbmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihNRVNTQUdFLmNhbnRGaW5kUmVwb3J0ZXJGb3JBbGlhcywgbmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBsdWdpbjogcGx1Z2luRmFjdG9yeSgpLFxuICAgICAgICAgICAgICAgIG91dFN0cmVhbVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIGFzeW5jIF9zdGFydFRlc3RlZEFwcCAoKSB7XG4gICAgICAgIGlmICh0aGlzLmFwcENvbW1hbmQpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlc3RlZEFwcCA9IG5ldyBUZXN0ZWRBcHAoKTtcblxuICAgICAgICAgICAgYXdhaXQgdGVzdGVkQXBwLnN0YXJ0KHRoaXMuYXBwQ29tbWFuZCwgdGhpcy5hcHBJbml0RGVsYXkpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGVzdGVkQXBwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgYXN5bmMgX2NhblVzZVBhcmFsbGVsQm9vdHN0cmFwcGluZyAoYnJvd3NlckluZm8pIHtcbiAgICAgICAgY29uc3QgaXNMb2NhbFByb21pc2VzID0gYnJvd3NlckluZm8ubWFwKGJyb3dzZXIgPT4gYnJvd3Nlci5wcm92aWRlci5pc0xvY2FsQnJvd3NlcihudWxsLCBicm93c2VySW5mby5icm93c2VyTmFtZSkpO1xuICAgICAgICBjb25zdCBpc0xvY2FsQnJvd3NlcnMgPSBhd2FpdCBQcm9taXNlLmFsbChpc0xvY2FsUHJvbWlzZXMpO1xuXG4gICAgICAgIHJldHVybiBpc0xvY2FsQnJvd3NlcnMuZXZlcnkocmVzdWx0ID0+IHJlc3VsdCk7XG4gICAgfVxuXG4gICAgYXN5bmMgX2Jvb3RzdHJhcFNlcXVlbmNlIChicm93c2VySW5mbykge1xuICAgICAgICBjb25zdCB0ZXN0cyAgICAgICA9IGF3YWl0IHRoaXMuX2dldFRlc3RzKCk7XG4gICAgICAgIGNvbnN0IHRlc3RlZEFwcCAgID0gYXdhaXQgdGhpcy5fc3RhcnRUZXN0ZWRBcHAoKTtcbiAgICAgICAgY29uc3QgYnJvd3NlclNldCAgPSBhd2FpdCB0aGlzLl9nZXRCcm93c2VyQ29ubmVjdGlvbnMoYnJvd3NlckluZm8pO1xuXG4gICAgICAgIHJldHVybiB7IHRlc3RzLCB0ZXN0ZWRBcHAsIGJyb3dzZXJTZXQgfTtcbiAgICB9XG5cbiAgICBfd3JhcEJvb3RzdHJhcHBpbmdQcm9taXNlIChwcm9taXNlKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlXG4gICAgICAgICAgICAudGhlbihyZXN1bHQgPT4gKHsgZXJyb3I6IG51bGwsIHJlc3VsdCB9KSlcbiAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiAoeyByZXN1bHQ6IG51bGwsIGVycm9yIH0pKTtcbiAgICB9XG5cbiAgICBhc3luYyBfaGFuZGxlQm9vdHN0cmFwcGluZ0Vycm9yIChbYnJvd3NlclNldFN0YXR1cywgdGVzdHNTdGF0dXMsIHRlc3RlZEFwcFN0YXR1c10pIHtcbiAgICAgICAgaWYgKCFicm93c2VyU2V0U3RhdHVzLmVycm9yKVxuICAgICAgICAgICAgYXdhaXQgYnJvd3NlclNldFN0YXR1cy5yZXN1bHQuZGlzcG9zZSgpO1xuXG4gICAgICAgIGlmICghdGVzdGVkQXBwU3RhdHVzLmVycm9yICYmIHRlc3RlZEFwcFN0YXR1cy5yZXN1bHQpXG4gICAgICAgICAgICBhd2FpdCB0ZXN0ZWRBcHBTdGF0dXMucmVzdWx0LmtpbGwoKTtcblxuICAgICAgICBpZiAodGVzdHNTdGF0dXMuZXJyb3IpXG4gICAgICAgICAgICB0aHJvdyB0ZXN0c1N0YXR1cy5lcnJvcjtcbiAgICAgICAgZWxzZSBpZiAodGVzdGVkQXBwU3RhdHVzLmVycm9yKVxuICAgICAgICAgICAgdGhyb3cgdGVzdGVkQXBwU3RhdHVzLmVycm9yO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aHJvdyBicm93c2VyU2V0U3RhdHVzLmVycm9yO1xuICAgIH1cblxuICAgIGFzeW5jIF9ib290c3RyYXBQYXJhbGxlbCAoYnJvd3NlckluZm8pIHtcbiAgICAgICAgbGV0IGJvb3RzdHJhcHBpbmdQcm9taXNlcyA9IFtcbiAgICAgICAgICAgIHRoaXMuX2dldEJyb3dzZXJDb25uZWN0aW9ucyhicm93c2VySW5mbyksXG4gICAgICAgICAgICB0aGlzLl9nZXRUZXN0cygpLFxuICAgICAgICAgICAgdGhpcy5fc3RhcnRUZXN0ZWRBcHAoKVxuICAgICAgICBdO1xuXG4gICAgICAgIGJvb3RzdHJhcHBpbmdQcm9taXNlcyA9IGJvb3RzdHJhcHBpbmdQcm9taXNlcy5tYXAocHJvbWlzZSA9PiB0aGlzLl93cmFwQm9vdHN0cmFwcGluZ1Byb21pc2UocHJvbWlzZSkpO1xuXG4gICAgICAgIGNvbnN0IGJvb3RzdHJhcHBpbmdTdGF0dXNlcyA9IGF3YWl0IFByb21pc2UuYWxsKGJvb3RzdHJhcHBpbmdQcm9taXNlcyk7XG5cbiAgICAgICAgaWYgKGJvb3RzdHJhcHBpbmdTdGF0dXNlcy5zb21lKHN0YXR1cyA9PiBzdGF0dXMuZXJyb3IpKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5faGFuZGxlQm9vdHN0cmFwcGluZ0Vycm9yKGJvb3RzdHJhcHBpbmdTdGF0dXNlcyk7XG5cbiAgICAgICAgY29uc3QgW2Jyb3dzZXJTZXQsIHRlc3RzLCB0ZXN0ZWRBcHBdID0gYm9vdHN0cmFwcGluZ1N0YXR1c2VzLm1hcChzdGF0dXMgPT4gc3RhdHVzLnJlc3VsdCk7XG5cbiAgICAgICAgcmV0dXJuIHsgYnJvd3NlclNldCwgdGVzdHMsIHRlc3RlZEFwcCB9O1xuICAgIH1cblxuICAgIC8vIEFQSVxuICAgIGFzeW5jIGNyZWF0ZVJ1bm5hYmxlQ29uZmlndXJhdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHJlcG9ydGVyUGx1Z2lucyA9IGF3YWl0IHRoaXMuX2dldFJlcG9ydGVyUGx1Z2lucygpO1xuXG4gICAgICAgIC8vIE5PVEU6IElmIGEgdXNlciBmb3Jnb3QgdG8gc3BlY2lmeSBhIGJyb3dzZXIsIGJ1dCBoYXMgc3BlY2lmaWVkIGEgcGF0aCB0byB0ZXN0cywgdGhlIHNwZWNpZmllZCBwYXRoIHdpbGwgYmVcbiAgICAgICAgLy8gY29uc2lkZXJlZCBhcyB0aGUgYnJvd3NlciBhcmd1bWVudCwgYW5kIHRoZSB0ZXN0cyBwYXRoIGFyZ3VtZW50IHdpbGwgaGF2ZSB0aGUgcHJlZGVmaW5lZCBkZWZhdWx0IHZhbHVlLlxuICAgICAgICAvLyBJdCdzIHZlcnkgYW1iaWd1b3VzIGZvciB0aGUgdXNlciwgd2hvIG1pZ2h0IGJlIGNvbmZ1c2VkIGJ5IGNvbXBpbGF0aW9uIGVycm9ycyBmcm9tIGFuIHVuZXhwZWN0ZWQgdGVzdC5cbiAgICAgICAgLy8gU28sIHdlIG5lZWQgdG8gcmV0cmlldmUgdGhlIGJyb3dzZXIgYWxpYXNlcyBhbmQgcGF0aHMgYmVmb3JlIHRlc3RzIGNvbXBpbGF0aW9uLlxuICAgICAgICBjb25zdCBicm93c2VySW5mbyA9IGF3YWl0IHRoaXMuX2dldEJyb3dzZXJJbmZvKCk7XG5cbiAgICAgICAgaWYgKGF3YWl0IHRoaXMuX2NhblVzZVBhcmFsbGVsQm9vdHN0cmFwcGluZyhicm93c2VySW5mbykpXG4gICAgICAgICAgICByZXR1cm4geyByZXBvcnRlclBsdWdpbnMsIC4uLmF3YWl0IHRoaXMuX2Jvb3RzdHJhcFBhcmFsbGVsKGJyb3dzZXJJbmZvKSB9O1xuXG4gICAgICAgIHJldHVybiB7IHJlcG9ydGVyUGx1Z2lucywgLi4uYXdhaXQgdGhpcy5fYm9vdHN0cmFwU2VxdWVuY2UoYnJvd3NlckluZm8pIH07XG4gICAgfVxufVxuIl19
