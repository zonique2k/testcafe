'use strict';

exports.__esModule = true;

var _defineProperty = require('babel-runtime/core-js/object/define-property');

var _defineProperty2 = _interopRequireDefault(_defineProperty);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

// Validations
let getValidHostname = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (hostname) {
        if (hostname) {
            const valid = yield endpointUtils.isMyHostname(hostname);

            if (!valid) throw new _runtime.GeneralError(_message2.default.invalidHostname, hostname);
        } else hostname = endpointUtils.getIPAddress();

        return hostname;
    });

    return function getValidHostname(_x) {
        return _ref.apply(this, arguments);
    };
})();

let getValidPort = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (port) {
        if (port) {
            const isFree = yield endpointUtils.isFreePort(port);

            if (!isFree) throw new _runtime.GeneralError(_message2.default.portIsNotFree, port);
        } else port = yield endpointUtils.getFreePort();

        return port;
    });

    return function getValidPort(_x2) {
        return _ref2.apply(this, arguments);
    };
})();

// API


let createTestCafe = (() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function* (hostname, port1, port2, sslOptions, developmentMode, retryTestPages) {
        const configuration = new _configuration2.default();

        yield configuration.init({
            hostname,
            port1,
            port2,
            ssl: sslOptions,
            developmentMode,
            retryTestPages
        });

        var _ref4 = yield _pinkie2.default.all([getValidHostname(configuration.getOption('hostname')), getValidPort(configuration.getOption('port1')), getValidPort(configuration.getOption('port2'))]);

        hostname = _ref4[0];
        port1 = _ref4[1];
        port2 = _ref4[2];


        configuration.mergeOptions({ hostname, port1, port2 });

        const testcafe = new TestCafe(configuration);

        setupExitHook(function (cb) {
            return testcafe.close().then(cb);
        });

        return testcafe;
    });

    return function createTestCafe(_x3, _x4, _x5, _x6, _x7, _x8) {
        return _ref3.apply(this, arguments);
    };
})();

// Embedding utils


var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _runtime = require('./errors/runtime');

var _message = require('./errors/runtime/message');

var _message2 = _interopRequireDefault(_message);

var _embeddingUtils = require('./embedding-utils');

var _embeddingUtils2 = _interopRequireDefault(_embeddingUtils);

var _exportableLib = require('./api/exportable-lib');

var _exportableLib2 = _interopRequireDefault(_exportableLib);

var _configuration = require('./configuration');

var _configuration2 = _interopRequireDefault(_configuration);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const lazyRequire = require('import-lazy')(require);
const TestCafe = lazyRequire('./testcafe');
const endpointUtils = lazyRequire('endpoint-utils');
const setupExitHook = lazyRequire('async-exit-hook');createTestCafe.embeddingUtils = _embeddingUtils2.default;

// Common API
(0, _keys2.default)(_exportableLib2.default).forEach(key => {
    (0, _defineProperty2.default)(createTestCafe, key, { get: () => _exportableLib2.default[key] });
});

exports.default = createTestCafe;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJob3N0bmFtZSIsInZhbGlkIiwiZW5kcG9pbnRVdGlscyIsImlzTXlIb3N0bmFtZSIsIkdlbmVyYWxFcnJvciIsIk1FU1NBR0UiLCJpbnZhbGlkSG9zdG5hbWUiLCJnZXRJUEFkZHJlc3MiLCJnZXRWYWxpZEhvc3RuYW1lIiwicG9ydCIsImlzRnJlZSIsImlzRnJlZVBvcnQiLCJwb3J0SXNOb3RGcmVlIiwiZ2V0RnJlZVBvcnQiLCJnZXRWYWxpZFBvcnQiLCJwb3J0MSIsInBvcnQyIiwic3NsT3B0aW9ucyIsImRldmVsb3BtZW50TW9kZSIsInJldHJ5VGVzdFBhZ2VzIiwiY29uZmlndXJhdGlvbiIsIkNvbmZpZ3VyYXRpb24iLCJpbml0Iiwic3NsIiwiUHJvbWlzZSIsImFsbCIsImdldE9wdGlvbiIsIm1lcmdlT3B0aW9ucyIsInRlc3RjYWZlIiwiVGVzdENhZmUiLCJzZXR1cEV4aXRIb29rIiwiY2xvc2UiLCJ0aGVuIiwiY2IiLCJjcmVhdGVUZXN0Q2FmZSIsImxhenlSZXF1aXJlIiwicmVxdWlyZSIsImVtYmVkZGluZ1V0aWxzIiwiZXhwb3J0YWJsZUxpYiIsImZvckVhY2giLCJrZXkiLCJnZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZQTs7K0NBQ0EsV0FBaUNBLFFBQWpDLEVBQTJDO0FBQ3ZDLFlBQUlBLFFBQUosRUFBYztBQUNWLGtCQUFNQyxRQUFRLE1BQU1DLGNBQWNDLFlBQWQsQ0FBMkJILFFBQTNCLENBQXBCOztBQUVBLGdCQUFJLENBQUNDLEtBQUwsRUFDSSxNQUFNLElBQUlHLHFCQUFKLENBQWlCQyxrQkFBUUMsZUFBekIsRUFBMENOLFFBQTFDLENBQU47QUFDUCxTQUxELE1BT0lBLFdBQVdFLGNBQWNLLFlBQWQsRUFBWDs7QUFFSixlQUFPUCxRQUFQO0FBQ0gsSzs7b0JBWGNRLGdCOzs7Ozs7Z0RBYWYsV0FBNkJDLElBQTdCLEVBQW1DO0FBQy9CLFlBQUlBLElBQUosRUFBVTtBQUNOLGtCQUFNQyxTQUFTLE1BQU1SLGNBQWNTLFVBQWQsQ0FBeUJGLElBQXpCLENBQXJCOztBQUVBLGdCQUFJLENBQUNDLE1BQUwsRUFDSSxNQUFNLElBQUlOLHFCQUFKLENBQWlCQyxrQkFBUU8sYUFBekIsRUFBd0NILElBQXhDLENBQU47QUFDUCxTQUxELE1BT0lBLE9BQU8sTUFBTVAsY0FBY1csV0FBZCxFQUFiOztBQUVKLGVBQU9KLElBQVA7QUFDSCxLOztvQkFYY0ssWTs7Ozs7QUFhZjs7OztnREFDQSxXQUErQmQsUUFBL0IsRUFBeUNlLEtBQXpDLEVBQWdEQyxLQUFoRCxFQUF1REMsVUFBdkQsRUFBbUVDLGVBQW5FLEVBQW9GQyxjQUFwRixFQUFvRztBQUNoRyxjQUFNQyxnQkFBZ0IsSUFBSUMsdUJBQUosRUFBdEI7O0FBRUEsY0FBTUQsY0FBY0UsSUFBZCxDQUFtQjtBQUNyQnRCLG9CQURxQjtBQUVyQmUsaUJBRnFCO0FBR3JCQyxpQkFIcUI7QUFJckJPLGlCQUFLTixVQUpnQjtBQUtyQkMsMkJBTHFCO0FBTXJCQztBQU5xQixTQUFuQixDQUFOOztBQUhnRyxvQkFZckUsTUFBTUssaUJBQVFDLEdBQVIsQ0FBWSxDQUN6Q2pCLGlCQUFpQlksY0FBY00sU0FBZCxDQUF3QixVQUF4QixDQUFqQixDQUR5QyxFQUV6Q1osYUFBYU0sY0FBY00sU0FBZCxDQUF3QixPQUF4QixDQUFiLENBRnlDLEVBR3pDWixhQUFhTSxjQUFjTSxTQUFkLENBQXdCLE9BQXhCLENBQWIsQ0FIeUMsQ0FBWixDQVorRDs7QUFZL0YxQixnQkFaK0Y7QUFZckZlLGFBWnFGO0FBWTlFQyxhQVo4RTs7O0FBa0JoR0ksc0JBQWNPLFlBQWQsQ0FBMkIsRUFBRTNCLFFBQUYsRUFBWWUsS0FBWixFQUFtQkMsS0FBbkIsRUFBM0I7O0FBRUEsY0FBTVksV0FBVyxJQUFJQyxRQUFKLENBQWFULGFBQWIsQ0FBakI7O0FBRUFVLHNCQUFjO0FBQUEsbUJBQU1GLFNBQVNHLEtBQVQsR0FBaUJDLElBQWpCLENBQXNCQyxFQUF0QixDQUFOO0FBQUEsU0FBZDs7QUFFQSxlQUFPTCxRQUFQO0FBQ0gsSzs7b0JBekJjTSxjOzs7OztBQTJCZjs7O0FBbkVBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLE1BQU1DLGNBQWdCQyxRQUFRLGFBQVIsRUFBdUJBLE9BQXZCLENBQXRCO0FBQ0EsTUFBTVAsV0FBZ0JNLFlBQVksWUFBWixDQUF0QjtBQUNBLE1BQU1qQyxnQkFBZ0JpQyxZQUFZLGdCQUFaLENBQXRCO0FBQ0EsTUFBTUwsZ0JBQWdCSyxZQUFZLGlCQUFaLENBQXRCLENBMERBRCxlQUFlRyxjQUFmLEdBQWdDQSx3QkFBaEM7O0FBRUE7QUFDQSxvQkFBWUMsdUJBQVosRUFBMkJDLE9BQTNCLENBQW1DQyxPQUFPO0FBQ3RDLGtDQUFzQk4sY0FBdEIsRUFBc0NNLEdBQXRDLEVBQTJDLEVBQUVDLEtBQUssTUFBTUgsd0JBQWNFLEdBQWQsQ0FBYixFQUEzQztBQUNILENBRkQ7O2tCQUllTixjIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFByb21pc2UgZnJvbSAncGlua2llJztcbmltcG9ydCB7IEdlbmVyYWxFcnJvciB9IGZyb20gJy4vZXJyb3JzL3J1bnRpbWUnO1xuaW1wb3J0IE1FU1NBR0UgZnJvbSAnLi9lcnJvcnMvcnVudGltZS9tZXNzYWdlJztcbmltcG9ydCBlbWJlZGRpbmdVdGlscyBmcm9tICcuL2VtYmVkZGluZy11dGlscyc7XG5pbXBvcnQgZXhwb3J0YWJsZUxpYiBmcm9tICcuL2FwaS9leHBvcnRhYmxlLWxpYic7XG5pbXBvcnQgQ29uZmlndXJhdGlvbiBmcm9tICcuL2NvbmZpZ3VyYXRpb24nO1xuXG5jb25zdCBsYXp5UmVxdWlyZSAgID0gcmVxdWlyZSgnaW1wb3J0LWxhenknKShyZXF1aXJlKTtcbmNvbnN0IFRlc3RDYWZlICAgICAgPSBsYXp5UmVxdWlyZSgnLi90ZXN0Y2FmZScpO1xuY29uc3QgZW5kcG9pbnRVdGlscyA9IGxhenlSZXF1aXJlKCdlbmRwb2ludC11dGlscycpO1xuY29uc3Qgc2V0dXBFeGl0SG9vayA9IGxhenlSZXF1aXJlKCdhc3luYy1leGl0LWhvb2snKTtcblxuLy8gVmFsaWRhdGlvbnNcbmFzeW5jIGZ1bmN0aW9uIGdldFZhbGlkSG9zdG5hbWUgKGhvc3RuYW1lKSB7XG4gICAgaWYgKGhvc3RuYW1lKSB7XG4gICAgICAgIGNvbnN0IHZhbGlkID0gYXdhaXQgZW5kcG9pbnRVdGlscy5pc015SG9zdG5hbWUoaG9zdG5hbWUpO1xuXG4gICAgICAgIGlmICghdmFsaWQpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKE1FU1NBR0UuaW52YWxpZEhvc3RuYW1lLCBob3N0bmFtZSk7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgICAgaG9zdG5hbWUgPSBlbmRwb2ludFV0aWxzLmdldElQQWRkcmVzcygpO1xuXG4gICAgcmV0dXJuIGhvc3RuYW1lO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRWYWxpZFBvcnQgKHBvcnQpIHtcbiAgICBpZiAocG9ydCkge1xuICAgICAgICBjb25zdCBpc0ZyZWUgPSBhd2FpdCBlbmRwb2ludFV0aWxzLmlzRnJlZVBvcnQocG9ydCk7XG5cbiAgICAgICAgaWYgKCFpc0ZyZWUpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKE1FU1NBR0UucG9ydElzTm90RnJlZSwgcG9ydCk7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgICAgcG9ydCA9IGF3YWl0IGVuZHBvaW50VXRpbHMuZ2V0RnJlZVBvcnQoKTtcblxuICAgIHJldHVybiBwb3J0O1xufVxuXG4vLyBBUElcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVRlc3RDYWZlIChob3N0bmFtZSwgcG9ydDEsIHBvcnQyLCBzc2xPcHRpb25zLCBkZXZlbG9wbWVudE1vZGUsIHJldHJ5VGVzdFBhZ2VzKSB7XG4gICAgY29uc3QgY29uZmlndXJhdGlvbiA9IG5ldyBDb25maWd1cmF0aW9uKCk7XG5cbiAgICBhd2FpdCBjb25maWd1cmF0aW9uLmluaXQoe1xuICAgICAgICBob3N0bmFtZSxcbiAgICAgICAgcG9ydDEsXG4gICAgICAgIHBvcnQyLFxuICAgICAgICBzc2w6IHNzbE9wdGlvbnMsXG4gICAgICAgIGRldmVsb3BtZW50TW9kZSxcbiAgICAgICAgcmV0cnlUZXN0UGFnZXNcbiAgICB9KTtcblxuICAgIFtob3N0bmFtZSwgcG9ydDEsIHBvcnQyXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgZ2V0VmFsaWRIb3N0bmFtZShjb25maWd1cmF0aW9uLmdldE9wdGlvbignaG9zdG5hbWUnKSksXG4gICAgICAgIGdldFZhbGlkUG9ydChjb25maWd1cmF0aW9uLmdldE9wdGlvbigncG9ydDEnKSksXG4gICAgICAgIGdldFZhbGlkUG9ydChjb25maWd1cmF0aW9uLmdldE9wdGlvbigncG9ydDInKSlcbiAgICBdKTtcblxuICAgIGNvbmZpZ3VyYXRpb24ubWVyZ2VPcHRpb25zKHsgaG9zdG5hbWUsIHBvcnQxLCBwb3J0MiB9KTtcblxuICAgIGNvbnN0IHRlc3RjYWZlID0gbmV3IFRlc3RDYWZlKGNvbmZpZ3VyYXRpb24pO1xuXG4gICAgc2V0dXBFeGl0SG9vayhjYiA9PiB0ZXN0Y2FmZS5jbG9zZSgpLnRoZW4oY2IpKTtcblxuICAgIHJldHVybiB0ZXN0Y2FmZTtcbn1cblxuLy8gRW1iZWRkaW5nIHV0aWxzXG5jcmVhdGVUZXN0Q2FmZS5lbWJlZGRpbmdVdGlscyA9IGVtYmVkZGluZ1V0aWxzO1xuXG4vLyBDb21tb24gQVBJXG5PYmplY3Qua2V5cyhleHBvcnRhYmxlTGliKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNyZWF0ZVRlc3RDYWZlLCBrZXksIHsgZ2V0OiAoKSA9PiBleHBvcnRhYmxlTGliW2tleV0gfSk7XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlVGVzdENhZmU7XG4iXX0=
