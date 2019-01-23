'use strict';

exports.__esModule = true;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

exports.optionValueToRegExp = optionValueToRegExp;
exports.optionValueToKeyValue = optionValueToKeyValue;

var _runtime = require('../errors/runtime');

var _message = require('../errors/runtime/message');

var _message2 = _interopRequireDefault(_message);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function optionValueToRegExp(name, value) {
    if (value === void 0) return value;

    try {
        return new RegExp(value);
    } catch (err) {
        throw new _runtime.GeneralError(_message2.default.optionValueIsNotValidRegExp, name);
    }
}

function optionValueToKeyValue(name, value) {
    if (value === void 0) return value;

    const keyValue = value.split(',').reduce((obj, pair) => {
        var _pair$split = pair.split('=');

        const key = _pair$split[0],
              val = _pair$split[1];


        if (!key || !val) throw new _runtime.GeneralError(_message2.default.optionValueIsNotValidKeyValue, name);

        obj[key] = val;
        return obj;
    }, {});

    if ((0, _keys2.default)(keyValue).length === 0) throw new _runtime.GeneralError(_message2.default.optionValueIsNotValidKeyValue, name);

    return keyValue;
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb25maWd1cmF0aW9uL29wdGlvbi1jb252ZXJzaW9uLmpzIl0sIm5hbWVzIjpbIm9wdGlvblZhbHVlVG9SZWdFeHAiLCJvcHRpb25WYWx1ZVRvS2V5VmFsdWUiLCJuYW1lIiwidmFsdWUiLCJSZWdFeHAiLCJlcnIiLCJHZW5lcmFsRXJyb3IiLCJNRVNTQUdFIiwib3B0aW9uVmFsdWVJc05vdFZhbGlkUmVnRXhwIiwia2V5VmFsdWUiLCJzcGxpdCIsInJlZHVjZSIsIm9iaiIsInBhaXIiLCJrZXkiLCJ2YWwiLCJvcHRpb25WYWx1ZUlzTm90VmFsaWRLZXlWYWx1ZSIsImxlbmd0aCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFHZ0JBLG1CLEdBQUFBLG1CO1FBWUFDLHFCLEdBQUFBLHFCOztBQWZoQjs7QUFDQTs7Ozs7O0FBRU8sU0FBU0QsbUJBQVQsQ0FBOEJFLElBQTlCLEVBQW9DQyxLQUFwQyxFQUEyQztBQUM5QyxRQUFJQSxVQUFVLEtBQUssQ0FBbkIsRUFDSSxPQUFPQSxLQUFQOztBQUVKLFFBQUk7QUFDQSxlQUFPLElBQUlDLE1BQUosQ0FBV0QsS0FBWCxDQUFQO0FBQ0gsS0FGRCxDQUdBLE9BQU9FLEdBQVAsRUFBWTtBQUNSLGNBQU0sSUFBSUMscUJBQUosQ0FBaUJDLGtCQUFRQywyQkFBekIsRUFBc0ROLElBQXRELENBQU47QUFDSDtBQUNKOztBQUVNLFNBQVNELHFCQUFULENBQWdDQyxJQUFoQyxFQUFzQ0MsS0FBdEMsRUFBNkM7QUFDaEQsUUFBSUEsVUFBVSxLQUFLLENBQW5CLEVBQ0ksT0FBT0EsS0FBUDs7QUFFSixVQUFNTSxXQUFXTixNQUFNTyxLQUFOLENBQVksR0FBWixFQUFpQkMsTUFBakIsQ0FBd0IsQ0FBQ0MsR0FBRCxFQUFNQyxJQUFOLEtBQWU7QUFBQSwwQkFDakNBLEtBQUtILEtBQUwsQ0FBVyxHQUFYLENBRGlDOztBQUFBLGNBQzdDSSxHQUQ2QztBQUFBLGNBQ3hDQyxHQUR3Qzs7O0FBR3BELFlBQUksQ0FBQ0QsR0FBRCxJQUFRLENBQUNDLEdBQWIsRUFDSSxNQUFNLElBQUlULHFCQUFKLENBQWlCQyxrQkFBUVMsNkJBQXpCLEVBQXdEZCxJQUF4RCxDQUFOOztBQUVKVSxZQUFJRSxHQUFKLElBQVdDLEdBQVg7QUFDQSxlQUFPSCxHQUFQO0FBQ0gsS0FSZ0IsRUFRZCxFQVJjLENBQWpCOztBQVVBLFFBQUksb0JBQVlILFFBQVosRUFBc0JRLE1BQXRCLEtBQWlDLENBQXJDLEVBQ0ksTUFBTSxJQUFJWCxxQkFBSixDQUFpQkMsa0JBQVFTLDZCQUF6QixFQUF3RGQsSUFBeEQsQ0FBTjs7QUFFSixXQUFPTyxRQUFQO0FBQ0giLCJmaWxlIjoiY29uZmlndXJhdGlvbi9vcHRpb24tY29udmVyc2lvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdlbmVyYWxFcnJvciB9IGZyb20gJy4uL2Vycm9ycy9ydW50aW1lJztcbmltcG9ydCBNRVNTQUdFIGZyb20gJy4uL2Vycm9ycy9ydW50aW1lL21lc3NhZ2UnO1xuXG5leHBvcnQgZnVuY3Rpb24gb3B0aW9uVmFsdWVUb1JlZ0V4cCAobmFtZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHZvaWQgMClcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodmFsdWUpO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoTUVTU0FHRS5vcHRpb25WYWx1ZUlzTm90VmFsaWRSZWdFeHAsIG5hbWUpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9wdGlvblZhbHVlVG9LZXlWYWx1ZSAobmFtZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHZvaWQgMClcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuXG4gICAgY29uc3Qga2V5VmFsdWUgPSB2YWx1ZS5zcGxpdCgnLCcpLnJlZHVjZSgob2JqLCBwYWlyKSA9PiB7XG4gICAgICAgIGNvbnN0IFtrZXksIHZhbF0gPSBwYWlyLnNwbGl0KCc9Jyk7XG5cbiAgICAgICAgaWYgKCFrZXkgfHwgIXZhbClcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoTUVTU0FHRS5vcHRpb25WYWx1ZUlzTm90VmFsaWRLZXlWYWx1ZSwgbmFtZSk7XG5cbiAgICAgICAgb2JqW2tleV0gPSB2YWw7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfSwge30pO1xuXG4gICAgaWYgKE9iamVjdC5rZXlzKGtleVZhbHVlKS5sZW5ndGggPT09IDApXG4gICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoTUVTU0FHRS5vcHRpb25WYWx1ZUlzTm90VmFsaWRLZXlWYWx1ZSwgbmFtZSk7XG5cbiAgICByZXR1cm4ga2V5VmFsdWU7XG59XG4iXX0=
