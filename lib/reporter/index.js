'use strict';

exports.__esModule = true;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _lodash = require('lodash');

var _isStream = require('is-stream');

var _pluginHost = require('./plugin-host');

var _pluginHost2 = _interopRequireDefault(_pluginHost);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Reporter {
    constructor(plugin, task, outStream) {
        this.plugin = new _pluginHost2.default(plugin, outStream);
        this.task = task;

        this.disposed = false;
        this.passed = 0;
        this.failed = 0;
        this.skipped = 0;
        this.testCount = task.tests.filter(test => !test.skip).length;
        this.reportQueue = Reporter._createReportQueue(task);
        this.stopOnFirstFail = task.opts.stopOnFirstFail;
        this.outStream = outStream;

        this._assignTaskEventHandlers();
    }

    static _isSpecialStream(stream) {
        return stream.isTTY || stream === process.stdout || stream === process.stderr;
    }

    static _createPendingPromise() {
        let resolver = null;

        const promise = new _pinkie2.default(resolve => {
            resolver = resolve;
        });

        promise.resolve = resolver;

        return promise;
    }

    static _createReportItem(test, runsPerTest) {
        return {
            fixture: test.fixture,
            test: test,
            screenshotPath: null,
            screenshots: [],
            quarantine: null,
            errs: [],
            warnings: [],
            unstable: false,
            startTime: null,
            testRunInfo: null,

            pendingRuns: runsPerTest,
            pendingPromise: Reporter._createPendingPromise()
        };
    }

    static _createReportQueue(task) {
        const runsPerTest = task.browserConnectionGroups.length;

        return task.tests.map(test => Reporter._createReportItem(test, runsPerTest));
    }

    static _createTestRunInfo(reportItem) {
        return {
            errs: (0, _lodash.sortBy)(reportItem.errs, ['userAgent', 'type']),
            warnings: reportItem.warnings,
            durationMs: new Date() - reportItem.startTime,
            unstable: reportItem.unstable,
            screenshotPath: reportItem.screenshotPath,
            screenshots: reportItem.screenshots,
            quarantine: reportItem.quarantine,
            skipped: reportItem.test.skip
        };
    }

    _getReportItemForTestRun(testRun) {
        return (0, _lodash.find)(this.reportQueue, i => i.test === testRun.test);
    }

    _shiftReportQueue(reportItem) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            let currentFixture = null;
            let nextReportItem = null;

            while (_this.reportQueue.length && _this.reportQueue[0].testRunInfo) {
                reportItem = _this.reportQueue.shift();
                currentFixture = reportItem.fixture;

                yield _this.plugin.reportTestDone(reportItem.test.name, reportItem.testRunInfo, reportItem.test.meta);

                // NOTE: here we assume that tests are sorted by fixture.
                // Therefore, if the next report item has a different
                // fixture, we can report this fixture start.
                nextReportItem = _this.reportQueue[0];

                if (nextReportItem && nextReportItem.fixture !== currentFixture) yield _this.plugin.reportFixtureStart(nextReportItem.fixture.name, nextReportItem.fixture.path, nextReportItem.fixture.meta);
            }
        })();
    }

    _resolveReportItem(reportItem, testRun) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this2.task.screenshots.hasCapturedFor(testRun.test)) {
                reportItem.screenshotPath = _this2.task.screenshots.getPathFor(testRun.test);
                reportItem.screenshots = _this2.task.screenshots.getScreenshotsInfo(testRun.test);
            }

            if (testRun.quarantine) {
                reportItem.quarantine = testRun.quarantine.attempts.reduce(function (result, errors, index) {
                    const passed = !errors.length;
                    const quarantineAttempt = index + 1;

                    result[quarantineAttempt] = { passed };

                    return result;
                }, {});
            }

            if (!reportItem.testRunInfo) {
                reportItem.testRunInfo = Reporter._createTestRunInfo(reportItem);

                if (reportItem.test.skip) _this2.skipped++;else if (reportItem.errs.length) _this2.failed++;else _this2.passed++;
            }

            yield _this2._shiftReportQueue(reportItem);

            reportItem.pendingPromise.resolve();
        })();
    }

    _assignTaskEventHandlers() {
        var _this3 = this;

        const task = this.task;

        task.once('start', (0, _asyncToGenerator3.default)(function* () {
            const startTime = new Date();
            const userAgents = task.browserConnectionGroups.map(function (group) {
                return group[0].userAgent;
            });
            const first = _this3.reportQueue[0];

            yield _this3.plugin.reportTaskStart(startTime, userAgents, _this3.testCount);
            yield _this3.plugin.reportFixtureStart(first.fixture.name, first.fixture.path, first.fixture.meta);
        }));

        task.on('test-run-start', testRun => {
            const reportItem = this._getReportItemForTestRun(testRun);

            if (!reportItem.startTime) reportItem.startTime = new Date();
        });

        task.on('test-run-done', (() => {
            var _ref2 = (0, _asyncToGenerator3.default)(function* (testRun) {
                const reportItem = _this3._getReportItemForTestRun(testRun);
                const isTestRunStoppedTaskExecution = !!testRun.errs.length && _this3.stopOnFirstFail;

                reportItem.pendingRuns = isTestRunStoppedTaskExecution ? 0 : reportItem.pendingRuns - 1;
                reportItem.unstable = reportItem.unstable || testRun.unstable;
                reportItem.errs = reportItem.errs.concat(testRun.errs);
                reportItem.warnings = testRun.warningLog ? (0, _lodash.union)(reportItem.warnings, testRun.warningLog.messages) : [];

                if (!reportItem.pendingRuns) yield _this3._resolveReportItem(reportItem, testRun);

                yield reportItem.pendingPromise;
            });

            return function (_x) {
                return _ref2.apply(this, arguments);
            };
        })());

        task.once('done', (0, _asyncToGenerator3.default)(function* () {
            const endTime = new Date();

            const result = {
                passedCount: _this3.passed,
                failedCount: _this3.failed,
                skippedCount: _this3.skipped
            };

            yield _this3.plugin.reportTaskDone(endTime, _this3.passed, task.warningLog.messages, result);
        }));
    }

    dispose() {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this4.disposed) return _pinkie2.default.resolve();

            _this4.disposed = true;

            if (!_this4.outStream || Reporter._isSpecialStream(_this4.outStream) || !(0, _isStream.writable)(_this4.outStream)) return _pinkie2.default.resolve();

            const streamFinishedPromise = new _pinkie2.default(function (resolve) {
                _this4.outStream.once('finish', resolve);
                _this4.outStream.once('error', resolve);
            });

            _this4.outStream.end();

            return streamFinishedPromise;
        })();
    }
}
exports.default = Reporter;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yZXBvcnRlci9pbmRleC5qcyJdLCJuYW1lcyI6WyJSZXBvcnRlciIsImNvbnN0cnVjdG9yIiwicGx1Z2luIiwidGFzayIsIm91dFN0cmVhbSIsIlJlcG9ydGVyUGx1Z2luSG9zdCIsImRpc3Bvc2VkIiwicGFzc2VkIiwiZmFpbGVkIiwic2tpcHBlZCIsInRlc3RDb3VudCIsInRlc3RzIiwiZmlsdGVyIiwidGVzdCIsInNraXAiLCJsZW5ndGgiLCJyZXBvcnRRdWV1ZSIsIl9jcmVhdGVSZXBvcnRRdWV1ZSIsInN0b3BPbkZpcnN0RmFpbCIsIm9wdHMiLCJfYXNzaWduVGFza0V2ZW50SGFuZGxlcnMiLCJfaXNTcGVjaWFsU3RyZWFtIiwic3RyZWFtIiwiaXNUVFkiLCJwcm9jZXNzIiwic3Rkb3V0Iiwic3RkZXJyIiwiX2NyZWF0ZVBlbmRpbmdQcm9taXNlIiwicmVzb2x2ZXIiLCJwcm9taXNlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJfY3JlYXRlUmVwb3J0SXRlbSIsInJ1bnNQZXJUZXN0IiwiZml4dHVyZSIsInNjcmVlbnNob3RQYXRoIiwic2NyZWVuc2hvdHMiLCJxdWFyYW50aW5lIiwiZXJycyIsIndhcm5pbmdzIiwidW5zdGFibGUiLCJzdGFydFRpbWUiLCJ0ZXN0UnVuSW5mbyIsInBlbmRpbmdSdW5zIiwicGVuZGluZ1Byb21pc2UiLCJicm93c2VyQ29ubmVjdGlvbkdyb3VwcyIsIm1hcCIsIl9jcmVhdGVUZXN0UnVuSW5mbyIsInJlcG9ydEl0ZW0iLCJkdXJhdGlvbk1zIiwiRGF0ZSIsIl9nZXRSZXBvcnRJdGVtRm9yVGVzdFJ1biIsInRlc3RSdW4iLCJpIiwiX3NoaWZ0UmVwb3J0UXVldWUiLCJjdXJyZW50Rml4dHVyZSIsIm5leHRSZXBvcnRJdGVtIiwic2hpZnQiLCJyZXBvcnRUZXN0RG9uZSIsIm5hbWUiLCJtZXRhIiwicmVwb3J0Rml4dHVyZVN0YXJ0IiwicGF0aCIsIl9yZXNvbHZlUmVwb3J0SXRlbSIsImhhc0NhcHR1cmVkRm9yIiwiZ2V0UGF0aEZvciIsImdldFNjcmVlbnNob3RzSW5mbyIsImF0dGVtcHRzIiwicmVkdWNlIiwicmVzdWx0IiwiZXJyb3JzIiwiaW5kZXgiLCJxdWFyYW50aW5lQXR0ZW1wdCIsIm9uY2UiLCJ1c2VyQWdlbnRzIiwiZ3JvdXAiLCJ1c2VyQWdlbnQiLCJmaXJzdCIsInJlcG9ydFRhc2tTdGFydCIsIm9uIiwiaXNUZXN0UnVuU3RvcHBlZFRhc2tFeGVjdXRpb24iLCJjb25jYXQiLCJ3YXJuaW5nTG9nIiwibWVzc2FnZXMiLCJlbmRUaW1lIiwicGFzc2VkQ291bnQiLCJmYWlsZWRDb3VudCIsInNraXBwZWRDb3VudCIsInJlcG9ydFRhc2tEb25lIiwiZGlzcG9zZSIsInN0cmVhbUZpbmlzaGVkUHJvbWlzZSIsImVuZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QUFFZSxNQUFNQSxRQUFOLENBQWU7QUFDMUJDLGdCQUFhQyxNQUFiLEVBQXFCQyxJQUFyQixFQUEyQkMsU0FBM0IsRUFBc0M7QUFDbEMsYUFBS0YsTUFBTCxHQUFjLElBQUlHLG9CQUFKLENBQXVCSCxNQUF2QixFQUErQkUsU0FBL0IsQ0FBZDtBQUNBLGFBQUtELElBQUwsR0FBY0EsSUFBZDs7QUFFQSxhQUFLRyxRQUFMLEdBQXVCLEtBQXZCO0FBQ0EsYUFBS0MsTUFBTCxHQUF1QixDQUF2QjtBQUNBLGFBQUtDLE1BQUwsR0FBdUIsQ0FBdkI7QUFDQSxhQUFLQyxPQUFMLEdBQXVCLENBQXZCO0FBQ0EsYUFBS0MsU0FBTCxHQUF1QlAsS0FBS1EsS0FBTCxDQUFXQyxNQUFYLENBQWtCQyxRQUFRLENBQUNBLEtBQUtDLElBQWhDLEVBQXNDQyxNQUE3RDtBQUNBLGFBQUtDLFdBQUwsR0FBdUJoQixTQUFTaUIsa0JBQVQsQ0FBNEJkLElBQTVCLENBQXZCO0FBQ0EsYUFBS2UsZUFBTCxHQUF1QmYsS0FBS2dCLElBQUwsQ0FBVUQsZUFBakM7QUFDQSxhQUFLZCxTQUFMLEdBQXVCQSxTQUF2Qjs7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U0FWRDtBQVdIOztBQUVLb0IsV0FBTixHQUFpQjtBQUFBOztBQUFBO0FBQ2IsZ0JBQUksT0FBS25GLFFBQVQsRUFDSSxPQUFPd0IsaUJBQVFDLE9BQVIsRUFBUDs7QUFFSixtQkFBS3pCLFFBQUwsR0FBZ0IsSUFBaEI7O0FBRUEsZ0JBQUksQ0FBQyxPQUFLRixTQUFOLElBQW1CSixTQUFTcUIsZ0JBQVQsQ0FBMEIsT0FBS2pCLFNBQS9CLENBQW5CLElBQWdFLENBQUMsd0JBQWlCLE9BQUtBLFNBQXRCLENBQXJFLEVBQ0ksT0FBTzBCLGlCQUFRQyxPQUFSLEVBQVA7O0FBRUosa0JBQU0yRCx3QkFBd0IsSUFBSTVELGdCQUFKLENBQVksbUJBQVc7QUFDakQsdUJBQUsxQixTQUFMLENBQWVxRSxJQUFmLENBQW9CLFFBQXBCLEVBQThCMUMsT0FBOUI7QUFDQSx1QkFBSzNCLFNBQUwsQ0FBZXFFLElBQWYsQ0FBb0IsT0FBcEIsRUFBNkIxQyxPQUE3QjtBQUNILGFBSDZCLENBQTlCOztBQUtBLG1CQUFLM0IsU0FBTCxDQUFldUYsR0FBZjs7QUFFQSxtQkFBT0QscUJBQVA7QUFoQmE7QUFpQmhCO0FBL0x5QjtrQkFBVDFGLFEiLCJmaWxlIjoicmVwb3J0ZXIvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUHJvbWlzZSBmcm9tICdwaW5raWUnO1xuaW1wb3J0IHsgZmluZCwgc29ydEJ5LCB1bmlvbiB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyB3cml0YWJsZSBhcyBpc1dyaXRhYmxlU3RyZWFtIH0gZnJvbSAnaXMtc3RyZWFtJztcbmltcG9ydCBSZXBvcnRlclBsdWdpbkhvc3QgZnJvbSAnLi9wbHVnaW4taG9zdCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcG9ydGVyIHtcbiAgICBjb25zdHJ1Y3RvciAocGx1Z2luLCB0YXNrLCBvdXRTdHJlYW0pIHtcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBuZXcgUmVwb3J0ZXJQbHVnaW5Ib3N0KHBsdWdpbiwgb3V0U3RyZWFtKTtcbiAgICAgICAgdGhpcy50YXNrICAgPSB0YXNrO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zZWQgICAgICAgID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGFzc2VkICAgICAgICAgID0gMDtcbiAgICAgICAgdGhpcy5mYWlsZWQgICAgICAgICAgPSAwO1xuICAgICAgICB0aGlzLnNraXBwZWQgICAgICAgICA9IDA7XG4gICAgICAgIHRoaXMudGVzdENvdW50ICAgICAgID0gdGFzay50ZXN0cy5maWx0ZXIodGVzdCA9PiAhdGVzdC5za2lwKS5sZW5ndGg7XG4gICAgICAgIHRoaXMucmVwb3J0UXVldWUgICAgID0gUmVwb3J0ZXIuX2NyZWF0ZVJlcG9ydFF1ZXVlKHRhc2spO1xuICAgICAgICB0aGlzLnN0b3BPbkZpcnN0RmFpbCA9IHRhc2sub3B0cy5zdG9wT25GaXJzdEZhaWw7XG4gICAgICAgIHRoaXMub3V0U3RyZWFtICAgICAgID0gb3V0U3RyZWFtO1xuXG4gICAgICAgIHRoaXMuX2Fzc2lnblRhc2tFdmVudEhhbmRsZXJzKCk7XG4gICAgfVxuXG4gICAgc3RhdGljIF9pc1NwZWNpYWxTdHJlYW0gKHN0cmVhbSkge1xuICAgICAgICByZXR1cm4gc3RyZWFtLmlzVFRZIHx8IHN0cmVhbSA9PT0gcHJvY2Vzcy5zdGRvdXQgfHwgc3RyZWFtID09PSBwcm9jZXNzLnN0ZGVycjtcbiAgICB9XG5cbiAgICBzdGF0aWMgX2NyZWF0ZVBlbmRpbmdQcm9taXNlICgpIHtcbiAgICAgICAgbGV0IHJlc29sdmVyID0gbnVsbDtcblxuICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlciA9IHJlc29sdmU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHByb21pc2UucmVzb2x2ZSA9IHJlc29sdmVyO1xuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBfY3JlYXRlUmVwb3J0SXRlbSAodGVzdCwgcnVuc1BlclRlc3QpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpeHR1cmU6ICAgICAgICB0ZXN0LmZpeHR1cmUsXG4gICAgICAgICAgICB0ZXN0OiAgICAgICAgICAgdGVzdCxcbiAgICAgICAgICAgIHNjcmVlbnNob3RQYXRoOiBudWxsLFxuICAgICAgICAgICAgc2NyZWVuc2hvdHM6ICAgIFtdLFxuICAgICAgICAgICAgcXVhcmFudGluZTogICAgIG51bGwsXG4gICAgICAgICAgICBlcnJzOiAgICAgICAgICAgW10sXG4gICAgICAgICAgICB3YXJuaW5nczogICAgICAgW10sXG4gICAgICAgICAgICB1bnN0YWJsZTogICAgICAgZmFsc2UsXG4gICAgICAgICAgICBzdGFydFRpbWU6ICAgICAgbnVsbCxcbiAgICAgICAgICAgIHRlc3RSdW5JbmZvOiAgICBudWxsLFxuXG4gICAgICAgICAgICBwZW5kaW5nUnVuczogICAgcnVuc1BlclRlc3QsXG4gICAgICAgICAgICBwZW5kaW5nUHJvbWlzZTogUmVwb3J0ZXIuX2NyZWF0ZVBlbmRpbmdQcm9taXNlKClcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX2NyZWF0ZVJlcG9ydFF1ZXVlICh0YXNrKSB7XG4gICAgICAgIGNvbnN0IHJ1bnNQZXJUZXN0ID0gdGFzay5icm93c2VyQ29ubmVjdGlvbkdyb3Vwcy5sZW5ndGg7XG5cbiAgICAgICAgcmV0dXJuIHRhc2sudGVzdHMubWFwKHRlc3QgPT4gUmVwb3J0ZXIuX2NyZWF0ZVJlcG9ydEl0ZW0odGVzdCwgcnVuc1BlclRlc3QpKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX2NyZWF0ZVRlc3RSdW5JbmZvIChyZXBvcnRJdGVtKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlcnJzOiAgICAgICAgICAgc29ydEJ5KHJlcG9ydEl0ZW0uZXJycywgWyd1c2VyQWdlbnQnLCAndHlwZSddKSxcbiAgICAgICAgICAgIHdhcm5pbmdzOiAgICAgICByZXBvcnRJdGVtLndhcm5pbmdzLFxuICAgICAgICAgICAgZHVyYXRpb25NczogICAgIG5ldyBEYXRlKCkgLSByZXBvcnRJdGVtLnN0YXJ0VGltZSxcbiAgICAgICAgICAgIHVuc3RhYmxlOiAgICAgICByZXBvcnRJdGVtLnVuc3RhYmxlLFxuICAgICAgICAgICAgc2NyZWVuc2hvdFBhdGg6IHJlcG9ydEl0ZW0uc2NyZWVuc2hvdFBhdGgsXG4gICAgICAgICAgICBzY3JlZW5zaG90czogICAgcmVwb3J0SXRlbS5zY3JlZW5zaG90cyxcbiAgICAgICAgICAgIHF1YXJhbnRpbmU6ICAgICByZXBvcnRJdGVtLnF1YXJhbnRpbmUsXG4gICAgICAgICAgICBza2lwcGVkOiAgICAgICAgcmVwb3J0SXRlbS50ZXN0LnNraXBcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfZ2V0UmVwb3J0SXRlbUZvclRlc3RSdW4gKHRlc3RSdW4pIHtcbiAgICAgICAgcmV0dXJuIGZpbmQodGhpcy5yZXBvcnRRdWV1ZSwgaSA9PiBpLnRlc3QgPT09IHRlc3RSdW4udGVzdCk7XG4gICAgfVxuXG4gICAgYXN5bmMgX3NoaWZ0UmVwb3J0UXVldWUgKHJlcG9ydEl0ZW0pIHtcbiAgICAgICAgbGV0IGN1cnJlbnRGaXh0dXJlID0gbnVsbDtcbiAgICAgICAgbGV0IG5leHRSZXBvcnRJdGVtID0gbnVsbDtcblxuICAgICAgICB3aGlsZSAodGhpcy5yZXBvcnRRdWV1ZS5sZW5ndGggJiYgdGhpcy5yZXBvcnRRdWV1ZVswXS50ZXN0UnVuSW5mbykge1xuICAgICAgICAgICAgcmVwb3J0SXRlbSAgICAgPSB0aGlzLnJlcG9ydFF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICBjdXJyZW50Rml4dHVyZSA9IHJlcG9ydEl0ZW0uZml4dHVyZTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4ucmVwb3J0VGVzdERvbmUocmVwb3J0SXRlbS50ZXN0Lm5hbWUsIHJlcG9ydEl0ZW0udGVzdFJ1bkluZm8sIHJlcG9ydEl0ZW0udGVzdC5tZXRhKTtcblxuICAgICAgICAgICAgLy8gTk9URTogaGVyZSB3ZSBhc3N1bWUgdGhhdCB0ZXN0cyBhcmUgc29ydGVkIGJ5IGZpeHR1cmUuXG4gICAgICAgICAgICAvLyBUaGVyZWZvcmUsIGlmIHRoZSBuZXh0IHJlcG9ydCBpdGVtIGhhcyBhIGRpZmZlcmVudFxuICAgICAgICAgICAgLy8gZml4dHVyZSwgd2UgY2FuIHJlcG9ydCB0aGlzIGZpeHR1cmUgc3RhcnQuXG4gICAgICAgICAgICBuZXh0UmVwb3J0SXRlbSA9IHRoaXMucmVwb3J0UXVldWVbMF07XG5cbiAgICAgICAgICAgIGlmIChuZXh0UmVwb3J0SXRlbSAmJiBuZXh0UmVwb3J0SXRlbS5maXh0dXJlICE9PSBjdXJyZW50Rml4dHVyZSlcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5yZXBvcnRGaXh0dXJlU3RhcnQobmV4dFJlcG9ydEl0ZW0uZml4dHVyZS5uYW1lLCBuZXh0UmVwb3J0SXRlbS5maXh0dXJlLnBhdGgsIG5leHRSZXBvcnRJdGVtLmZpeHR1cmUubWV0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBfcmVzb2x2ZVJlcG9ydEl0ZW0gKHJlcG9ydEl0ZW0sIHRlc3RSdW4pIHtcbiAgICAgICAgaWYgKHRoaXMudGFzay5zY3JlZW5zaG90cy5oYXNDYXB0dXJlZEZvcih0ZXN0UnVuLnRlc3QpKSB7XG4gICAgICAgICAgICByZXBvcnRJdGVtLnNjcmVlbnNob3RQYXRoID0gdGhpcy50YXNrLnNjcmVlbnNob3RzLmdldFBhdGhGb3IodGVzdFJ1bi50ZXN0KTtcbiAgICAgICAgICAgIHJlcG9ydEl0ZW0uc2NyZWVuc2hvdHMgICAgPSB0aGlzLnRhc2suc2NyZWVuc2hvdHMuZ2V0U2NyZWVuc2hvdHNJbmZvKHRlc3RSdW4udGVzdCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGVzdFJ1bi5xdWFyYW50aW5lKSB7XG4gICAgICAgICAgICByZXBvcnRJdGVtLnF1YXJhbnRpbmUgPSB0ZXN0UnVuLnF1YXJhbnRpbmUuYXR0ZW1wdHMucmVkdWNlKChyZXN1bHQsIGVycm9ycywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXNzZWQgICAgICAgICAgICA9ICFlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNvbnN0IHF1YXJhbnRpbmVBdHRlbXB0ID0gaW5kZXggKyAxO1xuXG4gICAgICAgICAgICAgICAgcmVzdWx0W3F1YXJhbnRpbmVBdHRlbXB0XSA9IHsgcGFzc2VkIH07XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSwge30pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFyZXBvcnRJdGVtLnRlc3RSdW5JbmZvKSB7XG4gICAgICAgICAgICByZXBvcnRJdGVtLnRlc3RSdW5JbmZvID0gUmVwb3J0ZXIuX2NyZWF0ZVRlc3RSdW5JbmZvKHJlcG9ydEl0ZW0pO1xuXG4gICAgICAgICAgICBpZiAocmVwb3J0SXRlbS50ZXN0LnNraXApXG4gICAgICAgICAgICAgICAgdGhpcy5za2lwcGVkKys7XG4gICAgICAgICAgICBlbHNlIGlmIChyZXBvcnRJdGVtLmVycnMubGVuZ3RoKVxuICAgICAgICAgICAgICAgIHRoaXMuZmFpbGVkKys7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGhpcy5wYXNzZWQrKztcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuX3NoaWZ0UmVwb3J0UXVldWUocmVwb3J0SXRlbSk7XG5cbiAgICAgICAgcmVwb3J0SXRlbS5wZW5kaW5nUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgX2Fzc2lnblRhc2tFdmVudEhhbmRsZXJzICgpIHtcbiAgICAgICAgY29uc3QgdGFzayA9IHRoaXMudGFzaztcblxuICAgICAgICB0YXNrLm9uY2UoJ3N0YXJ0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnRUaW1lICA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBjb25zdCB1c2VyQWdlbnRzID0gdGFzay5icm93c2VyQ29ubmVjdGlvbkdyb3Vwcy5tYXAoZ3JvdXAgPT4gZ3JvdXBbMF0udXNlckFnZW50KTtcbiAgICAgICAgICAgIGNvbnN0IGZpcnN0ICAgICAgPSB0aGlzLnJlcG9ydFF1ZXVlWzBdO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5yZXBvcnRUYXNrU3RhcnQoc3RhcnRUaW1lLCB1c2VyQWdlbnRzLCB0aGlzLnRlc3RDb3VudCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5yZXBvcnRGaXh0dXJlU3RhcnQoZmlyc3QuZml4dHVyZS5uYW1lLCBmaXJzdC5maXh0dXJlLnBhdGgsIGZpcnN0LmZpeHR1cmUubWV0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRhc2sub24oJ3Rlc3QtcnVuLXN0YXJ0JywgdGVzdFJ1biA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXBvcnRJdGVtID0gdGhpcy5fZ2V0UmVwb3J0SXRlbUZvclRlc3RSdW4odGVzdFJ1bik7XG5cbiAgICAgICAgICAgIGlmICghcmVwb3J0SXRlbS5zdGFydFRpbWUpXG4gICAgICAgICAgICAgICAgcmVwb3J0SXRlbS5zdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0YXNrLm9uKCd0ZXN0LXJ1bi1kb25lJywgYXN5bmMgdGVzdFJ1biA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXBvcnRJdGVtICAgICAgICAgICAgICAgICAgICA9IHRoaXMuX2dldFJlcG9ydEl0ZW1Gb3JUZXN0UnVuKHRlc3RSdW4pO1xuICAgICAgICAgICAgY29uc3QgaXNUZXN0UnVuU3RvcHBlZFRhc2tFeGVjdXRpb24gPSAhIXRlc3RSdW4uZXJycy5sZW5ndGggJiYgdGhpcy5zdG9wT25GaXJzdEZhaWw7XG5cbiAgICAgICAgICAgIHJlcG9ydEl0ZW0ucGVuZGluZ1J1bnMgPSBpc1Rlc3RSdW5TdG9wcGVkVGFza0V4ZWN1dGlvbiA/IDAgOiByZXBvcnRJdGVtLnBlbmRpbmdSdW5zIC0gMTtcbiAgICAgICAgICAgIHJlcG9ydEl0ZW0udW5zdGFibGUgICAgPSByZXBvcnRJdGVtLnVuc3RhYmxlIHx8IHRlc3RSdW4udW5zdGFibGU7XG4gICAgICAgICAgICByZXBvcnRJdGVtLmVycnMgICAgICAgID0gcmVwb3J0SXRlbS5lcnJzLmNvbmNhdCh0ZXN0UnVuLmVycnMpO1xuICAgICAgICAgICAgcmVwb3J0SXRlbS53YXJuaW5ncyAgICA9IHRlc3RSdW4ud2FybmluZ0xvZyA/IHVuaW9uKHJlcG9ydEl0ZW0ud2FybmluZ3MsIHRlc3RSdW4ud2FybmluZ0xvZy5tZXNzYWdlcykgOiBbXTtcblxuICAgICAgICAgICAgaWYgKCFyZXBvcnRJdGVtLnBlbmRpbmdSdW5zKVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX3Jlc29sdmVSZXBvcnRJdGVtKHJlcG9ydEl0ZW0sIHRlc3RSdW4pO1xuXG4gICAgICAgICAgICBhd2FpdCByZXBvcnRJdGVtLnBlbmRpbmdQcm9taXNlO1xuICAgICAgICB9KTtcblxuICAgICAgICB0YXNrLm9uY2UoJ2RvbmUnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbmRUaW1lID0gbmV3IERhdGUoKTtcblxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgIHBhc3NlZENvdW50OiAgdGhpcy5wYXNzZWQsXG4gICAgICAgICAgICAgICAgZmFpbGVkQ291bnQ6ICB0aGlzLmZhaWxlZCxcbiAgICAgICAgICAgICAgICBza2lwcGVkQ291bnQ6IHRoaXMuc2tpcHBlZFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4ucmVwb3J0VGFza0RvbmUoZW5kVGltZSwgdGhpcy5wYXNzZWQsIHRhc2sud2FybmluZ0xvZy5tZXNzYWdlcywgcmVzdWx0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZGlzcG9zZSAoKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2VkKVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmICghdGhpcy5vdXRTdHJlYW0gfHwgUmVwb3J0ZXIuX2lzU3BlY2lhbFN0cmVhbSh0aGlzLm91dFN0cmVhbSkgfHwgIWlzV3JpdGFibGVTdHJlYW0odGhpcy5vdXRTdHJlYW0pKVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgIGNvbnN0IHN0cmVhbUZpbmlzaGVkUHJvbWlzZSA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgdGhpcy5vdXRTdHJlYW0ub25jZSgnZmluaXNoJywgcmVzb2x2ZSk7XG4gICAgICAgICAgICB0aGlzLm91dFN0cmVhbS5vbmNlKCdlcnJvcicsIHJlc29sdmUpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLm91dFN0cmVhbS5lbmQoKTtcblxuICAgICAgICByZXR1cm4gc3RyZWFtRmluaXNoZWRQcm9taXNlO1xuICAgIH1cbn1cbiJdfQ==
