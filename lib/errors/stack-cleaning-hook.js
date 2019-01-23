'use strict';

exports.__esModule = true;

var _errorStackParser = require('error-stack-parser');

var _errorStackParser2 = _interopRequireDefault(_errorStackParser);

var _createStackFilter = require('./create-stack-filter');

var _createStackFilter2 = _interopRequireDefault(_createStackFilter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ORIGINAL_STACK_TRACE_LIMIT = Error.stackTraceLimit;
const STACK_TRACE_LIMIT = 200;
const TOP_ANONYMOUS_FRAME_RE = /\s+at\s<anonymous>$/;
const GENERATOR_NEXT_FRAME_RE = /\s+at\sgenerator.next\s\(<anonymous>\)$/im;

exports.default = {
    isEnabled: false,

    _getFrames(error) {
        try {
            return _errorStackParser2.default.parse(error);
        } catch (e) {
            return [];
        }
    },

    _renderFrameInfo(frames) {
        return frames.map(frame => frame.getSource()).join('\n');
    },

    get enabled() {
        return this.isEnabled;
    },

    set enabled(val) {
        if (this.isEnabled === val) return;

        this.isEnabled = val;

        // NOTE: Babel errors may have really deep stacks,
        // so we increase stack trace capacity
        if (this.isEnabled) Error.stackTraceLimit = STACK_TRACE_LIMIT;else Error.stackTraceLimit = ORIGINAL_STACK_TRACE_LIMIT;
    },

    cleanError(error) {
        error.stack = error.stack.replace(TOP_ANONYMOUS_FRAME_RE, '');
        error.stack = error.stack.replace(GENERATOR_NEXT_FRAME_RE, '');

        let frames = this._getFrames(error);

        if (!frames.length) return error;

        error.stack = error.stack.replace(this._renderFrameInfo(frames), '');

        frames = frames.filter((0, _createStackFilter2.default)(ORIGINAL_STACK_TRACE_LIMIT));

        error.stack += this._renderFrameInfo(frames);

        return error;
    }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9lcnJvcnMvc3RhY2stY2xlYW5pbmctaG9vay5qcyJdLCJuYW1lcyI6WyJPUklHSU5BTF9TVEFDS19UUkFDRV9MSU1JVCIsIkVycm9yIiwic3RhY2tUcmFjZUxpbWl0IiwiU1RBQ0tfVFJBQ0VfTElNSVQiLCJUT1BfQU5PTllNT1VTX0ZSQU1FX1JFIiwiR0VORVJBVE9SX05FWFRfRlJBTUVfUkUiLCJpc0VuYWJsZWQiLCJfZ2V0RnJhbWVzIiwiZXJyb3IiLCJlcnJvclN0YWNrUGFyc2VyIiwicGFyc2UiLCJlIiwiX3JlbmRlckZyYW1lSW5mbyIsImZyYW1lcyIsIm1hcCIsImZyYW1lIiwiZ2V0U291cmNlIiwiam9pbiIsImVuYWJsZWQiLCJ2YWwiLCJjbGVhbkVycm9yIiwic3RhY2siLCJyZXBsYWNlIiwibGVuZ3RoIiwiZmlsdGVyIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7QUFDQTs7Ozs7O0FBR0EsTUFBTUEsNkJBQTZCQyxNQUFNQyxlQUF6QztBQUNBLE1BQU1DLG9CQUE2QixHQUFuQztBQUNBLE1BQU1DLHlCQUE2QixxQkFBbkM7QUFDQSxNQUFNQywwQkFBNkIsMkNBQW5DOztrQkFHZTtBQUNYQyxlQUFXLEtBREE7O0FBR1hDLGVBQVlDLEtBQVosRUFBbUI7QUFDZixZQUFJO0FBQ0EsbUJBQU9DLDJCQUFpQkMsS0FBakIsQ0FBdUJGLEtBQXZCLENBQVA7QUFDSCxTQUZELENBR0EsT0FBT0csQ0FBUCxFQUFVO0FBQ04sbUJBQU8sRUFBUDtBQUNIO0FBQ0osS0FWVTs7QUFZWEMscUJBQWtCQyxNQUFsQixFQUEwQjtBQUN0QixlQUFPQSxPQUFPQyxHQUFQLENBQVdDLFNBQVNBLE1BQU1DLFNBQU4sRUFBcEIsRUFBdUNDLElBQXZDLENBQTRDLElBQTVDLENBQVA7QUFDSCxLQWRVOztBQWdCWCxRQUFJQyxPQUFKLEdBQWU7QUFDWCxlQUFPLEtBQUtaLFNBQVo7QUFDSCxLQWxCVTs7QUFvQlgsUUFBSVksT0FBSixDQUFhQyxHQUFiLEVBQWtCO0FBQ2QsWUFBSSxLQUFLYixTQUFMLEtBQW1CYSxHQUF2QixFQUNJOztBQUVKLGFBQUtiLFNBQUwsR0FBaUJhLEdBQWpCOztBQUVBO0FBQ0E7QUFDQSxZQUFJLEtBQUtiLFNBQVQsRUFDSUwsTUFBTUMsZUFBTixHQUF3QkMsaUJBQXhCLENBREosS0FHSUYsTUFBTUMsZUFBTixHQUF3QkYsMEJBQXhCO0FBQ1AsS0FoQ1U7O0FBa0NYb0IsZUFBWVosS0FBWixFQUFtQjtBQUNmQSxjQUFNYSxLQUFOLEdBQWNiLE1BQU1hLEtBQU4sQ0FBWUMsT0FBWixDQUFvQmxCLHNCQUFwQixFQUE0QyxFQUE1QyxDQUFkO0FBQ0FJLGNBQU1hLEtBQU4sR0FBY2IsTUFBTWEsS0FBTixDQUFZQyxPQUFaLENBQW9CakIsdUJBQXBCLEVBQTZDLEVBQTdDLENBQWQ7O0FBRUEsWUFBSVEsU0FBUyxLQUFLTixVQUFMLENBQWdCQyxLQUFoQixDQUFiOztBQUVBLFlBQUksQ0FBQ0ssT0FBT1UsTUFBWixFQUNJLE9BQU9mLEtBQVA7O0FBRUpBLGNBQU1hLEtBQU4sR0FBY2IsTUFBTWEsS0FBTixDQUFZQyxPQUFaLENBQW9CLEtBQUtWLGdCQUFMLENBQXNCQyxNQUF0QixDQUFwQixFQUFtRCxFQUFuRCxDQUFkOztBQUVBQSxpQkFBU0EsT0FBT1csTUFBUCxDQUFjLGlDQUFrQnhCLDBCQUFsQixDQUFkLENBQVQ7O0FBRUFRLGNBQU1hLEtBQU4sSUFBZSxLQUFLVCxnQkFBTCxDQUFzQkMsTUFBdEIsQ0FBZjs7QUFFQSxlQUFPTCxLQUFQO0FBQ0g7QUFsRFUsQyIsImZpbGUiOiJlcnJvcnMvc3RhY2stY2xlYW5pbmctaG9vay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBlcnJvclN0YWNrUGFyc2VyIGZyb20gJ2Vycm9yLXN0YWNrLXBhcnNlcic7XG5pbXBvcnQgY3JlYXRlU3RhY2tGaWx0ZXIgZnJvbSAnLi9jcmVhdGUtc3RhY2stZmlsdGVyJztcblxuXG5jb25zdCBPUklHSU5BTF9TVEFDS19UUkFDRV9MSU1JVCA9IEVycm9yLnN0YWNrVHJhY2VMaW1pdDtcbmNvbnN0IFNUQUNLX1RSQUNFX0xJTUlUICAgICAgICAgID0gMjAwO1xuY29uc3QgVE9QX0FOT05ZTU9VU19GUkFNRV9SRSAgICAgPSAvXFxzK2F0XFxzPGFub255bW91cz4kLztcbmNvbnN0IEdFTkVSQVRPUl9ORVhUX0ZSQU1FX1JFICAgID0gL1xccythdFxcc2dlbmVyYXRvci5uZXh0XFxzXFwoPGFub255bW91cz5cXCkkL2ltO1xuXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBpc0VuYWJsZWQ6IGZhbHNlLFxuXG4gICAgX2dldEZyYW1lcyAoZXJyb3IpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvclN0YWNrUGFyc2VyLnBhcnNlKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9yZW5kZXJGcmFtZUluZm8gKGZyYW1lcykge1xuICAgICAgICByZXR1cm4gZnJhbWVzLm1hcChmcmFtZSA9PiBmcmFtZS5nZXRTb3VyY2UoKSkuam9pbignXFxuJyk7XG4gICAgfSxcblxuICAgIGdldCBlbmFibGVkICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNFbmFibGVkO1xuICAgIH0sXG5cbiAgICBzZXQgZW5hYmxlZCAodmFsKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRW5hYmxlZCA9PT0gdmFsKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuaXNFbmFibGVkID0gdmFsO1xuXG4gICAgICAgIC8vIE5PVEU6IEJhYmVsIGVycm9ycyBtYXkgaGF2ZSByZWFsbHkgZGVlcCBzdGFja3MsXG4gICAgICAgIC8vIHNvIHdlIGluY3JlYXNlIHN0YWNrIHRyYWNlIGNhcGFjaXR5XG4gICAgICAgIGlmICh0aGlzLmlzRW5hYmxlZClcbiAgICAgICAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCA9IFNUQUNLX1RSQUNFX0xJTUlUO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBFcnJvci5zdGFja1RyYWNlTGltaXQgPSBPUklHSU5BTF9TVEFDS19UUkFDRV9MSU1JVDtcbiAgICB9LFxuXG4gICAgY2xlYW5FcnJvciAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3Iuc3RhY2sgPSBlcnJvci5zdGFjay5yZXBsYWNlKFRPUF9BTk9OWU1PVVNfRlJBTUVfUkUsICcnKTtcbiAgICAgICAgZXJyb3Iuc3RhY2sgPSBlcnJvci5zdGFjay5yZXBsYWNlKEdFTkVSQVRPUl9ORVhUX0ZSQU1FX1JFLCAnJyk7XG5cbiAgICAgICAgbGV0IGZyYW1lcyA9IHRoaXMuX2dldEZyYW1lcyhlcnJvcik7XG5cbiAgICAgICAgaWYgKCFmcmFtZXMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIGVycm9yO1xuXG4gICAgICAgIGVycm9yLnN0YWNrID0gZXJyb3Iuc3RhY2sucmVwbGFjZSh0aGlzLl9yZW5kZXJGcmFtZUluZm8oZnJhbWVzKSwgJycpO1xuXG4gICAgICAgIGZyYW1lcyA9IGZyYW1lcy5maWx0ZXIoY3JlYXRlU3RhY2tGaWx0ZXIoT1JJR0lOQUxfU1RBQ0tfVFJBQ0VfTElNSVQpKTtcblxuICAgICAgICBlcnJvci5zdGFjayArPSB0aGlzLl9yZW5kZXJGcmFtZUluZm8oZnJhbWVzKTtcblxuICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgfVxufTtcbiJdfQ==