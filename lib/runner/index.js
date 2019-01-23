'use strict';

exports.__esModule = true;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _path = require('path');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _promisifyEvent = require('promisify-event');

var _promisifyEvent2 = _interopRequireDefault(_promisifyEvent);

var _mapReverse = require('map-reverse');

var _mapReverse2 = _interopRequireDefault(_mapReverse);

var _events = require('events');

var _lodash = require('lodash');

var _bootstrapper = require('./bootstrapper');

var _bootstrapper2 = _interopRequireDefault(_bootstrapper);

var _reporter = require('../reporter');

var _reporter2 = _interopRequireDefault(_reporter);

var _task = require('./task');

var _task2 = _interopRequireDefault(_task);

var _runtime = require('../errors/runtime');

var _message = require('../errors/runtime/message');

var _message2 = _interopRequireDefault(_message);

var _typeAssertions = require('../errors/runtime/type-assertions');

var _renderForbiddenCharsList = require('../errors/render-forbidden-chars-list');

var _renderForbiddenCharsList2 = _interopRequireDefault(_renderForbiddenCharsList);

var _checkFilePath = require('../utils/check-file-path');

var _checkFilePath2 = _interopRequireDefault(_checkFilePath);

var _handleErrors = require('../utils/handle-errors');

var _optionNames = require('../configuration/option-names');

var _optionNames2 = _interopRequireDefault(_optionNames);

var _flagList = require('../utils/flag-list');

var _flagList2 = _interopRequireDefault(_flagList);

var _prepareReporters = require('../utils/prepare-reporters');

var _prepareReporters2 = _interopRequireDefault(_prepareReporters);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DEBUG_LOGGER = (0, _debug2.default)('testcafe:runner');

class Runner extends _events.EventEmitter {
    constructor(proxy, browserConnectionGateway, configuration) {
        super();

        this.proxy = proxy;
        this.bootstrapper = this._createBootstrapper(browserConnectionGateway);
        this.pendingTaskPromises = [];
        this.configuration = configuration;
        this.isCli = false;

        this.apiMethodWasCalled = new _flagList2.default({
            initialFlagValue: false,
            flags: [_optionNames2.default.src, _optionNames2.default.browsers, _optionNames2.default.reporter]
        });
    }

    _createBootstrapper(browserConnectionGateway) {
        return new _bootstrapper2.default(browserConnectionGateway);
    }

    _disposeBrowserSet(browserSet) {
        return browserSet.dispose().catch(e => DEBUG_LOGGER(e));
    }

    _disposeReporters(reporters) {
        return _pinkie2.default.all(reporters.map(reporter => reporter.dispose().catch(e => DEBUG_LOGGER(e))));
    }

    _disposeTestedApp(testedApp) {
        return testedApp ? testedApp.kill().catch(e => DEBUG_LOGGER(e)) : _pinkie2.default.resolve();
    }

    _disposeTaskAndRelatedAssets(task, browserSet, reporters, testedApp) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            task.abort();
            task.clearListeners();

            yield _this._disposeAssets(browserSet, reporters, testedApp);
        })();
    }

    _disposeAssets(browserSet, reporters, testedApp) {
        return _pinkie2.default.all([this._disposeBrowserSet(browserSet), this._disposeReporters(reporters), this._disposeTestedApp(testedApp)]);
    }

    _prepareArrayParameter(array) {
        array = (0, _lodash.flattenDeep)(array);

        if (this.isCli) return array.length === 0 ? void 0 : array;

        return array;
    }

    _createCancelablePromise(taskPromise) {
        const promise = taskPromise.then(({ completionPromise }) => completionPromise);
        const removeFromPending = () => (0, _lodash.pull)(this.pendingTaskPromises, promise);

        promise.then(removeFromPending).catch(removeFromPending);

        promise.cancel = () => taskPromise.then(({ cancelTask }) => cancelTask()).then(removeFromPending);

        this.pendingTaskPromises.push(promise);
        return promise;
    }

    // Run task
    _getFailedTestCount(task, reporter) {
        let failedTestCount = reporter.testCount - reporter.passed;

        if (task.opts.stopOnFirstFail && !!failedTestCount) failedTestCount = 1;

        return failedTestCount;
    }

    _getTaskResult(task, browserSet, reporters, testedApp) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            task.on('browser-job-done', function (job) {
                return browserSet.releaseConnection(job.browserConnection);
            });

            const browserSetErrorPromise = (0, _promisifyEvent2.default)(browserSet, 'error');

            const taskDonePromise = task.once('done').then(function () {
                return browserSetErrorPromise.cancel();
            });

            const promises = [taskDonePromise, browserSetErrorPromise];

            if (testedApp) promises.push(testedApp.errorPromise);

            try {
                yield _pinkie2.default.race(promises);
            } catch (err) {
                yield _this2._disposeTaskAndRelatedAssets(task, browserSet, reporters, testedApp);

                throw err;
            }

            yield _this2._disposeAssets(browserSet, reporters, testedApp);

            return _this2._getFailedTestCount(task, reporters[0]);
        })();
    }

    _createTask(tests, browserConnectionGroups, proxy, opts, context) {
        return new _task2.default(tests, browserConnectionGroups, proxy, opts, context);
    }

    _runTask(reporterPlugins, browserSet, tests, testedApp, context) {
        var _this3 = this;

        let completed = false;
        const task = this._createTask(tests, browserSet.browserConnectionGroups, this.proxy, this.configuration.getOptions(), context);
        const reporters = reporterPlugins.map(reporter => new _reporter2.default(reporter.plugin, task, reporter.outStream));
        const completionPromise = this._getTaskResult(task, browserSet, reporters, testedApp);

        task.on('start', _handleErrors.startHandlingTestErrors);

        if (!this.configuration.getOption(_optionNames2.default.skipUncaughtErrors)) {
            task.once('test-run-start', _handleErrors.addRunningTest);
            task.once('test-run-done', _handleErrors.removeRunningTest);
        }

        task.on('done', _handleErrors.stopHandlingTestErrors);

        const setCompleted = () => {
            completed = true;
        };

        completionPromise.then(setCompleted).catch(setCompleted);

        const cancelTask = (() => {
            var _ref = (0, _asyncToGenerator3.default)(function* () {
                if (!completed) yield _this3._disposeTaskAndRelatedAssets(task, browserSet, reporters, testedApp);
            });

            return function cancelTask() {
                return _ref.apply(this, arguments);
            };
        })();

        return { completionPromise, cancelTask };
    }

    _registerAssets(assets) {
        assets.forEach(asset => this.proxy.GET(asset.path, asset.info));
    }

    _validateSpeedOption() {
        const speed = this.configuration.getOption(_optionNames2.default.speed);

        if (speed === void 0) return;

        if (typeof speed !== 'number' || isNaN(speed) || speed < 0.01 || speed > 1) throw new _runtime.GeneralError(_message2.default.invalidSpeedValue);
    }

    _validateConcurrencyOption() {
        const concurrency = this.configuration.getOption(_optionNames2.default.concurrency);

        if (concurrency === void 0) return;

        if (typeof concurrency !== 'number' || isNaN(concurrency) || concurrency < 1) throw new _runtime.GeneralError(_message2.default.invalidConcurrencyFactor);
    }

    _validateProxyBypassOption() {
        let proxyBypass = this.configuration.getOption(_optionNames2.default.proxyBypass);

        if (proxyBypass === void 0) return;

        (0, _typeAssertions.assertType)([_typeAssertions.is.string, _typeAssertions.is.array], null, '"proxyBypass" argument', proxyBypass);

        if (typeof proxyBypass === 'string') proxyBypass = [proxyBypass];

        proxyBypass = proxyBypass.reduce((arr, rules) => {
            (0, _typeAssertions.assertType)(_typeAssertions.is.string, null, '"proxyBypass" argument', rules);

            return arr.concat(rules.split(','));
        }, []);

        this.configuration.mergeOptions({ proxyBypass });
    }

    _validateScreenshotOptions() {
        const screenshotPath = this.configuration.getOption(_optionNames2.default.screenshotPath);
        const screenshotPathPattern = this.configuration.getOption(_optionNames2.default.screenshotPathPattern);

        if (screenshotPath) {
            this._validateScreenshotPath(screenshotPath, 'screenshots base directory path');

            this.configuration.mergeOptions({ [_optionNames2.default.screenshotPath]: (0, _path.resolve)(screenshotPath) });
        }

        if (screenshotPathPattern) this._validateScreenshotPath(screenshotPathPattern, 'screenshots path pattern');

        if (!screenshotPath && screenshotPathPattern) throw new _runtime.GeneralError(_message2.default.cantUseScreenshotPathPatternWithoutBaseScreenshotPathSpecified);
    }

    _validateRunOptions() {
        this._validateScreenshotOptions();
        this._validateSpeedOption();
        this._validateConcurrencyOption();
        this._validateProxyBypassOption();
    }

    _createRunnableConfiguration() {
        return this.bootstrapper.createRunnableConfiguration();
    }

    _validateScreenshotPath(screenshotPath, pathType) {
        const forbiddenCharsList = (0, _checkFilePath2.default)(screenshotPath);

        if (forbiddenCharsList.length) throw new _runtime.GeneralError(_message2.default.forbiddenCharatersInScreenshotPath, screenshotPath, pathType, (0, _renderForbiddenCharsList2.default)(forbiddenCharsList));
    }

    _setBootstrapperOptions() {
        this.bootstrapper.sources = this.configuration.getOption(_optionNames2.default.src) || this.bootstrapper.sources;
        this.bootstrapper.browsers = this.configuration.getOption(_optionNames2.default.browsers) || this.bootstrapper.browsers;
        this.bootstrapper.concurrency = this.configuration.getOption(_optionNames2.default.concurrency);
        this.bootstrapper.appCommand = this.configuration.getOption(_optionNames2.default.appCommand) || this.bootstrapper.appCommand;
        this.bootstrapper.appInitDelay = this.configuration.getOption(_optionNames2.default.appInitDelay);
        this.bootstrapper.disableTestSyntaxValidation = this.configuration.getOption(_optionNames2.default.disableTestSyntaxValidation);
        this.bootstrapper.filter = this.configuration.getOption(_optionNames2.default.filter) || this.bootstrapper.filter;
        this.bootstrapper.reporters = this.configuration.getOption(_optionNames2.default.reporter) || this.bootstrapper.reporters;
    }

    // API
    embeddingOptions(opts) {
        const assets = opts.assets,
              TestRunCtor = opts.TestRunCtor;


        this._registerAssets(assets);
        this.configuration.mergeOptions({ TestRunCtor });

        return this;
    }

    src(...sources) {
        if (this.apiMethodWasCalled.src) throw new _runtime.GeneralError(_message2.default.multipleAPIMethodCallForbidden, _optionNames2.default.src);

        sources = this._prepareArrayParameter(sources);
        this.configuration.mergeOptions({ [_optionNames2.default.src]: sources });

        this.apiMethodWasCalled.src = true;

        return this;
    }

    browsers(...browsers) {
        if (this.apiMethodWasCalled.browsers) throw new _runtime.GeneralError(_message2.default.multipleAPIMethodCallForbidden, _optionNames2.default.browsers);

        browsers = this._prepareArrayParameter(browsers);
        this.configuration.mergeOptions({ browsers });

        this.apiMethodWasCalled.browsers = true;

        return this;
    }

    concurrency(concurrency) {
        this.configuration.mergeOptions({ concurrency });

        return this;
    }

    reporter(name, fileOrStream) {
        if (this.apiMethodWasCalled.reporter) throw new _runtime.GeneralError(_message2.default.multipleAPIMethodCallForbidden, _optionNames2.default.reporter);

        let reporters = (0, _prepareReporters2.default)(name, fileOrStream);

        reporters = this._prepareArrayParameter(reporters);

        this.configuration.mergeOptions({ [_optionNames2.default.reporter]: reporters });

        this.apiMethodWasCalled.reporter = true;

        return this;
    }

    filter(filter) {
        this.configuration.mergeOptions({ filter });

        return this;
    }

    useProxy(proxy, proxyBypass) {
        this.configuration.mergeOptions({ proxy, proxyBypass });

        return this;
    }

    screenshots(path, takeOnFails, pattern) {
        this.configuration.mergeOptions({
            [_optionNames2.default.screenshotPath]: path,
            [_optionNames2.default.takeScreenshotsOnFails]: takeOnFails,
            [_optionNames2.default.screenshotPathPattern]: pattern
        });

        return this;
    }

    startApp(command, initDelay) {
        this.configuration.mergeOptions({
            [_optionNames2.default.appCommand]: command,
            [_optionNames2.default.appInitDelay]: initDelay
        });

        return this;
    }

    run(options = {}, context) {
        this.apiMethodWasCalled.reset();

        const skipJsErrors = options.skipJsErrors,
              disablePageReloads = options.disablePageReloads,
              quarantineMode = options.quarantineMode,
              debugMode = options.debugMode,
              selectorTimeout = options.selectorTimeout,
              assertionTimeout = options.assertionTimeout,
              pageLoadTimeout = options.pageLoadTimeout,
              speed = options.speed,
              debugOnFail = options.debugOnFail,
              skipUncaughtErrors = options.skipUncaughtErrors,
              stopOnFirstFail = options.stopOnFirstFail,
              disableTestSyntaxValidation = options.disableTestSyntaxValidation;


        this.configuration.mergeOptions({
            skipJsErrors: skipJsErrors,
            disablePageReloads: disablePageReloads,
            quarantineMode: quarantineMode,
            debugMode: debugMode,
            debugOnFail: debugOnFail,
            selectorTimeout: selectorTimeout,
            assertionTimeout: assertionTimeout,
            pageLoadTimeout: pageLoadTimeout,
            speed: speed,
            skipUncaughtErrors: skipUncaughtErrors,
            stopOnFirstFail: stopOnFirstFail,
            disableTestSyntaxValidation: disableTestSyntaxValidation
        });

        this.configuration.prepare();
        this.configuration.notifyAboutOverridenOptions();

        this._setBootstrapperOptions();

        const runTaskPromise = _pinkie2.default.resolve().then(() => {
            this._validateRunOptions();

            return this._createRunnableConfiguration();
        }).then(({ reporterPlugins, browserSet, tests, testedApp }) => {
            this.emit('done-bootstrapping');

            return this._runTask(reporterPlugins, browserSet, tests, testedApp, context);
        });

        return this._createCancelablePromise(runTaskPromise);
    }

    stop() {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            // NOTE: When taskPromise is cancelled, it is removed from
            // the pendingTaskPromises array, which leads to shifting indexes
            // towards the beginning. So, we must copy the array in order to iterate it,
            // or we can perform iteration from the end to the beginning.
            const cancellationPromises = (0, _mapReverse2.default)(_this4.pendingTaskPromises, function (taskPromise) {
                return taskPromise.cancel();
            });

            yield _pinkie2.default.all(cancellationPromises);
        })();
    }
}
exports.default = Runner;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydW5uZXIvaW5kZXguanMiXSwibmFtZXMiOlsiREVCVUdfTE9HR0VSIiwiUnVubmVyIiwiRXZlbnRFbWl0dGVyIiwiY29uc3RydWN0b3IiLCJwcm94eSIsImJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSIsImNvbmZpZ3VyYXRpb24iLCJib290c3RyYXBwZXIiLCJfY3JlYXRlQm9vdHN0cmFwcGVyIiwicGVuZGluZ1Rhc2tQcm9taXNlcyIsImlzQ2xpIiwiYXBpTWV0aG9kV2FzQ2FsbGVkIiwiRmxhZ0xpc3QiLCJpbml0aWFsRmxhZ1ZhbHVlIiwiZmxhZ3MiLCJPUFRJT05fTkFNRVMiLCJzcmMiLCJicm93c2VycyIsInJlcG9ydGVyIiwiQm9vdHN0cmFwcGVyIiwiX2Rpc3Bvc2VCcm93c2VyU2V0IiwiYnJvd3NlclNldCIsImRpc3Bvc2UiLCJjYXRjaCIsImUiLCJfZGlzcG9zZVJlcG9ydGVycyIsInJlcG9ydGVycyIsIlByb21pc2UiLCJhbGwiLCJtYXAiLCJfZGlzcG9zZVRlc3RlZEFwcCIsInRlc3RlZEFwcCIsImtpbGwiLCJyZXNvbHZlIiwiX2Rpc3Bvc2VUYXNrQW5kUmVsYXRlZEFzc2V0cyIsInRhc2siLCJhYm9ydCIsImNsZWFyTGlzdGVuZXJzIiwiX2Rpc3Bvc2VBc3NldHMiLCJfcHJlcGFyZUFycmF5UGFyYW1ldGVyIiwiYXJyYXkiLCJsZW5ndGgiLCJfY3JlYXRlQ2FuY2VsYWJsZVByb21pc2UiLCJ0YXNrUHJvbWlzZSIsInByb21pc2UiLCJ0aGVuIiwiY29tcGxldGlvblByb21pc2UiLCJyZW1vdmVGcm9tUGVuZGluZyIsImNhbmNlbCIsImNhbmNlbFRhc2siLCJwdXNoIiwiX2dldEZhaWxlZFRlc3RDb3VudCIsImZhaWxlZFRlc3RDb3VudCIsInRlc3RDb3VudCIsInBhc3NlZCIsIm9wdHMiLCJzdG9wT25GaXJzdEZhaWwiLCJfZ2V0VGFza1Jlc3VsdCIsIm9uIiwicmVsZWFzZUNvbm5lY3Rpb24iLCJqb2IiLCJicm93c2VyQ29ubmVjdGlvbiIsImJyb3dzZXJTZXRFcnJvclByb21pc2UiLCJ0YXNrRG9uZVByb21pc2UiLCJvbmNlIiwicHJvbWlzZXMiLCJlcnJvclByb21pc2UiLCJyYWNlIiwiZXJyIiwiX2NyZWF0ZVRhc2siLCJ0ZXN0cyIsImJyb3dzZXJDb25uZWN0aW9uR3JvdXBzIiwiY29udGV4dCIsIlRhc2siLCJfcnVuVGFzayIsInJlcG9ydGVyUGx1Z2lucyIsImNvbXBsZXRlZCIsImdldE9wdGlvbnMiLCJSZXBvcnRlciIsInBsdWdpbiIsIm91dFN0cmVhbSIsInN0YXJ0SGFuZGxpbmdUZXN0RXJyb3JzIiwiZ2V0T3B0aW9uIiwic2tpcFVuY2F1Z2h0RXJyb3JzIiwiYWRkUnVubmluZ1Rlc3QiLCJyZW1vdmVSdW5uaW5nVGVzdCIsInN0b3BIYW5kbGluZ1Rlc3RFcnJvcnMiLCJzZXRDb21wbGV0ZWQiLCJfcmVnaXN0ZXJBc3NldHMiLCJhc3NldHMiLCJmb3JFYWNoIiwiYXNzZXQiLCJHRVQiLCJwYXRoIiwiaW5mbyIsIl92YWxpZGF0ZVNwZWVkT3B0aW9uIiwic3BlZWQiLCJpc05hTiIsIkdlbmVyYWxFcnJvciIsIk1FU1NBR0UiLCJpbnZhbGlkU3BlZWRWYWx1ZSIsIl92YWxpZGF0ZUNvbmN1cnJlbmN5T3B0aW9uIiwiY29uY3VycmVuY3kiLCJpbnZhbGlkQ29uY3VycmVuY3lGYWN0b3IiLCJfdmFsaWRhdGVQcm94eUJ5cGFzc09wdGlvbiIsInByb3h5QnlwYXNzIiwiaXMiLCJzdHJpbmciLCJyZWR1Y2UiLCJhcnIiLCJydWxlcyIsImNvbmNhdCIsInNwbGl0IiwibWVyZ2VPcHRpb25zIiwiX3ZhbGlkYXRlU2NyZWVuc2hvdE9wdGlvbnMiLCJzY3JlZW5zaG90UGF0aCIsInNjcmVlbnNob3RQYXRoUGF0dGVybiIsIl92YWxpZGF0ZVNjcmVlbnNob3RQYXRoIiwiY2FudFVzZVNjcmVlbnNob3RQYXRoUGF0dGVybldpdGhvdXRCYXNlU2NyZWVuc2hvdFBhdGhTcGVjaWZpZWQiLCJfdmFsaWRhdGVSdW5PcHRpb25zIiwiX2NyZWF0ZVJ1bm5hYmxlQ29uZmlndXJhdGlvbiIsImNyZWF0ZVJ1bm5hYmxlQ29uZmlndXJhdGlvbiIsInBhdGhUeXBlIiwiZm9yYmlkZGVuQ2hhcnNMaXN0IiwiZm9yYmlkZGVuQ2hhcmF0ZXJzSW5TY3JlZW5zaG90UGF0aCIsIl9zZXRCb290c3RyYXBwZXJPcHRpb25zIiwic291cmNlcyIsImFwcENvbW1hbmQiLCJhcHBJbml0RGVsYXkiLCJkaXNhYmxlVGVzdFN5bnRheFZhbGlkYXRpb24iLCJmaWx0ZXIiLCJlbWJlZGRpbmdPcHRpb25zIiwiVGVzdFJ1bkN0b3IiLCJtdWx0aXBsZUFQSU1ldGhvZENhbGxGb3JiaWRkZW4iLCJuYW1lIiwiZmlsZU9yU3RyZWFtIiwidXNlUHJveHkiLCJzY3JlZW5zaG90cyIsInRha2VPbkZhaWxzIiwicGF0dGVybiIsInRha2VTY3JlZW5zaG90c09uRmFpbHMiLCJzdGFydEFwcCIsImNvbW1hbmQiLCJpbml0RGVsYXkiLCJydW4iLCJvcHRpb25zIiwicmVzZXQiLCJza2lwSnNFcnJvcnMiLCJkaXNhYmxlUGFnZVJlbG9hZHMiLCJxdWFyYW50aW5lTW9kZSIsImRlYnVnTW9kZSIsInNlbGVjdG9yVGltZW91dCIsImFzc2VydGlvblRpbWVvdXQiLCJwYWdlTG9hZFRpbWVvdXQiLCJkZWJ1Z09uRmFpbCIsInByZXBhcmUiLCJub3RpZnlBYm91dE92ZXJyaWRlbk9wdGlvbnMiLCJydW5UYXNrUHJvbWlzZSIsImVtaXQiLCJzdG9wIiwiY2FuY2VsbGF0aW9uUHJvbWlzZXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLE1BQU1BLGVBQWUscUJBQU0saUJBQU4sQ0FBckI7O0FBRWUsTUFBTUMsTUFBTixTQUFx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ZUEsYUFBSzNILGFBQUwsQ0FBbUJxSixPQUFuQjtBQUNBLGFBQUtySixhQUFMLENBQW1Cc0osMkJBQW5COztBQUVBLGFBQUsvQix1QkFBTDs7QUFFQSxjQUFNZ0MsaUJBQWlCbEksaUJBQVFNLE9BQVIsR0FDbEJZLElBRGtCLENBQ2IsTUFBTTtBQUNSLGlCQUFLMEUsbUJBQUw7O0FBRUEsbUJBQU8sS0FBS0MsNEJBQUwsRUFBUDtBQUNILFNBTGtCLEVBTWxCM0UsSUFOa0IsQ0FNYixDQUFDLEVBQUU4QixlQUFGLEVBQW1CdEQsVUFBbkIsRUFBK0JpRCxLQUEvQixFQUFzQ3ZDLFNBQXRDLEVBQUQsS0FBdUQ7QUFDekQsaUJBQUsrSCxJQUFMLENBQVUsb0JBQVY7O0FBRUEsbUJBQU8sS0FBS3BGLFFBQUwsQ0FBY0MsZUFBZCxFQUErQnRELFVBQS9CLEVBQTJDaUQsS0FBM0MsRUFBa0R2QyxTQUFsRCxFQUE2RHlDLE9BQTdELENBQVA7QUFDSCxTQVZrQixDQUF2Qjs7QUFZQSxlQUFPLEtBQUs5Qix3QkFBTCxDQUE4Qm1ILGNBQTlCLENBQVA7QUFDSDs7QUFFS0UsUUFBTixHQUFjO0FBQUE7O0FBQUE7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFNQyx1QkFBdUIsMEJBQVcsT0FBS3ZKLG1CQUFoQixFQUFxQztBQUFBLHVCQUFla0MsWUFBWUssTUFBWixFQUFmO0FBQUEsYUFBckMsQ0FBN0I7O0FBRUEsa0JBQU1yQixpQkFBUUMsR0FBUixDQUFZb0ksb0JBQVosQ0FBTjtBQVBVO0FBUWI7QUFqWTRDO2tCQUE1Qi9KLE0iLCJmaWxlIjoicnVubmVyL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzb2x2ZSBhcyByZXNvbHZlUGF0aCB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCBQcm9taXNlIGZyb20gJ3BpbmtpZSc7XG5pbXBvcnQgcHJvbWlzaWZ5RXZlbnQgZnJvbSAncHJvbWlzaWZ5LWV2ZW50JztcbmltcG9ydCBtYXBSZXZlcnNlIGZyb20gJ21hcC1yZXZlcnNlJztcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgeyBmbGF0dGVuRGVlcCBhcyBmbGF0dGVuLCBwdWxsIGFzIHJlbW92ZSB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgQm9vdHN0cmFwcGVyIGZyb20gJy4vYm9vdHN0cmFwcGVyJztcbmltcG9ydCBSZXBvcnRlciBmcm9tICcuLi9yZXBvcnRlcic7XG5pbXBvcnQgVGFzayBmcm9tICcuL3Rhc2snO1xuaW1wb3J0IHsgR2VuZXJhbEVycm9yIH0gZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUnO1xuaW1wb3J0IE1FU1NBR0UgZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUvbWVzc2FnZSc7XG5pbXBvcnQgeyBhc3NlcnRUeXBlLCBpcyB9IGZyb20gJy4uL2Vycm9ycy9ydW50aW1lL3R5cGUtYXNzZXJ0aW9ucyc7XG5pbXBvcnQgcmVuZGVyRm9yYmlkZGVuQ2hhcnNMaXN0IGZyb20gJy4uL2Vycm9ycy9yZW5kZXItZm9yYmlkZGVuLWNoYXJzLWxpc3QnO1xuaW1wb3J0IGNoZWNrRmlsZVBhdGggZnJvbSAnLi4vdXRpbHMvY2hlY2stZmlsZS1wYXRoJztcbmltcG9ydCB7IGFkZFJ1bm5pbmdUZXN0LCByZW1vdmVSdW5uaW5nVGVzdCwgc3RhcnRIYW5kbGluZ1Rlc3RFcnJvcnMsIHN0b3BIYW5kbGluZ1Rlc3RFcnJvcnMgfSBmcm9tICcuLi91dGlscy9oYW5kbGUtZXJyb3JzJztcbmltcG9ydCBPUFRJT05fTkFNRVMgZnJvbSAnLi4vY29uZmlndXJhdGlvbi9vcHRpb24tbmFtZXMnO1xuaW1wb3J0IEZsYWdMaXN0IGZyb20gJy4uL3V0aWxzL2ZsYWctbGlzdCc7XG5pbXBvcnQgcHJlcGFyZVJlcG9ydGVycyBmcm9tICcuLi91dGlscy9wcmVwYXJlLXJlcG9ydGVycyc7XG5cbmNvbnN0IERFQlVHX0xPR0dFUiA9IGRlYnVnKCd0ZXN0Y2FmZTpydW5uZXInKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUnVubmVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvciAocHJveHksIGJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMucHJveHkgICAgICAgICAgICAgICA9IHByb3h5O1xuICAgICAgICB0aGlzLmJvb3RzdHJhcHBlciAgICAgICAgPSB0aGlzLl9jcmVhdGVCb290c3RyYXBwZXIoYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5KTtcbiAgICAgICAgdGhpcy5wZW5kaW5nVGFza1Byb21pc2VzID0gW107XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbiAgICAgICA9IGNvbmZpZ3VyYXRpb247XG4gICAgICAgIHRoaXMuaXNDbGkgICAgICAgICAgICAgICA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuYXBpTWV0aG9kV2FzQ2FsbGVkID0gbmV3IEZsYWdMaXN0KHtcbiAgICAgICAgICAgIGluaXRpYWxGbGFnVmFsdWU6IGZhbHNlLFxuICAgICAgICAgICAgZmxhZ3M6ICAgICAgICAgICAgW09QVElPTl9OQU1FUy5zcmMsIE9QVElPTl9OQU1FUy5icm93c2VycywgT1BUSU9OX05BTUVTLnJlcG9ydGVyXVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfY3JlYXRlQm9vdHN0cmFwcGVyIChicm93c2VyQ29ubmVjdGlvbkdhdGV3YXkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBCb290c3RyYXBwZXIoYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5KTtcbiAgICB9XG5cbiAgICBfZGlzcG9zZUJyb3dzZXJTZXQgKGJyb3dzZXJTZXQpIHtcbiAgICAgICAgcmV0dXJuIGJyb3dzZXJTZXQuZGlzcG9zZSgpLmNhdGNoKGUgPT4gREVCVUdfTE9HR0VSKGUpKTtcbiAgICB9XG5cbiAgICBfZGlzcG9zZVJlcG9ydGVycyAocmVwb3J0ZXJzKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChyZXBvcnRlcnMubWFwKHJlcG9ydGVyID0+IHJlcG9ydGVyLmRpc3Bvc2UoKS5jYXRjaChlID0+IERFQlVHX0xPR0dFUihlKSkpKTtcbiAgICB9XG5cbiAgICBfZGlzcG9zZVRlc3RlZEFwcCAodGVzdGVkQXBwKSB7XG4gICAgICAgIHJldHVybiB0ZXN0ZWRBcHAgPyB0ZXN0ZWRBcHAua2lsbCgpLmNhdGNoKGUgPT4gREVCVUdfTE9HR0VSKGUpKSA6IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIGFzeW5jIF9kaXNwb3NlVGFza0FuZFJlbGF0ZWRBc3NldHMgKHRhc2ssIGJyb3dzZXJTZXQsIHJlcG9ydGVycywgdGVzdGVkQXBwKSB7XG4gICAgICAgIHRhc2suYWJvcnQoKTtcbiAgICAgICAgdGFzay5jbGVhckxpc3RlbmVycygpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX2Rpc3Bvc2VBc3NldHMoYnJvd3NlclNldCwgcmVwb3J0ZXJzLCB0ZXN0ZWRBcHApO1xuICAgIH1cblxuICAgIF9kaXNwb3NlQXNzZXRzIChicm93c2VyU2V0LCByZXBvcnRlcnMsIHRlc3RlZEFwcCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zZUJyb3dzZXJTZXQoYnJvd3NlclNldCksXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NlUmVwb3J0ZXJzKHJlcG9ydGVycyksXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NlVGVzdGVkQXBwKHRlc3RlZEFwcClcbiAgICAgICAgXSk7XG4gICAgfVxuXG4gICAgX3ByZXBhcmVBcnJheVBhcmFtZXRlciAoYXJyYXkpIHtcbiAgICAgICAgYXJyYXkgPSBmbGF0dGVuKGFycmF5KTtcblxuICAgICAgICBpZiAodGhpcy5pc0NsaSlcbiAgICAgICAgICAgIHJldHVybiBhcnJheS5sZW5ndGggPT09IDAgPyB2b2lkIDAgOiBhcnJheTtcblxuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNhbmNlbGFibGVQcm9taXNlICh0YXNrUHJvbWlzZSkge1xuICAgICAgICBjb25zdCBwcm9taXNlICAgICAgICAgICA9IHRhc2tQcm9taXNlLnRoZW4oKHsgY29tcGxldGlvblByb21pc2UgfSkgPT4gY29tcGxldGlvblByb21pc2UpO1xuICAgICAgICBjb25zdCByZW1vdmVGcm9tUGVuZGluZyA9ICgpID0+IHJlbW92ZSh0aGlzLnBlbmRpbmdUYXNrUHJvbWlzZXMsIHByb21pc2UpO1xuXG4gICAgICAgIHByb21pc2VcbiAgICAgICAgICAgIC50aGVuKHJlbW92ZUZyb21QZW5kaW5nKVxuICAgICAgICAgICAgLmNhdGNoKHJlbW92ZUZyb21QZW5kaW5nKTtcblxuICAgICAgICBwcm9taXNlLmNhbmNlbCA9ICgpID0+IHRhc2tQcm9taXNlXG4gICAgICAgICAgICAudGhlbigoeyBjYW5jZWxUYXNrIH0pID0+IGNhbmNlbFRhc2soKSlcbiAgICAgICAgICAgIC50aGVuKHJlbW92ZUZyb21QZW5kaW5nKTtcblxuICAgICAgICB0aGlzLnBlbmRpbmdUYXNrUHJvbWlzZXMucHVzaChwcm9taXNlKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgLy8gUnVuIHRhc2tcbiAgICBfZ2V0RmFpbGVkVGVzdENvdW50ICh0YXNrLCByZXBvcnRlcikge1xuICAgICAgICBsZXQgZmFpbGVkVGVzdENvdW50ID0gcmVwb3J0ZXIudGVzdENvdW50IC0gcmVwb3J0ZXIucGFzc2VkO1xuXG4gICAgICAgIGlmICh0YXNrLm9wdHMuc3RvcE9uRmlyc3RGYWlsICYmICEhZmFpbGVkVGVzdENvdW50KVxuICAgICAgICAgICAgZmFpbGVkVGVzdENvdW50ID0gMTtcblxuICAgICAgICByZXR1cm4gZmFpbGVkVGVzdENvdW50O1xuICAgIH1cblxuICAgIGFzeW5jIF9nZXRUYXNrUmVzdWx0ICh0YXNrLCBicm93c2VyU2V0LCByZXBvcnRlcnMsIHRlc3RlZEFwcCkge1xuICAgICAgICB0YXNrLm9uKCdicm93c2VyLWpvYi1kb25lJywgam9iID0+IGJyb3dzZXJTZXQucmVsZWFzZUNvbm5lY3Rpb24oam9iLmJyb3dzZXJDb25uZWN0aW9uKSk7XG5cbiAgICAgICAgY29uc3QgYnJvd3NlclNldEVycm9yUHJvbWlzZSA9IHByb21pc2lmeUV2ZW50KGJyb3dzZXJTZXQsICdlcnJvcicpO1xuXG4gICAgICAgIGNvbnN0IHRhc2tEb25lUHJvbWlzZSA9IHRhc2sub25jZSgnZG9uZScpXG4gICAgICAgICAgICAudGhlbigoKSA9PiBicm93c2VyU2V0RXJyb3JQcm9taXNlLmNhbmNlbCgpKTtcblxuXG4gICAgICAgIGNvbnN0IHByb21pc2VzID0gW1xuICAgICAgICAgICAgdGFza0RvbmVQcm9taXNlLFxuICAgICAgICAgICAgYnJvd3NlclNldEVycm9yUHJvbWlzZVxuICAgICAgICBdO1xuXG4gICAgICAgIGlmICh0ZXN0ZWRBcHApXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHRlc3RlZEFwcC5lcnJvclByb21pc2UpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBQcm9taXNlLnJhY2UocHJvbWlzZXMpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2Rpc3Bvc2VUYXNrQW5kUmVsYXRlZEFzc2V0cyh0YXNrLCBicm93c2VyU2V0LCByZXBvcnRlcnMsIHRlc3RlZEFwcCk7XG5cbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuX2Rpc3Bvc2VBc3NldHMoYnJvd3NlclNldCwgcmVwb3J0ZXJzLCB0ZXN0ZWRBcHApO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRGYWlsZWRUZXN0Q291bnQodGFzaywgcmVwb3J0ZXJzWzBdKTtcbiAgICB9XG5cbiAgICBfY3JlYXRlVGFzayAodGVzdHMsIGJyb3dzZXJDb25uZWN0aW9uR3JvdXBzLCBwcm94eSwgb3B0cywgY29udGV4dCkge1xuICAgICAgICByZXR1cm4gbmV3IFRhc2sodGVzdHMsIGJyb3dzZXJDb25uZWN0aW9uR3JvdXBzLCBwcm94eSwgb3B0cywgY29udGV4dCk7XG4gICAgfVxuXG4gICAgX3J1blRhc2sgKHJlcG9ydGVyUGx1Z2lucywgYnJvd3NlclNldCwgdGVzdHMsIHRlc3RlZEFwcCwgY29udGV4dCkge1xuICAgICAgICBsZXQgY29tcGxldGVkICAgICAgICAgICA9IGZhbHNlO1xuICAgICAgICBjb25zdCB0YXNrICAgICAgICAgICAgICA9IHRoaXMuX2NyZWF0ZVRhc2sodGVzdHMsIGJyb3dzZXJTZXQuYnJvd3NlckNvbm5lY3Rpb25Hcm91cHMsIHRoaXMucHJveHksIHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb25zKCksIGNvbnRleHQpO1xuICAgICAgICBjb25zdCByZXBvcnRlcnMgICAgICAgICA9IHJlcG9ydGVyUGx1Z2lucy5tYXAocmVwb3J0ZXIgPT4gbmV3IFJlcG9ydGVyKHJlcG9ydGVyLnBsdWdpbiwgdGFzaywgcmVwb3J0ZXIub3V0U3RyZWFtKSk7XG4gICAgICAgIGNvbnN0IGNvbXBsZXRpb25Qcm9taXNlID0gdGhpcy5fZ2V0VGFza1Jlc3VsdCh0YXNrLCBicm93c2VyU2V0LCByZXBvcnRlcnMsIHRlc3RlZEFwcCk7XG5cbiAgICAgICAgdGFzay5vbignc3RhcnQnLCBzdGFydEhhbmRsaW5nVGVzdEVycm9ycyk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy5za2lwVW5jYXVnaHRFcnJvcnMpKSB7XG4gICAgICAgICAgICB0YXNrLm9uY2UoJ3Rlc3QtcnVuLXN0YXJ0JywgYWRkUnVubmluZ1Rlc3QpO1xuICAgICAgICAgICAgdGFzay5vbmNlKCd0ZXN0LXJ1bi1kb25lJywgcmVtb3ZlUnVubmluZ1Rlc3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGFzay5vbignZG9uZScsIHN0b3BIYW5kbGluZ1Rlc3RFcnJvcnMpO1xuXG4gICAgICAgIGNvbnN0IHNldENvbXBsZXRlZCA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbXBsZXRlZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29tcGxldGlvblByb21pc2VcbiAgICAgICAgICAgIC50aGVuKHNldENvbXBsZXRlZClcbiAgICAgICAgICAgIC5jYXRjaChzZXRDb21wbGV0ZWQpO1xuXG4gICAgICAgIGNvbnN0IGNhbmNlbFRhc2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWNvbXBsZXRlZClcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9kaXNwb3NlVGFza0FuZFJlbGF0ZWRBc3NldHModGFzaywgYnJvd3NlclNldCwgcmVwb3J0ZXJzLCB0ZXN0ZWRBcHApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB7IGNvbXBsZXRpb25Qcm9taXNlLCBjYW5jZWxUYXNrIH07XG4gICAgfVxuXG4gICAgX3JlZ2lzdGVyQXNzZXRzIChhc3NldHMpIHtcbiAgICAgICAgYXNzZXRzLmZvckVhY2goYXNzZXQgPT4gdGhpcy5wcm94eS5HRVQoYXNzZXQucGF0aCwgYXNzZXQuaW5mbykpO1xuICAgIH1cblxuICAgIF92YWxpZGF0ZVNwZWVkT3B0aW9uICgpIHtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSB0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy5zcGVlZCk7XG5cbiAgICAgICAgaWYgKHNwZWVkID09PSB2b2lkIDApXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzcGVlZCAhPT0gJ251bWJlcicgfHwgaXNOYU4oc3BlZWQpIHx8IHNwZWVkIDwgMC4wMSB8fCBzcGVlZCA+IDEpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKE1FU1NBR0UuaW52YWxpZFNwZWVkVmFsdWUpO1xuICAgIH1cblxuICAgIF92YWxpZGF0ZUNvbmN1cnJlbmN5T3B0aW9uICgpIHtcbiAgICAgICAgY29uc3QgY29uY3VycmVuY3kgPSB0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy5jb25jdXJyZW5jeSk7XG5cbiAgICAgICAgaWYgKGNvbmN1cnJlbmN5ID09PSB2b2lkIDApXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjb25jdXJyZW5jeSAhPT0gJ251bWJlcicgfHwgaXNOYU4oY29uY3VycmVuY3kpIHx8IGNvbmN1cnJlbmN5IDwgMSlcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoTUVTU0FHRS5pbnZhbGlkQ29uY3VycmVuY3lGYWN0b3IpO1xuICAgIH1cblxuICAgIF92YWxpZGF0ZVByb3h5QnlwYXNzT3B0aW9uICgpIHtcbiAgICAgICAgbGV0IHByb3h5QnlwYXNzID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMucHJveHlCeXBhc3MpO1xuXG4gICAgICAgIGlmIChwcm94eUJ5cGFzcyA9PT0gdm9pZCAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGFzc2VydFR5cGUoWyBpcy5zdHJpbmcsIGlzLmFycmF5IF0sIG51bGwsICdcInByb3h5QnlwYXNzXCIgYXJndW1lbnQnLCBwcm94eUJ5cGFzcyk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBwcm94eUJ5cGFzcyA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICBwcm94eUJ5cGFzcyA9IFtwcm94eUJ5cGFzc107XG5cbiAgICAgICAgcHJveHlCeXBhc3MgPSBwcm94eUJ5cGFzcy5yZWR1Y2UoKGFyciwgcnVsZXMpID0+IHtcbiAgICAgICAgICAgIGFzc2VydFR5cGUoaXMuc3RyaW5nLCBudWxsLCAnXCJwcm94eUJ5cGFzc1wiIGFyZ3VtZW50JywgcnVsZXMpO1xuXG4gICAgICAgICAgICByZXR1cm4gYXJyLmNvbmNhdChydWxlcy5zcGxpdCgnLCcpKTtcbiAgICAgICAgfSwgW10pO1xuXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMoeyBwcm94eUJ5cGFzcyB9KTtcbiAgICB9XG5cbiAgICBfdmFsaWRhdGVTY3JlZW5zaG90T3B0aW9ucyAoKSB7XG4gICAgICAgIGNvbnN0IHNjcmVlbnNob3RQYXRoICAgICAgICA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLnNjcmVlbnNob3RQYXRoKTtcbiAgICAgICAgY29uc3Qgc2NyZWVuc2hvdFBhdGhQYXR0ZXJuID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuc2NyZWVuc2hvdFBhdGhQYXR0ZXJuKTtcblxuICAgICAgICBpZiAoc2NyZWVuc2hvdFBhdGgpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZhbGlkYXRlU2NyZWVuc2hvdFBhdGgoc2NyZWVuc2hvdFBhdGgsICdzY3JlZW5zaG90cyBiYXNlIGRpcmVjdG9yeSBwYXRoJyk7XG5cbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMoeyBbT1BUSU9OX05BTUVTLnNjcmVlbnNob3RQYXRoXTogcmVzb2x2ZVBhdGgoc2NyZWVuc2hvdFBhdGgpIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjcmVlbnNob3RQYXRoUGF0dGVybilcbiAgICAgICAgICAgIHRoaXMuX3ZhbGlkYXRlU2NyZWVuc2hvdFBhdGgoc2NyZWVuc2hvdFBhdGhQYXR0ZXJuLCAnc2NyZWVuc2hvdHMgcGF0aCBwYXR0ZXJuJyk7XG5cbiAgICAgICAgaWYgKCFzY3JlZW5zaG90UGF0aCAmJiBzY3JlZW5zaG90UGF0aFBhdHRlcm4pXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKE1FU1NBR0UuY2FudFVzZVNjcmVlbnNob3RQYXRoUGF0dGVybldpdGhvdXRCYXNlU2NyZWVuc2hvdFBhdGhTcGVjaWZpZWQpO1xuICAgIH1cblxuICAgIF92YWxpZGF0ZVJ1bk9wdGlvbnMgKCkge1xuICAgICAgICB0aGlzLl92YWxpZGF0ZVNjcmVlbnNob3RPcHRpb25zKCk7XG4gICAgICAgIHRoaXMuX3ZhbGlkYXRlU3BlZWRPcHRpb24oKTtcbiAgICAgICAgdGhpcy5fdmFsaWRhdGVDb25jdXJyZW5jeU9wdGlvbigpO1xuICAgICAgICB0aGlzLl92YWxpZGF0ZVByb3h5QnlwYXNzT3B0aW9uKCk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZVJ1bm5hYmxlQ29uZmlndXJhdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJvb3RzdHJhcHBlci5jcmVhdGVSdW5uYWJsZUNvbmZpZ3VyYXRpb24oKTtcbiAgICB9XG5cbiAgICBfdmFsaWRhdGVTY3JlZW5zaG90UGF0aCAoc2NyZWVuc2hvdFBhdGgsIHBhdGhUeXBlKSB7XG4gICAgICAgIGNvbnN0IGZvcmJpZGRlbkNoYXJzTGlzdCA9IGNoZWNrRmlsZVBhdGgoc2NyZWVuc2hvdFBhdGgpO1xuXG4gICAgICAgIGlmIChmb3JiaWRkZW5DaGFyc0xpc3QubGVuZ3RoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihNRVNTQUdFLmZvcmJpZGRlbkNoYXJhdGVyc0luU2NyZWVuc2hvdFBhdGgsIHNjcmVlbnNob3RQYXRoLCBwYXRoVHlwZSwgcmVuZGVyRm9yYmlkZGVuQ2hhcnNMaXN0KGZvcmJpZGRlbkNoYXJzTGlzdCkpO1xuICAgIH1cblxuICAgIF9zZXRCb290c3RyYXBwZXJPcHRpb25zICgpIHtcbiAgICAgICAgdGhpcy5ib290c3RyYXBwZXIuc291cmNlcyAgICAgICAgICAgICAgICAgICAgID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuc3JjKSB8fCB0aGlzLmJvb3RzdHJhcHBlci5zb3VyY2VzO1xuICAgICAgICB0aGlzLmJvb3RzdHJhcHBlci5icm93c2VycyAgICAgICAgICAgICAgICAgICAgPSB0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy5icm93c2VycykgfHwgdGhpcy5ib290c3RyYXBwZXIuYnJvd3NlcnM7XG4gICAgICAgIHRoaXMuYm9vdHN0cmFwcGVyLmNvbmN1cnJlbmN5ICAgICAgICAgICAgICAgICA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLmNvbmN1cnJlbmN5KTtcbiAgICAgICAgdGhpcy5ib290c3RyYXBwZXIuYXBwQ29tbWFuZCAgICAgICAgICAgICAgICAgID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuYXBwQ29tbWFuZCkgfHwgdGhpcy5ib290c3RyYXBwZXIuYXBwQ29tbWFuZDtcbiAgICAgICAgdGhpcy5ib290c3RyYXBwZXIuYXBwSW5pdERlbGF5ICAgICAgICAgICAgICAgID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuYXBwSW5pdERlbGF5KTtcbiAgICAgICAgdGhpcy5ib290c3RyYXBwZXIuZGlzYWJsZVRlc3RTeW50YXhWYWxpZGF0aW9uID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuZGlzYWJsZVRlc3RTeW50YXhWYWxpZGF0aW9uKTtcbiAgICAgICAgdGhpcy5ib290c3RyYXBwZXIuZmlsdGVyICAgICAgICAgICAgICAgICAgICAgID0gdGhpcy5jb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMuZmlsdGVyKSB8fCB0aGlzLmJvb3RzdHJhcHBlci5maWx0ZXI7XG4gICAgICAgIHRoaXMuYm9vdHN0cmFwcGVyLnJlcG9ydGVycyAgICAgICAgICAgICAgICAgICA9IHRoaXMuY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLnJlcG9ydGVyKSB8fCB0aGlzLmJvb3RzdHJhcHBlci5yZXBvcnRlcnM7XG4gICAgfVxuXG4gICAgLy8gQVBJXG4gICAgZW1iZWRkaW5nT3B0aW9ucyAob3B0cykge1xuICAgICAgICBjb25zdCB7IGFzc2V0cywgVGVzdFJ1bkN0b3IgfSA9IG9wdHM7XG5cbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJBc3NldHMoYXNzZXRzKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7IFRlc3RSdW5DdG9yIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNyYyAoLi4uc291cmNlcykge1xuICAgICAgICBpZiAodGhpcy5hcGlNZXRob2RXYXNDYWxsZWQuc3JjKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihNRVNTQUdFLm11bHRpcGxlQVBJTWV0aG9kQ2FsbEZvcmJpZGRlbiwgT1BUSU9OX05BTUVTLnNyYyk7XG5cbiAgICAgICAgc291cmNlcyA9IHRoaXMuX3ByZXBhcmVBcnJheVBhcmFtZXRlcihzb3VyY2VzKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7IFtPUFRJT05fTkFNRVMuc3JjXTogc291cmNlcyB9KTtcblxuICAgICAgICB0aGlzLmFwaU1ldGhvZFdhc0NhbGxlZC5zcmMgPSB0cnVlO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGJyb3dzZXJzICguLi5icm93c2Vycykge1xuICAgICAgICBpZiAodGhpcy5hcGlNZXRob2RXYXNDYWxsZWQuYnJvd3NlcnMpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKE1FU1NBR0UubXVsdGlwbGVBUElNZXRob2RDYWxsRm9yYmlkZGVuLCBPUFRJT05fTkFNRVMuYnJvd3NlcnMpO1xuXG4gICAgICAgIGJyb3dzZXJzID0gdGhpcy5fcHJlcGFyZUFycmF5UGFyYW1ldGVyKGJyb3dzZXJzKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7IGJyb3dzZXJzIH0pO1xuXG4gICAgICAgIHRoaXMuYXBpTWV0aG9kV2FzQ2FsbGVkLmJyb3dzZXJzID0gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25jdXJyZW5jeSAoY29uY3VycmVuY3kpIHtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7IGNvbmN1cnJlbmN5IH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlcG9ydGVyIChuYW1lLCBmaWxlT3JTdHJlYW0pIHtcbiAgICAgICAgaWYgKHRoaXMuYXBpTWV0aG9kV2FzQ2FsbGVkLnJlcG9ydGVyKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbmVyYWxFcnJvcihNRVNTQUdFLm11bHRpcGxlQVBJTWV0aG9kQ2FsbEZvcmJpZGRlbiwgT1BUSU9OX05BTUVTLnJlcG9ydGVyKTtcblxuICAgICAgICBsZXQgcmVwb3J0ZXJzID0gcHJlcGFyZVJlcG9ydGVycyhuYW1lLCBmaWxlT3JTdHJlYW0pO1xuXG4gICAgICAgIHJlcG9ydGVycyA9IHRoaXMuX3ByZXBhcmVBcnJheVBhcmFtZXRlcihyZXBvcnRlcnMpO1xuXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tZXJnZU9wdGlvbnMoeyBbT1BUSU9OX05BTUVTLnJlcG9ydGVyXTogcmVwb3J0ZXJzIH0pO1xuXG4gICAgICAgIHRoaXMuYXBpTWV0aG9kV2FzQ2FsbGVkLnJlcG9ydGVyID0gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBmaWx0ZXIgKGZpbHRlcikge1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWVyZ2VPcHRpb25zKHsgZmlsdGVyIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHVzZVByb3h5IChwcm94eSwgcHJveHlCeXBhc3MpIHtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7IHByb3h5LCBwcm94eUJ5cGFzcyB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzY3JlZW5zaG90cyAocGF0aCwgdGFrZU9uRmFpbHMsIHBhdHRlcm4pIHtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7XG4gICAgICAgICAgICBbT1BUSU9OX05BTUVTLnNjcmVlbnNob3RQYXRoXTogICAgICAgICBwYXRoLFxuICAgICAgICAgICAgW09QVElPTl9OQU1FUy50YWtlU2NyZWVuc2hvdHNPbkZhaWxzXTogdGFrZU9uRmFpbHMsXG4gICAgICAgICAgICBbT1BUSU9OX05BTUVTLnNjcmVlbnNob3RQYXRoUGF0dGVybl06ICBwYXR0ZXJuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHN0YXJ0QXBwIChjb21tYW5kLCBpbml0RGVsYXkpIHtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7XG4gICAgICAgICAgICBbT1BUSU9OX05BTUVTLmFwcENvbW1hbmRdOiAgIGNvbW1hbmQsXG4gICAgICAgICAgICBbT1BUSU9OX05BTUVTLmFwcEluaXREZWxheV06IGluaXREZWxheVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBydW4gKG9wdGlvbnMgPSB7fSwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmFwaU1ldGhvZFdhc0NhbGxlZC5yZXNldCgpO1xuXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHNraXBKc0Vycm9ycyxcbiAgICAgICAgICAgIGRpc2FibGVQYWdlUmVsb2FkcyxcbiAgICAgICAgICAgIHF1YXJhbnRpbmVNb2RlLFxuICAgICAgICAgICAgZGVidWdNb2RlLFxuICAgICAgICAgICAgc2VsZWN0b3JUaW1lb3V0LFxuICAgICAgICAgICAgYXNzZXJ0aW9uVGltZW91dCxcbiAgICAgICAgICAgIHBhZ2VMb2FkVGltZW91dCxcbiAgICAgICAgICAgIHNwZWVkLFxuICAgICAgICAgICAgZGVidWdPbkZhaWwsXG4gICAgICAgICAgICBza2lwVW5jYXVnaHRFcnJvcnMsXG4gICAgICAgICAgICBzdG9wT25GaXJzdEZhaWwsXG4gICAgICAgICAgICBkaXNhYmxlVGVzdFN5bnRheFZhbGlkYXRpb25cbiAgICAgICAgfSA9IG9wdGlvbnM7XG5cbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1lcmdlT3B0aW9ucyh7XG4gICAgICAgICAgICBza2lwSnNFcnJvcnM6ICAgICAgICAgICAgICAgIHNraXBKc0Vycm9ycyxcbiAgICAgICAgICAgIGRpc2FibGVQYWdlUmVsb2FkczogICAgICAgICAgZGlzYWJsZVBhZ2VSZWxvYWRzLFxuICAgICAgICAgICAgcXVhcmFudGluZU1vZGU6ICAgICAgICAgICAgICBxdWFyYW50aW5lTW9kZSxcbiAgICAgICAgICAgIGRlYnVnTW9kZTogICAgICAgICAgICAgICAgICAgZGVidWdNb2RlLFxuICAgICAgICAgICAgZGVidWdPbkZhaWw6ICAgICAgICAgICAgICAgICBkZWJ1Z09uRmFpbCxcbiAgICAgICAgICAgIHNlbGVjdG9yVGltZW91dDogICAgICAgICAgICAgc2VsZWN0b3JUaW1lb3V0LFxuICAgICAgICAgICAgYXNzZXJ0aW9uVGltZW91dDogICAgICAgICAgICBhc3NlcnRpb25UaW1lb3V0LFxuICAgICAgICAgICAgcGFnZUxvYWRUaW1lb3V0OiAgICAgICAgICAgICBwYWdlTG9hZFRpbWVvdXQsXG4gICAgICAgICAgICBzcGVlZDogICAgICAgICAgICAgICAgICAgICAgIHNwZWVkLFxuICAgICAgICAgICAgc2tpcFVuY2F1Z2h0RXJyb3JzOiAgICAgICAgICBza2lwVW5jYXVnaHRFcnJvcnMsXG4gICAgICAgICAgICBzdG9wT25GaXJzdEZhaWw6ICAgICAgICAgICAgIHN0b3BPbkZpcnN0RmFpbCxcbiAgICAgICAgICAgIGRpc2FibGVUZXN0U3ludGF4VmFsaWRhdGlvbjogZGlzYWJsZVRlc3RTeW50YXhWYWxpZGF0aW9uXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5wcmVwYXJlKCk7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5ub3RpZnlBYm91dE92ZXJyaWRlbk9wdGlvbnMoKTtcblxuICAgICAgICB0aGlzLl9zZXRCb290c3RyYXBwZXJPcHRpb25zKCk7XG5cbiAgICAgICAgY29uc3QgcnVuVGFza1Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZhbGlkYXRlUnVuT3B0aW9ucygpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZVJ1bm5hYmxlQ29uZmlndXJhdGlvbigpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKCh7IHJlcG9ydGVyUGx1Z2lucywgYnJvd3NlclNldCwgdGVzdHMsIHRlc3RlZEFwcCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdkb25lLWJvb3RzdHJhcHBpbmcnKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9ydW5UYXNrKHJlcG9ydGVyUGx1Z2lucywgYnJvd3NlclNldCwgdGVzdHMsIHRlc3RlZEFwcCwgY29udGV4dCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlQ2FuY2VsYWJsZVByb21pc2UocnVuVGFza1Byb21pc2UpO1xuICAgIH1cblxuICAgIGFzeW5jIHN0b3AgKCkge1xuICAgICAgICAvLyBOT1RFOiBXaGVuIHRhc2tQcm9taXNlIGlzIGNhbmNlbGxlZCwgaXQgaXMgcmVtb3ZlZCBmcm9tXG4gICAgICAgIC8vIHRoZSBwZW5kaW5nVGFza1Byb21pc2VzIGFycmF5LCB3aGljaCBsZWFkcyB0byBzaGlmdGluZyBpbmRleGVzXG4gICAgICAgIC8vIHRvd2FyZHMgdGhlIGJlZ2lubmluZy4gU28sIHdlIG11c3QgY29weSB0aGUgYXJyYXkgaW4gb3JkZXIgdG8gaXRlcmF0ZSBpdCxcbiAgICAgICAgLy8gb3Igd2UgY2FuIHBlcmZvcm0gaXRlcmF0aW9uIGZyb20gdGhlIGVuZCB0byB0aGUgYmVnaW5uaW5nLlxuICAgICAgICBjb25zdCBjYW5jZWxsYXRpb25Qcm9taXNlcyA9IG1hcFJldmVyc2UodGhpcy5wZW5kaW5nVGFza1Byb21pc2VzLCB0YXNrUHJvbWlzZSA9PiB0YXNrUHJvbWlzZS5jYW5jZWwoKSk7XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY2FuY2VsbGF0aW9uUHJvbWlzZXMpO1xuICAgIH1cbn1cbiJdfQ==
