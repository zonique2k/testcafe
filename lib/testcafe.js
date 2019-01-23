'use strict';

exports.__esModule = true;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _runtime = require('./errors/runtime');

var _message = require('./errors/runtime/message');

var _message2 = _interopRequireDefault(_message);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const lazyRequire = require('import-lazy')(require);
const sourceMapSupport = lazyRequire('source-map-support');
const hammerhead = lazyRequire('testcafe-hammerhead');
const loadAssets = lazyRequire('./load-assets');
const errorHandlers = lazyRequire('./utils/handle-errors');
const BrowserConnectionGateway = lazyRequire('./browser/connection/gateway');
const BrowserConnection = lazyRequire('./browser/connection');
const browserProviderPool = lazyRequire('./browser/provider/pool');
const Runner = lazyRequire('./runner');
const LiveModeRunner = lazyRequire('./live/test-runner');

// NOTE: CoffeeScript can't be loaded lazily, because it will break stack traces
require('coffeescript');

class TestCafe {
    constructor(configuration) {
        this._setupSourceMapsSupport();
        errorHandlers.registerErrorHandlers();

        var _configuration$startO = configuration.startOptions;
        const hostname = _configuration$startO.hostname,
              port1 = _configuration$startO.port1,
              port2 = _configuration$startO.port2,
              options = _configuration$startO.options;


        this.closed = false;
        this.proxy = new hammerhead.Proxy(hostname, port1, port2, options);
        this.browserConnectionGateway = new BrowserConnectionGateway(this.proxy, { retryTestPages: configuration.getOption('retryTestPages') });
        this.runners = [];
        this.configuration = configuration;

        this._registerAssets(options.developmentMode);
    }

    _registerAssets(developmentMode) {
        var _loadAssets = loadAssets(developmentMode);

        const favIcon = _loadAssets.favIcon,
              coreScript = _loadAssets.coreScript,
              driverScript = _loadAssets.driverScript,
              uiScript = _loadAssets.uiScript,
              uiStyle = _loadAssets.uiStyle,
              uiSprite = _loadAssets.uiSprite,
              automationScript = _loadAssets.automationScript,
              legacyRunnerScript = _loadAssets.legacyRunnerScript;


        this.proxy.GET('/testcafe-core.js', { content: coreScript, contentType: 'application/x-javascript' });
        this.proxy.GET('/testcafe-driver.js', { content: driverScript, contentType: 'application/x-javascript' });

        this.proxy.GET('/testcafe-legacy-runner.js', {
            content: legacyRunnerScript,
            contentType: 'application/x-javascript'
        });

        this.proxy.GET('/testcafe-automation.js', { content: automationScript, contentType: 'application/x-javascript' });
        this.proxy.GET('/testcafe-ui.js', { content: uiScript, contentType: 'application/x-javascript' });
        this.proxy.GET('/testcafe-ui-sprite.png', { content: uiSprite, contentType: 'image/png' });
        this.proxy.GET('/favicon.ico', { content: favIcon, contentType: 'image/x-icon' });

        this.proxy.GET('/testcafe-ui-styles.css', {
            content: uiStyle,
            contentType: 'text/css',
            isShadowUIStylesheet: true
        });
    }

    _setupSourceMapsSupport() {
        sourceMapSupport.install({
            hookRequire: true,
            handleUncaughtExceptions: false,
            environment: 'node'
        });
    }

    _createRunner(isLiveMode) {
        const Ctor = isLiveMode ? LiveModeRunner : Runner;
        const newRunner = new Ctor(this.proxy, this.browserConnectionGateway, this.configuration.clone());

        this.runners.push(newRunner);

        return newRunner;
    }

    // API
    createBrowserConnection() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const browserInfo = yield browserProviderPool.getBrowserInfo('remote');

            return new BrowserConnection(_this.browserConnectionGateway, browserInfo, true);
        })();
    }

    createRunner() {
        return this._createRunner(false);
    }

    createLiveModeRunner() {
        if (this.runners.some(runner => runner instanceof LiveModeRunner)) throw new _runtime.GeneralError(_message2.default.cannotCreateMultipleLiveModeRunners);

        return this._createRunner(true);
    }

    close() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (_this2.closed) return;

            _this2.closed = true;

            yield _pinkie2.default.all(_this2.runners.map(function (runner) {
                return runner.stop();
            }));

            yield browserProviderPool.dispose();

            _this2.browserConnectionGateway.close();
            _this2.proxy.close();
        })();
    }
}
exports.default = TestCafe;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90ZXN0Y2FmZS5qcyJdLCJuYW1lcyI6WyJsYXp5UmVxdWlyZSIsInJlcXVpcmUiLCJzb3VyY2VNYXBTdXBwb3J0IiwiaGFtbWVyaGVhZCIsImxvYWRBc3NldHMiLCJlcnJvckhhbmRsZXJzIiwiQnJvd3NlckNvbm5lY3Rpb25HYXRld2F5IiwiQnJvd3NlckNvbm5lY3Rpb24iLCJicm93c2VyUHJvdmlkZXJQb29sIiwiUnVubmVyIiwiTGl2ZU1vZGVSdW5uZXIiLCJUZXN0Q2FmZSIsImNvbnN0cnVjdG9yIiwiY29uZmlndXJhdGlvbiIsIl9zZXR1cFNvdXJjZU1hcHNTdXBwb3J0IiwicmVnaXN0ZXJFcnJvckhhbmRsZXJzIiwic3RhcnRPcHRpb25zIiwiaG9zdG5hbWUiLCJwb3J0MSIsInBvcnQyIiwib3B0aW9ucyIsImNsb3NlZCIsInByb3h5IiwiUHJveHkiLCJicm93c2VyQ29ubmVjdGlvbkdhdGV3YXkiLCJyZXRyeVRlc3RQYWdlcyIsImdldE9wdGlvbiIsInJ1bm5lcnMiLCJfcmVnaXN0ZXJBc3NldHMiLCJkZXZlbG9wbWVudE1vZGUiLCJmYXZJY29uIiwiY29yZVNjcmlwdCIsImRyaXZlclNjcmlwdCIsInVpU2NyaXB0IiwidWlTdHlsZSIsInVpU3ByaXRlIiwiYXV0b21hdGlvblNjcmlwdCIsImxlZ2FjeVJ1bm5lclNjcmlwdCIsIkdFVCIsImNvbnRlbnQiLCJjb250ZW50VHlwZSIsImlzU2hhZG93VUlTdHlsZXNoZWV0IiwiaW5zdGFsbCIsImhvb2tSZXF1aXJlIiwiaGFuZGxlVW5jYXVnaHRFeGNlcHRpb25zIiwiZW52aXJvbm1lbnQiLCJfY3JlYXRlUnVubmVyIiwiaXNMaXZlTW9kZSIsIkN0b3IiLCJuZXdSdW5uZXIiLCJjbG9uZSIsInB1c2giLCJjcmVhdGVCcm93c2VyQ29ubmVjdGlvbiIsImJyb3dzZXJJbmZvIiwiZ2V0QnJvd3NlckluZm8iLCJjcmVhdGVSdW5uZXIiLCJjcmVhdGVMaXZlTW9kZVJ1bm5lciIsInNvbWUiLCJydW5uZXIiLCJHZW5lcmFsRXJyb3IiLCJNRVNTQUdFIiwiY2Fubm90Q3JlYXRlTXVsdGlwbGVMaXZlTW9kZVJ1bm5lcnMiLCJjbG9zZSIsIlByb21pc2UiLCJhbGwiLCJtYXAiLCJzdG9wIiwiZGlzcG9zZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOzs7Ozs7QUFFQSxNQUFNQSxjQUEyQkMsUUFBUSxhQUFSLEVBQXVCQSxPQUF2QixDQUFqQztBQUNBLE1BQU1DLG1CQUEyQkYsWUFBWSxvQkFBWixDQUFqQztBQUNBLE1BQU1HLGFBQTJCSCxZQUFZLHFCQUFaLENBQWpDO0FBQ0EsTUFBTUksYUFBMkJKLFlBQVksZUFBWixDQUFqQztBQUNBLE1BQU1LLGdCQUEyQkwsWUFBWSx1QkFBWixDQUFqQztBQUNBLE1BQU1NLDJCQUEyQk4sWUFBWSw4QkFBWixDQUFqQztBQUNBLE1BQU1PLG9CQUEyQlAsWUFBWSxzQkFBWixDQUFqQztBQUNBLE1BQU1RLHNCQUEyQlIsWUFBWSx5QkFBWixDQUFqQztBQUNBLE1BQU1TLFNBQTJCVCxZQUFZLFVBQVosQ0FBakM7QUFDQSxNQUFNVSxpQkFBMkJWLFlBQVksb0JBQVosQ0FBakM7O0FBRUE7QUFDQUMsUUFBUSxjQUFSOztBQUVlLE1BQU1VLFFBQU4sQ0FBZTtBQUMxQkMsZ0JBQWFDLGFBQWIsRUFBNEI7QUFDeEIsYUFBS0MsdUJBQUw7QUFDQVQsc0JBQWNVLHFCQUFkOztBQUZ3QixvQ0FJb0JGLGNBQWNHLFlBSmxDO0FBQUEsY0FJaEJDLFFBSmdCLHlCQUloQkEsUUFKZ0I7QUFBQSxjQUlOQyxLQUpNLHlCQUlOQSxLQUpNO0FBQUEsY0FJQ0MsS0FKRCx5QkFJQ0EsS0FKRDtBQUFBLGNBSVFDLE9BSlIseUJBSVFBLE9BSlI7OztBQU14QixhQUFLQyxNQUFMLEdBQWdDLEtBQWhDO0FBQ0EsYUFBS0MsS0FBTCxHQUFnQyxJQUFJbkIsV0FBV29CLEtBQWYsQ0FBcUJOLFFBQXJCLEVBQStCQyxLQUEvQixFQUFzQ0MsS0FBdEMsRUFBNkNDLE9BQTdD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O0FBQ1osZUFBTyxLQUFLVCxhQUFMLENBQW1CLEtBQW5CLENBQVA7QUFDSDs7QUFFRFUsMkJBQXdCO0FBQ3BCLFlBQUksS0FBSzdCLE9BQUwsQ0FBYThCLElBQWIsQ0FBa0JDLFVBQVVBLGtCQUFrQmhELGNBQTlDLENBQUosRUFDSSxNQUFNLElBQUlpRCxxQkFBSixDQUFpQkMsa0JBQVFDLG1DQUF6QixDQUFOOztBQUVKLGVBQU8sS0FBS2YsYUFBTCxDQUFtQixJQUFuQixDQUFQO0FBQ0g7O0FBRUtnQixTQUFOLEdBQWU7QUFBQTs7QUFBQTtBQUNYLGdCQUFJLE9BQUt6QyxNQUFULEVBQ0k7O0FBRUosbUJBQUtBLE1BQUwsR0FBYyxJQUFkOztBQUVBLGtCQUFNMEMsaUJBQVFDLEdBQVIsQ0FBWSxPQUFLckMsT0FBTCxDQUFhc0MsR0FBYixDQUFpQjtBQUFBLHVCQUFVUCxPQUFPUSxJQUFQLEVBQVY7QUFBQSxhQUFqQixDQUFaLENBQU47O0FBRUEsa0JBQU0xRCxvQkFBb0IyRCxPQUFwQixFQUFOOztBQUVBLG1CQUFLM0Msd0JBQUwsQ0FBOEJzQyxLQUE5QjtBQUNBLG1CQUFLeEMsS0FBTCxDQUFXd0MsS0FBWDtBQVhXO0FBWWQ7QUF2RnlCO2tCQUFUbkQsUSIsImZpbGUiOiJ0ZXN0Y2FmZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQcm9taXNlIGZyb20gJ3BpbmtpZSc7XG5pbXBvcnQgeyBHZW5lcmFsRXJyb3IgfSBmcm9tICcuL2Vycm9ycy9ydW50aW1lJztcbmltcG9ydCBNRVNTQUdFIGZyb20gJy4vZXJyb3JzL3J1bnRpbWUvbWVzc2FnZSc7XG5cbmNvbnN0IGxhenlSZXF1aXJlICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2ltcG9ydC1sYXp5JykocmVxdWlyZSk7XG5jb25zdCBzb3VyY2VNYXBTdXBwb3J0ICAgICAgICAgPSBsYXp5UmVxdWlyZSgnc291cmNlLW1hcC1zdXBwb3J0Jyk7XG5jb25zdCBoYW1tZXJoZWFkICAgICAgICAgICAgICAgPSBsYXp5UmVxdWlyZSgndGVzdGNhZmUtaGFtbWVyaGVhZCcpO1xuY29uc3QgbG9hZEFzc2V0cyAgICAgICAgICAgICAgID0gbGF6eVJlcXVpcmUoJy4vbG9hZC1hc3NldHMnKTtcbmNvbnN0IGVycm9ySGFuZGxlcnMgICAgICAgICAgICA9IGxhenlSZXF1aXJlKCcuL3V0aWxzL2hhbmRsZS1lcnJvcnMnKTtcbmNvbnN0IEJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSA9IGxhenlSZXF1aXJlKCcuL2Jyb3dzZXIvY29ubmVjdGlvbi9nYXRld2F5Jyk7XG5jb25zdCBCcm93c2VyQ29ubmVjdGlvbiAgICAgICAgPSBsYXp5UmVxdWlyZSgnLi9icm93c2VyL2Nvbm5lY3Rpb24nKTtcbmNvbnN0IGJyb3dzZXJQcm92aWRlclBvb2wgICAgICA9IGxhenlSZXF1aXJlKCcuL2Jyb3dzZXIvcHJvdmlkZXIvcG9vbCcpO1xuY29uc3QgUnVubmVyICAgICAgICAgICAgICAgICAgID0gbGF6eVJlcXVpcmUoJy4vcnVubmVyJyk7XG5jb25zdCBMaXZlTW9kZVJ1bm5lciAgICAgICAgICAgPSBsYXp5UmVxdWlyZSgnLi9saXZlL3Rlc3QtcnVubmVyJyk7XG5cbi8vIE5PVEU6IENvZmZlZVNjcmlwdCBjYW4ndCBiZSBsb2FkZWQgbGF6aWx5LCBiZWNhdXNlIGl0IHdpbGwgYnJlYWsgc3RhY2sgdHJhY2VzXG5yZXF1aXJlKCdjb2ZmZWVzY3JpcHQnKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGVzdENhZmUge1xuICAgIGNvbnN0cnVjdG9yIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHRoaXMuX3NldHVwU291cmNlTWFwc1N1cHBvcnQoKTtcbiAgICAgICAgZXJyb3JIYW5kbGVycy5yZWdpc3RlckVycm9ySGFuZGxlcnMoKTtcblxuICAgICAgICBjb25zdCB7IGhvc3RuYW1lLCBwb3J0MSwgcG9ydDIsIG9wdGlvbnMgfSA9IGNvbmZpZ3VyYXRpb24uc3RhcnRPcHRpb25zO1xuXG4gICAgICAgIHRoaXMuY2xvc2VkICAgICAgICAgICAgICAgICAgID0gZmFsc2U7XG4gICAgICAgIHRoaXMucHJveHkgICAgICAgICAgICAgICAgICAgID0gbmV3IGhhbW1lcmhlYWQuUHJveHkoaG9zdG5hbWUsIHBvcnQxLCBwb3J0Miwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5ID0gbmV3IEJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSh0aGlzLnByb3h5LCB7IHJldHJ5VGVzdFBhZ2VzOiBjb25maWd1cmF0aW9uLmdldE9wdGlvbigncmV0cnlUZXN0UGFnZXMnKSB9KTtcbiAgICAgICAgdGhpcy5ydW5uZXJzICAgICAgICAgICAgICAgICAgPSBbXTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uICAgICAgICAgICAgPSBjb25maWd1cmF0aW9uO1xuXG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyQXNzZXRzKG9wdGlvbnMuZGV2ZWxvcG1lbnRNb2RlKTtcbiAgICB9XG5cbiAgICBfcmVnaXN0ZXJBc3NldHMgKGRldmVsb3BtZW50TW9kZSkge1xuICAgICAgICBjb25zdCB7IGZhdkljb24sIGNvcmVTY3JpcHQsIGRyaXZlclNjcmlwdCwgdWlTY3JpcHQsXG4gICAgICAgICAgICB1aVN0eWxlLCB1aVNwcml0ZSwgYXV0b21hdGlvblNjcmlwdCwgbGVnYWN5UnVubmVyU2NyaXB0IH0gPSBsb2FkQXNzZXRzKGRldmVsb3BtZW50TW9kZSk7XG5cbiAgICAgICAgdGhpcy5wcm94eS5HRVQoJy90ZXN0Y2FmZS1jb3JlLmpzJywgeyBjb250ZW50OiBjb3JlU2NyaXB0LCBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL3gtamF2YXNjcmlwdCcgfSk7XG4gICAgICAgIHRoaXMucHJveHkuR0VUKCcvdGVzdGNhZmUtZHJpdmVyLmpzJywgeyBjb250ZW50OiBkcml2ZXJTY3JpcHQsIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24veC1qYXZhc2NyaXB0JyB9KTtcblxuICAgICAgICB0aGlzLnByb3h5LkdFVCgnL3Rlc3RjYWZlLWxlZ2FjeS1ydW5uZXIuanMnLCB7XG4gICAgICAgICAgICBjb250ZW50OiAgICAgbGVnYWN5UnVubmVyU2NyaXB0LFxuICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi94LWphdmFzY3JpcHQnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucHJveHkuR0VUKCcvdGVzdGNhZmUtYXV0b21hdGlvbi5qcycsIHsgY29udGVudDogYXV0b21hdGlvblNjcmlwdCwgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi94LWphdmFzY3JpcHQnIH0pO1xuICAgICAgICB0aGlzLnByb3h5LkdFVCgnL3Rlc3RjYWZlLXVpLmpzJywgeyBjb250ZW50OiB1aVNjcmlwdCwgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi94LWphdmFzY3JpcHQnIH0pO1xuICAgICAgICB0aGlzLnByb3h5LkdFVCgnL3Rlc3RjYWZlLXVpLXNwcml0ZS5wbmcnLCB7IGNvbnRlbnQ6IHVpU3ByaXRlLCBjb250ZW50VHlwZTogJ2ltYWdlL3BuZycgfSk7XG4gICAgICAgIHRoaXMucHJveHkuR0VUKCcvZmF2aWNvbi5pY28nLCB7IGNvbnRlbnQ6IGZhdkljb24sIGNvbnRlbnRUeXBlOiAnaW1hZ2UveC1pY29uJyB9KTtcblxuICAgICAgICB0aGlzLnByb3h5LkdFVCgnL3Rlc3RjYWZlLXVpLXN0eWxlcy5jc3MnLCB7XG4gICAgICAgICAgICBjb250ZW50OiAgICAgICAgICAgICAgdWlTdHlsZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAgICAgICAgICAndGV4dC9jc3MnLFxuICAgICAgICAgICAgaXNTaGFkb3dVSVN0eWxlc2hlZXQ6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX3NldHVwU291cmNlTWFwc1N1cHBvcnQgKCkge1xuICAgICAgICBzb3VyY2VNYXBTdXBwb3J0Lmluc3RhbGwoe1xuICAgICAgICAgICAgaG9va1JlcXVpcmU6ICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgaGFuZGxlVW5jYXVnaHRFeGNlcHRpb25zOiBmYWxzZSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiAgICAgICAgICAgICAgJ25vZGUnXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9jcmVhdGVSdW5uZXIgKGlzTGl2ZU1vZGUpIHtcbiAgICAgICAgY29uc3QgQ3RvciAgICAgID0gaXNMaXZlTW9kZSA/IExpdmVNb2RlUnVubmVyIDogUnVubmVyO1xuICAgICAgICBjb25zdCBuZXdSdW5uZXIgPSBuZXcgQ3Rvcih0aGlzLnByb3h5LCB0aGlzLmJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSwgdGhpcy5jb25maWd1cmF0aW9uLmNsb25lKCkpO1xuXG4gICAgICAgIHRoaXMucnVubmVycy5wdXNoKG5ld1J1bm5lcik7XG5cbiAgICAgICAgcmV0dXJuIG5ld1J1bm5lcjtcbiAgICB9XG5cbiAgICAvLyBBUElcbiAgICBhc3luYyBjcmVhdGVCcm93c2VyQ29ubmVjdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGJyb3dzZXJJbmZvID0gYXdhaXQgYnJvd3NlclByb3ZpZGVyUG9vbC5nZXRCcm93c2VySW5mbygncmVtb3RlJyk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBCcm93c2VyQ29ubmVjdGlvbih0aGlzLmJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSwgYnJvd3NlckluZm8sIHRydWUpO1xuICAgIH1cblxuICAgIGNyZWF0ZVJ1bm5lciAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVSdW5uZXIoZmFsc2UpO1xuICAgIH1cblxuICAgIGNyZWF0ZUxpdmVNb2RlUnVubmVyICgpIHtcbiAgICAgICAgaWYgKHRoaXMucnVubmVycy5zb21lKHJ1bm5lciA9PiBydW5uZXIgaW5zdGFuY2VvZiBMaXZlTW9kZVJ1bm5lcikpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKE1FU1NBR0UuY2Fubm90Q3JlYXRlTXVsdGlwbGVMaXZlTW9kZVJ1bm5lcnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVSdW5uZXIodHJ1ZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgY2xvc2UgKCkge1xuICAgICAgICBpZiAodGhpcy5jbG9zZWQpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRoaXMucnVubmVycy5tYXAocnVubmVyID0+IHJ1bm5lci5zdG9wKCkpKTtcblxuICAgICAgICBhd2FpdCBicm93c2VyUHJvdmlkZXJQb29sLmRpc3Bvc2UoKTtcblxuICAgICAgICB0aGlzLmJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheS5jbG9zZSgpO1xuICAgICAgICB0aGlzLnByb3h5LmNsb3NlKCk7XG4gICAgfVxufVxuIl19
