'use strict';

exports.__esModule = true;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _commander = require('commander');

var _dedent = require('dedent');

var _dedent2 = _interopRequireDefault(_dedent);

var _readFileRelative = require('read-file-relative');

var _runtime = require('../errors/runtime');

var _message = require('../errors/runtime/message');

var _message2 = _interopRequireDefault(_message);

var _typeAssertions = require('../errors/runtime/type-assertions');

var _getViewportWidth = require('../utils/get-viewport-width');

var _getViewportWidth2 = _interopRequireDefault(_getViewportWidth);

var _string = require('../utils/string');

var _parseSslOptions = require('../utils/parse-ssl-options');

var _parseSslOptions2 = _interopRequireDefault(_parseSslOptions);

var _getFilterFn = require('../utils/get-filter-fn');

var _getFilterFn2 = _interopRequireDefault(_getFilterFn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const REMOTE_ALIAS_RE = /^remote(?::(\d*))?$/;

const DESCRIPTION = (0, _dedent2.default)(`
    In the browser list, you can use browser names (e.g. "ie", "chrome", etc.) as well as paths to executables.

    To run tests against all installed browsers, use the "all" alias.

    To use a remote browser connection (e.g., to connect a mobile device), specify "remote" as the browser alias.
    If you need to connect multiple devices, add a colon and the number of browsers you want to connect (e.g., "remote:3").

    To run tests in a browser accessed through a browser provider plugin, specify a browser alias that consists of two parts - the browser provider name prefix and the name of the browser itself; for example, "saucelabs:chrome@51".

    You can use one or more file paths or glob patterns to specify which tests to run.

    More info: https://devexpress.github.io/testcafe/documentation
`);

class CLIArgumentParser {
    constructor(cwd) {
        this.program = new _commander.Command('testcafe');

        this.cwd = cwd || process.cwd();

        this.src = null;
        this.browsers = null;
        this.filter = null;
        this.remoteCount = 0;
        this.opts = null;

        this._describeProgram();
    }

    static _parsePortNumber(value) {
        (0, _typeAssertions.assertType)(_typeAssertions.is.nonNegativeNumberString, null, 'Port number', value);

        return parseInt(value, 10);
    }

    static _getDescription() {
        // NOTE: add empty line to workaround commander-forced indentation on the first line.
        return '\n' + (0, _string.wordWrap)(DESCRIPTION, 2, (0, _getViewportWidth2.default)(process.stdout));
    }

    _describeProgram() {
        const version = JSON.parse((0, _readFileRelative.readSync)('../../package.json')).version;

        this.program.version(version, '-v, --version').usage('[options] <comma-separated-browser-list> <file-or-glob ...>').description(CLIArgumentParser._getDescription()).option('-b, --list-browsers [provider]', 'output the aliases for local browsers or browsers available through the specified browser provider').option('-r, --reporter <name[:outputFile][,...]>', 'specify the reporters and optionally files where reports are saved').option('-s, --screenshots <path>', 'enable screenshot capturing and specify the path to save the screenshots to').option('-S, --screenshots-on-fails', 'take a screenshot whenever a test fails').option('-p, --screenshot-path-pattern <pattern>', 'use patterns to compose screenshot file names and paths: ${BROWSER}, ${BROWSER_VERSION}, ${OS}, etc.').option('-q, --quarantine-mode', 'enable the quarantine mode').option('-d, --debug-mode', 'execute test steps one by one pausing the test after each step').option('-e, --skip-js-errors', 'make tests not fail when a JS error happens on a page').option('-u, --skip-uncaught-errors', 'ignore uncaught errors and unhandled promise rejections, which occur during test execution').option('-t, --test <name>', 'run only tests with the specified name').option('-T, --test-grep <pattern>', 'run only tests matching the specified pattern').option('-f, --fixture <name>', 'run only fixtures with the specified name').option('-F, --fixture-grep <pattern>', 'run only fixtures matching the specified pattern').option('-a, --app <command>', 'launch the tested app using the specified command before running tests').option('-c, --concurrency <number>', 'run tests concurrently').option('-L, --live', 'enable live mode. In this mode, TestCafe watches for changes you make in the test files. These changes immediately restart the tests so that you can see the effect.').option('--test-meta <key=value[,key2=value2,...]>', 'run only tests with matching metadata').option('--fixture-meta <key=value[,key2=value2,...]>', 'run only fixtures with matching metadata').option('--debug-on-fail', 'pause the test if it fails').option('--app-init-delay <ms>', 'specify how much time it takes for the tested app to initialize').option('--selector-timeout <ms>', 'set the amount of time within which selectors make attempts to obtain a node to be returned').option('--assertion-timeout <ms>', 'set the amount of time within which assertion should pass').option('--page-load-timeout <ms>', 'set the amount of time within which TestCafe waits for the `window.load` event to fire on page load before proceeding to the next test action').option('--speed <factor>', 'set the speed of test execution (0.01 ... 1)').option('--ports <port1,port2>', 'specify custom port numbers').option('--hostname <name>', 'specify the hostname').option('--proxy <host>', 'specify the host of the proxy server').option('--proxy-bypass <rules>', 'specify a comma-separated list of rules that define URLs accessed bypassing the proxy server').option('--ssl <options>', 'specify SSL options to run TestCafe proxy server over the HTTPS protocol').option('--disable-page-reloads', 'disable page reloads between tests').option('--dev', 'enables mechanisms to log and diagnose errors').option('--qr-code', 'outputs QR-code that repeats URLs used to connect the remote browsers').option('--sf, --stop-on-first-fail', 'stop an entire test run if any test fails').option('--disable-test-syntax-validation', 'disables checks for \'test\' and \'fixture\' directives to run dynamically loaded tests')

        // NOTE: these options will be handled by chalk internally
        .option('--color', 'force colors in command line').option('--no-color', 'disable colors in command line');
    }

    _filterAndCountRemotes(browser) {
        const remoteMatch = browser.match(REMOTE_ALIAS_RE);

        if (remoteMatch) {
            this.remoteCount += parseInt(remoteMatch[1], 10) || 1;
            return false;
        }

        return true;
    }

    _parseFilteringOptions() {
        this.filter = (0, _getFilterFn2.default)(this.opts);
    }

    _parseAppInitDelay() {
        if (this.opts.appInitDelay) {
            (0, _typeAssertions.assertType)(_typeAssertions.is.nonNegativeNumberString, null, 'Tested app initialization delay', this.opts.appInitDelay);

            this.opts.appInitDelay = parseInt(this.opts.appInitDelay, 10);
        }
    }

    _parseSelectorTimeout() {
        if (this.opts.selectorTimeout) {
            (0, _typeAssertions.assertType)(_typeAssertions.is.nonNegativeNumberString, null, 'Selector timeout', this.opts.selectorTimeout);

            this.opts.selectorTimeout = parseInt(this.opts.selectorTimeout, 10);
        }
    }

    _parseAssertionTimeout() {
        if (this.opts.assertionTimeout) {
            (0, _typeAssertions.assertType)(_typeAssertions.is.nonNegativeNumberString, null, 'Assertion timeout', this.opts.assertionTimeout);

            this.opts.assertionTimeout = parseInt(this.opts.assertionTimeout, 10);
        }
    }

    _parsePageLoadTimeout() {
        if (this.opts.pageLoadTimeout) {
            (0, _typeAssertions.assertType)(_typeAssertions.is.nonNegativeNumberString, null, 'Page load timeout', this.opts.pageLoadTimeout);

            this.opts.pageLoadTimeout = parseInt(this.opts.pageLoadTimeout, 10);
        }
    }

    _parseSpeed() {
        if (this.opts.speed) this.opts.speed = parseFloat(this.opts.speed);
    }

    _parseConcurrency() {
        if (this.opts.concurrency) this.opts.concurrency = parseInt(this.opts.concurrency, 10);
    }

    _parsePorts() {
        if (this.opts.ports) {
            this.opts.ports = this.opts.ports.split(',').map(CLIArgumentParser._parsePortNumber);

            if (this.opts.ports.length < 2) throw new _runtime.GeneralError(_message2.default.portsOptionRequiresTwoNumbers);
        }
    }

    _parseBrowserList() {
        const browsersArg = this.program.args[0] || '';

        this.browsers = (0, _string.splitQuotedText)(browsersArg, ',').filter(browser => browser && this._filterAndCountRemotes(browser));
    }

    _parseSslOptions() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this.opts.ssl) _this.opts.ssl = yield (0, _parseSslOptions2.default)(_this.opts.ssl);
        })();
    }

    _parseReporters() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const reporters = _this2.opts.reporter ? _this2.opts.reporter.split(',') : [];

            _this2.opts.reporter = reporters.map(function (reporter) {
                const separatorIndex = reporter.indexOf(':');

                if (separatorIndex < 0) return { name: reporter };

                const name = reporter.substring(0, separatorIndex);
                const file = reporter.substring(separatorIndex + 1);

                return { name, file };
            });
        })();
    }

    _parseFileList() {
        this.src = this.program.args.slice(1);
    }

    _getProviderName() {
        this.opts.providerName = this.opts.listBrowsers === true ? void 0 : this.opts.listBrowsers;
    }

    parse(argv) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            _this3.program.parse(argv);

            _this3.opts = _this3.program.opts();

            // NOTE: the '-list-browsers' option only lists browsers and immediately exits the app.
            // Therefore, we don't need to process other arguments.
            if (_this3.opts.listBrowsers) {
                _this3._getProviderName();
                return;
            }

            _this3._parseFilteringOptions();
            _this3._parseSelectorTimeout();
            _this3._parseAssertionTimeout();
            _this3._parsePageLoadTimeout();
            _this3._parseAppInitDelay();
            _this3._parseSpeed();
            _this3._parsePorts();
            _this3._parseBrowserList();
            _this3._parseConcurrency();
            _this3._parseFileList();

            yield _this3._parseSslOptions();
            yield _this3._parseReporters();
        })();
    }
}
exports.default = CLIArgumentParser;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jbGkvYXJndW1lbnQtcGFyc2VyLmpzIl0sIm5hbWVzIjpbIlJFTU9URV9BTElBU19SRSIsIkRFU0NSSVBUSU9OIiwiQ0xJQXJndW1lbnRQYXJzZXIiLCJjb25zdHJ1Y3RvciIsImN3ZCIsInByb2dyYW0iLCJDb21tYW5kIiwicHJvY2VzcyIsInNyYyIsImJyb3dzZXJzIiwiZmlsdGVyIiwicmVtb3RlQ291bnQiLCJvcHRzIiwiX2Rlc2NyaWJlUHJvZ3JhbSIsIl9wYXJzZVBvcnROdW1iZXIiLCJ2YWx1ZSIsImlzIiwibm9uTmVnYXRpdmVOdW1iZXJTdHJpbmciLCJwYXJzZUludCIsIl9nZXREZXNjcmlwdGlvbiIsInN0ZG91dCIsInZlcnNpb24iLCJKU09OIiwicGFyc2UiLCJ1c2FnZSIsImRlc2NyaXB0aW9uIiwib3B0aW9uIiwiX2ZpbHRlckFuZENvdW50UmVtb3RlcyIsImJyb3dzZXIiLCJyZW1vdGVNYXRjaCIsIm1hdGNoIiwiX3BhcnNlRmlsdGVyaW5nT3B0aW9ucyIsIl9wYXJzZUFwcEluaXREZWxheSIsImFwcEluaXREZWxheSIsIl9wYXJzZVNlbGVjdG9yVGltZW91dCIsInNlbGVjdG9yVGltZW91dCIsIl9wYXJzZUFzc2VydGlvblRpbWVvdXQiLCJhc3NlcnRpb25UaW1lb3V0IiwiX3BhcnNlUGFnZUxvYWRUaW1lb3V0IiwicGFnZUxvYWRUaW1lb3V0IiwiX3BhcnNlU3BlZWQiLCJzcGVlZCIsInBhcnNlRmxvYXQiLCJfcGFyc2VDb25jdXJyZW5jeSIsImNvbmN1cnJlbmN5IiwiX3BhcnNlUG9ydHMiLCJwb3J0cyIsInNwbGl0IiwibWFwIiwibGVuZ3RoIiwiR2VuZXJhbEVycm9yIiwiTUVTU0FHRSIsInBvcnRzT3B0aW9uUmVxdWlyZXNUd29OdW1iZXJzIiwiX3BhcnNlQnJvd3Nlckxpc3QiLCJicm93c2Vyc0FyZyIsImFyZ3MiLCJfcGFyc2VTc2xPcHRpb25zIiwic3NsIiwiX3BhcnNlUmVwb3J0ZXJzIiwicmVwb3J0ZXJzIiwicmVwb3J0ZXIiLCJzZXBhcmF0b3JJbmRleCIsImluZGV4T2YiLCJuYW1lIiwic3Vic3RyaW5nIiwiZmlsZSIsIl9wYXJzZUZpbGVMaXN0Iiwic2xpY2UiLCJfZ2V0UHJvdmlkZXJOYW1lIiwicHJvdmlkZXJOYW1lIiwibGlzdEJyb3dzZXJzIiwiYXJndiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztBQUNBOztBQUNBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQSxNQUFNQSxrQkFBa0IscUJBQXhCOztBQUVBLE1BQU1DLGNBQWMsc0JBQVE7Ozs7Ozs7Ozs7Ozs7Q0FBUixDQUFwQjs7QUFlZSxNQUFNQyxpQkFBTixDQUF3QjtBQUNuQ0MsZ0JBQWFDLEdBQWIsRUFBa0I7QUFDZCxhQUFLQyxPQUFMLEdBQWUsSUFBSUMsa0JBQUosQ0FBWSxVQUFaLENBQWY7O0FBRUEsYUFBS0YsR0FBTCxHQUFXQSxPQUFPRyxRQUFRSCxHQUFSLEVBQWxCOztBQUVBLGFBQUtJLEdBQUwsR0FBbUIsSUFBbkI7QUFDQSxhQUFLQyxRQUFMLEdBQW1CLElBQW5CO0FBQ0EsYUFBS0MsTUFBTCxHQUFtQixJQUFuQjtBQUNBLGFBQUtDLFdBQUwsR0FBbUIsQ0FBbkI7QUFDQSxhQUFLQyxJQUFMLEdBQW1CLElBQW5COztBQUVBLGFBQUtDLGdCQUFMO0FBQ0g7O0FBRUQsV0FBT0MsZ0JBQVAsQ0FBeUJDLEtBQXpCLEVBQWdDO0FBQzVCLHdDQUFXQyxtQkFBR0MsdUJBQWQsRUFBdUMsSUFBdkMsRUFBNkMsYUFBN0MsRUFBNERGLEtBQTVEOztBQUVBLGVBQU9HLFNBQVNILEtBQVQsRUFBZ0IsRUFBaEIsQ0FBUDtBQUNIOztBQUVELFdBQU9JLGVBQVAsR0FBMEI7QUFDdEI7QUFDQSxlQUFPLE9BQU8sc0JBQVNsQixXQUFULEVBQXNCLENBQXRCLEVBQXlCLGdDQUFpQk0sUUFBUWEsTUFBekIsQ0FBekIsQ0FBZDtBQUNIOztBQUVEUCx1QkFBb0I7QUFDaEIsY0FBTVEsVUFBVUMsS0FBS0MsS0FBTCxDQUFXLGdDQUFLLG9CQUFMLENBQVgsRUFBdUNGLE9BQXZEOztBQUVBLGFBQUtoQixPQUFMLENBQ0tnQixPQURMLENBQ2FBLE9BRGIsRUFDc0IsZUFEdEIsRUFFS0csS0FGTCxDQUVXLDZEQUZYLEVBR0tDLFdBSEwsQ0FHaUJ2QixrQkFBa0JpQixlQUFsQixFQUhqQixFQUtLTyxNQUxMLENBS1ksZ0NBTFosRUFLOEMsb0dBTDlDLEVBTUtBLE1BTkwsQ0FNWSwwQ0FOWixFQU13RCxvRUFOeEQsRUFPS0EsTUFQTCxDQU9ZLDBCQVBaLEVBT3dDLDZFQVB4QyxFQVFLQSxNQVJMLENBUVksNEJBUlosRUFRMEMseUNBUjFDLEVBU0tBLE1BVEwsQ0FTWSx5Q0FUWixFQVN1RCxzR0FUdkQsRUFVS0EsTUFWTCxDQVVZLHVCQVZaLEVBVXFDLDRCQVZyQyxFQVdLQSxNQVhMLENBV1ksa0JBWFosRUFXZ0MsZ0VBWGhDLEVBWUtBLE1BWkwsQ0FZWSxzQkFaWixFQVlvQyx1REFacEMsRUFhS0EsTUFiTCxDQWFZLDRCQWJaLEVBYTBDLDRGQWIxQyxFQWNLQSxNQWRMLENBY1ksbUJBZFosRUFjaUMsd0NBZGpDLEVBZUtBLE1BZkwsQ0FlWSwyQkFmWixFQWV5QywrQ0FmekMsRUFnQktBLE1BaEJMLENBZ0JZLHNCQWhCWixFQWdCb0MsMkNBaEJwQyxFQWlCS0EsTUFqQkwsQ0FpQlksOEJBakJaLEVBaUI0QyxrREFqQjVDLEVBa0JLQSxNQWxCTCxDQWtCWSxxQkFsQlosRUFrQm1DLHdFQWxCbkMsRUFtQktBLE1BbkJMLENBbUJZLDRCQW5CWixFQW1CMEMsd0JBbkIxQyxFQW9CS0EsTUFwQkwsQ0FvQlksWUFwQlosRUFvQjBCLHNLQXBCMUIsRUFxQktBLE1BckJMLENBcUJZLDJDQXJCWixFQXFCeUQsdUNBckJ6RCxFQXNCS0EsTUF0QkwsQ0FzQlksOENBdEJaLEVBc0I0RCwwQ0F0QjVELEVBdUJLQSxNQXZCTCxDQXVCWSxpQkF2QlosRUF1QitCLDRCQXZCL0IsRUF3QktBLE1BeEJMLENBd0JZLHVCQXhCWixFQXdCcUMsaUVBeEJyQyxFQXlCS0EsTUF6QkwsQ0F5QlkseUJBekJaLEVBeUJ1Qyw2RkF6QnZDLEVBMEJLQSxNQTFCTCxDQTBCWSwwQkExQlosRUEwQndDLDJEQTFCeEMsRUEyQktBLE1BM0JMLENBMkJZLDBCQTNCWixFQTJCd0MsK0lBM0J4QyxFQTRCS0EsTUE1QkwsQ0E0Qlksa0JBNUJaLEVBNEJnQyw4Q0E1QmhDLEVBNkJLQSxNQTdCTCxDQTZCWSx1QkE3QlosRUE2QnFDLDZCQTdCckMsRUE4QktBLE1BOUJMLENBOEJZLG1CQTlCWixFQThCaUMsc0JBOUJqQyxFQStCS0EsTUEvQkwsQ0ErQlksZ0JBL0JaLEVBK0I4QixzQ0EvQjlCLEVBZ0NLQSxNQWhDTCxDQWdDWSx3QkFoQ1osRUFnQ3NDLDhGQWhDdEMsRUFpQ0tBLE1BakNMLENBaUNZLGlCQWpDWixFQWlDK0IsMEVBakMvQixFQWtDS0EsTUFsQ0wsQ0FrQ1ksd0JBbENaLEVBa0NzQyxvQ0FsQ3RDLEVBbUNLQSxNQW5DTCxDQW1DWSxPQW5DWixFQW1DcUIsK0NBbkNyQixFQW9DS0EsTUFwQ0wsQ0FvQ1ksV0FwQ1osRUFvQ3lCLHVFQXBDekIsRUFxQ0tBLE1BckNMLENBcUNZLDRCQXJDWixFQXFDMEMsMkNBckMxQyxFQXNDS0EsTUF0Q0wsQ0FzQ1ksa0NBdENaLEVBc0NnRCx5RkF0Q2hEOztBQXdDSTtBQXhDSixTQXlDS0EsTUF6Q0wsQ0F5Q1ksU0F6Q1osRUF5Q3VCLDhCQXpDdkIsRUEwQ0tBLE1BMUNMLENBMENZLFlBMUNaLEVBMEMwQixnQ0ExQzFCO0FBMkNIOztBQUVEQywyQkFBd0JDLE9BQXhCLEVBQWlDO0FBQzdCLGNBQU1DLGNBQWNELFFBQVFFLEtBQVIsQ0FBYzlCLGVBQWQsQ0FBcEI7O0FBRUEsWUFBSTZCLFdBQUosRUFBaUI7QUFDYixpQkFBS2xCLFdBQUwsSUFBb0JPLFNBQVNXLFlBQVksQ0FBWixDQUFULEVBQXlCLEVBQXpCLEtBQWdDLENBQXBEO0FBQ0EsbUJBQU8sS0FBUDtBQUNIOztBQUVELGVBQU8sSUFBUDtBQUNIOztBQUVERSw2QkFBMEI7QUFDdEIsYUFBS3JCLE1BQUwsR0FBYywyQkFBWSxLQUFLRSxJQUFqQixDQUFkO0FBQ0g7O0FBRURvQix5QkFBc0I7QUFDbEIsWUFBSSxLQUFLcEIsSUFBTCxDQUFVcUIsWUFBZCxFQUE0QjtBQUN4Qiw0Q0FBV2pCLG1CQUFHQyx1QkFBZCxFQUF1QyxJQUF2QyxFQUE2QyxpQ0FBN0MsRUFBZ0YsS0FBS0wsSUFBTCxDQUFVcUIsWUFBMUY7O0FBRUEsaUJBQUtyQixJQUFMLENBQVVxQixZQUFWLEdBQXlCZixTQUFTLEtBQUtOLElBQUwsQ0FBVXFCLFlBQW5CLEVBQWlDLEVBQWpDLENBQXpCO0FBQ0g7QUFDSjs7QUFFREMsNEJBQXlCO0FBQ3JCLFlBQUksS0FBS3RCLElBQUwsQ0FBVXVCLGVBQWQsRUFBK0I7QUFDM0IsNENBQVduQixtQkFBR0MsdUJBQWQsRUFBdUMsSUFBdkMsRUFBNkMsa0JBQTdDLEVBQWlFLEtBQUtMLElBQUwsQ0FBVXVCLGVBQTNFOztBQUVBLGlCQUFLdkIsSUFBTCxDQUFVdUIsZUFBVixHQUE0QmpCLFNBQVMsS0FBS04sSUFBTCxDQUFVdUIsZUFBbkIsRUFBb0MsRUFBcEMsQ0FBNUI7QUFDSDtBQUNKOztBQUVEQyw2QkFBMEI7QUFDdEIsWUFBSSxLQUFLeEIsSUFBTCxDQUFVeUIsZ0JBQWQsRUFBZ0M7QUFDNUIsNENBQVdyQixtQkFBR0MsdUJBQWQsRUFBdUMsSUFBdkMsRUFBNkMsbUJBQTdDLEVBQWtFLEtBQUtMLElBQUwsQ0FBVXlCLGdCQUE1RTs7QUFFQSxpQkFBS3pCLElBQUwsQ0FBVXlCLGdCQUFWLEdBQTZCbkIsU0FBUyxLQUFLTixJQUFMLENBQVV5QixnQkFBbkIsRUFBcUMsRUFBckMsQ0FBN0I7QUFDSDtBQUNKOztBQUVEQyw0QkFBeUI7QUFDckIsWUFBSSxLQUFLMUIsSUFBTCxDQUFVMkIsZUFBZCxFQUErQjtBQUMzQiw0Q0FBV3ZCLG1CQUFHQyx1QkFBZCxFQUF1QyxJQUF2QyxFQUE2QyxtQkFBN0MsRUFBa0UsS0FBS0wsSUFBTCxDQUFVMkIsZUFBNUU7O0FBRUEsaUJBQUszQixJQUFMLENBQVUyQixlQUFWLEdBQTRCckIsU0FBUyxLQUFLTixJQUFMLENBQVUyQixlQUFuQixFQUFvQyxFQUFwQyxDQUE1QjtBQUNIO0FBQ0o7O0FBRURDLGtCQUFlO0FBQ1gsWUFBSSxLQUFLNUIsSUFBTCxDQUFVNkIsS0FBZCxFQUNJLEtBQUs3QixJQUFMLENBQVU2QixLQUFWLEdBQWtCQyxXQUFXLEtBQUs5QixJQUFMLENBQVU2QixLQUFyQixDQUFsQjtBQUNQOztBQUVERSx3QkFBcUI7QUFDakIsWUFBSSxLQUFLL0IsSUFBTCxDQUFVZ0MsV0FBZCxFQUNJLEtBQUtoQyxJQUFMLENBQVVnQyxXQUFWLEdBQXdCMUIsU0FBUyxLQUFLTixJQUFMLENBQVVnQyxXQUFuQixFQUFnQyxFQUFoQyxDQUF4QjtBQUNQOztBQUVEQyxrQkFBZTtBQUNYLFlBQUksS0FBS2pDLElBQUwsQ0FBVWtDLEtBQWQsRUFBcUI7QUFDakIsaUJBQUtsQyxJQUFMLENBQVVrQyxLQUFWLEdBQWtCLEtBQUtsQyxJQUFMLENBQVVrQyxLQUFWLENBQ2JDLEtBRGEsQ0FDUCxHQURPLEVBRWJDLEdBRmEsQ0FFVDlDLGtCQUFrQlksZ0JBRlQsQ0FBbEI7O0FBSUEsZ0JBQUksS0FBS0YsSUFBTCxDQUFVa0MsS0FBVixDQUFnQkcsTUFBaEIsR0FBeUIsQ0FBN0IsRUFDSSxNQUFNLElBQUlDLHFCQUFKLENBQWlCQyxrQkFBUUMsNkJBQXpCLENBQU47QUFDUDtBQUNKOztBQUVEQyx3QkFBcUI7QUFDakIsY0FBTUMsY0FBYyxLQUFLakQsT0FBTCxDQUFha0QsSUFBYixDQUFrQixDQUFsQixLQUF3QixFQUE1Qzs7QUFFQSxhQUFLOUMsUUFBTCxHQUFnQiw2QkFBZ0I2QyxXQUFoQixFQUE2QixHQUE3QixFQUNYNUMsTUFEVyxDQUNKa0IsV0FBV0EsV0FBVyxLQUFLRCxzQkFBTCxDQUE0QkMsT0FBNUIsQ0FEbEIsQ0FBaEI7QUFFSDs7QUFFSzRCLG9CQUFOLEdBQTBCO0FBQUE7O0FBQUE7QUFDdEIsZ0JBQUksTUFBSzVDLElBQUwsQ0FBVTZDLEdBQWQsRUFDSSxNQUFLN0MsSUFBTCxDQUFVNkMsR0FBVixHQUFnQixNQUFNLCtCQUFnQixNQUFLN0MsSUFBTCxDQUFVNkMsR0FBMUIsQ0FBdEI7QUFGa0I7QUFHekI7O0FBRUtDLG1CQUFOLEdBQXlCO0FBQUE7O0FBQUE7QUFDckIsa0JBQU1DLFlBQVksT0FBSy9DLElBQUwsQ0FBVWdELFFBQVYsR0FBcUIsT0FBS2hELElBQUwsQ0FBVWdELFFBQVYsQ0FBbUJiLEtBQW5CLENBQXlCLEdBQXpCLENBQXJCLEdBQXFELEVBQXZFOztBQUVBLG1CQUFLbkMsSUFBTCxDQUFVZ0QsUUFBVixHQUFxQkQsVUFBVVgsR0FBVixDQUFjLG9CQUFZO0FBQzNDLHNCQUFNYSxpQkFBaUJELFNBQVNFLE9BQVQsQ0FBaUIsR0FBakIsQ0FBdkI7O0FBRUEsb0JBQUlELGlCQUFpQixDQUFyQixFQUNJLE9BQU8sRUFBRUUsTUFBTUgsUUFBUixFQUFQOztBQUVKLHNCQUFNRyxPQUFPSCxTQUFTSSxTQUFULENBQW1CLENBQW5CLEVBQXNCSCxjQUF0QixDQUFiO0FBQ0Esc0JBQU1JLE9BQU9MLFNBQVNJLFNBQVQsQ0FBbUJILGlCQUFpQixDQUFwQyxDQUFiOztBQUVBLHVCQUFPLEVBQUVFLElBQUYsRUFBUUUsSUFBUixFQUFQO0FBQ0gsYUFWb0IsQ0FBckI7QUFIcUI7QUFjeEI7O0FBRURDLHFCQUFrQjtBQUNkLGFBQUsxRCxHQUFMLEdBQVcsS0FBS0gsT0FBTCxDQUFha0QsSUFBYixDQUFrQlksS0FBbEIsQ0FBd0IsQ0FBeEIsQ0FBWDtBQUNIOztBQUVEQyx1QkFBb0I7QUFDaEIsYUFBS3hELElBQUwsQ0FBVXlELFlBQVYsR0FBeUIsS0FBS3pELElBQUwsQ0FBVTBELFlBQVYsS0FBMkIsSUFBM0IsR0FBa0MsS0FBSyxDQUF2QyxHQUEyQyxLQUFLMUQsSUFBTCxDQUFVMEQsWUFBOUU7QUFDSDs7QUFFSy9DLFNBQU4sQ0FBYWdELElBQWIsRUFBbUI7QUFBQTs7QUFBQTtBQUNmLG1CQUFLbEUsT0FBTCxDQUFha0IsS0FBYixDQUFtQmdELElBQW5COztBQUVBLG1CQUFLM0QsSUFBTCxHQUFZLE9BQUtQLE9BQUwsQ0FBYU8sSUFBYixFQUFaOztBQUVBO0FBQ0E7QUFDQSxnQkFBSSxPQUFLQSxJQUFMLENBQVUwRCxZQUFkLEVBQTRCO0FBQ3hCLHVCQUFLRixnQkFBTDtBQUNBO0FBQ0g7O0FBRUQsbUJBQUtyQyxzQkFBTDtBQUNBLG1CQUFLRyxxQkFBTDtBQUNBLG1CQUFLRSxzQkFBTDtBQUNBLG1CQUFLRSxxQkFBTDtBQUNBLG1CQUFLTixrQkFBTDtBQUNBLG1CQUFLUSxXQUFMO0FBQ0EsbUJBQUtLLFdBQUw7QUFDQSxtQkFBS1EsaUJBQUw7QUFDQSxtQkFBS1YsaUJBQUw7QUFDQSxtQkFBS3VCLGNBQUw7O0FBRUEsa0JBQU0sT0FBS1YsZ0JBQUwsRUFBTjtBQUNBLGtCQUFNLE9BQUtFLGVBQUwsRUFBTjtBQXhCZTtBQXlCbEI7QUEzTWtDO2tCQUFsQnhELGlCIiwiZmlsZSI6ImNsaS9hcmd1bWVudC1wYXJzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kIH0gZnJvbSAnY29tbWFuZGVyJztcbmltcG9ydCBkZWRlbnQgZnJvbSAnZGVkZW50JztcbmltcG9ydCB7IHJlYWRTeW5jIGFzIHJlYWQgfSBmcm9tICdyZWFkLWZpbGUtcmVsYXRpdmUnO1xuaW1wb3J0IHsgR2VuZXJhbEVycm9yIH0gZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUnO1xuaW1wb3J0IE1FU1NBR0UgZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUvbWVzc2FnZSc7XG5pbXBvcnQgeyBhc3NlcnRUeXBlLCBpcyB9IGZyb20gJy4uL2Vycm9ycy9ydW50aW1lL3R5cGUtYXNzZXJ0aW9ucyc7XG5pbXBvcnQgZ2V0Vmlld1BvcnRXaWR0aCBmcm9tICcuLi91dGlscy9nZXQtdmlld3BvcnQtd2lkdGgnO1xuaW1wb3J0IHsgd29yZFdyYXAsIHNwbGl0UXVvdGVkVGV4dCB9IGZyb20gJy4uL3V0aWxzL3N0cmluZyc7XG5pbXBvcnQgcGFyc2VTc2xPcHRpb25zIGZyb20gJy4uL3V0aWxzL3BhcnNlLXNzbC1vcHRpb25zJztcbmltcG9ydCBnZXRGaWx0ZXJGbiBmcm9tICcuLi91dGlscy9nZXQtZmlsdGVyLWZuJztcblxuY29uc3QgUkVNT1RFX0FMSUFTX1JFID0gL15yZW1vdGUoPzo6KFxcZCopKT8kLztcblxuY29uc3QgREVTQ1JJUFRJT04gPSBkZWRlbnQoYFxuICAgIEluIHRoZSBicm93c2VyIGxpc3QsIHlvdSBjYW4gdXNlIGJyb3dzZXIgbmFtZXMgKGUuZy4gXCJpZVwiLCBcImNocm9tZVwiLCBldGMuKSBhcyB3ZWxsIGFzIHBhdGhzIHRvIGV4ZWN1dGFibGVzLlxuXG4gICAgVG8gcnVuIHRlc3RzIGFnYWluc3QgYWxsIGluc3RhbGxlZCBicm93c2VycywgdXNlIHRoZSBcImFsbFwiIGFsaWFzLlxuXG4gICAgVG8gdXNlIGEgcmVtb3RlIGJyb3dzZXIgY29ubmVjdGlvbiAoZS5nLiwgdG8gY29ubmVjdCBhIG1vYmlsZSBkZXZpY2UpLCBzcGVjaWZ5IFwicmVtb3RlXCIgYXMgdGhlIGJyb3dzZXIgYWxpYXMuXG4gICAgSWYgeW91IG5lZWQgdG8gY29ubmVjdCBtdWx0aXBsZSBkZXZpY2VzLCBhZGQgYSBjb2xvbiBhbmQgdGhlIG51bWJlciBvZiBicm93c2VycyB5b3Ugd2FudCB0byBjb25uZWN0IChlLmcuLCBcInJlbW90ZTozXCIpLlxuXG4gICAgVG8gcnVuIHRlc3RzIGluIGEgYnJvd3NlciBhY2Nlc3NlZCB0aHJvdWdoIGEgYnJvd3NlciBwcm92aWRlciBwbHVnaW4sIHNwZWNpZnkgYSBicm93c2VyIGFsaWFzIHRoYXQgY29uc2lzdHMgb2YgdHdvIHBhcnRzIC0gdGhlIGJyb3dzZXIgcHJvdmlkZXIgbmFtZSBwcmVmaXggYW5kIHRoZSBuYW1lIG9mIHRoZSBicm93c2VyIGl0c2VsZjsgZm9yIGV4YW1wbGUsIFwic2F1Y2VsYWJzOmNocm9tZUA1MVwiLlxuXG4gICAgWW91IGNhbiB1c2Ugb25lIG9yIG1vcmUgZmlsZSBwYXRocyBvciBnbG9iIHBhdHRlcm5zIHRvIHNwZWNpZnkgd2hpY2ggdGVzdHMgdG8gcnVuLlxuXG4gICAgTW9yZSBpbmZvOiBodHRwczovL2RldmV4cHJlc3MuZ2l0aHViLmlvL3Rlc3RjYWZlL2RvY3VtZW50YXRpb25cbmApO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDTElBcmd1bWVudFBhcnNlciB7XG4gICAgY29uc3RydWN0b3IgKGN3ZCkge1xuICAgICAgICB0aGlzLnByb2dyYW0gPSBuZXcgQ29tbWFuZCgndGVzdGNhZmUnKTtcblxuICAgICAgICB0aGlzLmN3ZCA9IGN3ZCB8fCBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgICAgIHRoaXMuc3JjICAgICAgICAgPSBudWxsO1xuICAgICAgICB0aGlzLmJyb3dzZXJzICAgID0gbnVsbDtcbiAgICAgICAgdGhpcy5maWx0ZXIgICAgICA9IG51bGw7XG4gICAgICAgIHRoaXMucmVtb3RlQ291bnQgPSAwO1xuICAgICAgICB0aGlzLm9wdHMgICAgICAgID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9kZXNjcmliZVByb2dyYW0oKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX3BhcnNlUG9ydE51bWJlciAodmFsdWUpIHtcbiAgICAgICAgYXNzZXJ0VHlwZShpcy5ub25OZWdhdGl2ZU51bWJlclN0cmluZywgbnVsbCwgJ1BvcnQgbnVtYmVyJywgdmFsdWUpO1xuXG4gICAgICAgIHJldHVybiBwYXJzZUludCh2YWx1ZSwgMTApO1xuICAgIH1cblxuICAgIHN0YXRpYyBfZ2V0RGVzY3JpcHRpb24gKCkge1xuICAgICAgICAvLyBOT1RFOiBhZGQgZW1wdHkgbGluZSB0byB3b3JrYXJvdW5kIGNvbW1hbmRlci1mb3JjZWQgaW5kZW50YXRpb24gb24gdGhlIGZpcnN0IGxpbmUuXG4gICAgICAgIHJldHVybiAnXFxuJyArIHdvcmRXcmFwKERFU0NSSVBUSU9OLCAyLCBnZXRWaWV3UG9ydFdpZHRoKHByb2Nlc3Muc3Rkb3V0KSk7XG4gICAgfVxuXG4gICAgX2Rlc2NyaWJlUHJvZ3JhbSAoKSB7XG4gICAgICAgIGNvbnN0IHZlcnNpb24gPSBKU09OLnBhcnNlKHJlYWQoJy4uLy4uL3BhY2thZ2UuanNvbicpKS52ZXJzaW9uO1xuXG4gICAgICAgIHRoaXMucHJvZ3JhbVxuICAgICAgICAgICAgLnZlcnNpb24odmVyc2lvbiwgJy12LCAtLXZlcnNpb24nKVxuICAgICAgICAgICAgLnVzYWdlKCdbb3B0aW9uc10gPGNvbW1hLXNlcGFyYXRlZC1icm93c2VyLWxpc3Q+IDxmaWxlLW9yLWdsb2IgLi4uPicpXG4gICAgICAgICAgICAuZGVzY3JpcHRpb24oQ0xJQXJndW1lbnRQYXJzZXIuX2dldERlc2NyaXB0aW9uKCkpXG5cbiAgICAgICAgICAgIC5vcHRpb24oJy1iLCAtLWxpc3QtYnJvd3NlcnMgW3Byb3ZpZGVyXScsICdvdXRwdXQgdGhlIGFsaWFzZXMgZm9yIGxvY2FsIGJyb3dzZXJzIG9yIGJyb3dzZXJzIGF2YWlsYWJsZSB0aHJvdWdoIHRoZSBzcGVjaWZpZWQgYnJvd3NlciBwcm92aWRlcicpXG4gICAgICAgICAgICAub3B0aW9uKCctciwgLS1yZXBvcnRlciA8bmFtZVs6b3V0cHV0RmlsZV1bLC4uLl0+JywgJ3NwZWNpZnkgdGhlIHJlcG9ydGVycyBhbmQgb3B0aW9uYWxseSBmaWxlcyB3aGVyZSByZXBvcnRzIGFyZSBzYXZlZCcpXG4gICAgICAgICAgICAub3B0aW9uKCctcywgLS1zY3JlZW5zaG90cyA8cGF0aD4nLCAnZW5hYmxlIHNjcmVlbnNob3QgY2FwdHVyaW5nIGFuZCBzcGVjaWZ5IHRoZSBwYXRoIHRvIHNhdmUgdGhlIHNjcmVlbnNob3RzIHRvJylcbiAgICAgICAgICAgIC5vcHRpb24oJy1TLCAtLXNjcmVlbnNob3RzLW9uLWZhaWxzJywgJ3Rha2UgYSBzY3JlZW5zaG90IHdoZW5ldmVyIGEgdGVzdCBmYWlscycpXG4gICAgICAgICAgICAub3B0aW9uKCctcCwgLS1zY3JlZW5zaG90LXBhdGgtcGF0dGVybiA8cGF0dGVybj4nLCAndXNlIHBhdHRlcm5zIHRvIGNvbXBvc2Ugc2NyZWVuc2hvdCBmaWxlIG5hbWVzIGFuZCBwYXRoczogJHtCUk9XU0VSfSwgJHtCUk9XU0VSX1ZFUlNJT059LCAke09TfSwgZXRjLicpXG4gICAgICAgICAgICAub3B0aW9uKCctcSwgLS1xdWFyYW50aW5lLW1vZGUnLCAnZW5hYmxlIHRoZSBxdWFyYW50aW5lIG1vZGUnKVxuICAgICAgICAgICAgLm9wdGlvbignLWQsIC0tZGVidWctbW9kZScsICdleGVjdXRlIHRlc3Qgc3RlcHMgb25lIGJ5IG9uZSBwYXVzaW5nIHRoZSB0ZXN0IGFmdGVyIGVhY2ggc3RlcCcpXG4gICAgICAgICAgICAub3B0aW9uKCctZSwgLS1za2lwLWpzLWVycm9ycycsICdtYWtlIHRlc3RzIG5vdCBmYWlsIHdoZW4gYSBKUyBlcnJvciBoYXBwZW5zIG9uIGEgcGFnZScpXG4gICAgICAgICAgICAub3B0aW9uKCctdSwgLS1za2lwLXVuY2F1Z2h0LWVycm9ycycsICdpZ25vcmUgdW5jYXVnaHQgZXJyb3JzIGFuZCB1bmhhbmRsZWQgcHJvbWlzZSByZWplY3Rpb25zLCB3aGljaCBvY2N1ciBkdXJpbmcgdGVzdCBleGVjdXRpb24nKVxuICAgICAgICAgICAgLm9wdGlvbignLXQsIC0tdGVzdCA8bmFtZT4nLCAncnVuIG9ubHkgdGVzdHMgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWUnKVxuICAgICAgICAgICAgLm9wdGlvbignLVQsIC0tdGVzdC1ncmVwIDxwYXR0ZXJuPicsICdydW4gb25seSB0ZXN0cyBtYXRjaGluZyB0aGUgc3BlY2lmaWVkIHBhdHRlcm4nKVxuICAgICAgICAgICAgLm9wdGlvbignLWYsIC0tZml4dHVyZSA8bmFtZT4nLCAncnVuIG9ubHkgZml4dHVyZXMgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWUnKVxuICAgICAgICAgICAgLm9wdGlvbignLUYsIC0tZml4dHVyZS1ncmVwIDxwYXR0ZXJuPicsICdydW4gb25seSBmaXh0dXJlcyBtYXRjaGluZyB0aGUgc3BlY2lmaWVkIHBhdHRlcm4nKVxuICAgICAgICAgICAgLm9wdGlvbignLWEsIC0tYXBwIDxjb21tYW5kPicsICdsYXVuY2ggdGhlIHRlc3RlZCBhcHAgdXNpbmcgdGhlIHNwZWNpZmllZCBjb21tYW5kIGJlZm9yZSBydW5uaW5nIHRlc3RzJylcbiAgICAgICAgICAgIC5vcHRpb24oJy1jLCAtLWNvbmN1cnJlbmN5IDxudW1iZXI+JywgJ3J1biB0ZXN0cyBjb25jdXJyZW50bHknKVxuICAgICAgICAgICAgLm9wdGlvbignLUwsIC0tbGl2ZScsICdlbmFibGUgbGl2ZSBtb2RlLiBJbiB0aGlzIG1vZGUsIFRlc3RDYWZlIHdhdGNoZXMgZm9yIGNoYW5nZXMgeW91IG1ha2UgaW4gdGhlIHRlc3QgZmlsZXMuIFRoZXNlIGNoYW5nZXMgaW1tZWRpYXRlbHkgcmVzdGFydCB0aGUgdGVzdHMgc28gdGhhdCB5b3UgY2FuIHNlZSB0aGUgZWZmZWN0LicpXG4gICAgICAgICAgICAub3B0aW9uKCctLXRlc3QtbWV0YSA8a2V5PXZhbHVlWyxrZXkyPXZhbHVlMiwuLi5dPicsICdydW4gb25seSB0ZXN0cyB3aXRoIG1hdGNoaW5nIG1ldGFkYXRhJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tZml4dHVyZS1tZXRhIDxrZXk9dmFsdWVbLGtleTI9dmFsdWUyLC4uLl0+JywgJ3J1biBvbmx5IGZpeHR1cmVzIHdpdGggbWF0Y2hpbmcgbWV0YWRhdGEnKVxuICAgICAgICAgICAgLm9wdGlvbignLS1kZWJ1Zy1vbi1mYWlsJywgJ3BhdXNlIHRoZSB0ZXN0IGlmIGl0IGZhaWxzJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tYXBwLWluaXQtZGVsYXkgPG1zPicsICdzcGVjaWZ5IGhvdyBtdWNoIHRpbWUgaXQgdGFrZXMgZm9yIHRoZSB0ZXN0ZWQgYXBwIHRvIGluaXRpYWxpemUnKVxuICAgICAgICAgICAgLm9wdGlvbignLS1zZWxlY3Rvci10aW1lb3V0IDxtcz4nLCAnc2V0IHRoZSBhbW91bnQgb2YgdGltZSB3aXRoaW4gd2hpY2ggc2VsZWN0b3JzIG1ha2UgYXR0ZW1wdHMgdG8gb2J0YWluIGEgbm9kZSB0byBiZSByZXR1cm5lZCcpXG4gICAgICAgICAgICAub3B0aW9uKCctLWFzc2VydGlvbi10aW1lb3V0IDxtcz4nLCAnc2V0IHRoZSBhbW91bnQgb2YgdGltZSB3aXRoaW4gd2hpY2ggYXNzZXJ0aW9uIHNob3VsZCBwYXNzJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tcGFnZS1sb2FkLXRpbWVvdXQgPG1zPicsICdzZXQgdGhlIGFtb3VudCBvZiB0aW1lIHdpdGhpbiB3aGljaCBUZXN0Q2FmZSB3YWl0cyBmb3IgdGhlIGB3aW5kb3cubG9hZGAgZXZlbnQgdG8gZmlyZSBvbiBwYWdlIGxvYWQgYmVmb3JlIHByb2NlZWRpbmcgdG8gdGhlIG5leHQgdGVzdCBhY3Rpb24nKVxuICAgICAgICAgICAgLm9wdGlvbignLS1zcGVlZCA8ZmFjdG9yPicsICdzZXQgdGhlIHNwZWVkIG9mIHRlc3QgZXhlY3V0aW9uICgwLjAxIC4uLiAxKScpXG4gICAgICAgICAgICAub3B0aW9uKCctLXBvcnRzIDxwb3J0MSxwb3J0Mj4nLCAnc3BlY2lmeSBjdXN0b20gcG9ydCBudW1iZXJzJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0taG9zdG5hbWUgPG5hbWU+JywgJ3NwZWNpZnkgdGhlIGhvc3RuYW1lJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tcHJveHkgPGhvc3Q+JywgJ3NwZWNpZnkgdGhlIGhvc3Qgb2YgdGhlIHByb3h5IHNlcnZlcicpXG4gICAgICAgICAgICAub3B0aW9uKCctLXByb3h5LWJ5cGFzcyA8cnVsZXM+JywgJ3NwZWNpZnkgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBydWxlcyB0aGF0IGRlZmluZSBVUkxzIGFjY2Vzc2VkIGJ5cGFzc2luZyB0aGUgcHJveHkgc2VydmVyJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tc3NsIDxvcHRpb25zPicsICdzcGVjaWZ5IFNTTCBvcHRpb25zIHRvIHJ1biBUZXN0Q2FmZSBwcm94eSBzZXJ2ZXIgb3ZlciB0aGUgSFRUUFMgcHJvdG9jb2wnKVxuICAgICAgICAgICAgLm9wdGlvbignLS1kaXNhYmxlLXBhZ2UtcmVsb2FkcycsICdkaXNhYmxlIHBhZ2UgcmVsb2FkcyBiZXR3ZWVuIHRlc3RzJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tZGV2JywgJ2VuYWJsZXMgbWVjaGFuaXNtcyB0byBsb2cgYW5kIGRpYWdub3NlIGVycm9ycycpXG4gICAgICAgICAgICAub3B0aW9uKCctLXFyLWNvZGUnLCAnb3V0cHV0cyBRUi1jb2RlIHRoYXQgcmVwZWF0cyBVUkxzIHVzZWQgdG8gY29ubmVjdCB0aGUgcmVtb3RlIGJyb3dzZXJzJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tc2YsIC0tc3RvcC1vbi1maXJzdC1mYWlsJywgJ3N0b3AgYW4gZW50aXJlIHRlc3QgcnVuIGlmIGFueSB0ZXN0IGZhaWxzJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tZGlzYWJsZS10ZXN0LXN5bnRheC12YWxpZGF0aW9uJywgJ2Rpc2FibGVzIGNoZWNrcyBmb3IgXFwndGVzdFxcJyBhbmQgXFwnZml4dHVyZVxcJyBkaXJlY3RpdmVzIHRvIHJ1biBkeW5hbWljYWxseSBsb2FkZWQgdGVzdHMnKVxuXG4gICAgICAgICAgICAvLyBOT1RFOiB0aGVzZSBvcHRpb25zIHdpbGwgYmUgaGFuZGxlZCBieSBjaGFsayBpbnRlcm5hbGx5XG4gICAgICAgICAgICAub3B0aW9uKCctLWNvbG9yJywgJ2ZvcmNlIGNvbG9ycyBpbiBjb21tYW5kIGxpbmUnKVxuICAgICAgICAgICAgLm9wdGlvbignLS1uby1jb2xvcicsICdkaXNhYmxlIGNvbG9ycyBpbiBjb21tYW5kIGxpbmUnKTtcbiAgICB9XG5cbiAgICBfZmlsdGVyQW5kQ291bnRSZW1vdGVzIChicm93c2VyKSB7XG4gICAgICAgIGNvbnN0IHJlbW90ZU1hdGNoID0gYnJvd3Nlci5tYXRjaChSRU1PVEVfQUxJQVNfUkUpO1xuXG4gICAgICAgIGlmIChyZW1vdGVNYXRjaCkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVDb3VudCArPSBwYXJzZUludChyZW1vdGVNYXRjaFsxXSwgMTApIHx8IDE7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBfcGFyc2VGaWx0ZXJpbmdPcHRpb25zICgpIHtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBnZXRGaWx0ZXJGbih0aGlzLm9wdHMpO1xuICAgIH1cblxuICAgIF9wYXJzZUFwcEluaXREZWxheSAoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuYXBwSW5pdERlbGF5KSB7XG4gICAgICAgICAgICBhc3NlcnRUeXBlKGlzLm5vbk5lZ2F0aXZlTnVtYmVyU3RyaW5nLCBudWxsLCAnVGVzdGVkIGFwcCBpbml0aWFsaXphdGlvbiBkZWxheScsIHRoaXMub3B0cy5hcHBJbml0RGVsYXkpO1xuXG4gICAgICAgICAgICB0aGlzLm9wdHMuYXBwSW5pdERlbGF5ID0gcGFyc2VJbnQodGhpcy5vcHRzLmFwcEluaXREZWxheSwgMTApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3BhcnNlU2VsZWN0b3JUaW1lb3V0ICgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5zZWxlY3RvclRpbWVvdXQpIHtcbiAgICAgICAgICAgIGFzc2VydFR5cGUoaXMubm9uTmVnYXRpdmVOdW1iZXJTdHJpbmcsIG51bGwsICdTZWxlY3RvciB0aW1lb3V0JywgdGhpcy5vcHRzLnNlbGVjdG9yVGltZW91dCk7XG5cbiAgICAgICAgICAgIHRoaXMub3B0cy5zZWxlY3RvclRpbWVvdXQgPSBwYXJzZUludCh0aGlzLm9wdHMuc2VsZWN0b3JUaW1lb3V0LCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfcGFyc2VBc3NlcnRpb25UaW1lb3V0ICgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5hc3NlcnRpb25UaW1lb3V0KSB7XG4gICAgICAgICAgICBhc3NlcnRUeXBlKGlzLm5vbk5lZ2F0aXZlTnVtYmVyU3RyaW5nLCBudWxsLCAnQXNzZXJ0aW9uIHRpbWVvdXQnLCB0aGlzLm9wdHMuYXNzZXJ0aW9uVGltZW91dCk7XG5cbiAgICAgICAgICAgIHRoaXMub3B0cy5hc3NlcnRpb25UaW1lb3V0ID0gcGFyc2VJbnQodGhpcy5vcHRzLmFzc2VydGlvblRpbWVvdXQsIDEwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9wYXJzZVBhZ2VMb2FkVGltZW91dCAoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMucGFnZUxvYWRUaW1lb3V0KSB7XG4gICAgICAgICAgICBhc3NlcnRUeXBlKGlzLm5vbk5lZ2F0aXZlTnVtYmVyU3RyaW5nLCBudWxsLCAnUGFnZSBsb2FkIHRpbWVvdXQnLCB0aGlzLm9wdHMucGFnZUxvYWRUaW1lb3V0KTtcblxuICAgICAgICAgICAgdGhpcy5vcHRzLnBhZ2VMb2FkVGltZW91dCA9IHBhcnNlSW50KHRoaXMub3B0cy5wYWdlTG9hZFRpbWVvdXQsIDEwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9wYXJzZVNwZWVkICgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5zcGVlZClcbiAgICAgICAgICAgIHRoaXMub3B0cy5zcGVlZCA9IHBhcnNlRmxvYXQodGhpcy5vcHRzLnNwZWVkKTtcbiAgICB9XG5cbiAgICBfcGFyc2VDb25jdXJyZW5jeSAoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuY29uY3VycmVuY3kpXG4gICAgICAgICAgICB0aGlzLm9wdHMuY29uY3VycmVuY3kgPSBwYXJzZUludCh0aGlzLm9wdHMuY29uY3VycmVuY3ksIDEwKTtcbiAgICB9XG5cbiAgICBfcGFyc2VQb3J0cyAoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMucG9ydHMpIHtcbiAgICAgICAgICAgIHRoaXMub3B0cy5wb3J0cyA9IHRoaXMub3B0cy5wb3J0c1xuICAgICAgICAgICAgICAgIC5zcGxpdCgnLCcpXG4gICAgICAgICAgICAgICAgLm1hcChDTElBcmd1bWVudFBhcnNlci5fcGFyc2VQb3J0TnVtYmVyKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5wb3J0cy5sZW5ndGggPCAyKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoTUVTU0FHRS5wb3J0c09wdGlvblJlcXVpcmVzVHdvTnVtYmVycyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfcGFyc2VCcm93c2VyTGlzdCAoKSB7XG4gICAgICAgIGNvbnN0IGJyb3dzZXJzQXJnID0gdGhpcy5wcm9ncmFtLmFyZ3NbMF0gfHwgJyc7XG5cbiAgICAgICAgdGhpcy5icm93c2VycyA9IHNwbGl0UXVvdGVkVGV4dChicm93c2Vyc0FyZywgJywnKVxuICAgICAgICAgICAgLmZpbHRlcihicm93c2VyID0+IGJyb3dzZXIgJiYgdGhpcy5fZmlsdGVyQW5kQ291bnRSZW1vdGVzKGJyb3dzZXIpKTtcbiAgICB9XG5cbiAgICBhc3luYyBfcGFyc2VTc2xPcHRpb25zICgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5zc2wpXG4gICAgICAgICAgICB0aGlzLm9wdHMuc3NsID0gYXdhaXQgcGFyc2VTc2xPcHRpb25zKHRoaXMub3B0cy5zc2wpO1xuICAgIH1cblxuICAgIGFzeW5jIF9wYXJzZVJlcG9ydGVycyAoKSB7XG4gICAgICAgIGNvbnN0IHJlcG9ydGVycyA9IHRoaXMub3B0cy5yZXBvcnRlciA/IHRoaXMub3B0cy5yZXBvcnRlci5zcGxpdCgnLCcpIDogW107XG5cbiAgICAgICAgdGhpcy5vcHRzLnJlcG9ydGVyID0gcmVwb3J0ZXJzLm1hcChyZXBvcnRlciA9PiB7XG4gICAgICAgICAgICBjb25zdCBzZXBhcmF0b3JJbmRleCA9IHJlcG9ydGVyLmluZGV4T2YoJzonKTtcblxuICAgICAgICAgICAgaWYgKHNlcGFyYXRvckluZGV4IDwgMClcbiAgICAgICAgICAgICAgICByZXR1cm4geyBuYW1lOiByZXBvcnRlciB9O1xuXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gcmVwb3J0ZXIuc3Vic3RyaW5nKDAsIHNlcGFyYXRvckluZGV4KTtcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSByZXBvcnRlci5zdWJzdHJpbmcoc2VwYXJhdG9ySW5kZXggKyAxKTtcblxuICAgICAgICAgICAgcmV0dXJuIHsgbmFtZSwgZmlsZSB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfcGFyc2VGaWxlTGlzdCAoKSB7XG4gICAgICAgIHRoaXMuc3JjID0gdGhpcy5wcm9ncmFtLmFyZ3Muc2xpY2UoMSk7XG4gICAgfVxuXG4gICAgX2dldFByb3ZpZGVyTmFtZSAoKSB7XG4gICAgICAgIHRoaXMub3B0cy5wcm92aWRlck5hbWUgPSB0aGlzLm9wdHMubGlzdEJyb3dzZXJzID09PSB0cnVlID8gdm9pZCAwIDogdGhpcy5vcHRzLmxpc3RCcm93c2VycztcbiAgICB9XG5cbiAgICBhc3luYyBwYXJzZSAoYXJndikge1xuICAgICAgICB0aGlzLnByb2dyYW0ucGFyc2UoYXJndik7XG5cbiAgICAgICAgdGhpcy5vcHRzID0gdGhpcy5wcm9ncmFtLm9wdHMoKTtcblxuICAgICAgICAvLyBOT1RFOiB0aGUgJy1saXN0LWJyb3dzZXJzJyBvcHRpb24gb25seSBsaXN0cyBicm93c2VycyBhbmQgaW1tZWRpYXRlbHkgZXhpdHMgdGhlIGFwcC5cbiAgICAgICAgLy8gVGhlcmVmb3JlLCB3ZSBkb24ndCBuZWVkIHRvIHByb2Nlc3Mgb3RoZXIgYXJndW1lbnRzLlxuICAgICAgICBpZiAodGhpcy5vcHRzLmxpc3RCcm93c2Vycykge1xuICAgICAgICAgICAgdGhpcy5fZ2V0UHJvdmlkZXJOYW1lKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9wYXJzZUZpbHRlcmluZ09wdGlvbnMoKTtcbiAgICAgICAgdGhpcy5fcGFyc2VTZWxlY3RvclRpbWVvdXQoKTtcbiAgICAgICAgdGhpcy5fcGFyc2VBc3NlcnRpb25UaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuX3BhcnNlUGFnZUxvYWRUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuX3BhcnNlQXBwSW5pdERlbGF5KCk7XG4gICAgICAgIHRoaXMuX3BhcnNlU3BlZWQoKTtcbiAgICAgICAgdGhpcy5fcGFyc2VQb3J0cygpO1xuICAgICAgICB0aGlzLl9wYXJzZUJyb3dzZXJMaXN0KCk7XG4gICAgICAgIHRoaXMuX3BhcnNlQ29uY3VycmVuY3koKTtcbiAgICAgICAgdGhpcy5fcGFyc2VGaWxlTGlzdCgpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX3BhcnNlU3NsT3B0aW9ucygpO1xuICAgICAgICBhd2FpdCB0aGlzLl9wYXJzZVJlcG9ydGVycygpO1xuICAgIH1cbn1cbiJdfQ==
