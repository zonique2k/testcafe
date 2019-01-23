'use strict';

exports.__esModule = true;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _lodash = require('lodash');

var _asyncEventEmitter = require('../utils/async-event-emitter');

var _asyncEventEmitter2 = _interopRequireDefault(_asyncEventEmitter);

var _testRunController = require('./test-run-controller');

var _testRunController2 = _interopRequireDefault(_testRunController);

var _sessionController = require('../test-run/session-controller');

var _sessionController2 = _interopRequireDefault(_sessionController);

var _browserJobResult = require('./browser-job-result');

var _browserJobResult2 = _interopRequireDefault(_browserJobResult);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Browser job
class BrowserJob extends _asyncEventEmitter2.default {
    constructor(tests, browserConnections, proxy, screenshots, warningLog, fixtureHookController, opts, context) {
        super();

        this.started = false;
        this.context = context;
        this.total = 0;
        this.passed = 0;
        this.opts = opts;
        this.proxy = proxy;
        this.browserConnections = browserConnections;
        this.screenshots = screenshots;
        this.warningLog = warningLog;
        this.fixtureHookController = fixtureHookController;
        this.result = null;

        this.testRunControllerQueue = tests.map((test, index) => this._createTestRunController(test, index));

        this.completionQueue = [];

        this.connectionErrorListener = error => this._setResult(_browserJobResult2.default.errored, error);

        this.browserConnections.map(bc => bc.once('error', this.connectionErrorListener));
    }

    _createTestRunController(test, index) {
        const testRunController = new _testRunController2.default(test, index + 1, this.proxy, this.screenshots, this.warningLog, this.fixtureHookController, this.opts, this.context);

        testRunController.on('test-run-start', () => this.emit('test-run-start', testRunController.testRun));
        testRunController.on('test-run-restart', () => this._onTestRunRestart(testRunController));
        testRunController.on('test-run-done', () => this._onTestRunDone(testRunController));

        return testRunController;
    }

    _setResult(status, data) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this.result) return;

            _this.result = { status, data };

            _this.browserConnections.forEach(function (bc) {
                return bc.removeListener('error', _this.connectionErrorListener);
            });

            yield _pinkie2.default.all(_this.browserConnections.map(function (bc) {
                return bc.reportJobResult(_this.result.status, _this.result.data);
            }));
        })();
    }

    _addToCompletionQueue(testRunInfo) {
        this.completionQueue.push(testRunInfo);
    }

    _removeFromCompletionQueue(testRunInfo) {
        (0, _lodash.remove)(this.completionQueue, testRunInfo);
    }

    _onTestRunRestart(testRunController) {
        this._removeFromCompletionQueue(testRunController);
        this.testRunControllerQueue.unshift(testRunController);
    }

    _onTestRunDone(testRunController) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            _this2.total++;

            if (!testRunController.testRun.errs.length) _this2.passed++;

            while (_this2.completionQueue.length && _this2.completionQueue[0].done) {
                testRunController = _this2.completionQueue.shift();

                yield _this2.emit('test-run-done', testRunController.testRun);
            }

            if (!_this2.completionQueue.length && !_this2.hasQueuedTestRuns) {
                if (!_this2.opts.live) _sessionController2.default.closeSession(testRunController.testRun);

                _this2._setResult(_browserJobResult2.default.done, { total: _this2.total, passed: _this2.passed }).then(function () {
                    return _this2.emit('done');
                });
            }
        })();
    }

    // API
    get hasQueuedTestRuns() {
        return !!this.testRunControllerQueue.length;
    }

    popNextTestRunUrl(connection) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            while (_this3.testRunControllerQueue.length) {
                // NOTE: before hook for test run fixture is currently
                // executing, so test run is temporary blocked
                const isBlocked = _this3.testRunControllerQueue[0].blocked;
                const isConcurrency = _this3.opts.concurrency > 1;
                const hasIncompleteTestRuns = _this3.completionQueue.some(function (controller) {
                    return !controller.done;
                });

                if (isBlocked || hasIncompleteTestRuns && !isConcurrency) break;

                const testRunController = _this3.testRunControllerQueue.shift();

                _this3._addToCompletionQueue(testRunController);

                if (!_this3.started) {
                    _this3.started = true;
                    yield _this3.emit('start');
                }

                const testRunUrl = yield testRunController.start(connection);

                if (testRunUrl) return testRunUrl;
            }

            return null;
        })();
    }

    abort() {
        this.clearListeners();
        this._setResult(_browserJobResult2.default.aborted);
        this.browserConnections.map(bc => bc.removeJob(this));
    }
}
exports.default = BrowserJob;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydW5uZXIvYnJvd3Nlci1qb2IuanMiXSwibmFtZXMiOlsiQnJvd3NlckpvYiIsIkFzeW5jRXZlbnRFbWl0dGVyIiwiY29uc3RydWN0b3IiLCJ0ZXN0cyIsImJyb3dzZXJDb25uZWN0aW9ucyIsInByb3h5Iiwic2NyZWVuc2hvdHMiLCJ3YXJuaW5nTG9nIiwiZml4dHVyZUhvb2tDb250cm9sbGVyIiwib3B0cyIsImNvbnRleHQiLCJzdGFydGVkIiwidG90YWwiLCJwYXNzZWQiLCJyZXN1bHQiLCJ0ZXN0UnVuQ29udHJvbGxlclF1ZXVlIiwibWFwIiwidGVzdCIsImluZGV4IiwiX2NyZWF0ZVRlc3RSdW5Db250cm9sbGVyIiwiY29tcGxldGlvblF1ZXVlIiwiY29ubmVjdGlvbkVycm9yTGlzdGVuZXIiLCJlcnJvciIsIl9zZXRSZXN1bHQiLCJSRVNVTFQiLCJlcnJvcmVkIiwiYmMiLCJvbmNlIiwidGVzdFJ1bkNvbnRyb2xsZXIiLCJUZXN0UnVuQ29udHJvbGxlciIsIm9uIiwiZW1pdCIsInRlc3RSdW4iLCJfb25UZXN0UnVuUmVzdGFydCIsIl9vblRlc3RSdW5Eb25lIiwic3RhdHVzIiwiZGF0YSIsImZvckVhY2giLCJyZW1vdmVMaXN0ZW5lciIsIlByb21pc2UiLCJhbGwiLCJyZXBvcnRKb2JSZXN1bHQiLCJfYWRkVG9Db21wbGV0aW9uUXVldWUiLCJ0ZXN0UnVuSW5mbyIsInB1c2giLCJfcmVtb3ZlRnJvbUNvbXBsZXRpb25RdWV1ZSIsInVuc2hpZnQiLCJlcnJzIiwibGVuZ3RoIiwiZG9uZSIsInNoaWZ0IiwiaGFzUXVldWVkVGVzdFJ1bnMiLCJsaXZlIiwiU2Vzc2lvbkNvbnRyb2xsZXIiLCJjbG9zZVNlc3Npb24iLCJ0aGVuIiwicG9wTmV4dFRlc3RSdW5VcmwiLCJjb25uZWN0aW9uIiwiaXNCbG9ja2VkIiwiYmxvY2tlZCIsImlzQ29uY3VycmVuY3kiLCJjb25jdXJyZW5jeSIsImhhc0luY29tcGxldGVUZXN0UnVucyIsInNvbWUiLCJjb250cm9sbGVyIiwidGVzdFJ1blVybCIsInN0YXJ0IiwiYWJvcnQiLCJjbGVhckxpc3RlbmVycyIsImFib3J0ZWQiLCJyZW1vdmVKb2IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBR0E7QUFDZSxNQUFNQSxVQUFOLFNBQXlCQywyQkFBekIsQ0FBMkM7QUFDdERDLGdCQUFhQyxLQUFiLEVBQW9CQyxrQkFBcEIsRUFBd0NDLEtBQXhDLEVBQStDQyxXQUEvQyxFQUE0REMsVUFBNUQsRUFBd0VDLHFCQUF4RSxFQUErRkMsSUFBL0YsRUFBcUdDLE9BQXJHLEVBQThHO0FBQzFHOztBQUVBLGFBQUtDLE9BQUwsR0FBZSxLQUFmO0FBQ0EsYUFBS0QsT0FBTCxHQUE2QkEsT0FBN0I7QUFDQSxhQUFLRSxLQUFMLEdBQTZCLENBQTdCO0FBQ0EsYUFBS0MsTUFBTCxHQUE2QixDQUE3QjtBQUNBLGFBQUtKLElBQUwsR0FBNkJBLElBQTdCO0FBQ0EsYUFBS0osS0FBTCxHQUE2QkEsS0FBN0I7QUFDQSxhQUFLRCxrQkFBTCxHQUE2QkEsa0JBQTdCO0FBQ0EsYUFBS0UsV0FBTCxHQUE2QkEsV0FBN0I7QUFDQSxhQUFLQyxVQUFMLEdBQTZCQSxVQUE3QjtBQUNBLGFBQUtDLHFCQUFMLEdBQTZCQSxxQkFBN0I7QUFDQSxhQUFLTSxNQUFMLEdBQTZCLElBQTdCOztBQUVBLGFBQUtDLHNCQUFMLEdBQThCWixNQUFNYSxHQUFOLENBQVUsQ0FBQ0MsSUFBRCxFQUFPQyxLQUFQLEtBQWlCLEtBQUtDLHdCQUFMLENBQThCRixJQUE5QixFQUFvQ0MsS0FBcEMsQ0FBM0IsQ0FBOUI7O0FBRUEsYUFBS0UsZUFBTCxHQUF1QixFQUF2Qjs7QUFFQSxhQUFLQyx1QkFBTCxHQUErQkMsU0FBUyxLQUFLQyxVQUFMLENBQWdCQywyQkFBT0MsT0FBdkIsRUFBZ0NILEtBQWhDLENBQXhDOztBQUVBLGFBQUtsQixrQkFBTCxDQUF3QlksR0FBeEIsQ0FBNEJV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SzdDLFVBQUwsQ0FBZ0JDLDJCQUFPNkMsT0FBdkI7QUFDQSxhQUFLakUsa0JBQUwsQ0FBd0JZLEdBQXhCLENBQTRCVSxNQUFNQSxHQUFHNEMsU0FBSCxDQUFhLElBQWIsQ0FBbEM7QUFDSDtBQXhIcUQ7a0JBQXJDdEUsVSIsImZpbGUiOiJydW5uZXIvYnJvd3Nlci1qb2IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUHJvbWlzZSBmcm9tICdwaW5raWUnO1xuaW1wb3J0IHsgcmVtb3ZlIH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBBc3luY0V2ZW50RW1pdHRlciBmcm9tICcuLi91dGlscy9hc3luYy1ldmVudC1lbWl0dGVyJztcbmltcG9ydCBUZXN0UnVuQ29udHJvbGxlciBmcm9tICcuL3Rlc3QtcnVuLWNvbnRyb2xsZXInO1xuaW1wb3J0IFNlc3Npb25Db250cm9sbGVyIGZyb20gJy4uL3Rlc3QtcnVuL3Nlc3Npb24tY29udHJvbGxlcic7XG5pbXBvcnQgUkVTVUxUIGZyb20gJy4vYnJvd3Nlci1qb2ItcmVzdWx0JztcblxuXG4vLyBCcm93c2VyIGpvYlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnJvd3NlckpvYiBleHRlbmRzIEFzeW5jRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvciAodGVzdHMsIGJyb3dzZXJDb25uZWN0aW9ucywgcHJveHksIHNjcmVlbnNob3RzLCB3YXJuaW5nTG9nLCBmaXh0dXJlSG9va0NvbnRyb2xsZXIsIG9wdHMsIGNvbnRleHQpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jb250ZXh0ICAgICAgICAgICAgICAgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLnRvdGFsICAgICAgICAgICAgICAgICA9IDA7XG4gICAgICAgIHRoaXMucGFzc2VkICAgICAgICAgICAgICAgID0gMDtcbiAgICAgICAgdGhpcy5vcHRzICAgICAgICAgICAgICAgICAgPSBvcHRzO1xuICAgICAgICB0aGlzLnByb3h5ICAgICAgICAgICAgICAgICA9IHByb3h5O1xuICAgICAgICB0aGlzLmJyb3dzZXJDb25uZWN0aW9ucyAgICA9IGJyb3dzZXJDb25uZWN0aW9ucztcbiAgICAgICAgdGhpcy5zY3JlZW5zaG90cyAgICAgICAgICAgPSBzY3JlZW5zaG90cztcbiAgICAgICAgdGhpcy53YXJuaW5nTG9nICAgICAgICAgICAgPSB3YXJuaW5nTG9nO1xuICAgICAgICB0aGlzLmZpeHR1cmVIb29rQ29udHJvbGxlciA9IGZpeHR1cmVIb29rQ29udHJvbGxlcjtcbiAgICAgICAgdGhpcy5yZXN1bHQgICAgICAgICAgICAgICAgPSBudWxsO1xuXG4gICAgICAgIHRoaXMudGVzdFJ1bkNvbnRyb2xsZXJRdWV1ZSA9IHRlc3RzLm1hcCgodGVzdCwgaW5kZXgpID0+IHRoaXMuX2NyZWF0ZVRlc3RSdW5Db250cm9sbGVyKHRlc3QsIGluZGV4KSk7XG5cbiAgICAgICAgdGhpcy5jb21wbGV0aW9uUXVldWUgPSBbXTtcblxuICAgICAgICB0aGlzLmNvbm5lY3Rpb25FcnJvckxpc3RlbmVyID0gZXJyb3IgPT4gdGhpcy5fc2V0UmVzdWx0KFJFU1VMVC5lcnJvcmVkLCBlcnJvcik7XG5cbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbnMubWFwKGJjID0+IGJjLm9uY2UoJ2Vycm9yJywgdGhpcy5jb25uZWN0aW9uRXJyb3JMaXN0ZW5lcikpO1xuICAgIH1cblxuICAgIF9jcmVhdGVUZXN0UnVuQ29udHJvbGxlciAodGVzdCwgaW5kZXgpIHtcbiAgICAgICAgY29uc3QgdGVzdFJ1bkNvbnRyb2xsZXIgPSBuZXcgVGVzdFJ1bkNvbnRyb2xsZXIodGVzdCwgaW5kZXggKyAxLCB0aGlzLnByb3h5LCB0aGlzLnNjcmVlbnNob3RzLCB0aGlzLndhcm5pbmdMb2csXG4gICAgICAgICAgICB0aGlzLmZpeHR1cmVIb29rQ29udHJvbGxlciwgdGhpcy5vcHRzLCB0aGlzLmNvbnRleHQpO1xuXG4gICAgICAgIHRlc3RSdW5Db250cm9sbGVyLm9uKCd0ZXN0LXJ1bi1zdGFydCcsICgpID0+IHRoaXMuZW1pdCgndGVzdC1ydW4tc3RhcnQnLCB0ZXN0UnVuQ29udHJvbGxlci50ZXN0UnVuKSk7XG4gICAgICAgIHRlc3RSdW5Db250cm9sbGVyLm9uKCd0ZXN0LXJ1bi1yZXN0YXJ0JywgKCkgPT4gdGhpcy5fb25UZXN0UnVuUmVzdGFydCh0ZXN0UnVuQ29udHJvbGxlcikpO1xuICAgICAgICB0ZXN0UnVuQ29udHJvbGxlci5vbigndGVzdC1ydW4tZG9uZScsICgpID0+IHRoaXMuX29uVGVzdFJ1bkRvbmUodGVzdFJ1bkNvbnRyb2xsZXIpKTtcblxuICAgICAgICByZXR1cm4gdGVzdFJ1bkNvbnRyb2xsZXI7XG4gICAgfVxuXG4gICAgYXN5bmMgX3NldFJlc3VsdCAoc3RhdHVzLCBkYXRhKSB7XG4gICAgICAgIGlmICh0aGlzLnJlc3VsdClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB0aGlzLnJlc3VsdCA9IHsgc3RhdHVzLCBkYXRhIH07XG5cbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbnMuZm9yRWFjaChiYyA9PiBiYy5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCB0aGlzLmNvbm5lY3Rpb25FcnJvckxpc3RlbmVyKSk7XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5icm93c2VyQ29ubmVjdGlvbnMubWFwKGJjID0+IGJjLnJlcG9ydEpvYlJlc3VsdCh0aGlzLnJlc3VsdC5zdGF0dXMsIHRoaXMucmVzdWx0LmRhdGEpKSk7XG4gICAgfVxuXG4gICAgX2FkZFRvQ29tcGxldGlvblF1ZXVlICh0ZXN0UnVuSW5mbykge1xuICAgICAgICB0aGlzLmNvbXBsZXRpb25RdWV1ZS5wdXNoKHRlc3RSdW5JbmZvKTtcbiAgICB9XG5cbiAgICBfcmVtb3ZlRnJvbUNvbXBsZXRpb25RdWV1ZSAodGVzdFJ1bkluZm8pIHtcbiAgICAgICAgcmVtb3ZlKHRoaXMuY29tcGxldGlvblF1ZXVlLCB0ZXN0UnVuSW5mbyk7XG4gICAgfVxuXG4gICAgX29uVGVzdFJ1blJlc3RhcnQgKHRlc3RSdW5Db250cm9sbGVyKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZUZyb21Db21wbGV0aW9uUXVldWUodGVzdFJ1bkNvbnRyb2xsZXIpO1xuICAgICAgICB0aGlzLnRlc3RSdW5Db250cm9sbGVyUXVldWUudW5zaGlmdCh0ZXN0UnVuQ29udHJvbGxlcik7XG4gICAgfVxuXG4gICAgYXN5bmMgX29uVGVzdFJ1bkRvbmUgKHRlc3RSdW5Db250cm9sbGVyKSB7XG4gICAgICAgIHRoaXMudG90YWwrKztcblxuICAgICAgICBpZiAoIXRlc3RSdW5Db250cm9sbGVyLnRlc3RSdW4uZXJycy5sZW5ndGgpXG4gICAgICAgICAgICB0aGlzLnBhc3NlZCsrO1xuXG4gICAgICAgIHdoaWxlICh0aGlzLmNvbXBsZXRpb25RdWV1ZS5sZW5ndGggJiYgdGhpcy5jb21wbGV0aW9uUXVldWVbMF0uZG9uZSkge1xuICAgICAgICAgICAgdGVzdFJ1bkNvbnRyb2xsZXIgPSB0aGlzLmNvbXBsZXRpb25RdWV1ZS5zaGlmdCgpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVtaXQoJ3Rlc3QtcnVuLWRvbmUnLCB0ZXN0UnVuQ29udHJvbGxlci50ZXN0UnVuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5jb21wbGV0aW9uUXVldWUubGVuZ3RoICYmICF0aGlzLmhhc1F1ZXVlZFRlc3RSdW5zKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0cy5saXZlKVxuICAgICAgICAgICAgICAgIFNlc3Npb25Db250cm9sbGVyLmNsb3NlU2Vzc2lvbih0ZXN0UnVuQ29udHJvbGxlci50ZXN0UnVuKTtcblxuICAgICAgICAgICAgdGhpc1xuICAgICAgICAgICAgICAgIC5fc2V0UmVzdWx0KFJFU1VMVC5kb25lLCB7IHRvdGFsOiB0aGlzLnRvdGFsLCBwYXNzZWQ6IHRoaXMucGFzc2VkIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5lbWl0KCdkb25lJykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQVBJXG4gICAgZ2V0IGhhc1F1ZXVlZFRlc3RSdW5zICgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy50ZXN0UnVuQ29udHJvbGxlclF1ZXVlLmxlbmd0aDtcbiAgICB9XG5cbiAgICBhc3luYyBwb3BOZXh0VGVzdFJ1blVybCAoY29ubmVjdGlvbikge1xuICAgICAgICB3aGlsZSAodGhpcy50ZXN0UnVuQ29udHJvbGxlclF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gTk9URTogYmVmb3JlIGhvb2sgZm9yIHRlc3QgcnVuIGZpeHR1cmUgaXMgY3VycmVudGx5XG4gICAgICAgICAgICAvLyBleGVjdXRpbmcsIHNvIHRlc3QgcnVuIGlzIHRlbXBvcmFyeSBibG9ja2VkXG4gICAgICAgICAgICBjb25zdCBpc0Jsb2NrZWQgICAgICAgICAgICAgPSB0aGlzLnRlc3RSdW5Db250cm9sbGVyUXVldWVbMF0uYmxvY2tlZDtcbiAgICAgICAgICAgIGNvbnN0IGlzQ29uY3VycmVuY3kgICAgICAgICA9IHRoaXMub3B0cy5jb25jdXJyZW5jeSA+IDE7XG4gICAgICAgICAgICBjb25zdCBoYXNJbmNvbXBsZXRlVGVzdFJ1bnMgPSB0aGlzLmNvbXBsZXRpb25RdWV1ZS5zb21lKGNvbnRyb2xsZXIgPT4gIWNvbnRyb2xsZXIuZG9uZSk7XG5cbiAgICAgICAgICAgIGlmIChpc0Jsb2NrZWQgfHwgaGFzSW5jb21wbGV0ZVRlc3RSdW5zICYmICFpc0NvbmN1cnJlbmN5KVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjb25zdCB0ZXN0UnVuQ29udHJvbGxlciA9IHRoaXMudGVzdFJ1bkNvbnRyb2xsZXJRdWV1ZS5zaGlmdCgpO1xuXG4gICAgICAgICAgICB0aGlzLl9hZGRUb0NvbXBsZXRpb25RdWV1ZSh0ZXN0UnVuQ29udHJvbGxlcik7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmVtaXQoJ3N0YXJ0Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHRlc3RSdW5VcmwgPSBhd2FpdCB0ZXN0UnVuQ29udHJvbGxlci5zdGFydChjb25uZWN0aW9uKTtcblxuICAgICAgICAgICAgaWYgKHRlc3RSdW5VcmwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRlc3RSdW5Vcmw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBhYm9ydCAoKSB7XG4gICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lcnMoKTtcbiAgICAgICAgdGhpcy5fc2V0UmVzdWx0KFJFU1VMVC5hYm9ydGVkKTtcbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbnMubWFwKGJjID0+IGJjLnJlbW92ZUpvYih0aGlzKSk7XG4gICAgfVxufVxuIl19
