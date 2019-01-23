'use strict';

exports.__esModule = true;
exports.hasMatch = hasMatch;
exports.findMatch = findMatch;
exports.isMatchTrue = isMatchTrue;
exports.splitEscaped = splitEscaped;
exports.getPathFromParsedModes = getPathFromParsedModes;
exports.getModes = getModes;
exports.parseConfig = parseConfig;

var _lodash = require('lodash');

var _osFamily = require('os-family');

var _osFamily2 = _interopRequireDefault(_osFamily);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CONFIG_TERMINATOR_RE = /(\s+|^)-/;

function hasMatch(array, re) {
    return !!(0, _lodash.find)(array, el => el.match(re));
}

function findMatch(array, re) {
    const element = (0, _lodash.find)(array, el => el.match(re));

    return element ? element.match(re)[1] : '';
}

function isMatchTrue(array, re) {
    const match = findMatch(array, re);

    return match && match !== '0' && match !== 'false';
}

function splitEscaped(str, splitterChar) {
    const result = [''];

    for (let i = 0; i < str.length; i++) {
        if (str[i] === splitterChar) {
            result.push('');
            continue;
        }

        if (str[i] === '\\' && (str[i + 1] === '\\' || str[i + 1] === splitterChar)) i++;

        result[result.length - 1] += str[i];
    }

    return result;
}

function getPathFromParsedModes(modes, availableModes = []) {
    if (!modes.length) return '';

    if (availableModes.some(mode => mode === modes[0])) return '';

    let path = modes.shift();

    if (_osFamily2.default.win && modes.length && path.match(/^[A-Za-z]$/)) path += ':' + modes.shift();

    return path;
}

function getModes(modes, availableModes = []) {
    const result = {};

    availableModes = availableModes.slice();

    availableModes.forEach(key => {
        result[key] = false;
    });

    while (modes.length && availableModes.length) {
        if (modes[0] === availableModes[0]) {
            result[availableModes[0]] = true;

            modes.shift();
        }

        availableModes.shift();
    }

    return result;
}

function parseConfig(str) {
    const configTerminatorMatch = str.match(CONFIG_TERMINATOR_RE);

    if (!configTerminatorMatch) return { modesString: str, userArgs: '' };

    return {
        modesString: str.substr(0, configTerminatorMatch.index),
        userArgs: str.substr(configTerminatorMatch.index + configTerminatorMatch[1].length)
    };
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9icm93c2VyL3Byb3ZpZGVyL3V0aWxzL2FyZ3VtZW50LXBhcnNpbmcuanMiXSwibmFtZXMiOlsiaGFzTWF0Y2giLCJmaW5kTWF0Y2giLCJpc01hdGNoVHJ1ZSIsInNwbGl0RXNjYXBlZCIsImdldFBhdGhGcm9tUGFyc2VkTW9kZXMiLCJnZXRNb2RlcyIsInBhcnNlQ29uZmlnIiwiQ09ORklHX1RFUk1JTkFUT1JfUkUiLCJhcnJheSIsInJlIiwiZWwiLCJtYXRjaCIsImVsZW1lbnQiLCJzdHIiLCJzcGxpdHRlckNoYXIiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwicHVzaCIsIm1vZGVzIiwiYXZhaWxhYmxlTW9kZXMiLCJzb21lIiwibW9kZSIsInBhdGgiLCJzaGlmdCIsIk9TIiwid2luIiwic2xpY2UiLCJmb3JFYWNoIiwia2V5IiwiY29uZmlnVGVybWluYXRvck1hdGNoIiwibW9kZXNTdHJpbmciLCJ1c2VyQXJncyIsInN1YnN0ciIsImluZGV4Il0sIm1hcHBpbmdzIjoiOzs7UUFLZ0JBLFEsR0FBQUEsUTtRQUlBQyxTLEdBQUFBLFM7UUFNQUMsVyxHQUFBQSxXO1FBTUFDLFksR0FBQUEsWTtRQWtCQUMsc0IsR0FBQUEsc0I7UUFlQUMsUSxHQUFBQSxRO1FBc0JBQyxXLEdBQUFBLFc7O0FBNUVoQjs7QUFDQTs7Ozs7O0FBRUEsTUFBTUMsdUJBQXVCLFVBQTdCOztBQUVPLFNBQVNQLFFBQVQsQ0FBbUJRLEtBQW5CLEVBQTBCQyxFQUExQixFQUE4QjtBQUNqQyxXQUFPLENBQUMsQ0FBQyxrQkFBWUQsS0FBWixFQUFtQkUsTUFBTUEsR0FBR0MsS0FBSCxDQUFTRixFQUFULENBQXpCLENBQVQ7QUFDSDs7QUFFTSxTQUFTUixTQUFULENBQW9CTyxLQUFwQixFQUEyQkMsRUFBM0IsRUFBK0I7QUFDbEMsVUFBTUcsVUFBVSxrQkFBWUosS0FBWixFQUFtQkUsTUFBTUEsR0FBR0MsS0FBSCxDQUFTRixFQUFULENBQXpCLENBQWhCOztBQUVBLFdBQU9HLFVBQVVBLFFBQVFELEtBQVIsQ0FBY0YsRUFBZCxFQUFrQixDQUFsQixDQUFWLEdBQWlDLEVBQXhDO0FBQ0g7O0FBRU0sU0FBU1AsV0FBVCxDQUFzQk0sS0FBdEIsRUFBNkJDLEVBQTdCLEVBQWlDO0FBQ3BDLFVBQU1FLFFBQVFWLFVBQVVPLEtBQVYsRUFBaUJDLEVBQWpCLENBQWQ7O0FBRUEsV0FBT0UsU0FBU0EsVUFBVSxHQUFuQixJQUEwQkEsVUFBVSxPQUEzQztBQUNIOztBQUVNLFNBQVNSLFlBQVQsQ0FBdUJVLEdBQXZCLEVBQTRCQyxZQUE1QixFQUEwQztBQUM3QyxVQUFNQyxTQUFTLENBQUMsRUFBRCxDQUFmOztBQUVBLFNBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJSCxJQUFJSSxNQUF4QixFQUFnQ0QsR0FBaEMsRUFBcUM7QUFDakMsWUFBSUgsSUFBSUcsQ0FBSixNQUFXRixZQUFmLEVBQTZCO0FBQ3pCQyxtQkFBT0csSUFBUCxDQUFZLEVBQVo7QUFDQTtBQUNIOztBQUVELFlBQUlMLElBQUlHLENBQUosTUFBVyxJQUFYLEtBQW9CSCxJQUFJRyxJQUFJLENBQVIsTUFBZSxJQUFmLElBQXVCSCxJQUFLRyxJQUFJLENBQVQsTUFBZ0JGLFlBQTNELENBQUosRUFDSUU7O0FBRUpELGVBQU9BLE9BQU9FLE1BQVAsR0FBZ0IsQ0FBdkIsS0FBNkJKLElBQUlHLENBQUosQ0FBN0I7QUFDSDs7QUFFRCxXQUFPRCxNQUFQO0FBQ0g7O0FBRU0sU0FBU1gsc0JBQVQsQ0FBaUNlLEtBQWpDLEVBQXdDQyxpQkFBaUIsRUFBekQsRUFBNkQ7QUFDaEUsUUFBSSxDQUFDRCxNQUFNRixNQUFYLEVBQ0ksT0FBTyxFQUFQOztBQUVKLFFBQUlHLGVBQWVDLElBQWYsQ0FBb0JDLFFBQVFBLFNBQVNILE1BQU0sQ0FBTixDQUFyQyxDQUFKLEVBQ0ksT0FBTyxFQUFQOztBQUVKLFFBQUlJLE9BQU9KLE1BQU1LLEtBQU4sRUFBWDs7QUFFQSxRQUFJQyxtQkFBR0MsR0FBSCxJQUFVUCxNQUFNRixNQUFoQixJQUEwQk0sS0FBS1osS0FBTCxDQUFXLFlBQVgsQ0FBOUIsRUFDSVksUUFBUSxNQUFNSixNQUFNSyxLQUFOLEVBQWQ7O0FBRUosV0FBT0QsSUFBUDtBQUNIOztBQUVNLFNBQVNsQixRQUFULENBQW1CYyxLQUFuQixFQUEwQkMsaUJBQWlCLEVBQTNDLEVBQStDO0FBQ2xELFVBQU1MLFNBQVMsRUFBZjs7QUFFQUsscUJBQWlCQSxlQUFlTyxLQUFmLEVBQWpCOztBQUVBUCxtQkFBZVEsT0FBZixDQUF1QkMsT0FBTztBQUMxQmQsZUFBT2MsR0FBUCxJQUFjLEtBQWQ7QUFDSCxLQUZEOztBQUlBLFdBQU9WLE1BQU1GLE1BQU4sSUFBZ0JHLGVBQWVILE1BQXRDLEVBQThDO0FBQzFDLFlBQUlFLE1BQU0sQ0FBTixNQUFhQyxlQUFlLENBQWYsQ0FBakIsRUFBb0M7QUFDaENMLG1CQUFPSyxlQUFlLENBQWYsQ0FBUCxJQUE0QixJQUE1Qjs7QUFFQUQsa0JBQU1LLEtBQU47QUFDSDs7QUFFREosdUJBQWVJLEtBQWY7QUFDSDs7QUFFRCxXQUFPVCxNQUFQO0FBQ0g7O0FBRU0sU0FBU1QsV0FBVCxDQUFzQk8sR0FBdEIsRUFBMkI7QUFDOUIsVUFBTWlCLHdCQUF3QmpCLElBQUlGLEtBQUosQ0FBVUosb0JBQVYsQ0FBOUI7O0FBRUEsUUFBSSxDQUFDdUIscUJBQUwsRUFDSSxPQUFPLEVBQUVDLGFBQWFsQixHQUFmLEVBQW9CbUIsVUFBVSxFQUE5QixFQUFQOztBQUVKLFdBQU87QUFDSEQscUJBQWFsQixJQUFJb0IsTUFBSixDQUFXLENBQVgsRUFBY0gsc0JBQXNCSSxLQUFwQyxDQURWO0FBRUhGLGtCQUFhbkIsSUFBSW9CLE1BQUosQ0FBV0gsc0JBQXNCSSxLQUF0QixHQUE4Qkosc0JBQXNCLENBQXRCLEVBQXlCYixNQUFsRTtBQUZWLEtBQVA7QUFJSCIsImZpbGUiOiJicm93c2VyL3Byb3ZpZGVyL3V0aWxzL2FyZ3VtZW50LXBhcnNpbmcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmaW5kIGFzIGZpbmRFbGVtZW50IH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBPUyBmcm9tICdvcy1mYW1pbHknO1xuXG5jb25zdCBDT05GSUdfVEVSTUlOQVRPUl9SRSA9IC8oXFxzK3xeKS0vO1xuXG5leHBvcnQgZnVuY3Rpb24gaGFzTWF0Y2ggKGFycmF5LCByZSkge1xuICAgIHJldHVybiAhIWZpbmRFbGVtZW50KGFycmF5LCBlbCA9PiBlbC5tYXRjaChyZSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZE1hdGNoIChhcnJheSwgcmUpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gZmluZEVsZW1lbnQoYXJyYXksIGVsID0+IGVsLm1hdGNoKHJlKSk7XG5cbiAgICByZXR1cm4gZWxlbWVudCA/IGVsZW1lbnQubWF0Y2gocmUpWzFdIDogJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc01hdGNoVHJ1ZSAoYXJyYXksIHJlKSB7XG4gICAgY29uc3QgbWF0Y2ggPSBmaW5kTWF0Y2goYXJyYXksIHJlKTtcblxuICAgIHJldHVybiBtYXRjaCAmJiBtYXRjaCAhPT0gJzAnICYmIG1hdGNoICE9PSAnZmFsc2UnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRFc2NhcGVkIChzdHIsIHNwbGl0dGVyQ2hhcikge1xuICAgIGNvbnN0IHJlc3VsdCA9IFsnJ107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoc3RyW2ldID09PSBzcGxpdHRlckNoYXIpIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKCcnKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0cltpXSA9PT0gJ1xcXFwnICYmIChzdHJbaSArIDFdID09PSAnXFxcXCcgfHwgc3RyIFtpICsgMV0gPT09IHNwbGl0dGVyQ2hhcikpXG4gICAgICAgICAgICBpKys7XG5cbiAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXSArPSBzdHJbaV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhdGhGcm9tUGFyc2VkTW9kZXMgKG1vZGVzLCBhdmFpbGFibGVNb2RlcyA9IFtdKSB7XG4gICAgaWYgKCFtb2Rlcy5sZW5ndGgpXG4gICAgICAgIHJldHVybiAnJztcblxuICAgIGlmIChhdmFpbGFibGVNb2Rlcy5zb21lKG1vZGUgPT4gbW9kZSA9PT0gbW9kZXNbMF0pKVxuICAgICAgICByZXR1cm4gJyc7XG5cbiAgICBsZXQgcGF0aCA9IG1vZGVzLnNoaWZ0KCk7XG5cbiAgICBpZiAoT1Mud2luICYmIG1vZGVzLmxlbmd0aCAmJiBwYXRoLm1hdGNoKC9eW0EtWmEtel0kLykpXG4gICAgICAgIHBhdGggKz0gJzonICsgbW9kZXMuc2hpZnQoKTtcblxuICAgIHJldHVybiBwYXRoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kZXMgKG1vZGVzLCBhdmFpbGFibGVNb2RlcyA9IFtdKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG5cbiAgICBhdmFpbGFibGVNb2RlcyA9IGF2YWlsYWJsZU1vZGVzLnNsaWNlKCk7XG5cbiAgICBhdmFpbGFibGVNb2Rlcy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gZmFsc2U7XG4gICAgfSk7XG5cbiAgICB3aGlsZSAobW9kZXMubGVuZ3RoICYmIGF2YWlsYWJsZU1vZGVzLmxlbmd0aCkge1xuICAgICAgICBpZiAobW9kZXNbMF0gPT09IGF2YWlsYWJsZU1vZGVzWzBdKSB7XG4gICAgICAgICAgICByZXN1bHRbYXZhaWxhYmxlTW9kZXNbMF1dID0gdHJ1ZTtcblxuICAgICAgICAgICAgbW9kZXMuc2hpZnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF2YWlsYWJsZU1vZGVzLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ29uZmlnIChzdHIpIHtcbiAgICBjb25zdCBjb25maWdUZXJtaW5hdG9yTWF0Y2ggPSBzdHIubWF0Y2goQ09ORklHX1RFUk1JTkFUT1JfUkUpO1xuXG4gICAgaWYgKCFjb25maWdUZXJtaW5hdG9yTWF0Y2gpXG4gICAgICAgIHJldHVybiB7IG1vZGVzU3RyaW5nOiBzdHIsIHVzZXJBcmdzOiAnJyB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbW9kZXNTdHJpbmc6IHN0ci5zdWJzdHIoMCwgY29uZmlnVGVybWluYXRvck1hdGNoLmluZGV4KSxcbiAgICAgICAgdXNlckFyZ3M6ICAgIHN0ci5zdWJzdHIoY29uZmlnVGVybWluYXRvck1hdGNoLmluZGV4ICsgY29uZmlnVGVybWluYXRvck1hdGNoWzFdLmxlbmd0aClcbiAgICB9O1xufVxuIl19