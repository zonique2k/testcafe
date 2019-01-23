'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let runTests = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (argParser) {
        const opts = argParser.opts;
        const port1 = opts.ports && opts.ports[0];
        const port2 = opts.ports && opts.ports[1];
        const proxy = opts.proxy;
        const proxyBypass = opts.proxyBypass;

        _log2.default.showSpinner();

        const testCafe = yield (0, _2.default)(opts.hostname, port1, port2, opts.ssl, opts.dev);
        const remoteBrowsers = yield (0, _remotesWizard2.default)(testCafe, argParser.remoteCount, opts.qrCode);
        const browsers = argParser.browsers.concat(remoteBrowsers);
        const runner = opts.live ? testCafe.createLiveModeRunner() : testCafe.createRunner();

        let failed = 0;

        runner.isCli = true;

        runner.useProxy(proxy, proxyBypass).src(argParser.src).browsers(browsers).reporter(argParser.opts.reporter).concurrency(argParser.opts.concurrency).filter(argParser.filter).screenshots(opts.screenshots, opts.screenshotsOnFails, opts.screenshotPathPattern).startApp(opts.app, opts.appInitDelay);

        runner.once('done-bootstrapping', function () {
            return _log2.default.hideSpinner();
        });

        try {
            failed = yield runner.run(opts);
        } finally {
            showMessageOnExit = false;
            yield testCafe.close();
        }

        exit(failed);
    });

    return function runTests(_x) {
        return _ref.apply(this, arguments);
    };
})();

let listBrowsers = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (providerName = 'locally-installed') {
        // NOTE: Load the provider pool lazily to reduce startup time
        const browserProviderPool = require('../browser/provider/pool');

        const provider = yield browserProviderPool.getProvider(providerName);

        if (!provider) throw new _runtime.GeneralError(_message2.default.browserProviderNotFound, providerName);

        if (provider.isMultiBrowser) {
            const browserNames = yield provider.getBrowserList();

            yield browserProviderPool.dispose();

            if (providerName === 'locally-installed') console.log(browserNames.join('\n'));else console.log(browserNames.map(function (browserName) {
                return `"${providerName}:${browserName}"`;
            }).join('\n'));
        } else console.log(`"${providerName}"`);

        exit(0);
    });

    return function listBrowsers() {
        return _ref2.apply(this, arguments);
    };
})();

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _runtime = require('../errors/runtime');

var _message = require('../errors/runtime/message');

var _message2 = _interopRequireDefault(_message);

var _argumentParser = require('./argument-parser');

var _argumentParser2 = _interopRequireDefault(_argumentParser);

var _terminationHandler = require('./termination-handler');

var _terminationHandler2 = _interopRequireDefault(_terminationHandler);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _remotesWizard = require('./remotes-wizard');

var _remotesWizard2 = _interopRequireDefault(_remotesWizard);

var _ = require('../');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let showMessageOnExit = true;
let exitMessageShown = false;
let exiting = false;

function exitHandler(terminationLevel) {
    if (showMessageOnExit && !exitMessageShown) {
        exitMessageShown = true;

        _log2.default.hideSpinner();
        _log2.default.write('Stopping TestCafe...');
        _log2.default.showSpinner();

        process.on('exit', () => _log2.default.hideSpinner(true));
    }

    if (exiting || terminationLevel < 2) return;

    exiting = true;

    exit(0);
}

function exit(code) {
    _log2.default.hideSpinner(true);

    // NOTE: give a process time to flush the output.
    // It's necessary in some environments.
    setTimeout(() => process.exit(code), 0);
}

function error(err) {
    _log2.default.hideSpinner();

    let message = null;

    // HACK: workaround for the `instanceof` problem
    // (see: http://stackoverflow.com/questions/33870684/why-doesnt-instanceof-work-on-instances-of-error-subclasses-under-babel-node)
    if (err.constructor === _runtime.GeneralError) message = err.message;else if (err.constructor === _runtime.APIError) message = err.coloredStack;else message = err.stack;

    _log2.default.write(_chalk2.default.red('ERROR ') + message + '\n');
    _log2.default.write(_chalk2.default.gray('Type "testcafe -h" for help.'));

    exit(1);
}

(() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function* () {
        const terminationHandler = new _terminationHandler2.default();

        terminationHandler.on(_terminationHandler2.default.TERMINATION_LEVEL_INCREASED_EVENT, exitHandler);

        try {
            const argParser = new _argumentParser2.default();

            yield argParser.parse(process.argv);

            if (argParser.opts.listBrowsers) yield listBrowsers(argParser.opts.providerName);else yield runTests(argParser);
        } catch (err) {
            showMessageOnExit = false;
            error(err);
        }
    });

    function cli() {
        return _ref3.apply(this, arguments);
    }

    return cli;
})()();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jbGkvY2xpLmpzIl0sIm5hbWVzIjpbImFyZ1BhcnNlciIsIm9wdHMiLCJwb3J0MSIsInBvcnRzIiwicG9ydDIiLCJwcm94eSIsInByb3h5QnlwYXNzIiwibG9nIiwic2hvd1NwaW5uZXIiLCJ0ZXN0Q2FmZSIsImhvc3RuYW1lIiwic3NsIiwiZGV2IiwicmVtb3RlQnJvd3NlcnMiLCJyZW1vdGVDb3VudCIsInFyQ29kZSIsImJyb3dzZXJzIiwiY29uY2F0IiwicnVubmVyIiwibGl2ZSIsImNyZWF0ZUxpdmVNb2RlUnVubmVyIiwiY3JlYXRlUnVubmVyIiwiZmFpbGVkIiwiaXNDbGkiLCJ1c2VQcm94eSIsInNyYyIsInJlcG9ydGVyIiwiY29uY3VycmVuY3kiLCJmaWx0ZXIiLCJzY3JlZW5zaG90cyIsInNjcmVlbnNob3RzT25GYWlscyIsInNjcmVlbnNob3RQYXRoUGF0dGVybiIsInN0YXJ0QXBwIiwiYXBwIiwiYXBwSW5pdERlbGF5Iiwib25jZSIsImhpZGVTcGlubmVyIiwicnVuIiwic2hvd01lc3NhZ2VPbkV4aXQiLCJjbG9zZSIsImV4aXQiLCJydW5UZXN0cyIsInByb3ZpZGVyTmFtZSIsImJyb3dzZXJQcm92aWRlclBvb2wiLCJyZXF1aXJlIiwicHJvdmlkZXIiLCJnZXRQcm92aWRlciIsIkdlbmVyYWxFcnJvciIsIk1FU1NBR0UiLCJicm93c2VyUHJvdmlkZXJOb3RGb3VuZCIsImlzTXVsdGlCcm93c2VyIiwiYnJvd3Nlck5hbWVzIiwiZ2V0QnJvd3Nlckxpc3QiLCJkaXNwb3NlIiwiY29uc29sZSIsImpvaW4iLCJtYXAiLCJicm93c2VyTmFtZSIsImxpc3RCcm93c2VycyIsImV4aXRNZXNzYWdlU2hvd24iLCJleGl0aW5nIiwiZXhpdEhhbmRsZXIiLCJ0ZXJtaW5hdGlvbkxldmVsIiwid3JpdGUiLCJwcm9jZXNzIiwib24iLCJjb2RlIiwic2V0VGltZW91dCIsImVycm9yIiwiZXJyIiwibWVzc2FnZSIsImNvbnN0cnVjdG9yIiwiQVBJRXJyb3IiLCJjb2xvcmVkU3RhY2siLCJzdGFjayIsImNoYWxrIiwicmVkIiwiZ3JheSIsInRlcm1pbmF0aW9uSGFuZGxlciIsIlRlcm1pbmF0aW9uSGFuZGxlciIsIlRFUk1JTkFUSU9OX0xFVkVMX0lOQ1JFQVNFRF9FVkVOVCIsIkNsaUFyZ3VtZW50UGFyc2VyIiwicGFyc2UiLCJhcmd2IiwiY2xpIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OytDQThEQSxXQUF5QkEsU0FBekIsRUFBb0M7QUFDaEMsY0FBTUMsT0FBb0JELFVBQVVDLElBQXBDO0FBQ0EsY0FBTUMsUUFBb0JELEtBQUtFLEtBQUwsSUFBY0YsS0FBS0UsS0FBTCxDQUFXLENBQVgsQ0FBeEM7QUFDQSxjQUFNQyxRQUFvQkgsS0FBS0UsS0FBTCxJQUFjRixLQUFLRSxLQUFMLENBQVcsQ0FBWCxDQUF4QztBQUNBLGNBQU1FLFFBQW9CSixLQUFLSSxLQUEvQjtBQUNBLGNBQU1DLGNBQW9CTCxLQUFLSyxXQUEvQjs7QUFFQUMsc0JBQUlDLFdBQUo7O0FBRUEsY0FBTUMsV0FBaUIsTUFBTSxnQkFBZVIsS0FBS1MsUUFBcEIsRUFBOEJSLEtBQTlCLEVBQXFDRSxLQUFyQyxFQUE0Q0gsS0FBS1UsR0FBakQsRUFBc0RWLEtBQUtXLEdBQTNELENBQTdCO0FBQ0EsY0FBTUMsaUJBQWlCLE1BQU0sNkJBQWNKLFFBQWQsRUFBd0JULFVBQVVjLFdBQWxDLEVBQStDYixLQUFLYyxNQUFwRCxDQUE3QjtBQUNBLGNBQU1DLFdBQWlCaEIsVUFBVWdCLFFBQVYsQ0FBbUJDLE1BQW5CLENBQTBCSixjQUExQixDQUF2QjtBQUNBLGNBQU1LLFNBQWlCakIsS0FBS2tCLElBQUwsR0FBWVYsU0FBU1csb0JBQVQsRUFBWixHQUE4Q1gsU0FBU1ksWUFBVCxFQUFyRTs7QUFFQSxZQUFJQyxTQUFTLENBQWI7O0FBR0FKLGVBQU9LLEtBQVAsR0FBZSxJQUFmOztBQUVBTCxlQUNLTSxRQURMLENBQ2NuQixLQURkLEVBQ3FCQyxXQURyQixFQUVLbUIsR0FGTCxDQUVTekIsVUFB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OztBQUVBLFFBQUlrQyxVQUFVLElBQWQ7O0FBRUE7QUFDQTtBQUNBLFFBQUlELElBQUlFLFdBQUosS0FBb0J4QixxQkFBeEIsRUFDSXVCLFVBQVVELElBQUlDLE9BQWQsQ0FESixLQUdLLElBQUlELElBQUlFLFdBQUosS0FBb0JDLGlCQUF4QixFQUNERixVQUFVRCxJQUFJSSxZQUFkLENBREMsS0FJREgsVUFBVUQsSUFBSUssS0FBZDs7QUFFSm5FLGtCQUFJd0QsS0FBSixDQUFVWSxnQkFBTUMsR0FBTixDQUFVLFFBQVYsSUFBc0JOLE9BQXRCLEdBQWdDLElBQTFDO0FBQ0EvRCxrQkFBSXdELEtBQUosQ0FBVVksZ0JBQU1FLElBQU4sQ0FBVyw4QkFBWCxDQUFWOztBQUVBckMsU0FBSyxDQUFMO0FBQ0g7O0FBc0VEO0FBQUEsZ0RBQUMsYUFBc0I7QUFDbkIsY0FBTXNDLHFCQUFxQixJQUFJQyw0QkFBSixFQUEzQjs7QUFFQUQsMkJBQW1CYixFQUFuQixDQUFzQmMsNkJBQW1CQyxpQ0FBekMsRUFBNEVuQixXQUE1RTs7QUFFQSxZQUFJO0FBQ0Esa0JBQU03RCxZQUFZLElBQUlpRix3QkFBSixFQUFsQjs7QUFFQSxrQkFBTWpGLFVBQVVrRixLQUFWLENBQWdCbEIsUUFBUW1CLElBQXhCLENBQU47O0FBRUEsZ0JBQUluRixVQUFVQyxJQUFWLENBQWV5RCxZQUFuQixFQUNJLE1BQU1BLGFBQWExRCxVQUFVQyxJQUFWLENBQWV5QyxZQUE1QixDQUFOLENBREosS0FHSSxNQUFNRCxTQUFTekMsU0FBVCxDQUFOO0FBQ1AsU0FURCxDQVVBLE9BQU9xRSxHQUFQLEVBQVk7QUFDUi9CLGdDQUFvQixLQUFwQjtBQUNBOEIsa0JBQU1DLEdBQU47QUFDSDtBQUNKLEtBbkJEOztBQUFBLGFBQWdCZSxHQUFoQjtBQUFBO0FBQUE7O0FBQUEsV0FBZ0JBLEdBQWhCO0FBQUEiLCJmaWxlIjoiY2xpL2NsaS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgeyBHZW5lcmFsRXJyb3IsIEFQSUVycm9yIH0gZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUnO1xuaW1wb3J0IE1FU1NBR0UgZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUvbWVzc2FnZSc7XG5pbXBvcnQgQ2xpQXJndW1lbnRQYXJzZXIgZnJvbSAnLi9hcmd1bWVudC1wYXJzZXInO1xuaW1wb3J0IFRlcm1pbmF0aW9uSGFuZGxlciBmcm9tICcuL3Rlcm1pbmF0aW9uLWhhbmRsZXInO1xuaW1wb3J0IGxvZyBmcm9tICcuL2xvZyc7XG5pbXBvcnQgcmVtb3Rlc1dpemFyZCBmcm9tICcuL3JlbW90ZXMtd2l6YXJkJztcbmltcG9ydCBjcmVhdGVUZXN0Q2FmZSBmcm9tICcuLi8nO1xuXG5sZXQgc2hvd01lc3NhZ2VPbkV4aXQgPSB0cnVlO1xubGV0IGV4aXRNZXNzYWdlU2hvd24gID0gZmFsc2U7XG5sZXQgZXhpdGluZyAgICAgICAgICAgPSBmYWxzZTtcblxuZnVuY3Rpb24gZXhpdEhhbmRsZXIgKHRlcm1pbmF0aW9uTGV2ZWwpIHtcbiAgICBpZiAoc2hvd01lc3NhZ2VPbkV4aXQgJiYgIWV4aXRNZXNzYWdlU2hvd24pIHtcbiAgICAgICAgZXhpdE1lc3NhZ2VTaG93biA9IHRydWU7XG5cbiAgICAgICAgbG9nLmhpZGVTcGlubmVyKCk7XG4gICAgICAgIGxvZy53cml0ZSgnU3RvcHBpbmcgVGVzdENhZmUuLi4nKTtcbiAgICAgICAgbG9nLnNob3dTcGlubmVyKCk7XG5cbiAgICAgICAgcHJvY2Vzcy5vbignZXhpdCcsICgpID0+IGxvZy5oaWRlU3Bpbm5lcih0cnVlKSk7XG4gICAgfVxuXG4gICAgaWYgKGV4aXRpbmcgfHwgdGVybWluYXRpb25MZXZlbCA8IDIpXG4gICAgICAgIHJldHVybjtcblxuICAgIGV4aXRpbmcgPSB0cnVlO1xuXG4gICAgZXhpdCgwKTtcbn1cblxuZnVuY3Rpb24gZXhpdCAoY29kZSkge1xuICAgIGxvZy5oaWRlU3Bpbm5lcih0cnVlKTtcblxuICAgIC8vIE5PVEU6IGdpdmUgYSBwcm9jZXNzIHRpbWUgdG8gZmx1c2ggdGhlIG91dHB1dC5cbiAgICAvLyBJdCdzIG5lY2Vzc2FyeSBpbiBzb21lIGVudmlyb25tZW50cy5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHByb2Nlc3MuZXhpdChjb2RlKSwgMCk7XG59XG5cbmZ1bmN0aW9uIGVycm9yIChlcnIpIHtcbiAgICBsb2cuaGlkZVNwaW5uZXIoKTtcblxuICAgIGxldCBtZXNzYWdlID0gbnVsbDtcblxuICAgIC8vIEhBQ0s6IHdvcmthcm91bmQgZm9yIHRoZSBgaW5zdGFuY2VvZmAgcHJvYmxlbVxuICAgIC8vIChzZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzM4NzA2ODQvd2h5LWRvZXNudC1pbnN0YW5jZW9mLXdvcmstb24taW5zdGFuY2VzLW9mLWVycm9yLXN1YmNsYXNzZXMtdW5kZXItYmFiZWwtbm9kZSlcbiAgICBpZiAoZXJyLmNvbnN0cnVjdG9yID09PSBHZW5lcmFsRXJyb3IpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIubWVzc2FnZTtcblxuICAgIGVsc2UgaWYgKGVyci5jb25zdHJ1Y3RvciA9PT0gQVBJRXJyb3IpXG4gICAgICAgIG1lc3NhZ2UgPSBlcnIuY29sb3JlZFN0YWNrO1xuXG4gICAgZWxzZVxuICAgICAgICBtZXNzYWdlID0gZXJyLnN0YWNrO1xuXG4gICAgbG9nLndyaXRlKGNoYWxrLnJlZCgnRVJST1IgJykgKyBtZXNzYWdlICsgJ1xcbicpO1xuICAgIGxvZy53cml0ZShjaGFsay5ncmF5KCdUeXBlIFwidGVzdGNhZmUgLWhcIiBmb3IgaGVscC4nKSk7XG5cbiAgICBleGl0KDEpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5UZXN0cyAoYXJnUGFyc2VyKSB7XG4gICAgY29uc3Qgb3B0cyAgICAgICAgICAgICAgPSBhcmdQYXJzZXIub3B0cztcbiAgICBjb25zdCBwb3J0MSAgICAgICAgICAgICA9IG9wdHMucG9ydHMgJiYgb3B0cy5wb3J0c1swXTtcbiAgICBjb25zdCBwb3J0MiAgICAgICAgICAgICA9IG9wdHMucG9ydHMgJiYgb3B0cy5wb3J0c1sxXTtcbiAgICBjb25zdCBwcm94eSAgICAgICAgICAgICA9IG9wdHMucHJveHk7XG4gICAgY29uc3QgcHJveHlCeXBhc3MgICAgICAgPSBvcHRzLnByb3h5QnlwYXNzO1xuXG4gICAgbG9nLnNob3dTcGlubmVyKCk7XG5cbiAgICBjb25zdCB0ZXN0Q2FmZSAgICAgICA9IGF3YWl0IGNyZWF0ZVRlc3RDYWZlKG9wdHMuaG9zdG5hbWUsIHBvcnQxLCBwb3J0Miwgb3B0cy5zc2wsIG9wdHMuZGV2KTtcbiAgICBjb25zdCByZW1vdGVCcm93c2VycyA9IGF3YWl0IHJlbW90ZXNXaXphcmQodGVzdENhZmUsIGFyZ1BhcnNlci5yZW1vdGVDb3VudCwgb3B0cy5xckNvZGUpO1xuICAgIGNvbnN0IGJyb3dzZXJzICAgICAgID0gYXJnUGFyc2VyLmJyb3dzZXJzLmNvbmNhdChyZW1vdGVCcm93c2Vycyk7XG4gICAgY29uc3QgcnVubmVyICAgICAgICAgPSBvcHRzLmxpdmUgPyB0ZXN0Q2FmZS5jcmVhdGVMaXZlTW9kZVJ1bm5lcigpIDogdGVzdENhZmUuY3JlYXRlUnVubmVyKCk7XG5cbiAgICBsZXQgZmFpbGVkID0gMDtcblxuXG4gICAgcnVubmVyLmlzQ2xpID0gdHJ1ZTtcblxuICAgIHJ1bm5lclxuICAgICAgICAudXNlUHJveHkocHJveHksIHByb3h5QnlwYXNzKVxuICAgICAgICAuc3JjKGFyZ1BhcnNlci5zcmMpXG4gICAgICAgIC5icm93c2Vycyhicm93c2VycylcbiAgICAgICAgLnJlcG9ydGVyKGFyZ1BhcnNlci5vcHRzLnJlcG9ydGVyKVxuICAgICAgICAuY29uY3VycmVuY3koYXJnUGFyc2VyLm9wdHMuY29uY3VycmVuY3kpXG4gICAgICAgIC5maWx0ZXIoYXJnUGFyc2VyLmZpbHRlcilcbiAgICAgICAgLnNjcmVlbnNob3RzKG9wdHMuc2NyZWVuc2hvdHMsIG9wdHMuc2NyZWVuc2hvdHNPbkZhaWxzLCBvcHRzLnNjcmVlbnNob3RQYXRoUGF0dGVybilcbiAgICAgICAgLnN0YXJ0QXBwKG9wdHMuYXBwLCBvcHRzLmFwcEluaXREZWxheSk7XG5cbiAgICBydW5uZXIub25jZSgnZG9uZS1ib290c3RyYXBwaW5nJywgKCkgPT4gbG9nLmhpZGVTcGlubmVyKCkpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgZmFpbGVkID0gYXdhaXQgcnVubmVyLnJ1bihvcHRzKTtcbiAgICB9XG5cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgc2hvd01lc3NhZ2VPbkV4aXQgPSBmYWxzZTtcbiAgICAgICAgYXdhaXQgdGVzdENhZmUuY2xvc2UoKTtcbiAgICB9XG5cbiAgICBleGl0KGZhaWxlZCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxpc3RCcm93c2VycyAocHJvdmlkZXJOYW1lID0gJ2xvY2FsbHktaW5zdGFsbGVkJykge1xuICAgIC8vIE5PVEU6IExvYWQgdGhlIHByb3ZpZGVyIHBvb2wgbGF6aWx5IHRvIHJlZHVjZSBzdGFydHVwIHRpbWVcbiAgICBjb25zdCBicm93c2VyUHJvdmlkZXJQb29sID0gcmVxdWlyZSgnLi4vYnJvd3Nlci9wcm92aWRlci9wb29sJyk7XG5cbiAgICBjb25zdCBwcm92aWRlciA9IGF3YWl0IGJyb3dzZXJQcm92aWRlclBvb2wuZ2V0UHJvdmlkZXIocHJvdmlkZXJOYW1lKTtcblxuICAgIGlmICghcHJvdmlkZXIpXG4gICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoTUVTU0FHRS5icm93c2VyUHJvdmlkZXJOb3RGb3VuZCwgcHJvdmlkZXJOYW1lKTtcblxuICAgIGlmIChwcm92aWRlci5pc011bHRpQnJvd3Nlcikge1xuICAgICAgICBjb25zdCBicm93c2VyTmFtZXMgPSBhd2FpdCBwcm92aWRlci5nZXRCcm93c2VyTGlzdCgpO1xuXG4gICAgICAgIGF3YWl0IGJyb3dzZXJQcm92aWRlclBvb2wuZGlzcG9zZSgpO1xuXG4gICAgICAgIGlmIChwcm92aWRlck5hbWUgPT09ICdsb2NhbGx5LWluc3RhbGxlZCcpXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhicm93c2VyTmFtZXMuam9pbignXFxuJykpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhicm93c2VyTmFtZXMubWFwKGJyb3dzZXJOYW1lID0+IGBcIiR7cHJvdmlkZXJOYW1lfToke2Jyb3dzZXJOYW1lfVwiYCkuam9pbignXFxuJykpO1xuICAgIH1cbiAgICBlbHNlXG4gICAgICAgIGNvbnNvbGUubG9nKGBcIiR7cHJvdmlkZXJOYW1lfVwiYCk7XG5cbiAgICBleGl0KDApO1xufVxuXG4oYXN5bmMgZnVuY3Rpb24gY2xpICgpIHtcbiAgICBjb25zdCB0ZXJtaW5hdGlvbkhhbmRsZXIgPSBuZXcgVGVybWluYXRpb25IYW5kbGVyKCk7XG5cbiAgICB0ZXJtaW5hdGlvbkhhbmRsZXIub24oVGVybWluYXRpb25IYW5kbGVyLlRFUk1JTkFUSU9OX0xFVkVMX0lOQ1JFQVNFRF9FVkVOVCwgZXhpdEhhbmRsZXIpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYXJnUGFyc2VyID0gbmV3IENsaUFyZ3VtZW50UGFyc2VyKCk7XG5cbiAgICAgICAgYXdhaXQgYXJnUGFyc2VyLnBhcnNlKHByb2Nlc3MuYXJndik7XG5cbiAgICAgICAgaWYgKGFyZ1BhcnNlci5vcHRzLmxpc3RCcm93c2VycylcbiAgICAgICAgICAgIGF3YWl0IGxpc3RCcm93c2VycyhhcmdQYXJzZXIub3B0cy5wcm92aWRlck5hbWUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhd2FpdCBydW5UZXN0cyhhcmdQYXJzZXIpO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHNob3dNZXNzYWdlT25FeGl0ID0gZmFsc2U7XG4gICAgICAgIGVycm9yKGVycik7XG4gICAgfVxufSkoKTtcblxuIl19
