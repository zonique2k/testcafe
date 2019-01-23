'use strict';

exports.__esModule = true;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _lodash = require('lodash');

var _readFileRelative = require('read-file-relative');

var _promisifyEvent = require('promisify-event');

var _promisifyEvent2 = _interopRequireDefault(_promisifyEvent);

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _mustache = require('mustache');

var _mustache2 = _interopRequireDefault(_mustache);

var _debugLogger = require('../notifications/debug-logger');

var _debugLogger2 = _interopRequireDefault(_debugLogger);

var _debugLog = require('./debug-log');

var _debugLog2 = _interopRequireDefault(_debugLog);

var _formattableAdapter = require('../errors/test-run/formattable-adapter');

var _formattableAdapter2 = _interopRequireDefault(_formattableAdapter);

var _errorList = require('../errors/error-list');

var _errorList2 = _interopRequireDefault(_errorList);

var _testRun = require('../errors/test-run/');

var _phase = require('./phase');

var _phase2 = _interopRequireDefault(_phase);

var _clientMessages = require('./client-messages');

var _clientMessages2 = _interopRequireDefault(_clientMessages);

var _type = require('./commands/type');

var _type2 = _interopRequireDefault(_type);

var _delay = require('../utils/delay');

var _delay2 = _interopRequireDefault(_delay);

var _markerSymbol = require('./marker-symbol');

var _markerSymbol2 = _interopRequireDefault(_markerSymbol);

var _testRunTracker = require('../api/test-run-tracker');

var _testRunTracker2 = _interopRequireDefault(_testRunTracker);

var _phase3 = require('../role/phase');

var _phase4 = _interopRequireDefault(_phase3);

var _pluginHost = require('../reporter/plugin-host');

var _pluginHost2 = _interopRequireDefault(_pluginHost);

var _browserConsoleMessages = require('./browser-console-messages');

var _browserConsoleMessages2 = _interopRequireDefault(_browserConsoleMessages);

var _unstableNetworkMode = require('../browser/connection/unstable-network-mode');

var _warningLog = require('../notifications/warning-log');

var _warningLog2 = _interopRequireDefault(_warningLog);

var _warningMessage = require('../notifications/warning-message');

var _warningMessage2 = _interopRequireDefault(_warningMessage);

var _utils = require('./commands/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const lazyRequire = require('import-lazy')(require);
const SessionController = lazyRequire('./session-controller');
const ClientFunctionBuilder = lazyRequire('../client-functions/client-function-builder');
const executeJsExpression = lazyRequire('./execute-js-expression');
const BrowserManipulationQueue = lazyRequire('./browser-manipulation-queue');
const TestRunBookmark = lazyRequire('./bookmark');
const AssertionExecutor = lazyRequire('../assertions/executor');
const actionCommands = lazyRequire('./commands/actions');
const browserManipulationCommands = lazyRequire('./commands/browser-manipulation');
const serviceCommands = lazyRequire('./commands/service');

const TEST_RUN_TEMPLATE = (0, _readFileRelative.readSync)('../client/test-run/index.js.mustache');
const IFRAME_TEST_RUN_TEMPLATE = (0, _readFileRelative.readSync)('../client/test-run/iframe.js.mustache');
const TEST_DONE_CONFIRMATION_RESPONSE = 'test-done-confirmation';
const MAX_RESPONSE_DELAY = 3000;

const ALL_DRIVER_TASKS_ADDED_TO_QUEUE_EVENT = 'all-driver-tasks-added-to-queue';

class TestRun extends _events2.default {
    constructor(test, browserConnection, screenshotCapturer, globalWarningLog, opts, context) {
        super();
        this.context = context;
        this[_markerSymbol2.default] = true;

        this.warningLog = new _warningLog2.default(globalWarningLog);

        this.opts = opts;
        this.test = test;
        this.browserConnection = browserConnection;

        this.phase = _phase2.default.initial;

        this.driverTaskQueue = [];
        this.testDoneCommandQueued = false;

        this.activeDialogHandler = null;
        this.activeIframeSelector = null;
        this.speed = this.opts.speed;
        this.pageLoadTimeout = this.opts.pageLoadTimeout;

        this.disablePageReloads = test.disablePageReloads || opts.disablePageReloads && test.disablePageReloads !== false;

        this.session = SessionController.getSession(this);

        this.consoleMessages = new _browserConsoleMessages2.default();

        this.pendingRequest = null;
        this.pendingPageError = null;

        this.controller = null;
        this.ctx = (0, _create2.default)(null);
        this.fixtureCtx = null;

        this.currentRoleId = null;
        this.usedRoleStates = (0, _create2.default)(null);

        this.errs = [];

        this.lastDriverStatusId = null;
        this.lastDriverStatusResponse = null;

        this.fileDownloadingHandled = false;
        this.resolveWaitForFileDownloadingPromise = null;

        this.addingDriverTasksCount = 0;

        this.debugging = this.opts.debugMode;
        this.debugOnFail = this.opts.debugOnFail;
        this.disableDebugBreakpoints = false;
        this.debugReporterPluginHost = new _pluginHost2.default({ noColors: false });

        this.browserManipulationQueue = new BrowserManipulationQueue(browserConnection, screenshotCapturer, this.warningLog);

        this.debugLog = new _debugLog2.default(this.browserConnection.userAgent);

        this.quarantine = null;

        this.injectable.scripts.push('/testcafe-core.js');
        this.injectable.scripts.push('/testcafe-ui.js');
        this.injectable.scripts.push('/testcafe-automation.js');
        this.injectable.scripts.push('/testcafe-driver.js');
        this.injectable.styles.push('/testcafe-ui-styles.css');

        this.requestHooks = (0, _from2.default)(this.test.requestHooks);

        this._initRequestHooks();
    }

    get id() {
        return this.session.id;
    }

    get injectable() {
        return this.session.injectable;
    }

    addQuarantineInfo(quarantine) {
        this.quarantine = quarantine;
    }

    addRequestHook(hook) {
        if (this.requestHooks.indexOf(hook) !== -1) return;

        this.requestHooks.push(hook);
        this._initRequestHook(hook);
    }

    removeRequestHook(hook) {
        if (this.requestHooks.indexOf(hook) === -1) return;

        (0, _lodash.pull)(this.requestHooks, hook);
        this._disposeRequestHook(hook);
    }

    _initRequestHook(hook) {
        hook.warningLog = this.warningLog;

        hook._instantiateRequestFilterRules();
        hook._instantiatedRequestFilterRules.forEach(rule => {
            this.session.addRequestEventListeners(rule, {
                onRequest: hook.onRequest.bind(hook),
                onConfigureResponse: hook._onConfigureResponse.bind(hook),
                onResponse: hook.onResponse.bind(hook)
            });
        });
    }

    _disposeRequestHook(hook) {
        hook.warningLog = null;

        hook._instantiatedRequestFilterRules.forEach(rule => {
            this.session.removeRequestEventListeners(rule);
        });
    }

    _initRequestHooks() {
        this.requestHooks.forEach(hook => this._initRequestHook(hook));
    }

    // Hammerhead payload
    _getPayloadScript() {
        this.fileDownloadingHandled = false;
        this.resolveWaitForFileDownloadingPromise = null;

        return _mustache2.default.render(TEST_RUN_TEMPLATE, {
            testRunId: (0, _stringify2.default)(this.session.id),
            browserId: (0, _stringify2.default)(this.browserConnection.id),
            browserHeartbeatRelativeUrl: (0, _stringify2.default)(this.browserConnection.heartbeatRelativeUrl),
            browserStatusRelativeUrl: (0, _stringify2.default)(this.browserConnection.statusRelativeUrl),
            browserStatusDoneRelativeUrl: (0, _stringify2.default)(this.browserConnection.statusDoneRelativeUrl),
            userAgent: (0, _stringify2.default)(this.browserConnection.userAgent),
            testName: (0, _stringify2.default)(this.test.name),
            fixtureName: (0, _stringify2.default)(this.test.fixture.name),
            selectorTimeout: this.opts.selectorTimeout,
            pageLoadTimeout: this.pageLoadTimeout,
            skipJsErrors: this.opts.skipJsErrors,
            retryTestPages: !!this.opts.retryTestPages,
            speed: this.speed,
            dialogHandler: (0, _stringify2.default)(this.activeDialogHandler)
        });
    }

    _getIframePayloadScript() {
        return _mustache2.default.render(IFRAME_TEST_RUN_TEMPLATE, {
            testRunId: (0, _stringify2.default)(this.session.id),
            selectorTimeout: this.opts.selectorTimeout,
            pageLoadTimeout: this.pageLoadTimeout,
            retryTestPages: !!this.opts.retryTestPages,
            speed: this.speed,
            dialogHandler: (0, _stringify2.default)(this.activeDialogHandler)
        });
    }

    // Hammerhead handlers
    getAuthCredentials() {
        return this.test.authCredentials;
    }

    handleFileDownload() {
        if (this.resolveWaitForFileDownloadingPromise) {
            this.resolveWaitForFileDownloadingPromise(true);
            this.resolveWaitForFileDownloadingPromise = null;
        } else this.fileDownloadingHandled = true;
    }

    handlePageError(ctx, err) {
        if (ctx.req.headers[_unstableNetworkMode.UNSTABLE_NETWORK_MODE_HEADER]) {
            ctx.closeWithError(500, err.toString());
            return;
        }

        this.pendingPageError = new _testRun.PageLoadError(err);

        ctx.redirect(ctx.toProxyUrl('about:error'));
    }

    // Test function execution
    _executeTestFn(phase, fn) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            _this.phase = phase;

            try {
                yield fn(_this);
            } catch (err) {
                let screenshotPath = null;

                if (_this.opts.takeScreenshotsOnFails) screenshotPath = yield _this.executeCommand(new browserManipulationCommands.TakeScreenshotOnFailCommand());

                _this.addError(err, screenshotPath);
                return false;
            }

            return !_this._addPendingPageErrorIfAny();
        })();
    }

    _runBeforeHook() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this2.test.beforeFn) return yield _this2._executeTestFn(_phase2.default.inTestBeforeHook, _this2.test.beforeFn);

            if (_this2.test.fixture.beforeEachFn) return yield _this2._executeTestFn(_phase2.default.inFixtureBeforeEachHook, _this2.test.fixture.beforeEachFn);

            return true;
        })();
    }

    _runAfterHook() {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this3.test.afterFn) return yield _this3._executeTestFn(_phase2.default.inTestAfterHook, _this3.test.afterFn);

            if (_this3.test.fixture.afterEachFn) return yield _this3._executeTestFn(_phase2.default.inFixtureAfterEachHook, _this3.test.fixture.afterEachFn);

            return true;
        })();
    }

    start() {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            _testRunTracker2.default.activeTestRuns[_this4.session.id] = _this4;

            _this4.emit('start');

            const onDisconnected = function onDisconnected(err) {
                return _this4._disconnect(err);
            };

            _this4.browserConnection.once('disconnected', onDisconnected);

            if (yield _this4._runBeforeHook()) {
                yield _this4._executeTestFn(_phase2.default.inTest, _this4.test.fn);
                yield _this4._runAfterHook();
            }

            if (_this4.disconnected) return;

            _this4.browserConnection.removeListener('disconnected', onDisconnected);

            if (_this4.errs.length && _this4.debugOnFail) yield _this4._enqueueSetBreakpointCommand(null, _this4.debugReporterPluginHost.formatError(_this4.errs[0]));

            yield _this4.executeCommand(new serviceCommands.TestDoneCommand());

            _this4._addPendingPageErrorIfAny();

            delete _testRunTracker2.default.activeTestRuns[_this4.session.id];

            _this4.emit('done');
        })();
    }

    _evaluate(code) {
        try {
            return executeJsExpression(code, this, { skipVisibilityCheck: false });
        } catch (err) {
            return { err };
        }
    }

    // Errors
    _addPendingPageErrorIfAny() {
        if (this.pendingPageError) {
            this.addError(this.pendingPageError);
            this.pendingPageError = null;
            return true;
        }

        return false;
    }

    addError(err, screenshotPath) {
        const errList = err instanceof _errorList2.default ? err.items : [err];

        errList.forEach(item => {
            const adapter = new _formattableAdapter2.default(item, {
                userAgent: this.browserConnection.userAgent,
                screenshotPath: screenshotPath || '',
                testRunPhase: this.phase
            });

            this.errs.push(adapter);
        });
    }

    // Task queue
    _enqueueCommand(command, callsite) {
        if (this.pendingRequest) this._resolvePendingRequest(command);

        return new _pinkie2.default((resolve, reject) => {
            this.addingDriverTasksCount--;
            this.driverTaskQueue.push({ command, resolve, reject, callsite });

            if (!this.addingDriverTasksCount) this.emit(ALL_DRIVER_TASKS_ADDED_TO_QUEUE_EVENT, this.driverTaskQueue.length);
        });
    }

    get driverTaskQueueLength() {
        return this.addingDriverTasksCount ? (0, _promisifyEvent2.default)(this, ALL_DRIVER_TASKS_ADDED_TO_QUEUE_EVENT) : _pinkie2.default.resolve(this.driverTaskQueue.length);
    }

    _enqueueBrowserConsoleMessagesCommand(command, callsite) {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            yield _this5._enqueueCommand(command, callsite);

            return _this5.consoleMessages.getCopy();
        })();
    }

    _enqueueSetBreakpointCommand(callsite, error) {
        var _this6 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this6.browserConnection.isHeadlessBrowser()) {
                _this6.warningLog.addWarning(_warningMessage2.default.debugInHeadlessError);
                return;
            }

            _debugLogger2.default.showBreakpoint(_this6.session.id, _this6.browserConnection.userAgent, callsite, error);

            _this6.debugging = yield _this6.executeCommand(new serviceCommands.SetBreakpointCommand(!!error), callsite);
        })();
    }

    _removeAllNonServiceTasks() {
        this.driverTaskQueue = this.driverTaskQueue.filter(driverTask => (0, _utils.isServiceCommand)(driverTask.command));

        this.browserManipulationQueue.removeAllNonServiceManipulations();
    }

    // Current driver task
    get currentDriverTask() {
        return this.driverTaskQueue[0];
    }

    _resolveCurrentDriverTask(result) {
        this.currentDriverTask.resolve(result);
        this.driverTaskQueue.shift();

        if (this.testDoneCommandQueued) this._removeAllNonServiceTasks();
    }

    _rejectCurrentDriverTask(err) {
        err.callsite = err.callsite || this.currentDriverTask.callsite;
        err.isRejectedDriverTask = true;

        this.currentDriverTask.reject(err);
        this._removeAllNonServiceTasks();
    }

    // Pending request
    _clearPendingRequest() {
        if (this.pendingRequest) {
            clearTimeout(this.pendingRequest.responseTimeout);
            this.pendingRequest = null;
        }
    }

    _resolvePendingRequest(command) {
        this.lastDriverStatusResponse = command;
        this.pendingRequest.resolve(command);
        this._clearPendingRequest();
    }

    // Handle driver request
    _fulfillCurrentDriverTask(driverStatus) {
        if (driverStatus.executionError) this._rejectCurrentDriverTask(driverStatus.executionError);else this._resolveCurrentDriverTask(driverStatus.result);
    }

    _handlePageErrorStatus(pageError) {
        if (this.currentDriverTask && (0, _utils.isCommandRejectableByPageError)(this.currentDriverTask.command)) {
            this._rejectCurrentDriverTask(pageError);
            this.pendingPageError = null;

            return true;
        }

        this.pendingPageError = this.pendingPageError || pageError;

        return false;
    }

    _handleDriverRequest(driverStatus) {
        const isTestDone = this.currentDriverTask && this.currentDriverTask.command.type === _type2.default.testDone;
        const pageError = this.pendingPageError || driverStatus.pageError;
        const currentTaskRejectedByError = pageError && this._handlePageErrorStatus(pageError);

        if (this.disconnected) return new _pinkie2.default((_, reject) => reject());

        this.consoleMessages.concat(driverStatus.consoleMessages);

        if (!currentTaskRejectedByError && driverStatus.isCommandResult) {
            if (isTestDone) {
                this._resolveCurrentDriverTask();

                return TEST_DONE_CONFIRMATION_RESPONSE;
            }

            this._fulfillCurrentDriverTask(driverStatus);
        }

        return this._getCurrentDriverTaskCommand();
    }

    _getCurrentDriverTaskCommand() {
        if (!this.currentDriverTask) return null;

        const command = this.currentDriverTask.command;

        if (command.type === _type2.default.navigateTo && command.stateSnapshot) this.session.useStateSnapshot(JSON.parse(command.stateSnapshot));

        return command;
    }

    // Execute command
    _executeExpression(command) {
        var _this7 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const resultVariableName = command.resultVariableName,
                  isAsyncExpression = command.isAsyncExpression;


            let expression = command.expression;

            if (isAsyncExpression) expression = `await ${expression}`;

            if (resultVariableName) expression = `${resultVariableName} = ${expression}, ${resultVariableName}`;

            if (isAsyncExpression) expression = `(async () => { return ${expression}; }).apply(this);`;

            const result = _this7._evaluate(expression);

            return isAsyncExpression ? yield result : result;
        })();
    }

    _executeAssertion(command, callsite) {
        var _this8 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const assertionTimeout = command.options.timeout === void 0 ? _this8.opts.assertionTimeout : command.options.timeout;
            const executor = new AssertionExecutor(command, assertionTimeout, callsite);

            executor.once('start-assertion-retries', function (timeout) {
                return _this8.executeCommand(new serviceCommands.ShowAssertionRetriesStatusCommand(timeout));
            });
            executor.once('end-assertion-retries', function (success) {
                return _this8.executeCommand(new serviceCommands.HideAssertionRetriesStatusCommand(success));
            });

            return executor.run();
        })();
    }

    _adjustConfigurationWithCommand(command) {
        if (command.type === _type2.default.testDone) {
            this.testDoneCommandQueued = true;
            _debugLogger2.default.hideBreakpoint(this.session.id);
        } else if (command.type === _type2.default.setNativeDialogHandler) this.activeDialogHandler = command.dialogHandler;else if (command.type === _type2.default.switchToIframe) this.activeIframeSelector = command.selector;else if (command.type === _type2.default.switchToMainWindow) this.activeIframeSelector = null;else if (command.type === _type2.default.setTestSpeed) this.speed = command.speed;else if (command.type === _type2.default.setPageLoadTimeout) this.pageLoadTimeout = command.duration;else if (command.type === _type2.default.debug) this.debugging = true;
    }

    _adjustScreenshotCommand(command) {
        var _this9 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const browserId = _this9.browserConnection.id;

            var _ref = yield _this9.browserConnection.provider.hasCustomActionForBrowser(browserId);

            const hasChromelessScreenshots = _ref.hasChromelessScreenshots;


            if (!hasChromelessScreenshots) command.generateScreenshotMark();
        })();
    }

    _setBreakpointIfNecessary(command, callsite) {
        var _this10 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (!_this10.disableDebugBreakpoints && _this10.debugging && (0, _utils.canSetDebuggerBreakpointBeforeCommand)(command)) yield _this10._enqueueSetBreakpointCommand(callsite);
        })();
    }

    executeCommand(command, callsite) {
        var _this11 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            _this11.debugLog.command(command);

            if (_this11.pendingPageError && (0, _utils.isCommandRejectableByPageError)(command)) return _this11._rejectCommandWithPageError(callsite);

            if ((0, _utils.isExecutableOnClientCommand)(command)) _this11.addingDriverTasksCount++;

            _this11._adjustConfigurationWithCommand(command);

            yield _this11._setBreakpointIfNecessary(command, callsite);

            if ((0, _utils.isScreenshotCommand)(command)) yield _this11._adjustScreenshotCommand(command);

            if ((0, _utils.isBrowserManipulationCommand)(command)) _this11.browserManipulationQueue.push(command);

            if (command.type === _type2.default.wait) return (0, _delay2.default)(command.timeout);

            if (command.type === _type2.default.setPageLoadTimeout) return null;

            if (command.type === _type2.default.debug) return yield _this11._enqueueSetBreakpointCommand(callsite);

            if (command.type === _type2.default.useRole) return yield _this11._useRole(command.role, callsite);

            if (command.type === _type2.default.assertion) return _this11._executeAssertion(command, callsite);

            if (command.type === _type2.default.executeExpression) return yield _this11._executeExpression(command, callsite);

            if (command.type === _type2.default.getBrowserConsoleMessages) return yield _this11._enqueueBrowserConsoleMessagesCommand(command, callsite);

            return _this11._enqueueCommand(command, callsite);
        })();
    }

    _rejectCommandWithPageError(callsite) {
        const err = this.pendingPageError;

        err.callsite = callsite;
        this.pendingPageError = null;

        return _pinkie2.default.reject(err);
    }

    // Role management
    getStateSnapshot() {
        var _this12 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const state = _this12.session.getStateSnapshot();

            state.storages = yield _this12.executeCommand(new serviceCommands.BackupStoragesCommand());

            return state;
        })();
    }

    switchToCleanRun() {
        var _this13 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            _this13.ctx = (0, _create2.default)(null);
            _this13.fixtureCtx = (0, _create2.default)(null);
            _this13.consoleMessages = new _browserConsoleMessages2.default();

            _this13.session.useStateSnapshot(null);

            if (_this13.activeDialogHandler) {
                const removeDialogHandlerCommand = new actionCommands.SetNativeDialogHandlerCommand({ dialogHandler: { fn: null } });

                yield _this13.executeCommand(removeDialogHandlerCommand);
            }

            if (_this13.speed !== _this13.opts.speed) {
                const setSpeedCommand = new actionCommands.SetTestSpeedCommand({ speed: _this13.opts.speed });

                yield _this13.executeCommand(setSpeedCommand);
            }

            if (_this13.pageLoadTimeout !== _this13.opts.pageLoadTimeout) {
                const setPageLoadTimeoutCommand = new actionCommands.SetPageLoadTimeoutCommand({ duration: _this13.opts.pageLoadTimeout });

                yield _this13.executeCommand(setPageLoadTimeoutCommand);
            }
        })();
    }

    _getStateSnapshotFromRole(role) {
        var _this14 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const prevPhase = _this14.phase;

            _this14.phase = _phase2.default.inRoleInitializer;

            if (role.phase === _phase4.default.uninitialized) yield role.initialize(_this14);else if (role.phase === _phase4.default.pendingInitialization) yield (0, _promisifyEvent2.default)(role, 'initialized');

            if (role.initErr) throw role.initErr;

            _this14.phase = prevPhase;

            return role.stateSnapshot;
        })();
    }

    _useRole(role, callsite) {
        var _this15 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this15.phase === _phase2.default.inRoleInitializer) throw new _testRun.RoleSwitchInRoleInitializerError(callsite);

            _this15.disableDebugBreakpoints = true;

            const bookmark = new TestRunBookmark(_this15, role);

            yield bookmark.init();

            if (_this15.currentRoleId) _this15.usedRoleStates[_this15.currentRoleId] = yield _this15.getStateSnapshot();

            const stateSnapshot = _this15.usedRoleStates[role.id] || (yield _this15._getStateSnapshotFromRole(role));

            _this15.session.useStateSnapshot(stateSnapshot);

            _this15.currentRoleId = role.id;

            yield bookmark.restore(callsite, stateSnapshot);

            _this15.disableDebugBreakpoints = false;
        })();
    }

    // Get current URL
    getCurrentUrl() {
        var _this16 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const builder = new ClientFunctionBuilder(function () {
                /* eslint-disable no-undef */
                return window.location.href;
                /* eslint-enable no-undef */
            }, { boundTestRun: _this16 });

            const getLocation = builder.getFunction();

            return yield getLocation();
        })();
    }

    _disconnect(err) {
        this.disconnected = true;

        this._rejectCurrentDriverTask(err);

        this.emit('disconnected', err);

        delete _testRunTracker2.default.activeTestRuns[this.session.id];
    }
}

exports.default = TestRun; // Service message handlers

const ServiceMessages = TestRun.prototype;

ServiceMessages[_clientMessages2.default.ready] = function (msg) {
    this.debugLog.driverMessage(msg);

    this._clearPendingRequest();

    // NOTE: the driver sends the status for the second time if it didn't get a response at the
    // first try. This is possible when the page was unloaded after the driver sent the status.
    if (msg.status.id === this.lastDriverStatusId) return this.lastDriverStatusResponse;

    this.lastDriverStatusId = msg.status.id;
    this.lastDriverStatusResponse = this._handleDriverRequest(msg.status);

    if (this.lastDriverStatusResponse) return this.lastDriverStatusResponse;

    // NOTE: we send an empty response after the MAX_RESPONSE_DELAY timeout is exceeded to keep connection
    // with the client and prevent the response timeout exception on the client side
    const responseTimeout = setTimeout(() => this._resolvePendingRequest(null), MAX_RESPONSE_DELAY);

    return new _pinkie2.default((resolve, reject) => {
        this.pendingRequest = { resolve, reject, responseTimeout };
    });
};

ServiceMessages[_clientMessages2.default.readyForBrowserManipulation] = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (msg) {
        this.debugLog.driverMessage(msg);

        let result = null;
        let error = null;

        try {
            result = yield this.browserManipulationQueue.executePendingManipulation(msg);
        } catch (err) {
            error = err;
        }

        return { result, error };
    });

    return function (_x) {
        return _ref2.apply(this, arguments);
    };
})();

ServiceMessages[_clientMessages2.default.waitForFileDownload] = function (msg) {
    this.debugLog.driverMessage(msg);

    return new _pinkie2.default(resolve => {
        if (this.fileDownloadingHandled) {
            this.fileDownloadingHandled = false;
            resolve(true);
        } else this.resolveWaitForFileDownloadingPromise = resolve;
    });
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXN0LXJ1bi9pbmRleC5qcyJdLCJuYW1lcyI6WyJsYXp5UmVxdWlyZSIsInJlcXVpcmUiLCJTZXNzaW9uQ29udHJvbGxlciIsIkNsaWVudEZ1bmN0aW9uQnVpbGRlciIsImV4ZWN1dGVKc0V4cHJlc3Npb24iLCJCcm93c2VyTWFuaXB1bGF0aW9uUXVldWUiLCJUZXN0UnVuQm9va21hcmsiLCJBc3NlcnRpb25FeGVjdXRvciIsImFjdGlvbkNvbW1hbmRzIiwiYnJvd3Nlck1hbmlwdWxhdGlvbkNvbW1hbmRzIiwic2VydmljZUNvbW1hbmRzIiwiVEVTVF9SVU5fVEVNUExBVEUiLCJJRlJBTUVfVEVTVF9SVU5fVEVNUExBVEUiLCJURVNUX0RPTkVfQ09ORklSTUFUSU9OX1JFU1BPTlNFIiwiTUFYX1JFU1BPTlNFX0RFTEFZIiwiQUxMX0RSSVZFUl9UQVNLU19BRERFRF9UT19RVUVVRV9FVkVOVCIsIlRlc3RSdW4iLCJFdmVudEVtaXR0ZXIiLCJjb25zdHJ1Y3RvciIsInRlc3QiLCJicm93c2VyQ29ubmVjdGlvbiIsInNjcmVlbnNob3RDYXB0dXJlciIsImdsb2JhbFdhcm5pbmdMb2ciLCJvcHRzIiwiY29udGV4dCIsInRlc3RSdW5NYXJrZXIiLCJ3YXJuaW5nTG9nIiwiV2FybmluZ0xvZyIsInBoYXNlIiwiUEhBU0UiLCJpbml0aWFsIiwiZHJpdmVyVGFza1F1ZXVlIiwidGVzdERvbmVDb21tYW5kUXVldWVkIiwiYWN0aXZlRGlhbG9nSGFuZGxlciIsImFjdGl2ZUlmcmFtZVNlbGVjdG9yIiwic3BlZWQiLCJwYWdlTG9hZFRpbWVvdXQiLCJkaXNhYmxlUGFnZVJlbG9hZHMiLCJzZXNzaW9uIiwiZ2V0U2Vzc2lvbiIsImNvbnNvbGVNZXNzYWdlcyIsIkJyb3dzZXJDb25zb2xlTWVzc2FnZXMiLCJwZW5kaW5nUmVxdWVzdCIsInBlbmRpbmdQYWdlRXJyb3IiLCJjb250cm9sbGVyIiwiY3R4IiwiZml4dHVyZUN0eCIsImN1cnJlbnRSb2xlSWQiLCJ1c2VkUm9sZVN0YXRlcyIsImVycnMiLCJsYXN0RHJpdmVyU3RhdHVzSWQiLCJsYXN0RHJpdmVyU3RhdHVzUmVzcG9uc2UiLCJmaWxlRG93bmxvYWRpbmdIYW5kbGVkIiwicmVzb2x2ZVdhaXRGb3JGaWxlRG93bmxvYWRpbmdQcm9taXNlIiwiYWRkaW5nRHJpdmVyVGFza3NDb3VudCIsImRlYnVnZ2luZyIsImRlYnVnTW9kZSIsImRlYnVnT25GYWlsIiwiZGlzYWJsZURlYnVnQnJlYWtwb2ludHMiLCJkZWJ1Z1JlcG9ydGVyUGx1Z2luSG9zdCIsIlJlcG9ydGVyUGx1Z2luSG9zdCIsIm5vQ29sb3JzIiwiYnJvd3Nlck1hbmlwdWxhdGlvblF1ZXVlIiwiZGVidWdMb2ciLCJUZXN0UnVuRGVidWdMb2ciLCJ1c2VyQWdlbnQiLCJxdWFyYW50aW5lIiwiaW5qZWN0YWJsZSIsInNjcmlwdHMiLCJwdXNoIiwic3R5bGVzIiwicmVxdWVzdEhvb2tzIiwiX2luaXRSZXF1ZXN0SG9va3MiLCJpZCIsImFkZFF1YXJhbnRpbmVJbmZvIiwiYWRkUmVxdWVzdEhvb2siLCJob29rIiwiaW5kZXhPZiIsIl9pbml0UmVxdWVzdEhvb2siLCJyZW1vdmVSZXF1ZXN0SG9vayIsIl9kaXNwb3NlUmVxdWVzdEhvb2siLCJfaW5zdGFudGlhdGVSZXF1ZXN0RmlsdGVyUnVsZXMiLCJfaW5zdGFudGlhdGVkUmVxdWVzdEZpbHRlclJ1bGVzIiwiZm9yRWFjaCIsInJ1bGUiLCJhZGRSZXF1ZXN0RXZlbnRMaXN0ZW5lcnMiLCJvblJlcXVlc3QiLCJiaW5kIiwib25Db25maWd1cmVSZXNwb25zZSIsIl9vbkNvbmZpZ3VyZVJlc3BvbnNlIiwib25SZXNwb25zZSIsInJlbW92ZVJlcXVlc3RFdmVudExpc3RlbmVycyIsIl9nZXRQYXlsb2FkU2NyaXB0IiwiTXVzdGFjaGUiLCJyZW5kZXIiLCJ0ZXN0UnVuSWQiLCJicm93c2VySWQiLCJicm93c2VySGVhcnRiZWF0UmVsYXRpdmVVcmwiLCJoZWFydGJlYXRSZWxhdGl2ZVVybCIsImJyb3dzZXJTdGF0dXNSZWxhdGl2ZVVybCIsInN0YXR1c1JlbGF0aXZlVXJsIiwiYnJvd3NlclN0YXR1c0RvbmVSZWxhdGl2ZVVybCIsInN0YXR1c0RvbmVSZWxhdGl2ZVVybCIsInRlc3ROYW1lIiwibmFtZSIsImZpeHR1cmVOYW1lIiwiZml4dHVyZSIsInNlbGVjdG9yVGltZW91dCIsInNraXBKc0Vycm9ycyIsInJldHJ5VGVzdFBhZ2VzIiwiZGlhbG9nSGFuZGxlciIsIl9nZXRJZnJhbWVQYXlsb2FkU2NyaXB0IiwiZ2V0QXV0aENyZWRlbnRpYWxzIiwiYXV0aENyZWRlbnRpYWxzIiwiaGFuZGxlRmlsZURvd25sb2FkIiwiaGFuZGxlUGFnZUVycm9yIiwiZXJyIiwicmVxIiwiaGVhZGVycyIsIlVOU1RBQkxFX05FVFdPUktfTU9ERV9IRUFERVIiLCJjbG9zZVdpdGhFcnJvciIsInRvU3RyaW5nIiwiUGFnZUxvYWRFcnJvciIsInJlZGlyZWN0IiwidG9Qcm94eVVybCIsIl9leGVjdXRlVGVzdEZuIiwiZm4iLCJzY3JlZW5zaG90UGF0aCIsInRha2VTY3JlZW5zaG90c09uRmFpbHMiLCJleGVjdXRlQ29tbWFuZCIsIlRha2VTY3JlZW5zaG90T25GYWlsQ29tbWFuZCIsImFkZEVycm9yIiwiX2FkZFBlbmRpbmdQYWdlRXJyb3JJZkFueSIsIl9ydW5CZWZvcmVIb29rIiwiYmVmb3JlRm4iLCJpblRlc3RCZWZvcmVIb29rIiwiYmVmb3JlRWFjaEZuIiwiaW5GaXh0dXJlQmVmb3JlRWFjaEhvb2siLCJfcnVuQWZ0ZXJIb29rIiwiYWZ0ZXJGbiIsImluVGVzdEFmdGVySG9vayIsImFmdGVyRWFjaEZuIiwiaW5GaXh0dXJlQWZ0ZXJFYWNoSG9vayIsInN0YXJ0IiwidGVzdFJ1blRyYWNrZXIiLCJhY3RpdmVUZXN0UnVucyIsImVtaXQiLCJvbkRpc2Nvbm5lY3RlZCIsIl9kaXNjb25uZWN0Iiwib25jZSIsImluVGVzdCIsImRpc2Nvbm5lY3RlZCIsInJlbW92ZUxpc3RlbmVyIiwibGVuZ3RoIiwiX2VucXVldWVTZXRCcmVha3BvaW50Q29tbWFuZCIsImZvcm1hdEVycm9yIiwiVGVzdERvbmVDb21tYW5kIiwiX2V2YWx1YXRlIiwiY29kZSIsInNraXBWaXNpYmlsaXR5Q2hlY2siLCJlcnJMaXN0IiwiVGVzdENhZmVFcnJvckxpc3QiLCJpdGVtcyIsIml0ZW0iLCJhZGFwdGVyIiwiVGVzdFJ1bkVycm9yRm9ybWF0dGFibGVBZGFwdGVyIiwidGVzdFJ1blBoYXNlIiwiX2VucXVldWVDb21tYW5kIiwiY29tbWFuZCIsImNhbGxzaXRlIiwiX3Jlc29sdmVQZW5kaW5nUmVxdWVzdCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZHJpdmVyVGFza1F1ZXVlTGVuZ3RoIiwiX2VucXVldWVCcm93c2VyQ29uc29sZU1lc3NhZ2VzQ29tbWFuZCIsImdldENvcHkiLCJlcnJvciIsImlzSGVhZGxlc3NCcm93c2VyIiwiYWRkV2FybmluZyIsIldBUk5JTkdfTUVTU0FHRSIsImRlYnVnSW5IZWFkbGVzc0Vycm9yIiwiZGVidWdMb2dnZXIiLCJzaG93QnJlYWtwb2ludCIsIlNldEJyZWFrcG9pbnRDb21tYW5kIiwiX3JlbW92ZUFsbE5vblNlcnZpY2VUYXNrcyIsImZpbHRlciIsImRyaXZlclRhc2siLCJyZW1vdmVBbGxOb25TZXJ2aWNlTWFuaXB1bGF0aW9ucyIsImN1cnJlbnREcml2ZXJUYXNrIiwiX3Jlc29sdmVDdXJyZW50RHJpdmVyVGFzayIsInJlc3VsdCIsInNoaWZ0IiwiX3JlamVjdEN1cnJlbnREcml2ZXJUYXNrIiwiaXNSZWplY3RlZERyaXZlclRhc2siLCJfY2xlYXJQZW5kaW5nUmVxdWVzdCIsImNsZWFyVGltZW91dCIsInJlc3BvbnNlVGltZW91dCIsIl9mdWxmaWxsQ3VycmVudERyaXZlclRhc2siLCJkcml2ZXJTdGF0dXMiLCJleGVjdXRpb25FcnJvciIsIl9oYW5kbGVQYWdlRXJyb3JTdGF0dXMiLCJwYWdlRXJyb3IiLCJfaGFuZGxlRHJpdmVyUmVxdWVzdCIsImlzVGVzdERvbmUiLCJ0eXBlIiwiQ09NTUFORF9UWVBFIiwidGVzdERvbmUiLCJjdXJyZW50VGFza1JlamVjdGVkQnlFcnJvciIsIl8iLCJjb25jYXQiLCJpc0NvbW1hbmRSZXN1bHQiLCJfZ2V0Q3VycmVudERyaXZlclRhc2tDb21tYW5kIiwibmF2aWdhdGVUbyIsInN0YXRlU25hcHNob3QiLCJ1c2VTdGF0ZVNuYXBzaG90IiwiSlNPTiIsInBhcnNlIiwiX2V4ZWN1dGVFeHByZXNzaW9uIiwicmVzdWx0VmFyaWFibGVOYW1lIiwiaXNBc3luY0V4cHJlc3Npb24iLCJleHByZXNzaW9uIiwiX2V4ZWN1dGVBc3NlcnRpb24iLCJhc3NlcnRpb25UaW1lb3V0Iiwib3B0aW9ucyIsInRpbWVvdXQiLCJleGVjdXRvciIsIlNob3dBc3NlcnRpb25SZXRyaWVzU3RhdHVzQ29tbWFuZCIsIkhpZGVBc3NlcnRpb25SZXRyaWVzU3RhdHVzQ29tbWFuZCIsInN1Y2Nlc3MiLCJydW4iLCJfYWRqdXN0Q29uZmlndXJhdGlvbldpdGhDb21tYW5kIiwiaGlkZUJyZWFrcG9pbnQiLCJzZXROYXRpdmVEaWFsb2dIYW5kbGVyIiwic3dpdGNoVG9JZnJhbWUiLCJzZWxlY3RvciIsInN3aXRjaFRvTWFpbldpbmRvdyIsInNldFRlc3RTcGVlZCIsInNldFBhZ2VMb2FkVGltZW91dCIsImR1cmF0aW9uIiwiZGVidWciLCJfYWRqdXN0U2NyZWVuc2hvdENvbW1hbmQiLCJwcm92aWRlciIsImhhc0N1c3RvbUFjdGlvbkZvckJyb3dzZXIiLCJoYXNDaHJvbWVsZXNzU2NyZWVuc2hvdHMiLCJnZW5lcmF0ZVNjcmVlbnNob3RNYXJrIiwiX3NldEJyZWFrcG9pbnRJZk5lY2Vzc2FyeSIsIl9yZWplY3RDb21tYW5kV2l0aFBhZ2VFcnJvciIsIndhaXQiLCJ1c2VSb2xlIiwiX3VzZVJvbGUiLCJyb2xlIiwiYXNzZXJ0aW9uIiwiZXhlY3V0ZUV4cHJlc3Npb24iLCJnZXRCcm93c2VyQ29uc29sZU1lc3NhZ2VzIiwiZ2V0U3RhdGVTbmFwc2hvdCIsInN0YXRlIiwic3RvcmFnZXMiLCJCYWNrdXBTdG9yYWdlc0NvbW1hbmQiLCJzd2l0Y2hUb0NsZWFuUnVuIiwicmVtb3ZlRGlhbG9nSGFuZGxlckNvbW1hbmQiLCJTZXROYXRpdmVEaWFsb2dIYW5kbGVyQ29tbWFuZCIsInNldFNwZWVkQ29tbWFuZCIsIlNldFRlc3RTcGVlZENvbW1hbmQiLCJzZXRQYWdlTG9hZFRpbWVvdXRDb21tYW5kIiwiU2V0UGFnZUxvYWRUaW1lb3V0Q29tbWFuZCIsIl9nZXRTdGF0ZVNuYXBzaG90RnJvbVJvbGUiLCJwcmV2UGhhc2UiLCJpblJvbGVJbml0aWFsaXplciIsIlJPTEVfUEhBU0UiLCJ1bmluaXRpYWxpemVkIiwiaW5pdGlhbGl6ZSIsInBlbmRpbmdJbml0aWFsaXphdGlvbiIsImluaXRFcnIiLCJSb2xlU3dpdGNoSW5Sb2xlSW5pdGlhbGl6ZXJFcnJvciIsImJvb2ttYXJrIiwiaW5pdCIsInJlc3RvcmUiLCJnZXRDdXJyZW50VXJsIiwiYnVpbGRlciIsIndpbmRvdyIsImxvY2F0aW9uIiwiaHJlZiIsImJvdW5kVGVzdFJ1biIsImdldExvY2F0aW9uIiwiZ2V0RnVuY3Rpb24iLCJTZXJ2aWNlTWVzc2FnZXMiLCJwcm90b3R5cGUiLCJDTElFTlRfTUVTU0FHRVMiLCJyZWFkeSIsIm1zZyIsImRyaXZlck1lc3NhZ2UiLCJzdGF0dXMiLCJzZXRUaW1lb3V0IiwicmVhZHlGb3JCcm93c2VyTWFuaXB1bGF0aW9uIiwiZXhlY3V0ZVBlbmRpbmdNYW5pcHVsYXRpb24iLCJ3YWl0Rm9yRmlsZURvd25sb2FkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBRUE7Ozs7QUFTQSxNQUFNQSxj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QUFoQyxJQUF1RCxVQUFVTixHQUFWLEVBQWU7QUFDbEUsU0FBS25PLFFBQUwsQ0FBY29PLGFBQWQsQ0FBNEJELEdBQTVCOztBQUVBLFdBQU8sSUFBSXZILGdCQUFKLENBQVlDLFdBQVc7QUFDMUIsWUFBSSxLQUFLeEgsc0JBQVQsRUFBaUM7QUFDN0IsaUJBQUtBLHNCQUFMLEdBQThCLEtBQTlCO0FBQ0F3SCxvQkFBUSxJQUFSO0FBQ0gsU0FIRCxNQUtJLEtBQUt2SCxvQ0FBTCxHQUE0Q3VILE9BQTVDO0FBQ1AsS0FQTSxDQUFQO0FBUUgsQ0FYRCIsImZpbGUiOiJ0ZXN0LXJ1bi9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IHB1bGwgYXMgcmVtb3ZlIH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IHJlYWRTeW5jIGFzIHJlYWQgfSBmcm9tICdyZWFkLWZpbGUtcmVsYXRpdmUnO1xuaW1wb3J0IHByb21pc2lmeUV2ZW50IGZyb20gJ3Byb21pc2lmeS1ldmVudCc7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICdwaW5raWUnO1xuaW1wb3J0IE11c3RhY2hlIGZyb20gJ211c3RhY2hlJztcbmltcG9ydCBkZWJ1Z0xvZ2dlciBmcm9tICcuLi9ub3RpZmljYXRpb25zL2RlYnVnLWxvZ2dlcic7XG5pbXBvcnQgVGVzdFJ1bkRlYnVnTG9nIGZyb20gJy4vZGVidWctbG9nJztcbmltcG9ydCBUZXN0UnVuRXJyb3JGb3JtYXR0YWJsZUFkYXB0ZXIgZnJvbSAnLi4vZXJyb3JzL3Rlc3QtcnVuL2Zvcm1hdHRhYmxlLWFkYXB0ZXInO1xuaW1wb3J0IFRlc3RDYWZlRXJyb3JMaXN0IGZyb20gJy4uL2Vycm9ycy9lcnJvci1saXN0JztcbmltcG9ydCB7IFBhZ2VMb2FkRXJyb3IsIFJvbGVTd2l0Y2hJblJvbGVJbml0aWFsaXplckVycm9yIH0gZnJvbSAnLi4vZXJyb3JzL3Rlc3QtcnVuLyc7XG5pbXBvcnQgUEhBU0UgZnJvbSAnLi9waGFzZSc7XG5pbXBvcnQgQ0xJRU5UX01FU1NBR0VTIGZyb20gJy4vY2xpZW50LW1lc3NhZ2VzJztcbmltcG9ydCBDT01NQU5EX1RZUEUgZnJvbSAnLi9jb21tYW5kcy90eXBlJztcbmltcG9ydCBkZWxheSBmcm9tICcuLi91dGlscy9kZWxheSc7XG5pbXBvcnQgdGVzdFJ1bk1hcmtlciBmcm9tICcuL21hcmtlci1zeW1ib2wnO1xuaW1wb3J0IHRlc3RSdW5UcmFja2VyIGZyb20gJy4uL2FwaS90ZXN0LXJ1bi10cmFja2VyJztcbmltcG9ydCBST0xFX1BIQVNFIGZyb20gJy4uL3JvbGUvcGhhc2UnO1xuaW1wb3J0IFJlcG9ydGVyUGx1Z2luSG9zdCBmcm9tICcuLi9yZXBvcnRlci9wbHVnaW4taG9zdCc7XG5pbXBvcnQgQnJvd3NlckNvbnNvbGVNZXNzYWdlcyBmcm9tICcuL2Jyb3dzZXItY29uc29sZS1tZXNzYWdlcyc7XG5pbXBvcnQgeyBVTlNUQUJMRV9ORVRXT1JLX01PREVfSEVBREVSIH0gZnJvbSAnLi4vYnJvd3Nlci9jb25uZWN0aW9uL3Vuc3RhYmxlLW5ldHdvcmstbW9kZSc7XG5pbXBvcnQgV2FybmluZ0xvZyBmcm9tICcuLi9ub3RpZmljYXRpb25zL3dhcm5pbmctbG9nJztcbmltcG9ydCBXQVJOSU5HX01FU1NBR0UgZnJvbSAnLi4vbm90aWZpY2F0aW9ucy93YXJuaW5nLW1lc3NhZ2UnO1xuXG5pbXBvcnQge1xuICAgIGlzQ29tbWFuZFJlamVjdGFibGVCeVBhZ2VFcnJvcixcbiAgICBpc0Jyb3dzZXJNYW5pcHVsYXRpb25Db21tYW5kLFxuICAgIGlzU2NyZWVuc2hvdENvbW1hbmQsXG4gICAgaXNTZXJ2aWNlQ29tbWFuZCxcbiAgICBjYW5TZXREZWJ1Z2dlckJyZWFrcG9pbnRCZWZvcmVDb21tYW5kLFxuICAgIGlzRXhlY3V0YWJsZU9uQ2xpZW50Q29tbWFuZFxufSBmcm9tICcuL2NvbW1hbmRzL3V0aWxzJztcblxuY29uc3QgbGF6eVJlcXVpcmUgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnaW1wb3J0LWxhenknKShyZXF1aXJlKTtcbmNvbnN0IFNlc3Npb25Db250cm9sbGVyICAgICAgICAgICA9IGxhenlSZXF1aXJlKCcuL3Nlc3Npb24tY29udHJvbGxlcicpO1xuY29uc3QgQ2xpZW50RnVuY3Rpb25CdWlsZGVyICAgICAgID0gbGF6eVJlcXVpcmUoJy4uL2NsaWVudC1mdW5jdGlvbnMvY2xpZW50LWZ1bmN0aW9uLWJ1aWxkZXInKTtcbmNvbnN0IGV4ZWN1dGVKc0V4cHJlc3Npb24gICAgICAgICA9IGxhenlSZXF1aXJlKCcuL2V4ZWN1dGUtanMtZXhwcmVzc2lvbicpO1xuY29uc3QgQnJvd3Nlck1hbmlwdWxhdGlvblF1ZXVlICAgID0gbGF6eVJlcXVpcmUoJy4vYnJvd3Nlci1tYW5pcHVsYXRpb24tcXVldWUnKTtcbmNvbnN0IFRlc3RSdW5Cb29rbWFyayAgICAgICAgICAgICA9IGxhenlSZXF1aXJlKCcuL2Jvb2ttYXJrJyk7XG5jb25zdCBBc3NlcnRpb25FeGVjdXRvciAgICAgICAgICAgPSBsYXp5UmVxdWlyZSgnLi4vYXNzZXJ0aW9ucy9leGVjdXRvcicpO1xuY29uc3QgYWN0aW9uQ29tbWFuZHMgICAgICAgICAgICAgID0gbGF6eVJlcXVpcmUoJy4vY29tbWFuZHMvYWN0aW9ucycpO1xuY29uc3QgYnJvd3Nlck1hbmlwdWxhdGlvbkNvbW1hbmRzID0gbGF6eVJlcXVpcmUoJy4vY29tbWFuZHMvYnJvd3Nlci1tYW5pcHVsYXRpb24nKTtcbmNvbnN0IHNlcnZpY2VDb21tYW5kcyAgICAgICAgICAgICA9IGxhenlSZXF1aXJlKCcuL2NvbW1hbmRzL3NlcnZpY2UnKTtcblxuXG5jb25zdCBURVNUX1JVTl9URU1QTEFURSAgICAgICAgICAgICAgID0gcmVhZCgnLi4vY2xpZW50L3Rlc3QtcnVuL2luZGV4LmpzLm11c3RhY2hlJyk7XG5jb25zdCBJRlJBTUVfVEVTVF9SVU5fVEVNUExBVEUgICAgICAgID0gcmVhZCgnLi4vY2xpZW50L3Rlc3QtcnVuL2lmcmFtZS5qcy5tdXN0YWNoZScpO1xuY29uc3QgVEVTVF9ET05FX0NPTkZJUk1BVElPTl9SRVNQT05TRSA9ICd0ZXN0LWRvbmUtY29uZmlybWF0aW9uJztcbmNvbnN0IE1BWF9SRVNQT05TRV9ERUxBWSAgICAgICAgICAgICAgPSAzMDAwO1xuXG5jb25zdCBBTExfRFJJVkVSX1RBU0tTX0FEREVEX1RPX1FVRVVFX0VWRU5UID0gJ2FsbC1kcml2ZXItdGFza3MtYWRkZWQtdG8tcXVldWUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXN0UnVuIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvciAodGVzdCwgYnJvd3NlckNvbm5lY3Rpb24sIHNjcmVlbnNob3RDYXB0dXJlciwgZ2xvYmFsV2FybmluZ0xvZywgb3B0cywgY29udGV4dCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzW3Rlc3RSdW5NYXJrZXJdID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLndhcm5pbmdMb2cgPSBuZXcgV2FybmluZ0xvZyhnbG9iYWxXYXJuaW5nTG9nKTtcblxuICAgICAgICB0aGlzLm9wdHMgICAgICAgICAgICAgID0gb3B0cztcbiAgICAgICAgdGhpcy50ZXN0ICAgICAgICAgICAgICA9IHRlc3Q7XG4gICAgICAgIHRoaXMuYnJvd3NlckNvbm5lY3Rpb24gPSBicm93c2VyQ29ubmVjdGlvbjtcblxuICAgICAgICB0aGlzLnBoYXNlID0gUEhBU0UuaW5pdGlhbDtcblxuICAgICAgICB0aGlzLmRyaXZlclRhc2tRdWV1ZSAgICAgICA9IFtdO1xuICAgICAgICB0aGlzLnRlc3REb25lQ29tbWFuZFF1ZXVlZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuYWN0aXZlRGlhbG9nSGFuZGxlciAgPSBudWxsO1xuICAgICAgICB0aGlzLmFjdGl2ZUlmcmFtZVNlbGVjdG9yID0gbnVsbDtcbiAgICAgICAgdGhpcy5zcGVlZCAgICAgICAgICAgICAgICA9IHRoaXMub3B0cy5zcGVlZDtcbiAgICAgICAgdGhpcy5wYWdlTG9hZFRpbWVvdXQgICAgICA9IHRoaXMub3B0cy5wYWdlTG9hZFRpbWVvdXQ7XG5cbiAgICAgICAgdGhpcy5kaXNhYmxlUGFnZVJlbG9hZHMgPSB0ZXN0LmRpc2FibGVQYWdlUmVsb2FkcyB8fCBvcHRzLmRpc2FibGVQYWdlUmVsb2FkcyAmJiB0ZXN0LmRpc2FibGVQYWdlUmVsb2FkcyAhPT0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5zZXNzaW9uID0gU2Vzc2lvbkNvbnRyb2xsZXIuZ2V0U2Vzc2lvbih0aGlzKTtcblxuICAgICAgICB0aGlzLmNvbnNvbGVNZXNzYWdlcyA9IG5ldyBCcm93c2VyQ29uc29sZU1lc3NhZ2VzKCk7XG5cbiAgICAgICAgdGhpcy5wZW5kaW5nUmVxdWVzdCAgID0gbnVsbDtcbiAgICAgICAgdGhpcy5wZW5kaW5nUGFnZUVycm9yID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmN0eCAgICAgICAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICB0aGlzLmZpeHR1cmVDdHggPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3VycmVudFJvbGVJZCAgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZWRSb2xlU3RhdGVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgICAgICB0aGlzLmVycnMgPSBbXTtcblxuICAgICAgICB0aGlzLmxhc3REcml2ZXJTdGF0dXNJZCAgICAgICA9IG51bGw7XG4gICAgICAgIHRoaXMubGFzdERyaXZlclN0YXR1c1Jlc3BvbnNlID0gbnVsbDtcblxuICAgICAgICB0aGlzLmZpbGVEb3dubG9hZGluZ0hhbmRsZWQgICAgICAgICAgICAgICA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlc29sdmVXYWl0Rm9yRmlsZURvd25sb2FkaW5nUHJvbWlzZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5hZGRpbmdEcml2ZXJUYXNrc0NvdW50ID0gMDtcblxuICAgICAgICB0aGlzLmRlYnVnZ2luZyAgICAgICAgICAgICAgID0gdGhpcy5vcHRzLmRlYnVnTW9kZTtcbiAgICAgICAgdGhpcy5kZWJ1Z09uRmFpbCAgICAgICAgICAgICA9IHRoaXMub3B0cy5kZWJ1Z09uRmFpbDtcbiAgICAgICAgdGhpcy5kaXNhYmxlRGVidWdCcmVha3BvaW50cyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRlYnVnUmVwb3J0ZXJQbHVnaW5Ib3N0ID0gbmV3IFJlcG9ydGVyUGx1Z2luSG9zdCh7IG5vQ29sb3JzOiBmYWxzZSB9KTtcblxuICAgICAgICB0aGlzLmJyb3dzZXJNYW5pcHVsYXRpb25RdWV1ZSA9IG5ldyBCcm93c2VyTWFuaXB1bGF0aW9uUXVldWUoYnJvd3NlckNvbm5lY3Rpb24sIHNjcmVlbnNob3RDYXB0dXJlciwgdGhpcy53YXJuaW5nTG9nKTtcblxuICAgICAgICB0aGlzLmRlYnVnTG9nID0gbmV3IFRlc3RSdW5EZWJ1Z0xvZyh0aGlzLmJyb3dzZXJDb25uZWN0aW9uLnVzZXJBZ2VudCk7XG5cbiAgICAgICAgdGhpcy5xdWFyYW50aW5lID0gbnVsbDtcblxuICAgICAgICB0aGlzLmluamVjdGFibGUuc2NyaXB0cy5wdXNoKCcvdGVzdGNhZmUtY29yZS5qcycpO1xuICAgICAgICB0aGlzLmluamVjdGFibGUuc2NyaXB0cy5wdXNoKCcvdGVzdGNhZmUtdWkuanMnKTtcbiAgICAgICAgdGhpcy5pbmplY3RhYmxlLnNjcmlwdHMucHVzaCgnL3Rlc3RjYWZlLWF1dG9tYXRpb24uanMnKTtcbiAgICAgICAgdGhpcy5pbmplY3RhYmxlLnNjcmlwdHMucHVzaCgnL3Rlc3RjYWZlLWRyaXZlci5qcycpO1xuICAgICAgICB0aGlzLmluamVjdGFibGUuc3R5bGVzLnB1c2goJy90ZXN0Y2FmZS11aS1zdHlsZXMuY3NzJyk7XG5cbiAgICAgICAgdGhpcy5yZXF1ZXN0SG9va3MgPSBBcnJheS5mcm9tKHRoaXMudGVzdC5yZXF1ZXN0SG9va3MpO1xuXG4gICAgICAgIHRoaXMuX2luaXRSZXF1ZXN0SG9va3MoKTtcbiAgICB9XG5cbiAgICBnZXQgaWQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXNzaW9uLmlkO1xuICAgIH1cblxuICAgIGdldCBpbmplY3RhYmxlICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5pbmplY3RhYmxlO1xuICAgIH1cblxuICAgIGFkZFF1YXJhbnRpbmVJbmZvIChxdWFyYW50aW5lKSB7XG4gICAgICAgIHRoaXMucXVhcmFudGluZSA9IHF1YXJhbnRpbmU7XG4gICAgfVxuXG4gICAgYWRkUmVxdWVzdEhvb2sgKGhvb2spIHtcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdEhvb2tzLmluZGV4T2YoaG9vaykgIT09IC0xKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMucmVxdWVzdEhvb2tzLnB1c2goaG9vayk7XG4gICAgICAgIHRoaXMuX2luaXRSZXF1ZXN0SG9vayhob29rKTtcbiAgICB9XG5cbiAgICByZW1vdmVSZXF1ZXN0SG9vayAoaG9vaykge1xuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0SG9va3MuaW5kZXhPZihob29rKSA9PT0gLTEpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgcmVtb3ZlKHRoaXMucmVxdWVzdEhvb2tzLCBob29rKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zZVJlcXVlc3RIb29rKGhvb2spO1xuICAgIH1cblxuICAgIF9pbml0UmVxdWVzdEhvb2sgKGhvb2spIHtcbiAgICAgICAgaG9vay53YXJuaW5nTG9nID0gdGhpcy53YXJuaW5nTG9nO1xuXG4gICAgICAgIGhvb2suX2luc3RhbnRpYXRlUmVxdWVzdEZpbHRlclJ1bGVzKCk7XG4gICAgICAgIGhvb2suX2luc3RhbnRpYXRlZFJlcXVlc3RGaWx0ZXJSdWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXNzaW9uLmFkZFJlcXVlc3RFdmVudExpc3RlbmVycyhydWxlLCB7XG4gICAgICAgICAgICAgICAgb25SZXF1ZXN0OiAgICAgICAgICAgaG9vay5vblJlcXVlc3QuYmluZChob29rKSxcbiAgICAgICAgICAgICAgICBvbkNvbmZpZ3VyZVJlc3BvbnNlOiBob29rLl9vbkNvbmZpZ3VyZVJlc3BvbnNlLmJpbmQoaG9vayksXG4gICAgICAgICAgICAgICAgb25SZXNwb25zZTogICAgICAgICAgaG9vay5vblJlc3BvbnNlLmJpbmQoaG9vaylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfZGlzcG9zZVJlcXVlc3RIb29rIChob29rKSB7XG4gICAgICAgIGhvb2sud2FybmluZ0xvZyA9IG51bGw7XG5cbiAgICAgICAgaG9vay5faW5zdGFudGlhdGVkUmVxdWVzdEZpbHRlclJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNlc3Npb24ucmVtb3ZlUmVxdWVzdEV2ZW50TGlzdGVuZXJzKHJ1bGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfaW5pdFJlcXVlc3RIb29rcyAoKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdEhvb2tzLmZvckVhY2goaG9vayA9PiB0aGlzLl9pbml0UmVxdWVzdEhvb2soaG9vaykpO1xuICAgIH1cblxuICAgIC8vIEhhbW1lcmhlYWQgcGF5bG9hZFxuICAgIF9nZXRQYXlsb2FkU2NyaXB0ICgpIHtcbiAgICAgICAgdGhpcy5maWxlRG93bmxvYWRpbmdIYW5kbGVkICAgICAgICAgICAgICAgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXNvbHZlV2FpdEZvckZpbGVEb3dubG9hZGluZ1Byb21pc2UgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiBNdXN0YWNoZS5yZW5kZXIoVEVTVF9SVU5fVEVNUExBVEUsIHtcbiAgICAgICAgICAgIHRlc3RSdW5JZDogICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHRoaXMuc2Vzc2lvbi5pZCksXG4gICAgICAgICAgICBicm93c2VySWQ6ICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLmJyb3dzZXJDb25uZWN0aW9uLmlkKSxcbiAgICAgICAgICAgIGJyb3dzZXJIZWFydGJlYXRSZWxhdGl2ZVVybDogIEpTT04uc3RyaW5naWZ5KHRoaXMuYnJvd3NlckNvbm5lY3Rpb24uaGVhcnRiZWF0UmVsYXRpdmVVcmwpLFxuICAgICAgICAgICAgYnJvd3NlclN0YXR1c1JlbGF0aXZlVXJsOiAgICAgSlNPTi5zdHJpbmdpZnkodGhpcy5icm93c2VyQ29ubmVjdGlvbi5zdGF0dXNSZWxhdGl2ZVVybCksXG4gICAgICAgICAgICBicm93c2VyU3RhdHVzRG9uZVJlbGF0aXZlVXJsOiBKU09OLnN0cmluZ2lmeSh0aGlzLmJyb3dzZXJDb25uZWN0aW9uLnN0YXR1c0RvbmVSZWxhdGl2ZVVybCksXG4gICAgICAgICAgICB1c2VyQWdlbnQ6ICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLmJyb3dzZXJDb25uZWN0aW9uLnVzZXJBZ2VudCksXG4gICAgICAgICAgICB0ZXN0TmFtZTogICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLnRlc3QubmFtZSksXG4gICAgICAgICAgICBmaXh0dXJlTmFtZTogICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLnRlc3QuZml4dHVyZS5uYW1lKSxcbiAgICAgICAgICAgIHNlbGVjdG9yVGltZW91dDogICAgICAgICAgICAgIHRoaXMub3B0cy5zZWxlY3RvclRpbWVvdXQsXG4gICAgICAgICAgICBwYWdlTG9hZFRpbWVvdXQ6ICAgICAgICAgICAgICB0aGlzLnBhZ2VMb2FkVGltZW91dCxcbiAgICAgICAgICAgIHNraXBKc0Vycm9yczogICAgICAgICAgICAgICAgIHRoaXMub3B0cy5za2lwSnNFcnJvcnMsXG4gICAgICAgICAgICByZXRyeVRlc3RQYWdlczogICAgICAgICAgICAgICAhIXRoaXMub3B0cy5yZXRyeVRlc3RQYWdlcyxcbiAgICAgICAgICAgIHNwZWVkOiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3BlZWQsXG4gICAgICAgICAgICBkaWFsb2dIYW5kbGVyOiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLmFjdGl2ZURpYWxvZ0hhbmRsZXIpXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9nZXRJZnJhbWVQYXlsb2FkU2NyaXB0ICgpIHtcbiAgICAgICAgcmV0dXJuIE11c3RhY2hlLnJlbmRlcihJRlJBTUVfVEVTVF9SVU5fVEVNUExBVEUsIHtcbiAgICAgICAgICAgIHRlc3RSdW5JZDogICAgICAgSlNPTi5zdHJpbmdpZnkodGhpcy5zZXNzaW9uLmlkKSxcbiAgICAgICAgICAgIHNlbGVjdG9yVGltZW91dDogdGhpcy5vcHRzLnNlbGVjdG9yVGltZW91dCxcbiAgICAgICAgICAgIHBhZ2VMb2FkVGltZW91dDogdGhpcy5wYWdlTG9hZFRpbWVvdXQsXG4gICAgICAgICAgICByZXRyeVRlc3RQYWdlczogICEhdGhpcy5vcHRzLnJldHJ5VGVzdFBhZ2VzLFxuICAgICAgICAgICAgc3BlZWQ6ICAgICAgICAgICB0aGlzLnNwZWVkLFxuICAgICAgICAgICAgZGlhbG9nSGFuZGxlcjogICBKU09OLnN0cmluZ2lmeSh0aGlzLmFjdGl2ZURpYWxvZ0hhbmRsZXIpXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEhhbW1lcmhlYWQgaGFuZGxlcnNcbiAgICBnZXRBdXRoQ3JlZGVudGlhbHMgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50ZXN0LmF1dGhDcmVkZW50aWFscztcbiAgICB9XG5cbiAgICBoYW5kbGVGaWxlRG93bmxvYWQgKCkge1xuICAgICAgICBpZiAodGhpcy5yZXNvbHZlV2FpdEZvckZpbGVEb3dubG9hZGluZ1Byb21pc2UpIHtcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZVdhaXRGb3JGaWxlRG93bmxvYWRpbmdQcm9taXNlKHRydWUpO1xuICAgICAgICAgICAgdGhpcy5yZXNvbHZlV2FpdEZvckZpbGVEb3dubG9hZGluZ1Byb21pc2UgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMuZmlsZURvd25sb2FkaW5nSGFuZGxlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaGFuZGxlUGFnZUVycm9yIChjdHgsIGVycikge1xuICAgICAgICBpZiAoY3R4LnJlcS5oZWFkZXJzW1VOU1RBQkxFX05FVFdPUktfTU9ERV9IRUFERVJdKSB7XG4gICAgICAgICAgICBjdHguY2xvc2VXaXRoRXJyb3IoNTAwLCBlcnIudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBlbmRpbmdQYWdlRXJyb3IgPSBuZXcgUGFnZUxvYWRFcnJvcihlcnIpO1xuXG4gICAgICAgIGN0eC5yZWRpcmVjdChjdHgudG9Qcm94eVVybCgnYWJvdXQ6ZXJyb3InKSk7XG4gICAgfVxuXG4gICAgLy8gVGVzdCBmdW5jdGlvbiBleGVjdXRpb25cbiAgICBhc3luYyBfZXhlY3V0ZVRlc3RGbiAocGhhc2UsIGZuKSB7XG4gICAgICAgIHRoaXMucGhhc2UgPSBwaGFzZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgZm4odGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgbGV0IHNjcmVlbnNob3RQYXRoID0gbnVsbDtcblxuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy50YWtlU2NyZWVuc2hvdHNPbkZhaWxzKVxuICAgICAgICAgICAgICAgIHNjcmVlbnNob3RQYXRoID0gYXdhaXQgdGhpcy5leGVjdXRlQ29tbWFuZChuZXcgYnJvd3Nlck1hbmlwdWxhdGlvbkNvbW1hbmRzLlRha2VTY3JlZW5zaG90T25GYWlsQ29tbWFuZCgpKTtcblxuICAgICAgICAgICAgdGhpcy5hZGRFcnJvcihlcnIsIHNjcmVlbnNob3RQYXRoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAhdGhpcy5fYWRkUGVuZGluZ1BhZ2VFcnJvcklmQW55KCk7XG4gICAgfVxuXG4gICAgYXN5bmMgX3J1bkJlZm9yZUhvb2sgKCkge1xuICAgICAgICBpZiAodGhpcy50ZXN0LmJlZm9yZUZuKVxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2V4ZWN1dGVUZXN0Rm4oUEhBU0UuaW5UZXN0QmVmb3JlSG9vaywgdGhpcy50ZXN0LmJlZm9yZUZuKTtcblxuICAgICAgICBpZiAodGhpcy50ZXN0LmZpeHR1cmUuYmVmb3JlRWFjaEZuKVxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2V4ZWN1dGVUZXN0Rm4oUEhBU0UuaW5GaXh0dXJlQmVmb3JlRWFjaEhvb2ssIHRoaXMudGVzdC5maXh0dXJlLmJlZm9yZUVhY2hGbik7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYXN5bmMgX3J1bkFmdGVySG9vayAoKSB7XG4gICAgICAgIGlmICh0aGlzLnRlc3QuYWZ0ZXJGbilcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9leGVjdXRlVGVzdEZuKFBIQVNFLmluVGVzdEFmdGVySG9vaywgdGhpcy50ZXN0LmFmdGVyRm4pO1xuXG4gICAgICAgIGlmICh0aGlzLnRlc3QuZml4dHVyZS5hZnRlckVhY2hGbilcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9leGVjdXRlVGVzdEZuKFBIQVNFLmluRml4dHVyZUFmdGVyRWFjaEhvb2ssIHRoaXMudGVzdC5maXh0dXJlLmFmdGVyRWFjaEZuKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBhc3luYyBzdGFydCAoKSB7XG4gICAgICAgIHRlc3RSdW5UcmFja2VyLmFjdGl2ZVRlc3RSdW5zW3RoaXMuc2Vzc2lvbi5pZF0gPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZW1pdCgnc3RhcnQnKTtcblxuICAgICAgICBjb25zdCBvbkRpc2Nvbm5lY3RlZCA9IGVyciA9PiB0aGlzLl9kaXNjb25uZWN0KGVycik7XG5cbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbi5vbmNlKCdkaXNjb25uZWN0ZWQnLCBvbkRpc2Nvbm5lY3RlZCk7XG5cbiAgICAgICAgaWYgKGF3YWl0IHRoaXMuX3J1bkJlZm9yZUhvb2soKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fZXhlY3V0ZVRlc3RGbihQSEFTRS5pblRlc3QsIHRoaXMudGVzdC5mbik7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9ydW5BZnRlckhvb2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRpc2Nvbm5lY3RlZClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB0aGlzLmJyb3dzZXJDb25uZWN0aW9uLnJlbW92ZUxpc3RlbmVyKCdkaXNjb25uZWN0ZWQnLCBvbkRpc2Nvbm5lY3RlZCk7XG5cbiAgICAgICAgaWYgKHRoaXMuZXJycy5sZW5ndGggJiYgdGhpcy5kZWJ1Z09uRmFpbClcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2VucXVldWVTZXRCcmVha3BvaW50Q29tbWFuZChudWxsLCB0aGlzLmRlYnVnUmVwb3J0ZXJQbHVnaW5Ib3N0LmZvcm1hdEVycm9yKHRoaXMuZXJyc1swXSkpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNvbW1hbmQobmV3IHNlcnZpY2VDb21tYW5kcy5UZXN0RG9uZUNvbW1hbmQoKSk7XG5cbiAgICAgICAgdGhpcy5fYWRkUGVuZGluZ1BhZ2VFcnJvcklmQW55KCk7XG5cbiAgICAgICAgZGVsZXRlIHRlc3RSdW5UcmFja2VyLmFjdGl2ZVRlc3RSdW5zW3RoaXMuc2Vzc2lvbi5pZF07XG5cbiAgICAgICAgdGhpcy5lbWl0KCdkb25lJyk7XG4gICAgfVxuXG4gICAgX2V2YWx1YXRlIChjb2RlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZUpzRXhwcmVzc2lvbihjb2RlLCB0aGlzLCB7IHNraXBWaXNpYmlsaXR5Q2hlY2s6IGZhbHNlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiB7IGVyciB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRXJyb3JzXG4gICAgX2FkZFBlbmRpbmdQYWdlRXJyb3JJZkFueSAoKSB7XG4gICAgICAgIGlmICh0aGlzLnBlbmRpbmdQYWdlRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRXJyb3IodGhpcy5wZW5kaW5nUGFnZUVycm9yKTtcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ1BhZ2VFcnJvciA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBhZGRFcnJvciAoZXJyLCBzY3JlZW5zaG90UGF0aCkge1xuICAgICAgICBjb25zdCBlcnJMaXN0ID0gZXJyIGluc3RhbmNlb2YgVGVzdENhZmVFcnJvckxpc3QgPyBlcnIuaXRlbXMgOiBbZXJyXTtcblxuICAgICAgICBlcnJMaXN0LmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyID0gbmV3IFRlc3RSdW5FcnJvckZvcm1hdHRhYmxlQWRhcHRlcihpdGVtLCB7XG4gICAgICAgICAgICAgICAgdXNlckFnZW50OiAgICAgIHRoaXMuYnJvd3NlckNvbm5lY3Rpb24udXNlckFnZW50LFxuICAgICAgICAgICAgICAgIHNjcmVlbnNob3RQYXRoOiBzY3JlZW5zaG90UGF0aCB8fCAnJyxcbiAgICAgICAgICAgICAgICB0ZXN0UnVuUGhhc2U6ICAgdGhpcy5waGFzZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuZXJycy5wdXNoKGFkYXB0ZXIpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBUYXNrIHF1ZXVlXG4gICAgX2VucXVldWVDb21tYW5kIChjb21tYW5kLCBjYWxsc2l0ZSkge1xuICAgICAgICBpZiAodGhpcy5wZW5kaW5nUmVxdWVzdClcbiAgICAgICAgICAgIHRoaXMuX3Jlc29sdmVQZW5kaW5nUmVxdWVzdChjb21tYW5kKTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hZGRpbmdEcml2ZXJUYXNrc0NvdW50LS07XG4gICAgICAgICAgICB0aGlzLmRyaXZlclRhc2tRdWV1ZS5wdXNoKHsgY29tbWFuZCwgcmVzb2x2ZSwgcmVqZWN0LCBjYWxsc2l0ZSB9KTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmFkZGluZ0RyaXZlclRhc2tzQ291bnQpXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KEFMTF9EUklWRVJfVEFTS1NfQURERURfVE9fUVVFVUVfRVZFTlQsIHRoaXMuZHJpdmVyVGFza1F1ZXVlLmxlbmd0aCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGdldCBkcml2ZXJUYXNrUXVldWVMZW5ndGggKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRpbmdEcml2ZXJUYXNrc0NvdW50ID8gcHJvbWlzaWZ5RXZlbnQodGhpcywgQUxMX0RSSVZFUl9UQVNLU19BRERFRF9UT19RVUVVRV9FVkVOVCkgOiBQcm9taXNlLnJlc29sdmUodGhpcy5kcml2ZXJUYXNrUXVldWUubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBhc3luYyBfZW5xdWV1ZUJyb3dzZXJDb25zb2xlTWVzc2FnZXNDb21tYW5kIChjb21tYW5kLCBjYWxsc2l0ZSkge1xuICAgICAgICBhd2FpdCB0aGlzLl9lbnF1ZXVlQ29tbWFuZChjb21tYW5kLCBjYWxsc2l0ZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc29sZU1lc3NhZ2VzLmdldENvcHkoKTtcbiAgICB9XG5cbiAgICBhc3luYyBfZW5xdWV1ZVNldEJyZWFrcG9pbnRDb21tYW5kIChjYWxsc2l0ZSwgZXJyb3IpIHtcbiAgICAgICAgaWYgKHRoaXMuYnJvd3NlckNvbm5lY3Rpb24uaXNIZWFkbGVzc0Jyb3dzZXIoKSkge1xuICAgICAgICAgICAgdGhpcy53YXJuaW5nTG9nLmFkZFdhcm5pbmcoV0FSTklOR19NRVNTQUdFLmRlYnVnSW5IZWFkbGVzc0Vycm9yKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnTG9nZ2VyLnNob3dCcmVha3BvaW50KHRoaXMuc2Vzc2lvbi5pZCwgdGhpcy5icm93c2VyQ29ubmVjdGlvbi51c2VyQWdlbnQsIGNhbGxzaXRlLCBlcnJvcik7XG5cbiAgICAgICAgdGhpcy5kZWJ1Z2dpbmcgPSBhd2FpdCB0aGlzLmV4ZWN1dGVDb21tYW5kKG5ldyBzZXJ2aWNlQ29tbWFuZHMuU2V0QnJlYWtwb2ludENvbW1hbmQoISFlcnJvciksIGNhbGxzaXRlKTtcbiAgICB9XG5cbiAgICBfcmVtb3ZlQWxsTm9uU2VydmljZVRhc2tzICgpIHtcbiAgICAgICAgdGhpcy5kcml2ZXJUYXNrUXVldWUgPSB0aGlzLmRyaXZlclRhc2tRdWV1ZS5maWx0ZXIoZHJpdmVyVGFzayA9PiBpc1NlcnZpY2VDb21tYW5kKGRyaXZlclRhc2suY29tbWFuZCkpO1xuXG4gICAgICAgIHRoaXMuYnJvd3Nlck1hbmlwdWxhdGlvblF1ZXVlLnJlbW92ZUFsbE5vblNlcnZpY2VNYW5pcHVsYXRpb25zKCk7XG4gICAgfVxuXG4gICAgLy8gQ3VycmVudCBkcml2ZXIgdGFza1xuICAgIGdldCBjdXJyZW50RHJpdmVyVGFzayAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRyaXZlclRhc2tRdWV1ZVswXTtcbiAgICB9XG5cbiAgICBfcmVzb2x2ZUN1cnJlbnREcml2ZXJUYXNrIChyZXN1bHQpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50RHJpdmVyVGFzay5yZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIHRoaXMuZHJpdmVyVGFza1F1ZXVlLnNoaWZ0KCk7XG5cbiAgICAgICAgaWYgKHRoaXMudGVzdERvbmVDb21tYW5kUXVldWVkKVxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQWxsTm9uU2VydmljZVRhc2tzKCk7XG4gICAgfVxuXG4gICAgX3JlamVjdEN1cnJlbnREcml2ZXJUYXNrIChlcnIpIHtcbiAgICAgICAgZXJyLmNhbGxzaXRlICAgICAgICAgICAgID0gZXJyLmNhbGxzaXRlIHx8IHRoaXMuY3VycmVudERyaXZlclRhc2suY2FsbHNpdGU7XG4gICAgICAgIGVyci5pc1JlamVjdGVkRHJpdmVyVGFzayA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50RHJpdmVyVGFzay5yZWplY3QoZXJyKTtcbiAgICAgICAgdGhpcy5fcmVtb3ZlQWxsTm9uU2VydmljZVRhc2tzKCk7XG4gICAgfVxuXG4gICAgLy8gUGVuZGluZyByZXF1ZXN0XG4gICAgX2NsZWFyUGVuZGluZ1JlcXVlc3QgKCkge1xuICAgICAgICBpZiAodGhpcy5wZW5kaW5nUmVxdWVzdCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMucGVuZGluZ1JlcXVlc3QucmVzcG9uc2VUaW1lb3V0KTtcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ1JlcXVlc3QgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3Jlc29sdmVQZW5kaW5nUmVxdWVzdCAoY29tbWFuZCkge1xuICAgICAgICB0aGlzLmxhc3REcml2ZXJTdGF0dXNSZXNwb25zZSA9IGNvbW1hbmQ7XG4gICAgICAgIHRoaXMucGVuZGluZ1JlcXVlc3QucmVzb2x2ZShjb21tYW5kKTtcbiAgICAgICAgdGhpcy5fY2xlYXJQZW5kaW5nUmVxdWVzdCgpO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBkcml2ZXIgcmVxdWVzdFxuICAgIF9mdWxmaWxsQ3VycmVudERyaXZlclRhc2sgKGRyaXZlclN0YXR1cykge1xuICAgICAgICBpZiAoZHJpdmVyU3RhdHVzLmV4ZWN1dGlvbkVycm9yKVxuICAgICAgICAgICAgdGhpcy5fcmVqZWN0Q3VycmVudERyaXZlclRhc2soZHJpdmVyU3RhdHVzLmV4ZWN1dGlvbkVycm9yKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZUN1cnJlbnREcml2ZXJUYXNrKGRyaXZlclN0YXR1cy5yZXN1bHQpO1xuICAgIH1cblxuICAgIF9oYW5kbGVQYWdlRXJyb3JTdGF0dXMgKHBhZ2VFcnJvcikge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50RHJpdmVyVGFzayAmJiBpc0NvbW1hbmRSZWplY3RhYmxlQnlQYWdlRXJyb3IodGhpcy5jdXJyZW50RHJpdmVyVGFzay5jb21tYW5kKSkge1xuICAgICAgICAgICAgdGhpcy5fcmVqZWN0Q3VycmVudERyaXZlclRhc2socGFnZUVycm9yKTtcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ1BhZ2VFcnJvciA9IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wZW5kaW5nUGFnZUVycm9yID0gdGhpcy5wZW5kaW5nUGFnZUVycm9yIHx8IHBhZ2VFcnJvcjtcblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgX2hhbmRsZURyaXZlclJlcXVlc3QgKGRyaXZlclN0YXR1cykge1xuICAgICAgICBjb25zdCBpc1Rlc3REb25lICAgICAgICAgICAgICAgICA9IHRoaXMuY3VycmVudERyaXZlclRhc2sgJiYgdGhpcy5jdXJyZW50RHJpdmVyVGFzay5jb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS50ZXN0RG9uZTtcbiAgICAgICAgY29uc3QgcGFnZUVycm9yICAgICAgICAgICAgICAgICAgPSB0aGlzLnBlbmRpbmdQYWdlRXJyb3IgfHwgZHJpdmVyU3RhdHVzLnBhZ2VFcnJvcjtcbiAgICAgICAgY29uc3QgY3VycmVudFRhc2tSZWplY3RlZEJ5RXJyb3IgPSBwYWdlRXJyb3IgJiYgdGhpcy5faGFuZGxlUGFnZUVycm9yU3RhdHVzKHBhZ2VFcnJvcik7XG5cbiAgICAgICAgaWYgKHRoaXMuZGlzY29ubmVjdGVkKVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChfLCByZWplY3QpID0+IHJlamVjdCgpKTtcblxuICAgICAgICB0aGlzLmNvbnNvbGVNZXNzYWdlcy5jb25jYXQoZHJpdmVyU3RhdHVzLmNvbnNvbGVNZXNzYWdlcyk7XG5cbiAgICAgICAgaWYgKCFjdXJyZW50VGFza1JlamVjdGVkQnlFcnJvciAmJiBkcml2ZXJTdGF0dXMuaXNDb21tYW5kUmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAoaXNUZXN0RG9uZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc29sdmVDdXJyZW50RHJpdmVyVGFzaygpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFRFU1RfRE9ORV9DT05GSVJNQVRJT05fUkVTUE9OU0U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2Z1bGZpbGxDdXJyZW50RHJpdmVyVGFzayhkcml2ZXJTdGF0dXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEN1cnJlbnREcml2ZXJUYXNrQ29tbWFuZCgpO1xuICAgIH1cblxuICAgIF9nZXRDdXJyZW50RHJpdmVyVGFza0NvbW1hbmQgKCkge1xuICAgICAgICBpZiAoIXRoaXMuY3VycmVudERyaXZlclRhc2spXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCBjb21tYW5kID0gdGhpcy5jdXJyZW50RHJpdmVyVGFzay5jb21tYW5kO1xuXG4gICAgICAgIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5uYXZpZ2F0ZVRvICYmIGNvbW1hbmQuc3RhdGVTbmFwc2hvdClcbiAgICAgICAgICAgIHRoaXMuc2Vzc2lvbi51c2VTdGF0ZVNuYXBzaG90KEpTT04ucGFyc2UoY29tbWFuZC5zdGF0ZVNuYXBzaG90KSk7XG5cbiAgICAgICAgcmV0dXJuIGNvbW1hbmQ7XG4gICAgfVxuXG4gICAgLy8gRXhlY3V0ZSBjb21tYW5kXG4gICAgYXN5bmMgX2V4ZWN1dGVFeHByZXNzaW9uIChjb21tYW5kKSB7XG4gICAgICAgIGNvbnN0IHsgcmVzdWx0VmFyaWFibGVOYW1lLCBpc0FzeW5jRXhwcmVzc2lvbiB9ID0gY29tbWFuZDtcblxuICAgICAgICBsZXQgZXhwcmVzc2lvbiA9IGNvbW1hbmQuZXhwcmVzc2lvbjtcblxuICAgICAgICBpZiAoaXNBc3luY0V4cHJlc3Npb24pXG4gICAgICAgICAgICBleHByZXNzaW9uID0gYGF3YWl0ICR7ZXhwcmVzc2lvbn1gO1xuXG4gICAgICAgIGlmIChyZXN1bHRWYXJpYWJsZU5hbWUpXG4gICAgICAgICAgICBleHByZXNzaW9uID0gYCR7cmVzdWx0VmFyaWFibGVOYW1lfSA9ICR7ZXhwcmVzc2lvbn0sICR7cmVzdWx0VmFyaWFibGVOYW1lfWA7XG5cbiAgICAgICAgaWYgKGlzQXN5bmNFeHByZXNzaW9uKVxuICAgICAgICAgICAgZXhwcmVzc2lvbiA9IGAoYXN5bmMgKCkgPT4geyByZXR1cm4gJHtleHByZXNzaW9ufTsgfSkuYXBwbHkodGhpcyk7YDtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9ldmFsdWF0ZShleHByZXNzaW9uKTtcblxuICAgICAgICByZXR1cm4gaXNBc3luY0V4cHJlc3Npb24gPyBhd2FpdCByZXN1bHQgOiByZXN1bHQ7XG4gICAgfVxuXG4gICAgYXN5bmMgX2V4ZWN1dGVBc3NlcnRpb24gKGNvbW1hbmQsIGNhbGxzaXRlKSB7XG4gICAgICAgIGNvbnN0IGFzc2VydGlvblRpbWVvdXQgPSBjb21tYW5kLm9wdGlvbnMudGltZW91dCA9PT0gdm9pZCAwID8gdGhpcy5vcHRzLmFzc2VydGlvblRpbWVvdXQgOiBjb21tYW5kLm9wdGlvbnMudGltZW91dDtcbiAgICAgICAgY29uc3QgZXhlY3V0b3IgICAgICAgICA9IG5ldyBBc3NlcnRpb25FeGVjdXRvcihjb21tYW5kLCBhc3NlcnRpb25UaW1lb3V0LCBjYWxsc2l0ZSk7XG5cbiAgICAgICAgZXhlY3V0b3Iub25jZSgnc3RhcnQtYXNzZXJ0aW9uLXJldHJpZXMnLCB0aW1lb3V0ID0+IHRoaXMuZXhlY3V0ZUNvbW1hbmQobmV3IHNlcnZpY2VDb21tYW5kcy5TaG93QXNzZXJ0aW9uUmV0cmllc1N0YXR1c0NvbW1hbmQodGltZW91dCkpKTtcbiAgICAgICAgZXhlY3V0b3Iub25jZSgnZW5kLWFzc2VydGlvbi1yZXRyaWVzJywgc3VjY2VzcyA9PiB0aGlzLmV4ZWN1dGVDb21tYW5kKG5ldyBzZXJ2aWNlQ29tbWFuZHMuSGlkZUFzc2VydGlvblJldHJpZXNTdGF0dXNDb21tYW5kKHN1Y2Nlc3MpKSk7XG5cbiAgICAgICAgcmV0dXJuIGV4ZWN1dG9yLnJ1bigpO1xuICAgIH1cblxuICAgIF9hZGp1c3RDb25maWd1cmF0aW9uV2l0aENvbW1hbmQgKGNvbW1hbmQpIHtcbiAgICAgICAgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLnRlc3REb25lKSB7XG4gICAgICAgICAgICB0aGlzLnRlc3REb25lQ29tbWFuZFF1ZXVlZCA9IHRydWU7XG4gICAgICAgICAgICBkZWJ1Z0xvZ2dlci5oaWRlQnJlYWtwb2ludCh0aGlzLnNlc3Npb24uaWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoY29tbWFuZC50eXBlID09PSBDT01NQU5EX1RZUEUuc2V0TmF0aXZlRGlhbG9nSGFuZGxlcilcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlRGlhbG9nSGFuZGxlciA9IGNvbW1hbmQuZGlhbG9nSGFuZGxlcjtcblxuICAgICAgICBlbHNlIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5zd2l0Y2hUb0lmcmFtZSlcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlSWZyYW1lU2VsZWN0b3IgPSBjb21tYW5kLnNlbGVjdG9yO1xuXG4gICAgICAgIGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLnN3aXRjaFRvTWFpbldpbmRvdylcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlSWZyYW1lU2VsZWN0b3IgPSBudWxsO1xuXG4gICAgICAgIGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLnNldFRlc3RTcGVlZClcbiAgICAgICAgICAgIHRoaXMuc3BlZWQgPSBjb21tYW5kLnNwZWVkO1xuXG4gICAgICAgIGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLnNldFBhZ2VMb2FkVGltZW91dClcbiAgICAgICAgICAgIHRoaXMucGFnZUxvYWRUaW1lb3V0ID0gY29tbWFuZC5kdXJhdGlvbjtcblxuICAgICAgICBlbHNlIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5kZWJ1ZylcbiAgICAgICAgICAgIHRoaXMuZGVidWdnaW5nID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBhc3luYyBfYWRqdXN0U2NyZWVuc2hvdENvbW1hbmQgKGNvbW1hbmQpIHtcbiAgICAgICAgY29uc3QgYnJvd3NlcklkICAgICAgICAgICAgICAgICAgICA9IHRoaXMuYnJvd3NlckNvbm5lY3Rpb24uaWQ7XG4gICAgICAgIGNvbnN0IHsgaGFzQ2hyb21lbGVzc1NjcmVlbnNob3RzIH0gPSBhd2FpdCB0aGlzLmJyb3dzZXJDb25uZWN0aW9uLnByb3ZpZGVyLmhhc0N1c3RvbUFjdGlvbkZvckJyb3dzZXIoYnJvd3NlcklkKTtcblxuICAgICAgICBpZiAoIWhhc0Nocm9tZWxlc3NTY3JlZW5zaG90cylcbiAgICAgICAgICAgIGNvbW1hbmQuZ2VuZXJhdGVTY3JlZW5zaG90TWFyaygpO1xuICAgIH1cblxuICAgIGFzeW5jIF9zZXRCcmVha3BvaW50SWZOZWNlc3NhcnkgKGNvbW1hbmQsIGNhbGxzaXRlKSB7XG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlRGVidWdCcmVha3BvaW50cyAmJiB0aGlzLmRlYnVnZ2luZyAmJiBjYW5TZXREZWJ1Z2dlckJyZWFrcG9pbnRCZWZvcmVDb21tYW5kKGNvbW1hbmQpKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fZW5xdWV1ZVNldEJyZWFrcG9pbnRDb21tYW5kKGNhbGxzaXRlKTtcbiAgICB9XG5cbiAgICBhc3luYyBleGVjdXRlQ29tbWFuZCAoY29tbWFuZCwgY2FsbHNpdGUpIHtcbiAgICAgICAgdGhpcy5kZWJ1Z0xvZy5jb21tYW5kKGNvbW1hbmQpO1xuXG4gICAgICAgIGlmICh0aGlzLnBlbmRpbmdQYWdlRXJyb3IgJiYgaXNDb21tYW5kUmVqZWN0YWJsZUJ5UGFnZUVycm9yKGNvbW1hbmQpKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlamVjdENvbW1hbmRXaXRoUGFnZUVycm9yKGNhbGxzaXRlKTtcblxuICAgICAgICBpZiAoaXNFeGVjdXRhYmxlT25DbGllbnRDb21tYW5kKGNvbW1hbmQpKVxuICAgICAgICAgICAgdGhpcy5hZGRpbmdEcml2ZXJUYXNrc0NvdW50Kys7XG5cbiAgICAgICAgdGhpcy5fYWRqdXN0Q29uZmlndXJhdGlvbldpdGhDb21tYW5kKGNvbW1hbmQpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX3NldEJyZWFrcG9pbnRJZk5lY2Vzc2FyeShjb21tYW5kLCBjYWxsc2l0ZSk7XG5cbiAgICAgICAgaWYgKGlzU2NyZWVuc2hvdENvbW1hbmQoY29tbWFuZCkpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9hZGp1c3RTY3JlZW5zaG90Q29tbWFuZChjb21tYW5kKTtcblxuICAgICAgICBpZiAoaXNCcm93c2VyTWFuaXB1bGF0aW9uQ29tbWFuZChjb21tYW5kKSlcbiAgICAgICAgICAgIHRoaXMuYnJvd3Nlck1hbmlwdWxhdGlvblF1ZXVlLnB1c2goY29tbWFuZCk7XG5cbiAgICAgICAgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLndhaXQpXG4gICAgICAgICAgICByZXR1cm4gZGVsYXkoY29tbWFuZC50aW1lb3V0KTtcblxuICAgICAgICBpZiAoY29tbWFuZC50eXBlID09PSBDT01NQU5EX1RZUEUuc2V0UGFnZUxvYWRUaW1lb3V0KVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLmRlYnVnKVxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2VucXVldWVTZXRCcmVha3BvaW50Q29tbWFuZChjYWxsc2l0ZSk7XG5cbiAgICAgICAgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLnVzZVJvbGUpXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5fdXNlUm9sZShjb21tYW5kLnJvbGUsIGNhbGxzaXRlKTtcblxuICAgICAgICBpZiAoY29tbWFuZC50eXBlID09PSBDT01NQU5EX1RZUEUuYXNzZXJ0aW9uKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V4ZWN1dGVBc3NlcnRpb24oY29tbWFuZCwgY2FsbHNpdGUpO1xuXG4gICAgICAgIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5leGVjdXRlRXhwcmVzc2lvbilcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9leGVjdXRlRXhwcmVzc2lvbihjb21tYW5kLCBjYWxsc2l0ZSk7XG5cbiAgICAgICAgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLmdldEJyb3dzZXJDb25zb2xlTWVzc2FnZXMpXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5fZW5xdWV1ZUJyb3dzZXJDb25zb2xlTWVzc2FnZXNDb21tYW5kKGNvbW1hbmQsIGNhbGxzaXRlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoY29tbWFuZCwgY2FsbHNpdGUpO1xuICAgIH1cblxuICAgIF9yZWplY3RDb21tYW5kV2l0aFBhZ2VFcnJvciAoY2FsbHNpdGUpIHtcbiAgICAgICAgY29uc3QgZXJyID0gdGhpcy5wZW5kaW5nUGFnZUVycm9yO1xuXG4gICAgICAgIGVyci5jYWxsc2l0ZSAgICAgICAgICA9IGNhbGxzaXRlO1xuICAgICAgICB0aGlzLnBlbmRpbmdQYWdlRXJyb3IgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgIH1cblxuICAgIC8vIFJvbGUgbWFuYWdlbWVudFxuICAgIGFzeW5jIGdldFN0YXRlU25hcHNob3QgKCkge1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc2Vzc2lvbi5nZXRTdGF0ZVNuYXBzaG90KCk7XG5cbiAgICAgICAgc3RhdGUuc3RvcmFnZXMgPSBhd2FpdCB0aGlzLmV4ZWN1dGVDb21tYW5kKG5ldyBzZXJ2aWNlQ29tbWFuZHMuQmFja3VwU3RvcmFnZXNDb21tYW5kKCkpO1xuXG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9XG5cbiAgICBhc3luYyBzd2l0Y2hUb0NsZWFuUnVuICgpIHtcbiAgICAgICAgdGhpcy5jdHggICAgICAgICAgICAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICB0aGlzLmZpeHR1cmVDdHggICAgICA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIHRoaXMuY29uc29sZU1lc3NhZ2VzID0gbmV3IEJyb3dzZXJDb25zb2xlTWVzc2FnZXMoKTtcblxuICAgICAgICB0aGlzLnNlc3Npb24udXNlU3RhdGVTbmFwc2hvdChudWxsKTtcblxuICAgICAgICBpZiAodGhpcy5hY3RpdmVEaWFsb2dIYW5kbGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZW1vdmVEaWFsb2dIYW5kbGVyQ29tbWFuZCA9IG5ldyBhY3Rpb25Db21tYW5kcy5TZXROYXRpdmVEaWFsb2dIYW5kbGVyQ29tbWFuZCh7IGRpYWxvZ0hhbmRsZXI6IHsgZm46IG51bGwgfSB9KTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlQ29tbWFuZChyZW1vdmVEaWFsb2dIYW5kbGVyQ29tbWFuZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zcGVlZCAhPT0gdGhpcy5vcHRzLnNwZWVkKSB7XG4gICAgICAgICAgICBjb25zdCBzZXRTcGVlZENvbW1hbmQgPSBuZXcgYWN0aW9uQ29tbWFuZHMuU2V0VGVzdFNwZWVkQ29tbWFuZCh7IHNwZWVkOiB0aGlzLm9wdHMuc3BlZWQgfSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNvbW1hbmQoc2V0U3BlZWRDb21tYW5kKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnBhZ2VMb2FkVGltZW91dCAhPT0gdGhpcy5vcHRzLnBhZ2VMb2FkVGltZW91dCkge1xuICAgICAgICAgICAgY29uc3Qgc2V0UGFnZUxvYWRUaW1lb3V0Q29tbWFuZCA9IG5ldyBhY3Rpb25Db21tYW5kcy5TZXRQYWdlTG9hZFRpbWVvdXRDb21tYW5kKHsgZHVyYXRpb246IHRoaXMub3B0cy5wYWdlTG9hZFRpbWVvdXQgfSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNvbW1hbmQoc2V0UGFnZUxvYWRUaW1lb3V0Q29tbWFuZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBfZ2V0U3RhdGVTbmFwc2hvdEZyb21Sb2xlIChyb2xlKSB7XG4gICAgICAgIGNvbnN0IHByZXZQaGFzZSA9IHRoaXMucGhhc2U7XG5cbiAgICAgICAgdGhpcy5waGFzZSA9IFBIQVNFLmluUm9sZUluaXRpYWxpemVyO1xuXG4gICAgICAgIGlmIChyb2xlLnBoYXNlID09PSBST0xFX1BIQVNFLnVuaW5pdGlhbGl6ZWQpXG4gICAgICAgICAgICBhd2FpdCByb2xlLmluaXRpYWxpemUodGhpcyk7XG5cbiAgICAgICAgZWxzZSBpZiAocm9sZS5waGFzZSA9PT0gUk9MRV9QSEFTRS5wZW5kaW5nSW5pdGlhbGl6YXRpb24pXG4gICAgICAgICAgICBhd2FpdCBwcm9taXNpZnlFdmVudChyb2xlLCAnaW5pdGlhbGl6ZWQnKTtcblxuICAgICAgICBpZiAocm9sZS5pbml0RXJyKVxuICAgICAgICAgICAgdGhyb3cgcm9sZS5pbml0RXJyO1xuXG4gICAgICAgIHRoaXMucGhhc2UgPSBwcmV2UGhhc2U7XG5cbiAgICAgICAgcmV0dXJuIHJvbGUuc3RhdGVTbmFwc2hvdDtcbiAgICB9XG5cbiAgICBhc3luYyBfdXNlUm9sZSAocm9sZSwgY2FsbHNpdGUpIHtcbiAgICAgICAgaWYgKHRoaXMucGhhc2UgPT09IFBIQVNFLmluUm9sZUluaXRpYWxpemVyKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJvbGVTd2l0Y2hJblJvbGVJbml0aWFsaXplckVycm9yKGNhbGxzaXRlKTtcblxuICAgICAgICB0aGlzLmRpc2FibGVEZWJ1Z0JyZWFrcG9pbnRzID0gdHJ1ZTtcblxuICAgICAgICBjb25zdCBib29rbWFyayA9IG5ldyBUZXN0UnVuQm9va21hcmsodGhpcywgcm9sZSk7XG5cbiAgICAgICAgYXdhaXQgYm9va21hcmsuaW5pdCgpO1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSb2xlSWQpXG4gICAgICAgICAgICB0aGlzLnVzZWRSb2xlU3RhdGVzW3RoaXMuY3VycmVudFJvbGVJZF0gPSBhd2FpdCB0aGlzLmdldFN0YXRlU25hcHNob3QoKTtcblxuICAgICAgICBjb25zdCBzdGF0ZVNuYXBzaG90ID0gdGhpcy51c2VkUm9sZVN0YXRlc1tyb2xlLmlkXSB8fCBhd2FpdCB0aGlzLl9nZXRTdGF0ZVNuYXBzaG90RnJvbVJvbGUocm9sZSk7XG5cbiAgICAgICAgdGhpcy5zZXNzaW9uLnVzZVN0YXRlU25hcHNob3Qoc3RhdGVTbmFwc2hvdCk7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50Um9sZUlkID0gcm9sZS5pZDtcblxuICAgICAgICBhd2FpdCBib29rbWFyay5yZXN0b3JlKGNhbGxzaXRlLCBzdGF0ZVNuYXBzaG90KTtcblxuICAgICAgICB0aGlzLmRpc2FibGVEZWJ1Z0JyZWFrcG9pbnRzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gR2V0IGN1cnJlbnQgVVJMXG4gICAgYXN5bmMgZ2V0Q3VycmVudFVybCAoKSB7XG4gICAgICAgIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQ2xpZW50RnVuY3Rpb25CdWlsZGVyKCgpID0+IHtcbiAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVmICovXG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVuZGVmICovXG4gICAgICAgIH0sIHsgYm91bmRUZXN0UnVuOiB0aGlzIH0pO1xuXG4gICAgICAgIGNvbnN0IGdldExvY2F0aW9uID0gYnVpbGRlci5nZXRGdW5jdGlvbigpO1xuXG4gICAgICAgIHJldHVybiBhd2FpdCBnZXRMb2NhdGlvbigpO1xuICAgIH1cblxuICAgIF9kaXNjb25uZWN0IChlcnIpIHtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0ZWQgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuX3JlamVjdEN1cnJlbnREcml2ZXJUYXNrKGVycik7XG5cbiAgICAgICAgdGhpcy5lbWl0KCdkaXNjb25uZWN0ZWQnLCBlcnIpO1xuXG4gICAgICAgIGRlbGV0ZSB0ZXN0UnVuVHJhY2tlci5hY3RpdmVUZXN0UnVuc1t0aGlzLnNlc3Npb24uaWRdO1xuICAgIH1cbn1cblxuLy8gU2VydmljZSBtZXNzYWdlIGhhbmRsZXJzXG5jb25zdCBTZXJ2aWNlTWVzc2FnZXMgPSBUZXN0UnVuLnByb3RvdHlwZTtcblxuU2VydmljZU1lc3NhZ2VzW0NMSUVOVF9NRVNTQUdFUy5yZWFkeV0gPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgdGhpcy5kZWJ1Z0xvZy5kcml2ZXJNZXNzYWdlKG1zZyk7XG5cbiAgICB0aGlzLl9jbGVhclBlbmRpbmdSZXF1ZXN0KCk7XG5cbiAgICAvLyBOT1RFOiB0aGUgZHJpdmVyIHNlbmRzIHRoZSBzdGF0dXMgZm9yIHRoZSBzZWNvbmQgdGltZSBpZiBpdCBkaWRuJ3QgZ2V0IGEgcmVzcG9uc2UgYXQgdGhlXG4gICAgLy8gZmlyc3QgdHJ5LiBUaGlzIGlzIHBvc3NpYmxlIHdoZW4gdGhlIHBhZ2Ugd2FzIHVubG9hZGVkIGFmdGVyIHRoZSBkcml2ZXIgc2VudCB0aGUgc3RhdHVzLlxuICAgIGlmIChtc2cuc3RhdHVzLmlkID09PSB0aGlzLmxhc3REcml2ZXJTdGF0dXNJZClcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdERyaXZlclN0YXR1c1Jlc3BvbnNlO1xuXG4gICAgdGhpcy5sYXN0RHJpdmVyU3RhdHVzSWQgICAgICAgPSBtc2cuc3RhdHVzLmlkO1xuICAgIHRoaXMubGFzdERyaXZlclN0YXR1c1Jlc3BvbnNlID0gdGhpcy5faGFuZGxlRHJpdmVyUmVxdWVzdChtc2cuc3RhdHVzKTtcblxuICAgIGlmICh0aGlzLmxhc3REcml2ZXJTdGF0dXNSZXNwb25zZSlcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdERyaXZlclN0YXR1c1Jlc3BvbnNlO1xuXG4gICAgLy8gTk9URTogd2Ugc2VuZCBhbiBlbXB0eSByZXNwb25zZSBhZnRlciB0aGUgTUFYX1JFU1BPTlNFX0RFTEFZIHRpbWVvdXQgaXMgZXhjZWVkZWQgdG8ga2VlcCBjb25uZWN0aW9uXG4gICAgLy8gd2l0aCB0aGUgY2xpZW50IGFuZCBwcmV2ZW50IHRoZSByZXNwb25zZSB0aW1lb3V0IGV4Y2VwdGlvbiBvbiB0aGUgY2xpZW50IHNpZGVcbiAgICBjb25zdCByZXNwb25zZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3Jlc29sdmVQZW5kaW5nUmVxdWVzdChudWxsKSwgTUFYX1JFU1BPTlNFX0RFTEFZKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMucGVuZGluZ1JlcXVlc3QgPSB7IHJlc29sdmUsIHJlamVjdCwgcmVzcG9uc2VUaW1lb3V0IH07XG4gICAgfSk7XG59O1xuXG5TZXJ2aWNlTWVzc2FnZXNbQ0xJRU5UX01FU1NBR0VTLnJlYWR5Rm9yQnJvd3Nlck1hbmlwdWxhdGlvbl0gPSBhc3luYyBmdW5jdGlvbiAobXNnKSB7XG4gICAgdGhpcy5kZWJ1Z0xvZy5kcml2ZXJNZXNzYWdlKG1zZyk7XG5cbiAgICBsZXQgcmVzdWx0ID0gbnVsbDtcbiAgICBsZXQgZXJyb3IgID0gbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuYnJvd3Nlck1hbmlwdWxhdGlvblF1ZXVlLmV4ZWN1dGVQZW5kaW5nTWFuaXB1bGF0aW9uKG1zZyk7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgZXJyb3IgPSBlcnI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcmVzdWx0LCBlcnJvciB9O1xufTtcblxuU2VydmljZU1lc3NhZ2VzW0NMSUVOVF9NRVNTQUdFUy53YWl0Rm9yRmlsZURvd25sb2FkXSA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICB0aGlzLmRlYnVnTG9nLmRyaXZlck1lc3NhZ2UobXNnKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgaWYgKHRoaXMuZmlsZURvd25sb2FkaW5nSGFuZGxlZCkge1xuICAgICAgICAgICAgdGhpcy5maWxlRG93bmxvYWRpbmdIYW5kbGVkID0gZmFsc2U7XG4gICAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZVdhaXRGb3JGaWxlRG93bmxvYWRpbmdQcm9taXNlID0gcmVzb2x2ZTtcbiAgICB9KTtcbn07XG4iXX0=
