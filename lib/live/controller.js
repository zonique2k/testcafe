'use strict';

exports.__esModule = true;

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _fileWatcher = require('./file-watcher');

var _fileWatcher2 = _interopRequireDefault(_fileWatcher);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _process = require('process');

var _process2 = _interopRequireDefault(_process);

var _keypress = require('keypress');

var _keypress2 = _interopRequireDefault(_keypress);

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const REQUIRED_MODULE_FOUND_EVENT = 'require-module-found';
const LOCK_KEY_PRESS_TIMEOUT = 1000;

class LiveModeController extends _events2.default {
    constructor(runner) {
        super();

        this.src = null;
        this.running = false;
        this.restarting = false;
        this.watchingPaused = false;
        this.stopping = false;
        this.logger = new _logger2.default();
        this.runner = runner;
        this.lockKeyPress = false;
    }

    init(files) {
        this._prepareProcessStdin();
        this._listenKeyPress();
        this._initFileWatching(files);
        this._listenTestRunnerEvents();
        this._setRunning();

        return _pinkie2.default.resolve().then(() => this.logger.writeIntroMessage(files));
    }

    _toggleWatching() {
        this.watchingPaused = !this.watchingPaused;

        this.logger.writeToggleWatchingMessage(!this.watchingPaused);
    }

    _stop() {
        if (!this.runner || !this.running) {
            this.logger.writeNothingToStopMessage();

            return _pinkie2.default.resolve();
        }

        this.logger.writeStopRunningMessage();

        return this.runner.stop().then(() => {
            this.restarting = false;
            this.running = false;
        });
    }

    _restart() {
        if (this.restarting || this.watchingPaused) return _pinkie2.default.resolve();

        this.restarting = true;

        if (this.running) {
            return this._stop().then(() => this.logger.writeTestsFinishedMessage()).then(() => this._runTests());
        }

        return this._runTests();
    }

    _exit() {
        if (this.stopping) return _pinkie2.default.resolve();

        this.logger.writeExitMessage();

        this.stopping = true;

        return this.runner ? this.runner.exit() : _pinkie2.default.resolve();
    }

    _createFileWatcher(src) {
        return new _fileWatcher2.default(src);
    }

    _prepareProcessStdin() {
        if (_process2.default.stdout.isTTY) _process2.default.stdin.setRawMode(true);
    }

    _listenKeyPress() {
        // Listen commands
        (0, _keypress2.default)(_process2.default.stdin);

        _process2.default.stdin.on('keypress', (ch, key) => {
            if (this.lockKeyPress) return null;

            this.lockKeyPress = true;

            setTimeout(() => {
                this.lockKeyPress = false;
            }, LOCK_KEY_PRESS_TIMEOUT);

            if (key && key.ctrl) {
                switch (key.name) {
                    case 's':
                        return this._stop();
                    case 'r':
                        return this._restart();
                    case 'c':
                        return this._exit();
                    case 'w':
                        return this._toggleWatching();
                }
            }

            return null;
        });
    }

    _listenTestRunnerEvents() {
        this.runner.on(this.runner.TEST_RUN_DONE_EVENT, e => {
            this.running = false;

            if (!this.restarting) this.logger.writeTestsFinishedMessage();

            if (e.err) this.logger.err(`ERROR: ${e.err}`);
        });

        this.runner.on(this.runner.REQUIRED_MODULE_FOUND_EVENT, e => {
            this.emit(REQUIRED_MODULE_FOUND_EVENT, e);
        });
    }

    _initFileWatching(src) {
        const fileWatcher = this._createFileWatcher(src);

        this.on(REQUIRED_MODULE_FOUND_EVENT, e => fileWatcher.addFile(e.filename));

        fileWatcher.on(fileWatcher.FILE_CHANGED_EVENT, () => this._runTests(true));
    }

    _setRunning() {
        this.running = true;
        this.restarting = false;
    }

    _runTests(sourceChanged) {
        if (this.watchingPaused || this.running) return _pinkie2.default.resolve();

        this._setRunning();

        this.logger.writeRunTestsMessage(sourceChanged);

        return this.runner.runTests();
    }
}

exports.default = LiveModeController;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXZlL2NvbnRyb2xsZXIuanMiXSwibmFtZXMiOlsiUkVRVUlSRURfTU9EVUxFX0ZPVU5EX0VWRU5UIiwiTE9DS19LRVlfUFJFU1NfVElNRU9VVCIsIkxpdmVNb2RlQ29udHJvbGxlciIsIkV2ZW50RW1pdHRlciIsImNvbnN0cnVjdG9yIiwicnVubmVyIiwic3JjIiwicnVubmluZyIsInJlc3RhcnRpbmciLCJ3YXRjaGluZ1BhdXNlZCIsInN0b3BwaW5nIiwibG9nZ2VyIiwiTG9nZ2VyIiwibG9ja0tleVByZXNzIiwiaW5pdCIsImZpbGVzIiwiX3ByZXBhcmVQcm9jZXNzU3RkaW4iLCJfbGlzdGVuS2V5UHJlc3MiLCJfaW5pdEZpbGVXYXRjaGluZyIsIl9saXN0ZW5UZXN0UnVubmVyRXZlbnRzIiwiX3NldFJ1bm5pbmciLCJQcm9taXNlIiwicmVzb2x2ZSIsInRoZW4iLCJ3cml0ZUludHJvTWVzc2FnZSIsIl90b2dnbGVXYXRjaGluZyIsIndyaXRlVG9nZ2xlV2F0Y2hpbmdNZXNzYWdlIiwiX3N0b3AiLCJ3cml0ZU5vdGhpbmdUb1N0b3BNZXNzYWdlIiwid3JpdGVTdG9wUnVubmluZ01lc3NhZ2UiLCJzdG9wIiwiX3Jlc3RhcnQiLCJ3cml0ZVRlc3RzRmluaXNoZWRNZXNzYWdlIiwiX3J1blRlc3RzIiwiX2V4aXQiLCJ3cml0ZUV4aXRNZXNzYWdlIiwiZXhpdCIsIl9jcmVhdGVGaWxlV2F0Y2hlciIsIkZpbGVXYXRjaGVyIiwicHJvY2VzcyIsInN0ZG91dCIsImlzVFRZIiwic3RkaW4iLCJzZXRSYXdNb2RlIiwib24iLCJjaCIsImtleSIsInNldFRpbWVvdXQiLCJjdHJsIiwibmFtZSIsIlRFU1RfUlVOX0RPTkVfRVZFTlQiLCJlIiwiZXJyIiwiZW1pdCIsImZpbGVXYXRjaGVyIiwiYWRkRmlsZSIsImZpbGVuYW1lIiwiRklMRV9DSEFOR0VEX0VWRU5UIiwic291cmNlQ2hhbmdlZCIsIndyaXRlUnVuVGVzdHNNZXNzYWdlIiwicnVuVGVz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QUFNZ0QsY0FBYyxLQUFLakIsa0JBQUwsQ0FBd0IvQixHQUF4QixDQUFwQjs7QUFFQSxhQUFLc0MsRUFBTCxDQUFRNUMsMkJBQVIsRUFBcUNtRCxLQUFLRyxZQUFZQyxPQUFaLENBQW9CSixFQUFFSyxRQUF0QixDQUExQzs7QUFFQUYsb0JBQVlWLEVBQVosQ0FBZVUsWUFBWUcsa0JBQTNCLEVBQStDLE1BQU0sS0FBS3hCLFNBQUwsQ0FBZSxJQUFmLENBQXJEO0FBQ0g7O0FBRURiLGtCQUFlO0FBQ1gsYUFBS2IsT0FBTCxHQUFrQixJQUFsQjtBQUNBLGFBQUtDLFVBQUwsR0FBa0IsS0FBbEI7QUFDSDs7QUFFRHlCLGNBQVd5QixhQUFYLEVBQTBCO0FBQ3RCLFlBQUksS0FBS2pELGNBQUwsSUFBdUIsS0FBS0YsT0FBaEMsRUFDSSxPQUFPYyxpQkFBUUMsT0FBUixFQUFQOztBQUVKLGFBQUtGLFdBQUw7O0FBRUEsYUFBS1QsTUFBTCxDQUFZZ0Qsb0JBQVosQ0FBaUNELGFBQWpDOztBQUVBLGVBQU8sS0FBS3JELE1BQUwsQ0FBWXVELFFBQVosRUFBUDtBQUNIO0FBdkp5Qzs7a0JBMEovQjFELGtCIiwiZmlsZSI6ImxpdmUvY29udHJvbGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCBGaWxlV2F0Y2hlciBmcm9tICcuL2ZpbGUtd2F0Y2hlcic7XG5pbXBvcnQgTG9nZ2VyIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCBwcm9jZXNzIGZyb20gJ3Byb2Nlc3MnO1xuaW1wb3J0IGtleXByZXNzIGZyb20gJ2tleXByZXNzJztcbmltcG9ydCBQcm9taXNlIGZyb20gJ3BpbmtpZSc7XG5cbmNvbnN0IFJFUVVJUkVEX01PRFVMRV9GT1VORF9FVkVOVCA9ICdyZXF1aXJlLW1vZHVsZS1mb3VuZCc7XG5jb25zdCBMT0NLX0tFWV9QUkVTU19USU1FT1VUICAgICAgPSAxMDAwO1xuXG5jbGFzcyBMaXZlTW9kZUNvbnRyb2xsZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yIChydW5uZXIpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnNyYyAgICAgICAgICAgID0gbnVsbDtcbiAgICAgICAgdGhpcy5ydW5uaW5nICAgICAgICA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlc3RhcnRpbmcgICAgID0gZmFsc2U7XG4gICAgICAgIHRoaXMud2F0Y2hpbmdQYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zdG9wcGluZyAgICAgICA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvZ2dlciAgICAgICAgID0gbmV3IExvZ2dlcigpO1xuICAgICAgICB0aGlzLnJ1bm5lciAgICAgICAgID0gcnVubmVyO1xuICAgICAgICB0aGlzLmxvY2tLZXlQcmVzcyAgID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaW5pdCAoZmlsZXMpIHtcbiAgICAgICAgdGhpcy5fcHJlcGFyZVByb2Nlc3NTdGRpbigpO1xuICAgICAgICB0aGlzLl9saXN0ZW5LZXlQcmVzcygpO1xuICAgICAgICB0aGlzLl9pbml0RmlsZVdhdGNoaW5nKGZpbGVzKTtcbiAgICAgICAgdGhpcy5fbGlzdGVuVGVzdFJ1bm5lckV2ZW50cygpO1xuICAgICAgICB0aGlzLl9zZXRSdW5uaW5nKCk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmxvZ2dlci53cml0ZUludHJvTWVzc2FnZShmaWxlcykpO1xuICAgIH1cblxuICAgIF90b2dnbGVXYXRjaGluZyAoKSB7XG4gICAgICAgIHRoaXMud2F0Y2hpbmdQYXVzZWQgPSAhdGhpcy53YXRjaGluZ1BhdXNlZDtcblxuICAgICAgICB0aGlzLmxvZ2dlci53cml0ZVRvZ2dsZVdhdGNoaW5nTWVzc2FnZSghdGhpcy53YXRjaGluZ1BhdXNlZCk7XG4gICAgfVxuXG4gICAgX3N0b3AgKCkge1xuICAgICAgICBpZiAoIXRoaXMucnVubmVyIHx8ICF0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLndyaXRlTm90aGluZ1RvU3RvcE1lc3NhZ2UoKTtcblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sb2dnZXIud3JpdGVTdG9wUnVubmluZ01lc3NhZ2UoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5ydW5uZXIuc3RvcCgpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0YXJ0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5uaW5nICAgID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfcmVzdGFydCAoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlc3RhcnRpbmcgfHwgdGhpcy53YXRjaGluZ1BhdXNlZClcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgICAgICB0aGlzLnJlc3RhcnRpbmcgPSB0cnVlO1xuXG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zdG9wKClcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmxvZ2dlci53cml0ZVRlc3RzRmluaXNoZWRNZXNzYWdlKCkpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5fcnVuVGVzdHMoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fcnVuVGVzdHMoKTtcbiAgICB9XG5cbiAgICBfZXhpdCAoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0b3BwaW5nKVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgIHRoaXMubG9nZ2VyLndyaXRlRXhpdE1lc3NhZ2UoKTtcblxuICAgICAgICB0aGlzLnN0b3BwaW5nID0gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gdGhpcy5ydW5uZXIgPyB0aGlzLnJ1bm5lci5leGl0KCkgOiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBfY3JlYXRlRmlsZVdhdGNoZXIgKHNyYykge1xuICAgICAgICByZXR1cm4gbmV3IEZpbGVXYXRjaGVyKHNyYyk7XG4gICAgfVxuXG4gICAgX3ByZXBhcmVQcm9jZXNzU3RkaW4gKCkge1xuICAgICAgICBpZiAocHJvY2Vzcy5zdGRvdXQuaXNUVFkpXG4gICAgICAgICAgICBwcm9jZXNzLnN0ZGluLnNldFJhd01vZGUodHJ1ZSk7XG4gICAgfVxuXG4gICAgX2xpc3RlbktleVByZXNzICgpIHtcbiAgICAgICAgLy8gTGlzdGVuIGNvbW1hbmRzXG4gICAgICAgIGtleXByZXNzKHByb2Nlc3Muc3RkaW4pO1xuXG4gICAgICAgIHByb2Nlc3Muc3RkaW4ub24oJ2tleXByZXNzJywgKGNoLCBrZXkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmxvY2tLZXlQcmVzcylcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICAgICAgdGhpcy5sb2NrS2V5UHJlc3MgPSB0cnVlO1xuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvY2tLZXlQcmVzcyA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgTE9DS19LRVlfUFJFU1NfVElNRU9VVCk7XG5cbiAgICAgICAgICAgIGlmIChrZXkgJiYga2V5LmN0cmwpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGtleS5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3N0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncic6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVzdGFydCgpO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdjJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9leGl0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3cnOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RvZ2dsZVdhdGNoaW5nKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX2xpc3RlblRlc3RSdW5uZXJFdmVudHMgKCkge1xuICAgICAgICB0aGlzLnJ1bm5lci5vbih0aGlzLnJ1bm5lci5URVNUX1JVTl9ET05FX0VWRU5ULCBlID0+IHtcbiAgICAgICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVzdGFydGluZylcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci53cml0ZVRlc3RzRmluaXNoZWRNZXNzYWdlKCk7XG5cbiAgICAgICAgICAgIGlmIChlLmVycilcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnIoYEVSUk9SOiAke2UuZXJyfWApO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnJ1bm5lci5vbih0aGlzLnJ1bm5lci5SRVFVSVJFRF9NT0RVTEVfRk9VTkRfRVZFTlQsIGUgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbWl0KFJFUVVJUkVEX01PRFVMRV9GT1VORF9FVkVOVCwgZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9pbml0RmlsZVdhdGNoaW5nIChzcmMpIHtcbiAgICAgICAgY29uc3QgZmlsZVdhdGNoZXIgPSB0aGlzLl9jcmVhdGVGaWxlV2F0Y2hlcihzcmMpO1xuXG4gICAgICAgIHRoaXMub24oUkVRVUlSRURfTU9EVUxFX0ZPVU5EX0VWRU5ULCBlID0+IGZpbGVXYXRjaGVyLmFkZEZpbGUoZS5maWxlbmFtZSkpO1xuXG4gICAgICAgIGZpbGVXYXRjaGVyLm9uKGZpbGVXYXRjaGVyLkZJTEVfQ0hBTkdFRF9FVkVOVCwgKCkgPT4gdGhpcy5fcnVuVGVzdHModHJ1ZSkpO1xuICAgIH1cblxuICAgIF9zZXRSdW5uaW5nICgpIHtcbiAgICAgICAgdGhpcy5ydW5uaW5nICAgID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZXN0YXJ0aW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgX3J1blRlc3RzIChzb3VyY2VDaGFuZ2VkKSB7XG4gICAgICAgIGlmICh0aGlzLndhdGNoaW5nUGF1c2VkIHx8IHRoaXMucnVubmluZylcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgICAgICB0aGlzLl9zZXRSdW5uaW5nKCk7XG5cbiAgICAgICAgdGhpcy5sb2dnZXIud3JpdGVSdW5UZXN0c01lc3NhZ2Uoc291cmNlQ2hhbmdlZCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucnVubmVyLnJ1blRlc3RzKCk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXZlTW9kZUNvbnRyb2xsZXI7XG4iXX0=
