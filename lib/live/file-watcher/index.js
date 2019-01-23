'use strict';

exports.__esModule = true;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _modulesGraph = require('./modules-graph');

var _modulesGraph2 = _interopRequireDefault(_modulesGraph);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const WATCH_LOCKED_TIMEOUT = 700;

class FileWatcher extends _events2.default {
    constructor(files) {
        super();

        this.FILE_CHANGED_EVENT = 'file-changed';

        this.watchers = {};
        this.lockedFiles = {};
        this.modulesGraph = null;
        this.lastChangedFiles = [];

        files.forEach(f => this.addFile(f));
    }

    _onChanged(file) {
        const cache = require.cache;

        if (!this.modulesGraph) {
            this.modulesGraph = new _modulesGraph2.default();
            this.modulesGraph.build(cache, (0, _keys2.default)(this.watchers));
        } else {
            this.lastChangedFiles.forEach(changedFile => this.modulesGraph.rebuildNode(cache, changedFile));
            this.lastChangedFiles = [];
        }

        this.lastChangedFiles.push(file);
        this.modulesGraph.clearParentsCache(cache, file);

        this.emit(this.FILE_CHANGED_EVENT, { file });
    }

    _watch(file) {
        if (this.lockedFiles[file]) return;

        this.lockedFiles[file] = setTimeout(() => {
            this._onChanged(file);

            delete this.lockedFiles[file];
        }, WATCH_LOCKED_TIMEOUT);
    }

    addFile(file) {
        if (!this.watchers[file] && file.indexOf('node_modules') < 0) {
            if (this.modulesGraph) {
                this.lastChangedFiles.push(file);
                this.modulesGraph.addNode(file, require.cache);
            }

            this.watchers[file] = _fs2.default.watch(file, () => this._watch(file));
        }
    }
}
exports.default = FileWatcher;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXZlL2ZpbGUtd2F0Y2hlci9pbmRleC5qcyJdLCJuYW1lcyI6WyJXQVRDSF9MT0NLRURfVElNRU9VVCIsIkZpbGVXYXRjaGVyIiwiRXZlbnRFbWl0dGVyIiwiY29uc3RydWN0b3IiLCJmaWxlcyIsIkZJTEVfQ0hBTkdFRF9FVkVOVCIsIndhdGNoZXJzIiwibG9ja2VkRmlsZXMiLCJtb2R1bGVzR3JhcGgiLCJsYXN0Q2hhbmdlZEZpbGVzIiwiZm9yRWFjaCIsImYiLCJhZGRGaWxlIiwiX29uQ2hhbmdlZCIsImZpbGUiLCJjYWNoZSIsInJlcXVpcmUiLCJNb2R1bGVzR3JhcGgiLCJidWlsZCIsImNoYW5nZWRGaWxlIiwicmVidWlsZE5vZGUiLCJwdXNoIiwiY2xlYXJQYXJlbnRzQ2FjaGUiLCJlbWl0IiwiX3dhdGNoIiwic2V0VGltZW91dCIsImluZGV4T2YiLCJhZGROb2RlIiwiZnMiLCJ3YXRjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLE1BQU1BLHVCQUF1QixHQUE3Qjs7QUFFZSxNQUFNQyxXQUFOLFNBQTBCQyxnQkFBMUIsQ0FBdUM7QUFDbERDLGdCQUFhQyxLQUFiLEVBQW9CO0FBQ2hCOztBQUVBLGFBQUtDLGtCQUFMLEdBQTBCLGNBQTFCOztBQUVBLGFBQUtDLFFBQUwsR0FBd0IsRUFBeEI7QUFDQSxhQUFLQyxXQUFMLEdBQXdCLEVBQXhCO0FBQ0EsYUFBS0MsWUFBTCxHQUF3QixJQUF4QjtBQUNBLGFBQUtDLGdCQUFMLEdBQXdCLEVBQXhCOztBQUVBTCxjQUFNTSxPQUFOLENBQWNDLEtBQUssS0FBS0MsT0FBTCxDQUFhRCxDQUFiLENBQW5CO0FBQ0g7O0FBRURFLGVBQVlDLElBQVosRUFBa0I7QUFDZCxjQUFNQyxRQUFRQyxRQUFRRCxLQUF0Qjs7QUFFQSxZQUFJLENBQUMsS0FBS1AsWUFBVixFQUF3QjtBQUNwQixpQkFBS0EsWUFBTCxHQUFvQixJQUFJUyxzQkFBSixFQUFwQjtBQUNBLGlCQUFLVCxZQUFMLENBQWtCVSxLQUFsQixDQUF3QkgsS0FBeEIsRUFBK0Isb0JBQVksS0FBS1QsUUFBakIsQ0FBL0I7QUFDSCxTQUhELE1BSUs7QUFDRCxpQkFBS0csZ0JBQUwsQ0FBc0JDLE9BQXRCLENBQThCUyxlQUFlLEtBQUtYLFlBQUwsQ0FBa0JZLFdBQWxCLENBQThCTCxLQUE5QixFQUFxQ0ksV0FBckMsQ0FBN0M7QUFDQSxpQkFBS1YsZ0JBQUwsR0FBd0IsRUFBeEI7QUFDSDs7QUFFRCxhQUFLQSxnQkFBTCxDQUFzQlksSUFBdEIsQ0FBMkJQLElBQTNCO0FBQ0EsYUFBS04sWUFBTCxDQUFrQmMsaUJBQWxCLENBQW9DUCxLQUFwQyxFQUEyQ0QsSUFBM0M7O0FBRUEsYUFBS1MsSUFBTCxDQUFVLEtBQUtsQixrQkFBZixFQUFtQyxFQUFFUyxJQUFGLEVBQW5DO0FBQ0g7O0FBRURVLFdBQVFWLElBQVIsRUFBYztBQUNWLFlBQUksS0FBS1AsV0FBTCxDQUFpQk8sSUFBakIsQ0FBSixFQUNJOztBQUVKLGFBQUtQLFdBQUwsQ0FBaUJPLElBQWpCLElBQXlCVyxXQUFXLE1BQU07QUFDdEMsaUJBQUtaLFVBQUwsQ0FBZ0JDLElBQWhCOztBQUVBLG1CQUFPLEtBQUtQLFdBQUwsQ0FBaUJPLElBQWpCLENBQVA7QUFDSCxTQUp3QixFQUl0QmQsb0JBSnNCLENBQXpCO0FBS0g7O0FBRURZLFlBQVNFLElBQVQsRUFBZTtBQUNYLFlBQUksQ0FBQyxLQUFLUixRQUFMLENBQWNRLElBQWQsQ0FBRCxJQUF3QkEsS0FBS1ksT0FBTCxDQUFhLGNBQWIsSUFBK0IsQ0FBM0QsRUFBOEQ7QUFDMUQsZ0JBQUksS0FBS2xCLFlBQVQsRUFBdUI7QUFDbkIscUJBQUtDLGdCQUFMLENBQXNCWSxJQUF0QixDQUEyQlAsSUFBM0I7QUFDQSxxQkFBS04sWUFBTCxDQUFrQm1CLE9BQWxCLENBQTBCYixJQUExQixFQUFnQ0UsUUFBUUQsS0FBeEM7QUFDSDs7QUFFRCxpQkFBS1QsUUFBTCxDQUFjUSxJQUFkLElBQXNCYyxhQUFHQyxLQUFILENBQVNmLElBQVQsRUFBZSxNQUFNLEtBQUtVLE1BQUwsQ0FBWVYsSUFBWixDQUFyQixDQUF0QjtBQUNIO0FBQ0o7QUFwRGlEO2tCQUFqQ2IsVyIsImZpbGUiOiJsaXZlL2ZpbGUtd2F0Y2hlci9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgTW9kdWxlc0dyYXBoIGZyb20gJy4vbW9kdWxlcy1ncmFwaCc7XG5cbmNvbnN0IFdBVENIX0xPQ0tFRF9USU1FT1VUID0gNzAwO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlV2F0Y2hlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IgKGZpbGVzKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5GSUxFX0NIQU5HRURfRVZFTlQgPSAnZmlsZS1jaGFuZ2VkJztcblxuICAgICAgICB0aGlzLndhdGNoZXJzICAgICAgICAgPSB7fTtcbiAgICAgICAgdGhpcy5sb2NrZWRGaWxlcyAgICAgID0ge307XG4gICAgICAgIHRoaXMubW9kdWxlc0dyYXBoICAgICA9IG51bGw7XG4gICAgICAgIHRoaXMubGFzdENoYW5nZWRGaWxlcyA9IFtdO1xuXG4gICAgICAgIGZpbGVzLmZvckVhY2goZiA9PiB0aGlzLmFkZEZpbGUoZikpO1xuICAgIH1cblxuICAgIF9vbkNoYW5nZWQgKGZpbGUpIHtcbiAgICAgICAgY29uc3QgY2FjaGUgPSByZXF1aXJlLmNhY2hlO1xuXG4gICAgICAgIGlmICghdGhpcy5tb2R1bGVzR3JhcGgpIHtcbiAgICAgICAgICAgIHRoaXMubW9kdWxlc0dyYXBoID0gbmV3IE1vZHVsZXNHcmFwaCgpO1xuICAgICAgICAgICAgdGhpcy5tb2R1bGVzR3JhcGguYnVpbGQoY2FjaGUsIE9iamVjdC5rZXlzKHRoaXMud2F0Y2hlcnMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGFzdENoYW5nZWRGaWxlcy5mb3JFYWNoKGNoYW5nZWRGaWxlID0+IHRoaXMubW9kdWxlc0dyYXBoLnJlYnVpbGROb2RlKGNhY2hlLCBjaGFuZ2VkRmlsZSkpO1xuICAgICAgICAgICAgdGhpcy5sYXN0Q2hhbmdlZEZpbGVzID0gW107XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxhc3RDaGFuZ2VkRmlsZXMucHVzaChmaWxlKTtcbiAgICAgICAgdGhpcy5tb2R1bGVzR3JhcGguY2xlYXJQYXJlbnRzQ2FjaGUoY2FjaGUsIGZpbGUpO1xuXG4gICAgICAgIHRoaXMuZW1pdCh0aGlzLkZJTEVfQ0hBTkdFRF9FVkVOVCwgeyBmaWxlIH0pO1xuICAgIH1cblxuICAgIF93YXRjaCAoZmlsZSkge1xuICAgICAgICBpZiAodGhpcy5sb2NrZWRGaWxlc1tmaWxlXSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB0aGlzLmxvY2tlZEZpbGVzW2ZpbGVdID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9vbkNoYW5nZWQoZmlsZSk7XG5cbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmxvY2tlZEZpbGVzW2ZpbGVdO1xuICAgICAgICB9LCBXQVRDSF9MT0NLRURfVElNRU9VVCk7XG4gICAgfVxuXG4gICAgYWRkRmlsZSAoZmlsZSkge1xuICAgICAgICBpZiAoIXRoaXMud2F0Y2hlcnNbZmlsZV0gJiYgZmlsZS5pbmRleE9mKCdub2RlX21vZHVsZXMnKSA8IDApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZHVsZXNHcmFwaCkge1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdENoYW5nZWRGaWxlcy5wdXNoKGZpbGUpO1xuICAgICAgICAgICAgICAgIHRoaXMubW9kdWxlc0dyYXBoLmFkZE5vZGUoZmlsZSwgcmVxdWlyZS5jYWNoZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMud2F0Y2hlcnNbZmlsZV0gPSBmcy53YXRjaChmaWxlLCAoKSA9PiB0aGlzLl93YXRjaChmaWxlKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=
