'use strict';

exports.__esModule = true;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _asyncEventEmitter = require('../utils/async-event-emitter');

var _asyncEventEmitter2 = _interopRequireDefault(_asyncEventEmitter);

var _testcafeLegacyApi = require('testcafe-legacy-api');

var _testRun = require('../test-run');

var _testRun2 = _interopRequireDefault(_testRun);

var _sessionController = require('../test-run/session-controller');

var _sessionController2 = _interopRequireDefault(_sessionController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const QUARANTINE_THRESHOLD = 3;
const DISCONNECT_THRESHOLD = 3;

class Quarantine {
    constructor() {
        this.attempts = [];
    }

    getFailedAttempts() {
        return this.attempts.filter(errors => !!errors.length);
    }

    getPassedAttempts() {
        return this.attempts.filter(errors => errors.length === 0);
    }

    getNextAttemptNumber() {
        return this.attempts.length + 1;
    }

    isThresholdReached() {
        const failedTimes = this.getFailedAttempts().length;
        const passedTimes = this.getPassedAttempts().length;
        const failedThresholdReached = failedTimes >= QUARANTINE_THRESHOLD;
        const passedThresholdReached = passedTimes >= QUARANTINE_THRESHOLD;

        return failedThresholdReached || passedThresholdReached;
    }
}

class TestRunController extends _asyncEventEmitter2.default {
    constructor(test, index, proxy, screenshots, warningLog, fixtureHookController, opts, context) {
        super();

        this.context = context;

        this.test = test;
        this.index = index;
        this.opts = opts;

        this.proxy = proxy;
        this.screenshots = screenshots;
        this.warningLog = warningLog;
        this.fixtureHookController = fixtureHookController;

        this.TestRunCtor = TestRunController._getTestRunCtor(test, opts);

        this.testRun = null;
        this.done = false;
        this.quarantine = null;
        this.disconnectionCount = 0;

        if (this.opts.quarantineMode) this.quarantine = new Quarantine();
    }

    static _getTestRunCtor(test, opts) {
        if (opts.TestRunCtor) return opts.TestRunCtor;

        return test.isLegacy ? _testcafeLegacyApi.TestRun : _testRun2.default;
    }

    _createTestRun(connection) {
        const screenshotCapturer = this.screenshots.createCapturerFor(this.test, this.index, this.quarantine, connection, this.warningLog);
        const TestRunCtor = this.TestRunCtor;

        this.testRun = new TestRunCtor(this.test, connection, screenshotCapturer, this.warningLog, this.opts, this.context);

        if (this.testRun.addQuarantineInfo) this.testRun.addQuarantineInfo(this.quarantine);

        return this.testRun;
    }

    _endQuarantine() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this.quarantine.attempts.length > 1) _this.testRun.unstable = _this.quarantine.getPassedAttempts().length > 0;

            yield _this._emitTestRunDone();
        })();
    }

    _shouldKeepInQuarantine() {
        const errors = this.testRun.errs;
        const hasErrors = !!errors.length;
        const attempts = this.quarantine.attempts;

        attempts.push(errors);

        const isFirstAttempt = attempts.length === 1;

        return isFirstAttempt ? hasErrors : !this.quarantine.isThresholdReached();
    }

    _keepInQuarantine() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            yield _this2._restartTest();
        })();
    }

    _restartTest() {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            yield _this3.emit('test-run-restart');
        })();
    }

    _testRunDoneInQuarantineMode() {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this4._shouldKeepInQuarantine()) yield _this4._keepInQuarantine();else yield _this4._endQuarantine();
        })();
    }

    _testRunDone() {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this5.quarantine) yield _this5._testRunDoneInQuarantineMode();else yield _this5._emitTestRunDone();
        })();
    }

    _emitTestRunDone() {
        var _this6 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            // NOTE: we should report test run completion in order they were completed in browser.
            // To keep a sequence after fixture hook execution we use completion queue.
            yield _this6.fixtureHookController.runFixtureAfterHookIfNecessary(_this6.testRun);

            _this6.done = true;

            yield _this6.emit('test-run-done');
        })();
    }

    _testRunDisconnected(connection) {
        var _this7 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            _this7.disconnectionCount++;

            if (_this7.disconnectionCount < DISCONNECT_THRESHOLD) {
                connection.suppressError();

                yield connection.restartBrowser();

                yield _this7._restartTest();
            }
        })();
    }

    get blocked() {
        return this.fixtureHookController.isTestBlocked(this.test);
    }

    start(connection) {
        var _this8 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const testRun = _this8._createTestRun(connection);

            const hookOk = yield _this8.fixtureHookController.runFixtureBeforeHookIfNecessary(testRun);

            if (_this8.test.skip || !hookOk) {
                yield _this8.emit('test-run-start');
                yield _this8._emitTestRunDone();
                return null;
            }

            testRun.once('start', function () {
                return _this8.emit('test-run-start');
            });
            testRun.once('done', function () {
                return _this8._testRunDone();
            });
            testRun.once('disconnected', function () {
                return _this8._testRunDisconnected(connection);
            });

            testRun.start();

            return _sessionController2.default.getSessionUrl(testRun, _this8.proxy);
        })();
    }
}
exports.default = TestRunController;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydW5uZXIvdGVzdC1ydW4tY29udHJvbGxlci5qcyJdLCJuYW1lcyI6WyJRVUFSQU5USU5FX1RIUkVTSE9MRCIsIkRJU0NPTk5FQ1RfVEhSRVNIT0xEIiwiUXVhcmFudGluZSIsImNvbnN0cnVjdG9yIiwiYXR0ZW1wdHMiLCJnZXRGYWlsZWRBdHRlbXB0cyIsImZpbHRlciIsImVycm9ycyIsImxlbmd0aCIsImdldFBhc3NlZEF0dGVtcHRzIiwiZ2V0TmV4dEF0dGVtcHROdW1iZXIiLCJpc1RocmVzaG9sZFJlYWNoZWQiLCJmYWlsZWRUaW1lcyIsInBhc3NlZFRpbWVzIiwiZmFpbGVkVGhyZXNob2xkUmVhY2hlZCIsInBhc3NlZFRocmVzaG9sZFJlYWNoZWQiLCJUZXN0UnVuQ29udHJvbGxlciIsIkFzeW5jRXZlbnRFbWl0dGVyIiwidGVzdCIsImluZGV4IiwicHJveHkiLCJzY3JlZW5zaG90cyIsIndhcm5pbmdMb2ciLCJmaXh0dXJlSG9va0NvbnRyb2xsZXIiLCJvcHRzIiwiY29udGV4dCIsIlRlc3RSdW5DdG9yIiwiX2dldFRlc3RSdW5DdG9yIiwidGVzdFJ1biIsImRvbmUiLCJxdWFyYW50aW5lIiwiZGlzY29ubmVjdGlvbkNvdW50IiwicXVhcmFudGluZU1vZGUiLCJpc0xlZ2FjeSIsIkxlZ2FjeVRlc3RSdW4iLCJUZXN0UnVuIiwiX2NyZWF0ZVRlc3RSdW4iLCJjb25uZWN0aW9uIiwic2NyZWVuc2hvdENhcHR1cmVyIiwiY3JlYXRlQ2FwdHVyZXJGb3IiLCJhZGRRdWFyYW50aW5lSW5mbyIsIl9lbmRRdWFyYW50aW5lIiwidW5zdGFibGUiLCJfZW1pdFRlc3RSdW5Eb25lIiwiX3Nob3VsZEtlZXBJblF1YXJhbnRpbmUiLCJlcnJzIiwiaGFzRXJyb3JzIiwicHVzaCIsImlzRmlyc3RBdHRlbXB0IiwiX2tlZXBJblF1YXJhbnRpbmUiLCJfcmVzdGFydFRlc3QiLCJlbWl0IiwiX3Rlc3RSdW5Eb25lSW5RdWFyYW50aW5lTW9kZSIsIl90ZXN0UnVuRG9uZSIsInJ1bkZpeHR1cmVBZnRlckhvb2tJZk5lY2Vzc2FyeSIsIl90ZXN0UnVuRGlzY29ubmVjdGVkIiwic3VwcHJlc3NFcnJvciIsInJlc3RhcnRCcm93c2VyIiwiYmxvY2tlZCIsImlzVGVzdEJsb2NrZWQiLCJzdGFydCIsImhvb2tPayIsInJ1bkZpeHR1cmVCZWZvcmVIb29rSWZOZWNlc3NhcnkiLCJza2lwIiwib25jZSIsIlNlc3Npb25Db250cm9sbGVyIiwiZ2V0U2Vzc2lvblVybCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLE1BQU1BLHVCQUF1QixDQUE3QjtBQUNBLE1BQU1DLHVCQUF1QixDQUE3Qjs7QUFFQSxNQUFNQyxVQUFOLENBQWlCO0FBQ2JDLGtCQUFlO0FBQ1gsYUFBS0MsUUFBTCxHQUFnQixFQUFoQjtBQUNIOztBQUVEQyx3QkFBcUI7QUFDakIsZUFBTyxLQUFLRCxRQUFMLENBQWNFLE1BQWQsQ0FBcUJDLFVBQVUsQ0FBQyxDQUFDQSxPQUFPQyxNQUF4QyxDQUFQO0FBQ0g7O0FBRURDLHdCQUFxQjtBQUNqQixlQUFPLEtBQUtMLFFBQUwsQ0FBY0UsTUFBZCxDQUFxQkMsVUFBVUEsT0FBT0MsTUFBUCxLQUFrQixDQUFqRCxDQUFQO0FBQ0g7O0FBRURFLDJCQUF3QjtBQUNwQixlQUFPLEtBQUtOLFFBQUwsQ0FBY0ksTUFBZCxHQUF1QixDQUE5QjtBQUNIOztBQUVERyx5QkFBc0I7QUFDbEIsY0FBTUMsY0FBeUIsS0FBS1AsaUJBQUwsR0FBeUJHLE1BQXhEO0FBQ0EsY0FBTUssY0FBeUIsS0FBS0osaUJBQUwsR0FBeUJELE1BQXhEO0FBQ0EsY0FBTU0seUJBQXlCRixlQUFlWixvQkFBOUM7QUFDQSxjQUFNZSx5QkFBeUJGLGVBQWViLG9CQUE5Qzs7QUFFQSxlQUFPYywwQkFBMEJDLHNCQUFqQztBQUNIO0FBeEJZOztBQTJCRixNQUFNQyxpQkFBTixTQUFnQ0MsMkJBQWhDLENBQWtEO0FBQzdEZCxnQkFBYWUs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QUFLdEMscUJBQUwsQ0FBMkJ1QywrQkFBM0IsQ0FBMkRsQyxPQUEzRCxDQUFyQjs7QUFFQSxnQkFBSSxPQUFLVixJQUFMLENBQVU2QyxJQUFWLElBQWtCLENBQUNGLE1BQXZCLEVBQStCO0FBQzNCLHNCQUFNLE9BQUtWLElBQUwsQ0FBVSxnQkFBVixDQUFOO0FBQ0Esc0JBQU0sT0FBS1IsZ0JBQUwsRUFBTjtBQUNBLHVCQUFPLElBQVA7QUFDSDs7QUFFRGYsb0JBQVFvQyxJQUFSLENBQWEsT0FBYixFQUFzQjtBQUFBLHVCQUFNLE9BQUtiLElBQUwsQ0FBVSxnQkFBVixDQUFOO0FBQUEsYUFBdEI7QUFDQXZCLG9CQUFRb0MsSUFBUixDQUFhLE1BQWIsRUFBcUI7QUFBQSx1QkFBTSxPQUFLWCxZQUFMLEVBQU47QUFBQSxhQUFyQjtBQUNBekIsb0JBQVFvQyxJQUFSLENBQWEsY0FBYixFQUE2QjtBQUFBLHVCQUFNLE9BQUtULG9CQUFMLENBQTBCbEIsVUFBMUIsQ0FBTjtBQUFBLGFBQTdCOztBQUVBVCxvQkFBUWdDLEtBQVI7O0FBRUEsbUJBQU9LLDRCQUFrQkMsYUFBbEIsQ0FBZ0N0QyxPQUFoQyxFQUF5QyxPQUFLUixLQUE5QyxDQUFQO0FBakJxQjtBQWtCeEI7QUFsSTREO2tCQUE1Q0osaUIiLCJmaWxlIjoicnVubmVyL3Rlc3QtcnVuLWNvbnRyb2xsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQXN5bmNFdmVudEVtaXR0ZXIgZnJvbSAnLi4vdXRpbHMvYXN5bmMtZXZlbnQtZW1pdHRlcic7XG5pbXBvcnQgeyBUZXN0UnVuIGFzIExlZ2FjeVRlc3RSdW4gfSBmcm9tICd0ZXN0Y2FmZS1sZWdhY3ktYXBpJztcbmltcG9ydCBUZXN0UnVuIGZyb20gJy4uL3Rlc3QtcnVuJztcbmltcG9ydCBTZXNzaW9uQ29udHJvbGxlciBmcm9tICcuLi90ZXN0LXJ1bi9zZXNzaW9uLWNvbnRyb2xsZXInO1xuXG5jb25zdCBRVUFSQU5USU5FX1RIUkVTSE9MRCA9IDM7XG5jb25zdCBESVNDT05ORUNUX1RIUkVTSE9MRCA9IDM7XG5cbmNsYXNzIFF1YXJhbnRpbmUge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5hdHRlbXB0cyA9IFtdO1xuICAgIH1cblxuICAgIGdldEZhaWxlZEF0dGVtcHRzICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0ZW1wdHMuZmlsdGVyKGVycm9ycyA9PiAhIWVycm9ycy5sZW5ndGgpO1xuICAgIH1cblxuICAgIGdldFBhc3NlZEF0dGVtcHRzICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0ZW1wdHMuZmlsdGVyKGVycm9ycyA9PiBlcnJvcnMubGVuZ3RoID09PSAwKTtcbiAgICB9XG5cbiAgICBnZXROZXh0QXR0ZW1wdE51bWJlciAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dGVtcHRzLmxlbmd0aCArIDE7XG4gICAgfVxuXG4gICAgaXNUaHJlc2hvbGRSZWFjaGVkICgpIHtcbiAgICAgICAgY29uc3QgZmFpbGVkVGltZXMgICAgICAgICAgICA9IHRoaXMuZ2V0RmFpbGVkQXR0ZW1wdHMoKS5sZW5ndGg7XG4gICAgICAgIGNvbnN0IHBhc3NlZFRpbWVzICAgICAgICAgICAgPSB0aGlzLmdldFBhc3NlZEF0dGVtcHRzKCkubGVuZ3RoO1xuICAgICAgICBjb25zdCBmYWlsZWRUaHJlc2hvbGRSZWFjaGVkID0gZmFpbGVkVGltZXMgPj0gUVVBUkFOVElORV9USFJFU0hPTEQ7XG4gICAgICAgIGNvbnN0IHBhc3NlZFRocmVzaG9sZFJlYWNoZWQgPSBwYXNzZWRUaW1lcyA+PSBRVUFSQU5USU5FX1RIUkVTSE9MRDtcblxuICAgICAgICByZXR1cm4gZmFpbGVkVGhyZXNob2xkUmVhY2hlZCB8fCBwYXNzZWRUaHJlc2hvbGRSZWFjaGVkO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGVzdFJ1bkNvbnRyb2xsZXIgZXh0ZW5kcyBBc3luY0V2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IgKHRlc3QsIGluZGV4LCBwcm94eSwgc2NyZWVuc2hvdHMsIHdhcm5pbmdMb2csIGZpeHR1cmVIb29rQ29udHJvbGxlciwgb3B0cywgY29udGV4dCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG5cbiAgICAgICAgdGhpcy50ZXN0ICA9IHRlc3Q7XG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICAgICAgdGhpcy5vcHRzICA9IG9wdHM7XG5cbiAgICAgICAgdGhpcy5wcm94eSAgICAgICAgICAgICAgICAgPSBwcm94eTtcbiAgICAgICAgdGhpcy5zY3JlZW5zaG90cyAgICAgICAgICAgPSBzY3JlZW5zaG90cztcbiAgICAgICAgdGhpcy53YXJuaW5nTG9nICAgICAgICAgICAgPSB3YXJuaW5nTG9nO1xuICAgICAgICB0aGlzLmZpeHR1cmVIb29rQ29udHJvbGxlciA9IGZpeHR1cmVIb29rQ29udHJvbGxlcjtcblxuICAgICAgICB0aGlzLlRlc3RSdW5DdG9yID0gVGVzdFJ1bkNvbnRyb2xsZXIuX2dldFRlc3RSdW5DdG9yKHRlc3QsIG9wdHMpO1xuXG4gICAgICAgIHRoaXMudGVzdFJ1biAgICAgICAgICAgID0gbnVsbDtcbiAgICAgICAgdGhpcy5kb25lICAgICAgICAgICAgICAgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5xdWFyYW50aW5lICAgICAgICAgPSBudWxsO1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3Rpb25Db3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0cy5xdWFyYW50aW5lTW9kZSlcbiAgICAgICAgICAgIHRoaXMucXVhcmFudGluZSA9IG5ldyBRdWFyYW50aW5lKCk7XG4gICAgfVxuXG4gICAgc3RhdGljIF9nZXRUZXN0UnVuQ3RvciAodGVzdCwgb3B0cykge1xuICAgICAgICBpZiAob3B0cy5UZXN0UnVuQ3RvcilcbiAgICAgICAgICAgIHJldHVybiBvcHRzLlRlc3RSdW5DdG9yO1xuXG4gICAgICAgIHJldHVybiB0ZXN0LmlzTGVnYWN5ID8gTGVnYWN5VGVzdFJ1biA6IFRlc3RSdW47XG4gICAgfVxuXG4gICAgX2NyZWF0ZVRlc3RSdW4gKGNvbm5lY3Rpb24pIHtcbiAgICAgICAgY29uc3Qgc2NyZWVuc2hvdENhcHR1cmVyID0gdGhpcy5zY3JlZW5zaG90cy5jcmVhdGVDYXB0dXJlckZvcih0aGlzLnRlc3QsIHRoaXMuaW5kZXgsIHRoaXMucXVhcmFudGluZSwgY29ubmVjdGlvbiwgdGhpcy53YXJuaW5nTG9nKTtcbiAgICAgICAgY29uc3QgVGVzdFJ1bkN0b3IgICAgICAgID0gdGhpcy5UZXN0UnVuQ3RvcjtcblxuICAgICAgICB0aGlzLnRlc3RSdW4gPSBuZXcgVGVzdFJ1bkN0b3IodGhpcy50ZXN0LCBjb25uZWN0aW9uLCBzY3JlZW5zaG90Q2FwdHVyZXIsIHRoaXMud2FybmluZ0xvZywgdGhpcy5vcHRzLCB0aGlzLmNvbnRleHQpO1xuXG4gICAgICAgIGlmICh0aGlzLnRlc3RSdW4uYWRkUXVhcmFudGluZUluZm8pXG4gICAgICAgICAgICB0aGlzLnRlc3RSdW4uYWRkUXVhcmFudGluZUluZm8odGhpcy5xdWFyYW50aW5lKTtcblxuICAgICAgICByZXR1cm4gdGhpcy50ZXN0UnVuO1xuICAgIH1cblxuICAgIGFzeW5jIF9lbmRRdWFyYW50aW5lICgpIHtcbiAgICAgICAgaWYgKHRoaXMucXVhcmFudGluZS5hdHRlbXB0cy5sZW5ndGggPiAxKVxuICAgICAgICAgICAgdGhpcy50ZXN0UnVuLnVuc3RhYmxlID0gdGhpcy5xdWFyYW50aW5lLmdldFBhc3NlZEF0dGVtcHRzKCkubGVuZ3RoID4gMDtcblxuICAgICAgICBhd2FpdCB0aGlzLl9lbWl0VGVzdFJ1bkRvbmUoKTtcbiAgICB9XG5cbiAgICBfc2hvdWxkS2VlcEluUXVhcmFudGluZSAoKSB7XG4gICAgICAgIGNvbnN0IGVycm9ycyAgICA9IHRoaXMudGVzdFJ1bi5lcnJzO1xuICAgICAgICBjb25zdCBoYXNFcnJvcnMgPSAhIWVycm9ycy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGF0dGVtcHRzICA9IHRoaXMucXVhcmFudGluZS5hdHRlbXB0cztcblxuICAgICAgICBhdHRlbXB0cy5wdXNoKGVycm9ycyk7XG5cbiAgICAgICAgY29uc3QgaXNGaXJzdEF0dGVtcHQgPSBhdHRlbXB0cy5sZW5ndGggPT09IDE7XG5cbiAgICAgICAgcmV0dXJuIGlzRmlyc3RBdHRlbXB0ID8gaGFzRXJyb3JzIDogIXRoaXMucXVhcmFudGluZS5pc1RocmVzaG9sZFJlYWNoZWQoKTtcbiAgICB9XG5cbiAgICBhc3luYyBfa2VlcEluUXVhcmFudGluZSAoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuX3Jlc3RhcnRUZXN0KCk7XG4gICAgfVxuXG4gICAgYXN5bmMgX3Jlc3RhcnRUZXN0ICgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5lbWl0KCd0ZXN0LXJ1bi1yZXN0YXJ0Jyk7XG4gICAgfVxuXG4gICAgYXN5bmMgX3Rlc3RSdW5Eb25lSW5RdWFyYW50aW5lTW9kZSAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9zaG91bGRLZWVwSW5RdWFyYW50aW5lKCkpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9rZWVwSW5RdWFyYW50aW5lKCk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2VuZFF1YXJhbnRpbmUoKTtcbiAgICB9XG5cbiAgICBhc3luYyBfdGVzdFJ1bkRvbmUgKCkge1xuICAgICAgICBpZiAodGhpcy5xdWFyYW50aW5lKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fdGVzdFJ1bkRvbmVJblF1YXJhbnRpbmVNb2RlKCk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2VtaXRUZXN0UnVuRG9uZSgpO1xuICAgIH1cblxuICAgIGFzeW5jIF9lbWl0VGVzdFJ1bkRvbmUgKCkge1xuICAgICAgICAvLyBOT1RFOiB3ZSBzaG91bGQgcmVwb3J0IHRlc3QgcnVuIGNvbXBsZXRpb24gaW4gb3JkZXIgdGhleSB3ZXJlIGNvbXBsZXRlZCBpbiBicm93c2VyLlxuICAgICAgICAvLyBUbyBrZWVwIGEgc2VxdWVuY2UgYWZ0ZXIgZml4dHVyZSBob29rIGV4ZWN1dGlvbiB3ZSB1c2UgY29tcGxldGlvbiBxdWV1ZS5cbiAgICAgICAgYXdhaXQgdGhpcy5maXh0dXJlSG9va0NvbnRyb2xsZXIucnVuRml4dHVyZUFmdGVySG9va0lmTmVjZXNzYXJ5KHRoaXMudGVzdFJ1bik7XG5cbiAgICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcblxuICAgICAgICBhd2FpdCB0aGlzLmVtaXQoJ3Rlc3QtcnVuLWRvbmUnKTtcbiAgICB9XG5cbiAgICBhc3luYyBfdGVzdFJ1bkRpc2Nvbm5lY3RlZCAoY29ubmVjdGlvbikge1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3Rpb25Db3VudCsrO1xuXG4gICAgICAgIGlmICh0aGlzLmRpc2Nvbm5lY3Rpb25Db3VudCA8IERJU0NPTk5FQ1RfVEhSRVNIT0xEKSB7XG4gICAgICAgICAgICBjb25uZWN0aW9uLnN1cHByZXNzRXJyb3IoKTtcblxuICAgICAgICAgICAgYXdhaXQgY29ubmVjdGlvbi5yZXN0YXJ0QnJvd3NlcigpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9yZXN0YXJ0VGVzdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGJsb2NrZWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5maXh0dXJlSG9va0NvbnRyb2xsZXIuaXNUZXN0QmxvY2tlZCh0aGlzLnRlc3QpO1xuICAgIH1cblxuICAgIGFzeW5jIHN0YXJ0IChjb25uZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHRlc3RSdW4gPSB0aGlzLl9jcmVhdGVUZXN0UnVuKGNvbm5lY3Rpb24pO1xuXG4gICAgICAgIGNvbnN0IGhvb2tPayA9IGF3YWl0IHRoaXMuZml4dHVyZUhvb2tDb250cm9sbGVyLnJ1bkZpeHR1cmVCZWZvcmVIb29rSWZOZWNlc3NhcnkodGVzdFJ1bik7XG5cbiAgICAgICAgaWYgKHRoaXMudGVzdC5za2lwIHx8ICFob29rT2spIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW1pdCgndGVzdC1ydW4tc3RhcnQnKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2VtaXRUZXN0UnVuRG9uZSgpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0ZXN0UnVuLm9uY2UoJ3N0YXJ0JywgKCkgPT4gdGhpcy5lbWl0KCd0ZXN0LXJ1bi1zdGFydCcpKTtcbiAgICAgICAgdGVzdFJ1bi5vbmNlKCdkb25lJywgKCkgPT4gdGhpcy5fdGVzdFJ1bkRvbmUoKSk7XG4gICAgICAgIHRlc3RSdW4ub25jZSgnZGlzY29ubmVjdGVkJywgKCkgPT4gdGhpcy5fdGVzdFJ1bkRpc2Nvbm5lY3RlZChjb25uZWN0aW9uKSk7XG5cbiAgICAgICAgdGVzdFJ1bi5zdGFydCgpO1xuXG4gICAgICAgIHJldHVybiBTZXNzaW9uQ29udHJvbGxlci5nZXRTZXNzaW9uVXJsKHRlc3RSdW4sIHRoaXMucHJveHkpO1xuICAgIH1cbn1cbiJdfQ==
