'use strict';

exports.__esModule = true;
exports.TestRunCtorFactory = undefined;

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _testRun = require('../test-run');

var _testRun2 = _interopRequireDefault(_testRun);

var _testRunState = require('./test-run-state');

var _type = require('../test-run/commands/type');

var _type2 = _interopRequireDefault(_type);

var _service = require('../test-run/commands/service');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TEST_RUN_ABORTED_MESSAGE = 'The test run has been aborted.';

const TestRunCtorFactory = exports.TestRunCtorFactory = function TestRunCtorFactory(callbacks) {
    const created = callbacks.created,
          started = callbacks.started,
          done = callbacks.done,
          readyToNext = callbacks.readyToNext;


    return class LiveModeTestRun extends _testRun2.default {
        constructor(test, browserConnection, screenshotCapturer, warningLog, opts) {
            super(test, browserConnection, screenshotCapturer, warningLog, opts);

            created(this, test);

            this.state = _testRunState.TEST_RUN_STATE.created;
            this.finish = null;
            this.stopping = false;
            this.isInRoleInitializing = false;
            this.stopped = false;
        }

        start() {
            started(this);
            super.start.apply(this, arguments);
        }

        stop() {
            this.stopped = true;
        }

        _useRole(...args) {
            this.isInRoleInitializing = true;

            return super._useRole.apply(this, args).then(res => {
                this.isInRoleInitializing = false;

                return res;
            }).catch(err => {
                this.isInRoleInitializing = false;

                throw err;
            });
        }

        executeCommand(commandToExec, callsite, forced) {
            // NOTE: don't close the page and the session when the last test in the queue is done
            if (commandToExec.type === _type2.default.testDone && !forced) {
                done(this, this.stopped).then(() => this.executeCommand(commandToExec, callsite, true)).then(() => readyToNext(this));

                this.executeCommand(new _service.UnlockPageCommand(), null);

                return _pinkie2.default.resolve();
            }

            if (this.stopped && !this.stopping && !this.isInRoleInitializing) {
                this.stopping = true;

                return _pinkie2.default.reject(new Error(TEST_RUN_ABORTED_MESSAGE));
            }

            return super.executeCommand(commandToExec, callsite);
        }
    };
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXZlL3Rlc3QtcnVuLmpzIl0sIm5hbWVzIjpbIlRFU1RfUlVOX0FCT1JURURfTUVTU0FHRSIsIlRlc3RSdW5DdG9yRmFjdG9yeSIsImNhbGxiYWNrcyIsImNyZWF0ZWQiLCJzdGFydGVkIiwiZG9uZSIsInJlYWR5VG9OZXh0IiwiTGl2ZU1vZGVUZXN0UnVuIiwiVGVzdFJ1biIsImNvbnN0cnVjdG9yIiwidGVzdCIsImJyb3dzZXJDb25uZWN0aW9uIiwic2NyZWVuc2hvdENhcHR1cmVyIiwid2FybmluZ0xvZyIsIm9wdHMiLCJzdGF0ZSIsIlRFU1RfUlVOX1NUQVRFIiwiZmluaXNoIiwic3RvcHBpbmciLCJpc0luUm9sZUluaXRpYWxpemluZyIsInN0b3BwZWQiLCJzdGFydCIsImFwcGx5IiwiYXJndW1lbnRzIiwic3RvcCIsIl91c2VSb2xlIiwiYXJncyIsInRoZW4iLCJyZXMiLCJjYXRjaCIsImVyciIsImV4ZWN1dGVDb21tYW5kIiwiY29tbWFuZFRvRXhlYyIsImNhbGxzaXRlIiwiZm9yY2VkIiwidHlwZSIsIkNPTU1BTkRfVFlQRSIsInRlc3REb25lIiwiVW5sb2NrUGFnZUNvbW1hbmQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIkVycm9yIl0sIm1hcHBpbmdzIjoiOzs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBRUEsTUFBTUEsMkJBQTJCLGdDQUFqQzs7QUFFTyxNQUFNQyxrREFBcUIsU0FBckJBLGtCQUFxQixDQUFVQyxTQUFWLEVBQXFCO0FBQUEsVUFDM0NDLE9BRDJDLEdBQ0hELFNBREcsQ0FDM0NDLE9BRDJDO0FBQUEsVUFDbENDLE9BRGtDLEdBQ0hGLFNBREcsQ0FDbENFLE9BRGtDO0FBQUEsVUFDekJDLElBRHlCLEdBQ0hILFNBREcsQ0FDekJHLElBRHlCO0FBQUEsVUFDbkJDLFdBRG1CLEdBQ0hKLFNBREcsQ0FDbkJJLFdBRG1COzs7QUFHbkQsV0FBTyxNQUFNQyxlQUFOLFNBQThCQyxpQkFBOUIsQ0FBc0M7QUFDekNDLG9CQUFhQyxJQUFiLEVBQW1CQyxpQkFBbkIsRUFBc0NDLGtCQUF0QyxFQUEwREMsVUFBMUQsRUFBc0VDLElBQXRFLEVBQTRFO0FBQ3hFLGtCQUFNSixJQUFOLEVBQVlDLGlCQUFaLEVBQStCQyxrQkFBL0IsRUFBbURDLFVBQW5ELEVBQStEQyxJQUEvRDs7QUFFQVgsb0JBQVEsSUFBUixFQUFjTyxJQUFkOztBQUVBLGlCQUFLSyxLQUFMLEdBQTRCQyw2QkFBZWIsT0FBM0M7QUFDQSxpQkFBS2MsTUFBTCxHQUE0QixJQUE1QjtBQUNBLGlCQUFLQyxRQUFMLEdBQTRCLEtBQTVCO0FBQ0EsaUJBQUtDLG9CQUFMLEdBQTRCLEtBQTVCO0FBQ0EsaUJBQUtDLE9BQUwsR0FBNEIsS0FBNUI7QUFDSDs7QUFFREMsZ0JBQVM7QUFDTGpCLG9CQUFRLElBQVI7QUFDQSxrQkFBTWlCLEtBQU4sQ0FBWUMsS0FBWixDQUFrQixJQUFsQixFQUF3QkMsU0FBeEI7QUFDSDs7QUFFREMsZUFBUTtBQUNKLGlCQUFLSixPQUFMLEdBQWUsSUFBZjtBQUNIOztBQUVESyxpQkFBVSxHQUFHQyxJQUFiLEVBQW1CO0FBQ2YsaUJBQUtQLG9CQUFMLEdBQTRCLElBQTVCOztBQUVBLG1CQUFPLE1BQU1NLFFBQU4sQ0FBZUgsS0FBZixDQUFxQixJQUFyQixFQUEyQkksSUFBM0IsRUFDRkMsSUFERSxDQUNHQyxPQUFPO0FBQ1QscUJBQUtULG9CQUFMLEdBQTRCLEtBQTVCOztBQUVBLHVCQUFPUyxHQUFQO0FBQ0gsYUFMRSxFQU1GQyxLQU5FLENBTUlDLE9BQU87QUFDVixxQkFBS1gsb0JBQUwsR0FBNEIsS0FBNUI7O0FBRUEsc0JBQU1XLEdBQU47QUFDSCxhQVZFLENBQVA7QUFXSDs7QUFFREMsdUJBQWdCQyxhQUFoQixFQUErQkMsUUFBL0IsRUFBeUNDLE1BQXpDLEVBQWlEO0FBQzdDO0FBQ0EsZ0JBQUlGLGNBQWNHLElBQWQsS0FBdUJDLGVBQWFDLFFBQXBDLElBQWdELENBQUNILE1BQXJELEVBQTZEO0FBQ3pEN0IscUJBQUssSUFBTCxFQUFXLEtBQUtlLE9BQWhCLEVBQ0tPLElBREwsQ0FDVSxNQUFNLEtBQUtJLGNBQUwsQ0FBb0JDLGFBQXBCLEVBQW1DQyxRQUFuQyxFQUE2QyxJQUE3QyxDQURoQixFQUVLTixJQUZMLENBRVUsTUFBTXJCLFlBQVksSUFBWixDQUZoQjs7QUFJQSxxQkFBS3lCLGNBQUwsQ0FBb0IsSUFBSU8sMEJBQUosRUFBcEIsRUFBNkMsSUFBN0M7O0FBRUEsdUJBQU9DLGlCQUFRQyxPQUFSLEVBQVA7QUFDSDs7QUFFRCxnQkFBSSxLQUFLcEIsT0FBTCxJQUFnQixDQUFDLEtBQUtGLFFBQXRCLElBQ0EsQ0FBQyxLQUFLQyxvQkFEVixFQUNnQztBQUM1QixxQkFBS0QsUUFBTCxHQUFnQixJQUFoQjs7QUFFQSx1QkFBT3FCLGlCQUFRRSxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVMUMsd0JBQVYsQ0FBZixDQUFQO0FBQ0g7O0FBRUQsbUJBQU8sTUFBTStCLGNBQU4sQ0FBcUJDLGFBQXJCLEVBQW9DQyxRQUFwQyxDQUFQO0FBQ0g7QUExRHdDLEtBQTdDO0FBNERILENBL0RNIiwiZmlsZSI6ImxpdmUvdGVzdC1ydW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUHJvbWlzZSBmcm9tICdwaW5raWUnO1xuaW1wb3J0IFRlc3RSdW4gZnJvbSAnLi4vdGVzdC1ydW4nO1xuaW1wb3J0IHsgVEVTVF9SVU5fU1RBVEUgfSBmcm9tICcuL3Rlc3QtcnVuLXN0YXRlJztcbmltcG9ydCBDT01NQU5EX1RZUEUgZnJvbSAnLi4vdGVzdC1ydW4vY29tbWFuZHMvdHlwZSc7XG5pbXBvcnQgeyBVbmxvY2tQYWdlQ29tbWFuZCB9IGZyb20gJy4uL3Rlc3QtcnVuL2NvbW1hbmRzL3NlcnZpY2UnO1xuXG5jb25zdCBURVNUX1JVTl9BQk9SVEVEX01FU1NBR0UgPSAnVGhlIHRlc3QgcnVuIGhhcyBiZWVuIGFib3J0ZWQuJztcblxuZXhwb3J0IGNvbnN0IFRlc3RSdW5DdG9yRmFjdG9yeSA9IGZ1bmN0aW9uIChjYWxsYmFja3MpIHtcbiAgICBjb25zdCB7IGNyZWF0ZWQsIHN0YXJ0ZWQsIGRvbmUsIHJlYWR5VG9OZXh0IH0gPSBjYWxsYmFja3M7XG5cbiAgICByZXR1cm4gY2xhc3MgTGl2ZU1vZGVUZXN0UnVuIGV4dGVuZHMgVGVzdFJ1biB7XG4gICAgICAgIGNvbnN0cnVjdG9yICh0ZXN0LCBicm93c2VyQ29ubmVjdGlvbiwgc2NyZWVuc2hvdENhcHR1cmVyLCB3YXJuaW5nTG9nLCBvcHRzKSB7XG4gICAgICAgICAgICBzdXBlcih0ZXN0LCBicm93c2VyQ29ubmVjdGlvbiwgc2NyZWVuc2hvdENhcHR1cmVyLCB3YXJuaW5nTG9nLCBvcHRzKTtcblxuICAgICAgICAgICAgY3JlYXRlZCh0aGlzLCB0ZXN0KTtcblxuICAgICAgICAgICAgdGhpcy5zdGF0ZSAgICAgICAgICAgICAgICA9IFRFU1RfUlVOX1NUQVRFLmNyZWF0ZWQ7XG4gICAgICAgICAgICB0aGlzLmZpbmlzaCAgICAgICAgICAgICAgID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuc3RvcHBpbmcgICAgICAgICAgICAgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuaXNJblJvbGVJbml0aWFsaXppbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuc3RvcHBlZCAgICAgICAgICAgICAgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXJ0ICgpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQodGhpcyk7XG4gICAgICAgICAgICBzdXBlci5zdGFydC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RvcCAoKSB7XG4gICAgICAgICAgICB0aGlzLnN0b3BwZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgX3VzZVJvbGUgKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgIHRoaXMuaXNJblJvbGVJbml0aWFsaXppbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICByZXR1cm4gc3VwZXIuX3VzZVJvbGUuYXBwbHkodGhpcywgYXJncylcbiAgICAgICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzSW5Sb2xlSW5pdGlhbGl6aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzSW5Sb2xlSW5pdGlhbGl6aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhlY3V0ZUNvbW1hbmQgKGNvbW1hbmRUb0V4ZWMsIGNhbGxzaXRlLCBmb3JjZWQpIHtcbiAgICAgICAgICAgIC8vIE5PVEU6IGRvbid0IGNsb3NlIHRoZSBwYWdlIGFuZCB0aGUgc2Vzc2lvbiB3aGVuIHRoZSBsYXN0IHRlc3QgaW4gdGhlIHF1ZXVlIGlzIGRvbmVcbiAgICAgICAgICAgIGlmIChjb21tYW5kVG9FeGVjLnR5cGUgPT09IENPTU1BTkRfVFlQRS50ZXN0RG9uZSAmJiAhZm9yY2VkKSB7XG4gICAgICAgICAgICAgICAgZG9uZSh0aGlzLCB0aGlzLnN0b3BwZWQpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuZXhlY3V0ZUNvbW1hbmQoY29tbWFuZFRvRXhlYywgY2FsbHNpdGUsIHRydWUpKVxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiByZWFkeVRvTmV4dCh0aGlzKSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kKG5ldyBVbmxvY2tQYWdlQ29tbWFuZCgpLCBudWxsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuc3RvcHBlZCAmJiAhdGhpcy5zdG9wcGluZyAmJlxuICAgICAgICAgICAgICAgICF0aGlzLmlzSW5Sb2xlSW5pdGlhbGl6aW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wcGluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFRFU1RfUlVOX0FCT1JURURfTUVTU0FHRSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc3VwZXIuZXhlY3V0ZUNvbW1hbmQoY29tbWFuZFRvRXhlYywgY2FsbHNpdGUpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG4iXX0=
