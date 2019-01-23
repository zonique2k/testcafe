'use strict';

exports.__esModule = true;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _child_process = require('child_process');

var _path = require('path');

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _treeKill = require('tree-kill');

var _treeKill2 = _interopRequireDefault(_treeKill);

var _osFamily = require('os-family');

var _osFamily2 = _interopRequireDefault(_osFamily);

var _delay = require('../utils/delay');

var _delay2 = _interopRequireDefault(_delay);

var _runtime = require('../errors/runtime');

var _message = require('../errors/runtime/message');

var _message2 = _interopRequireDefault(_message);

var _resolvePathRelativelyCwd = require('../utils/resolve-path-relatively-cwd');

var _resolvePathRelativelyCwd2 = _interopRequireDefault(_resolvePathRelativelyCwd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const MODULES_BIN_DIR = (0, _resolvePathRelativelyCwd2.default)('./node_modules/.bin');

const ENV_PATH_KEY = function () {
    if (_osFamily2.default.win) {
        let pathKey = 'Path';

        (0, _keys2.default)(process.env).forEach(key => {
            if (key.toLowerCase() === 'path') pathKey = key;
        });

        return pathKey;
    }

    return 'PATH';
}();

class TestedApp {
    constructor() {
        this.process = null;
        this.errorPromise = null;
        this.killed = false;
    }

    start(command, initDelay) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            _this.errorPromise = new _pinkie2.default(function (resolve, reject) {
                const env = (0, _assign2.default)({}, process.env);
                const path = env[ENV_PATH_KEY] || '';
                const pathParts = path.split(_path.delimiter);

                pathParts.unshift(MODULES_BIN_DIR);

                env[ENV_PATH_KEY] = pathParts.join(_path.delimiter);

                _this.process = (0, _child_process.exec)(command, { env }, function (err) {
                    if (!_this.killed && err) {
                        const message = err.stack || String(err);

                        reject(new _runtime.GeneralError(_message2.default.testedAppFailedWithError, message));
                    }
                });
            });

            yield _pinkie2.default.race([(0, _delay2.default)(initDelay), _this.errorPromise]);
        })();
    }

    kill() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            _this2.killed = true;

            const killPromise = new _pinkie2.default(function (resolve) {
                return (0, _treeKill2.default)(_this2.process.pid, 'SIGTERM', resolve);
            });

            yield killPromise;
        })();
    }
}
exports.default = TestedApp;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydW5uZXIvdGVzdGVkLWFwcC5qcyJdLCJuYW1lcyI6WyJNT0RVTEVTX0JJTl9ESVIiLCJFTlZfUEFUSF9LRVkiLCJPUyIsIndpbiIsInBhdGhLZXkiLCJwcm9jZXNzIiwiZW52IiwiZm9yRWFjaCIsImtleSIsInRvTG93ZXJDYXNlIiwiVGVzdGVkQXBwIiwiY29uc3RydWN0b3IiLCJlcnJvclByb21pc2UiLCJraWxsZWQiLCJzdGFydCIsImNvbW1hbmQiLCJpbml0RGVsYXkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInBhdGgiLCJwYXRoUGFydHMiLCJzcGxpdCIsInBhdGhEZWxpbWl0ZXIiLCJ1bnNoaWZ0Iiwiam9pbiIsImVyciIsIm1lc3NhZ2UiLCJzdGFjayIsIlN0cmluZyIsIkdlbmVyYWxFcnJvciIsIk1FU1NBR0UiLCJ0ZXN0ZWRBcHBGYWlsZWRXaXRoRXJyb3IiLCJyYWNlIiwia2lsbCIsImtpbGxQcm9taXNlIiwicGlkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQSxNQUFNQSxrQkFBa0Isd0NBQXlCLHFCQUF6QixDQUF4Qjs7QUFFQSxNQUFNQyxlQUFnQixZQUFZO0FBQzlCLFFBQUlDLG1CQUFHQyxHQUFQLEVBQVk7QUFDUixZQUFJQyxVQUFVLE1BQWQ7O0FBRUEsNEJBQVlDLFFBQVFDLEdBQXBCLEVBQXlCQyxPQUF6QixDQUFpQ0MsT0FBTztBQUNwQyxnQkFBSUEsSUFBSUMsV0FBSixPQUFzQixNQUExQixFQUNJTCxVQUFVSSxHQUFWO0FBQ1AsU0FIRDs7QUFLQSxlQUFPSixPQUFQO0FBQ0g7O0FBRUQsV0FBTyxNQUFQO0FBQ0gsQ0Fib0IsRUFBckI7O0FBZ0JlLE1BQU1NLFNBQU4sQ0FBZ0I7QUFDM0JDLGtCQUFlO0FBQ1gsYUFBS04sT0FBTCxHQUFvQixJQUFwQjtBQUNBLGFBQUtPLFlBQUwsR0FBb0IsSUFBcEI7QUFDQSxhQUFLQyxNQUFMLEdBQW9CLEtBQXBCO0FBQ0g7O0FBRUtDLFNBQU4sQ0FBYUMsT0FBYixFQUFzQkMsU0FBdEIsRUFBaUM7QUFBQTs7QUFBQTtBQUM3QixrQkFBS0osWUFBTCxHQUFvQixJQUFJSyxnQkFBSixDQUFZLFVBQUNDLE9BQUQsRUFBVUMsTUFBVixFQUFxQjtBQUNqRCxzQkFBTWIsTUFBWSxzQkFBYyxFQUFkLEVBQWtCRCxRQUFRQyxHQUExQixDQUFsQjtBQUNBLHNCQUFNYyxPQUFZZCxJQUFJTCxZQUFKLEtBQXFCLEVBQXZDO0FBQ0Esc0JBQU1vQixZQUFZRCxLQUFLRSxLQUFMLENBQVdDLGVBQVgsQ0FBbEI7O0FBRUFGLDBCQUFVRyxPQUFWLENBQWtCeEIsZUFBbEI7O0FBRUFNLG9CQUFJTCxZQUFKLElBQW9Cb0IsVUFBVUksSUFBVixDQUFlRixlQUFmLENBQXBCOztBQUVBLHNCQUFLbEIsT0FBTCxHQUFlLHlCQUFLVSxPQUFMLEVBQWMsRUFBRVQsR0FBRixFQUFkLEVBQXVCLGVBQU87QUFDekMsd0JBQUksQ0FBQyxNQUFLTyxNQUFOLElBQWdCYSxHQUFwQixFQUF5QjtBQUNyQiw4QkFBTUMsVUFBVUQsSUFBSUUsS0FBSixJQUFhQyxPQUFPSCxHQUFQLENBQTdCOztBQUVBUCwrQkFBTyxJQUFJVyxxQkFBSixDQUFpQkMsa0JBQVFDLHdCQUF6QixFQUFtREwsT0FBbkQsQ0FBUDtBQUNIO0FBQ0osaUJBTmMsQ0FBZjtBQU9ILGFBaEJtQixDQUFwQjs7QUFrQkEsa0JBQU1WLGlCQUFRZ0IsSUFBUixDQUFhLENBQ2YscUJBQU1qQixTQUFOLENBRGUsRUFFZixNQUFLSixZQUZVLENBQWIsQ0FBTjtBQW5CNkI7QUF1QmhDOztBQUVLc0IsUUFBTixHQUFjO0FBQUE7O0FBQUE7QUFDVixtQkFBS3JCLE1BQUwsR0FBYyxJQUFkOztBQUVBLGtCQUFNc0IsY0FBYyxJQUFJbEIsZ0JBQUosQ0FBWTtBQUFBLHVCQUFXLHdCQUFLLE9BQUtaLE9BQUwsQ0FBYStCLEdBQWxCLEVBQXVCLFNBQXZCLEVBQWtDbEIsT0FBbEMsQ0FBWDtBQUFBLGFBQVosQ0FBcEI7O0FBRUEsa0JBQU1pQixXQUFOO0FBTFU7QUFNYjtBQXRDMEI7a0JBQVZ6QixTIiwiZmlsZSI6InJ1bm5lci90ZXN0ZWQtYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhlYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgZGVsaW1pdGVyIGFzIHBhdGhEZWxpbWl0ZXIgfSBmcm9tICdwYXRoJztcbmltcG9ydCBQcm9taXNlIGZyb20gJ3BpbmtpZSc7XG5pbXBvcnQga2lsbCBmcm9tICd0cmVlLWtpbGwnO1xuaW1wb3J0IE9TIGZyb20gJ29zLWZhbWlseSc7XG5pbXBvcnQgZGVsYXkgZnJvbSAnLi4vdXRpbHMvZGVsYXknO1xuaW1wb3J0IHsgR2VuZXJhbEVycm9yIH0gZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUnO1xuaW1wb3J0IE1FU1NBR0UgZnJvbSAnLi4vZXJyb3JzL3J1bnRpbWUvbWVzc2FnZSc7XG5pbXBvcnQgcmVzb2x2ZVBhdGhSZWxhdGl2ZWx5Q3dkIGZyb20gJy4uL3V0aWxzL3Jlc29sdmUtcGF0aC1yZWxhdGl2ZWx5LWN3ZCc7XG5cbmNvbnN0IE1PRFVMRVNfQklOX0RJUiA9IHJlc29sdmVQYXRoUmVsYXRpdmVseUN3ZCgnLi9ub2RlX21vZHVsZXMvLmJpbicpO1xuXG5jb25zdCBFTlZfUEFUSF9LRVkgPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmIChPUy53aW4pIHtcbiAgICAgICAgbGV0IHBhdGhLZXkgPSAnUGF0aCc7XG5cbiAgICAgICAgT2JqZWN0LmtleXMocHJvY2Vzcy5lbnYpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIGlmIChrZXkudG9Mb3dlckNhc2UoKSA9PT0gJ3BhdGgnKVxuICAgICAgICAgICAgICAgIHBhdGhLZXkgPSBrZXk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBwYXRoS2V5O1xuICAgIH1cblxuICAgIHJldHVybiAnUEFUSCc7XG59KSgpO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRlc3RlZEFwcCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLnByb2Nlc3MgICAgICA9IG51bGw7XG4gICAgICAgIHRoaXMuZXJyb3JQcm9taXNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5raWxsZWQgICAgICAgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBhc3luYyBzdGFydCAoY29tbWFuZCwgaW5pdERlbGF5KSB7XG4gICAgICAgIHRoaXMuZXJyb3JQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW52ICAgICAgID0gT2JqZWN0LmFzc2lnbih7fSwgcHJvY2Vzcy5lbnYpO1xuICAgICAgICAgICAgY29uc3QgcGF0aCAgICAgID0gZW52W0VOVl9QQVRIX0tFWV0gfHwgJyc7XG4gICAgICAgICAgICBjb25zdCBwYXRoUGFydHMgPSBwYXRoLnNwbGl0KHBhdGhEZWxpbWl0ZXIpO1xuXG4gICAgICAgICAgICBwYXRoUGFydHMudW5zaGlmdChNT0RVTEVTX0JJTl9ESVIpO1xuXG4gICAgICAgICAgICBlbnZbRU5WX1BBVEhfS0VZXSA9IHBhdGhQYXJ0cy5qb2luKHBhdGhEZWxpbWl0ZXIpO1xuXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3MgPSBleGVjKGNvbW1hbmQsIHsgZW52IH0sIGVyciA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmtpbGxlZCAmJiBlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGVyci5zdGFjayB8fCBTdHJpbmcoZXJyKTtcblxuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEdlbmVyYWxFcnJvcihNRVNTQUdFLnRlc3RlZEFwcEZhaWxlZFdpdGhFcnJvciwgbWVzc2FnZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgZGVsYXkoaW5pdERlbGF5KSxcbiAgICAgICAgICAgIHRoaXMuZXJyb3JQcm9taXNlXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIGFzeW5jIGtpbGwgKCkge1xuICAgICAgICB0aGlzLmtpbGxlZCA9IHRydWU7XG5cbiAgICAgICAgY29uc3Qga2lsbFByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IGtpbGwodGhpcy5wcm9jZXNzLnBpZCwgJ1NJR1RFUk0nLCByZXNvbHZlKSk7XG5cbiAgICAgICAgYXdhaXQga2lsbFByb21pc2U7XG4gICAgfVxufVxuIl19
