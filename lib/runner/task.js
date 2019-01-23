'use strict';

exports.__esModule = true;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lodash = require('lodash');

var _asyncEventEmitter = require('../utils/async-event-emitter');

var _asyncEventEmitter2 = _interopRequireDefault(_asyncEventEmitter);

var _browserJob = require('./browser-job');

var _browserJob2 = _interopRequireDefault(_browserJob);

var _screenshots = require('../screenshots');

var _screenshots2 = _interopRequireDefault(_screenshots);

var _warningLog = require('../notifications/warning-log');

var _warningLog2 = _interopRequireDefault(_warningLog);

var _fixtureHookController = require('./fixture-hook-controller');

var _fixtureHookController2 = _interopRequireDefault(_fixtureHookController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Task extends _asyncEventEmitter2.default {
    constructor(tests, browserConnectionGroups, proxy, opts, context) {
        super();
        this.context = context;
        this.running = false;
        this.browserConnectionGroups = browserConnectionGroups;
        this.tests = tests;
        this.opts = opts;
        this.screenshots = new _screenshots2.default(this.opts.screenshotPath, this.opts.screenshotPathPattern);
        this.warningLog = new _warningLog2.default();

        this.fixtureHookController = new _fixtureHookController2.default(tests, browserConnectionGroups.length);
        this.pendingBrowserJobs = this._createBrowserJobs(proxy, this.opts);
    }

    _assignBrowserJobEventHandlers(job) {
        var _this = this;

        job.on('test-run-start', testRun => this.emit('test-run-start', testRun));

        job.on('test-run-done', (() => {
            var _ref = (0, _asyncToGenerator3.default)(function* (testRun) {
                yield _this.emit('test-run-done', testRun);

                if (_this.opts.stopOnFirstFail && testRun.errs.length) {
                    _this.abort();
                    yield _this.emit('done');
                }
            });

            return function (_x) {
                return _ref.apply(this, arguments);
            };
        })());

        job.once('start', (0, _asyncToGenerator3.default)(function* () {
            if (!_this.running) {
                _this.running = true;
                yield _this.emit('start');
            }
        }));

        job.once('done', (0, _asyncToGenerator3.default)(function* () {
            yield _this.emit('browser-job-done', job);

            (0, _lodash.pull)(_this.pendingBrowserJobs, job);

            if (!_this.pendingBrowserJobs.length) yield _this.emit('done');
        }));
    }

    _createBrowserJobs(proxy, opts) {
        return this.browserConnectionGroups.map(browserConnectionGroup => {
            const job = new _browserJob2.default(this.tests, browserConnectionGroup, proxy, this.screenshots, this.warningLog, this.fixtureHookController, opts, this.context);

            this._assignBrowserJobEventHandlers(job);
            browserConnectionGroup.map(bc => bc.addJob(job));

            return job;
        });
    }

    // API
    abort() {
        this.pendingBrowserJobs.forEach(job => job.abort());
    }
}
exports.default = Task;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydW5uZXIvdGFzay5qcyJdLCJuYW1lcyI6WyJUYXNrIiwiQXN5bmNFdmVudEVtaXR0ZXIiLCJjb25zdHJ1Y3RvciIsInRlc3RzIiwiYnJvd3NlckNvbm5lY3Rpb25Hcm91cHMiLCJwcm94eSIsIm9wdHMiLCJjb250ZXh0IiwicnVubmluZyIsInNjcmVlbnNob3RzIiwiU2NyZWVuc2hvdHMiLCJzY3JlZW5zaG90UGF0aCIsInNjcmVlbnNob3RQYXRoUGF0dGVybiIsIndhcm5pbmdMb2ciLCJXYXJuaW5nTG9nIiwiZml4dHVyZUhvb2tDb250cm9sbGVyIiwiRml4dHVyZUhvb2tDb250cm9sbGVyIiwibGVuZ3RoIiwicGVuZGluZ0Jyb3dzZXJKb2JzIiwiX2NyZWF0ZUJyb3dzZXJKb2JzIiwiX2Fzc2lnbkJyb3dzZXJKb2JFdmVudEhhbmRsZXJzIiwiam9iIiwib24iLCJ0ZXN0UnVuIiwiZW1pdCIsInN0b3BPbkZpcnN0RmFpbCIsImVycnMiLCJhYm9ydCIsIm9uY2UiLCJtYXAiLCJicm93c2VyQ29ubmVjdGlvbkdyb3VwIiwiQnJvd3NlckpvYiIsImJjIiwiYWRkSm9iIiwiZm9yRWFjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFZSxNQUFNQSxJQUFOLFNBQW1CQywyQkFBbkIsQ0FBcUM7QUFDaERDLGdCQUFhQyxLQUFiLEVBQW9CQyx1QkFBcEIsRUFBNkNDLEtBQTdDLEVBQW9EQyxJQUFwRCxFQUEwREMsT0FBMUQsRUFBbUU7QUFDL0Q7QUFDQSxhQUFLQSxPQUFMLEdBQStCQSxPQUEvQjtBQUNBLGFBQUtDLE9BQUwsR0FBK0IsS0FBL0I7QUFDQSxhQUFLSix1QkFBTCxHQUErQkEsdUJBQS9CO0FBQ0EsYUFBS0QsS0FBTCxHQUErQkEsS0FBL0I7QUFDQSxhQUFLRyxJQUFMLEdBQStCQSxJQUEvQjtBQUNBLGFBQUtHLFdBQUwsR0FBK0IsSUFBSUMscUJBQUosQ0FBZ0IsS0FBS0osSUFBTCxDQUFVSyxjQUExQixFQUEwQyxLQUFLTCxJQUFMLENBQVVNLHFCQUFwRCxDQUEvQjtBQUNBLGFBQUtDLFVBQUwsR0FBK0IsSUFBSUMsb0JBQUosRUFBL0I7O0FBRUEsYUFBS0MscUJBQUwsR0FBNkIsSUFBSUMsK0JBQUosQ0FBMEJiLEtBQTFCLEVBQWlDQyx3QkFBd0JhLE1BQXpELENBQTdCO0FBQ0EsYUFBS0Msa0JBQUwsR0FBNkIsS0FBS0Msa0JBQUwsQ0FBd0JkLEtBQXhCLEVBQStCLEtBQUtDLElBQXBDLENBQTdCO0FBQ0g7O0FBRURjLG1DQUFnQ0MsR0FBaEMsRUFBcUM7QUFBQTs7QUFDakNBLFlBQUlDLEVBQUosQ0FBTyxnQkFBUCxFQUF5QkMsV0FBVyxLQUFLQyxJQUFMLENBQVUsZ0JBQVYsRUFBNEJELE9BQTVCLENBQXBDOztBQUVBRixZQUFJQyxFQUFKLENBQU8sZUFBUDtBQUFBLHVEQUF3QixXQUFNQyxPQUFOLEVBQWlCO0FBQ3JDLHNCQUFNLE1BQUtDLElBQUwsQ0FBVSxlQUFWLEVBQTJCRCxPQUEzQixDQUFOOztBQUVBLG9CQUFJLE1BQUtqQixJQUFMLENBQVVtQixlQUFWLElBQTZCRixRQUFRRyxJQUFSLENBQWFULE1BQTlDLEVBQXNEO0FBQ2xELDBCQUFLVSxLQUFMO0FBQ0EsMEJBQU0sTUFBS0gsSUFBTCxDQUFVLE1BQVYsQ0FBTjtBQUNIO0FBQ0osYUFQRDs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFTQUgsWUFBSU8sSUFBSixDQUFTLE9BQVQsa0NBQWtCLGFBQVk7QUFDMUIsZ0JBQUksQ0FBQyxNQUFLcEIsT0FBVixFQUFtQjtBQUNmLHNCQUFLQSxPQUFMLEdBQWUsSUFBZjtBQUNBLHNCQUFNLE1BQUtnQixJQUFMLENBQVUsT0FBVixDQUFOO0FBQ0g7QUFDSixTQUxEOztBQU9BSCxZQUFJTyxJQUFKLENBQVMsTUFBVCxrQ0FBaUIsYUFBWTtBQUN6QixrQkFBTSxNQUFLSixJQUFMLENBQVUsa0JBQVYsRUFBOEJILEdBQTlCLENBQU47O0FBRUEsOEJBQU8sTUFBS0gsa0JBQVosRUFBZ0NHLEdBQWhDOztBQUVBLGdCQUFJLENBQUMsTUFBS0gsa0JBQUwsQ0FBd0JELE1BQTdCLEVBQ0ksTUFBTSxNQUFLTyxJQUFMLENBQVUsTUFBVixDQUFOO0FBQ1AsU0FQRDtBQVFIOztBQUVETCx1QkFBb0JkLEtBQXBCLEVBQTJCQyxJQUEzQixFQUFpQztBQUM3QixlQUFPLEtBQUtGLHVCQUFMLENBQTZCeUIsR0FBN0IsQ0FBaUNDLDBCQUEwQjtBQUM5RCxrQkFBTVQsTUFBTSxJQUFJVSxvQkFBSixDQUFlLEtBQUs1QixLQUFwQixFQUEyQjJCLHNCQUEzQixFQUFtRHpCLEtBQW5ELEVBQTBELEtBQUtJLFdBQS9ELEVBQTRFLEtBQUtJLFVBQWpGLEVBQTZGLEtBQUtFLHFCQUFsRyxFQUF5SFQsSUFBekgsRUFBK0gsS0FBS0MsT0FBcEksQ0FBWjs7QUFFQSxpQkFBS2EsOEJBQUwsQ0FBb0NDLEdBQXBDO0FBQ0FTLG1DQUF1QkQsR0FBdkIsQ0FBMkJHLE1BQU1BLEdBQUdDLE1BQUgsQ0FBVVosR0FBVixDQUFqQzs7QUFFQSxtQkFBT0EsR0FBUDtBQUNILFNBUE0sQ0FBUDtBQVFIOztBQUVEO0FBQ0FNLFlBQVM7QUFDTCxhQUFLVCxrQkFBTCxDQUF3QmdCLE9BQXhCLENBQWdDYixPQUFPQSxJQUFJTSxLQUFKLEVBQXZDO0FBQ0g7QUExRCtDO2tCQUEvQjNCLEkiLCJmaWxlIjoicnVubmVyL3Rhc2suanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwdWxsIGFzIHJlbW92ZSB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgQXN5bmNFdmVudEVtaXR0ZXIgZnJvbSAnLi4vdXRpbHMvYXN5bmMtZXZlbnQtZW1pdHRlcic7XG5pbXBvcnQgQnJvd3NlckpvYiBmcm9tICcuL2Jyb3dzZXItam9iJztcbmltcG9ydCBTY3JlZW5zaG90cyBmcm9tICcuLi9zY3JlZW5zaG90cyc7XG5pbXBvcnQgV2FybmluZ0xvZyBmcm9tICcuLi9ub3RpZmljYXRpb25zL3dhcm5pbmctbG9nJztcbmltcG9ydCBGaXh0dXJlSG9va0NvbnRyb2xsZXIgZnJvbSAnLi9maXh0dXJlLWhvb2stY29udHJvbGxlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRhc2sgZXh0ZW5kcyBBc3luY0V2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IgKHRlc3RzLCBicm93c2VyQ29ubmVjdGlvbkdyb3VwcywgcHJveHksIG9wdHMsIGNvbnRleHQpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5jb250ZXh0ICAgICAgICAgICAgICAgICA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMucnVubmluZyAgICAgICAgICAgICAgICAgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbkdyb3VwcyA9IGJyb3dzZXJDb25uZWN0aW9uR3JvdXBzO1xuICAgICAgICB0aGlzLnRlc3RzICAgICAgICAgICAgICAgICAgID0gdGVzdHM7XG4gICAgICAgIHRoaXMub3B0cyAgICAgICAgICAgICAgICAgICAgPSBvcHRzO1xuICAgICAgICB0aGlzLnNjcmVlbnNob3RzICAgICAgICAgICAgID0gbmV3IFNjcmVlbnNob3RzKHRoaXMub3B0cy5zY3JlZW5zaG90UGF0aCwgdGhpcy5vcHRzLnNjcmVlbnNob3RQYXRoUGF0dGVybik7XG4gICAgICAgIHRoaXMud2FybmluZ0xvZyAgICAgICAgICAgICAgPSBuZXcgV2FybmluZ0xvZygpO1xuXG4gICAgICAgIHRoaXMuZml4dHVyZUhvb2tDb250cm9sbGVyID0gbmV3IEZpeHR1cmVIb29rQ29udHJvbGxlcih0ZXN0cywgYnJvd3NlckNvbm5lY3Rpb25Hcm91cHMubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5wZW5kaW5nQnJvd3NlckpvYnMgICAgPSB0aGlzLl9jcmVhdGVCcm93c2VySm9icyhwcm94eSwgdGhpcy5vcHRzKTtcbiAgICB9XG5cbiAgICBfYXNzaWduQnJvd3NlckpvYkV2ZW50SGFuZGxlcnMgKGpvYikge1xuICAgICAgICBqb2Iub24oJ3Rlc3QtcnVuLXN0YXJ0JywgdGVzdFJ1biA9PiB0aGlzLmVtaXQoJ3Rlc3QtcnVuLXN0YXJ0JywgdGVzdFJ1bikpO1xuXG4gICAgICAgIGpvYi5vbigndGVzdC1ydW4tZG9uZScsIGFzeW5jIHRlc3RSdW4gPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5lbWl0KCd0ZXN0LXJ1bi1kb25lJywgdGVzdFJ1bik7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuc3RvcE9uRmlyc3RGYWlsICYmIHRlc3RSdW4uZXJycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5lbWl0KCdkb25lJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGpvYi5vbmNlKCdzdGFydCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5ydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmVtaXQoJ3N0YXJ0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGpvYi5vbmNlKCdkb25lJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5lbWl0KCdicm93c2VyLWpvYi1kb25lJywgam9iKTtcblxuICAgICAgICAgICAgcmVtb3ZlKHRoaXMucGVuZGluZ0Jyb3dzZXJKb2JzLCBqb2IpO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMucGVuZGluZ0Jyb3dzZXJKb2JzLmxlbmd0aClcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmVtaXQoJ2RvbmUnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUJyb3dzZXJKb2JzIChwcm94eSwgb3B0cykge1xuICAgICAgICByZXR1cm4gdGhpcy5icm93c2VyQ29ubmVjdGlvbkdyb3Vwcy5tYXAoYnJvd3NlckNvbm5lY3Rpb25Hcm91cCA9PiB7XG4gICAgICAgICAgICBjb25zdCBqb2IgPSBuZXcgQnJvd3NlckpvYih0aGlzLnRlc3RzLCBicm93c2VyQ29ubmVjdGlvbkdyb3VwLCBwcm94eSwgdGhpcy5zY3JlZW5zaG90cywgdGhpcy53YXJuaW5nTG9nLCB0aGlzLmZpeHR1cmVIb29rQ29udHJvbGxlciwgb3B0cywgdGhpcy5jb250ZXh0KTtcblxuICAgICAgICAgICAgdGhpcy5fYXNzaWduQnJvd3NlckpvYkV2ZW50SGFuZGxlcnMoam9iKTtcbiAgICAgICAgICAgIGJyb3dzZXJDb25uZWN0aW9uR3JvdXAubWFwKGJjID0+IGJjLmFkZEpvYihqb2IpKTtcblxuICAgICAgICAgICAgcmV0dXJuIGpvYjtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQVBJXG4gICAgYWJvcnQgKCkge1xuICAgICAgICB0aGlzLnBlbmRpbmdCcm93c2VySm9icy5mb3JFYWNoKGpvYiA9PiBqb2IuYWJvcnQoKSk7XG4gICAgfVxufVxuIl19
