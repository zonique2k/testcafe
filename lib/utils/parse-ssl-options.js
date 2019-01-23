'use strict';

exports.__esModule = true;
exports.ensureOptionValue = undefined;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let ensureOptionValue = exports.ensureOptionValue = (() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function* (optionName, optionValue) {
        optionValue = convertToBestFitType(optionValue);

        return yield ensureFileOptionValue(optionName, optionValue);
    });

    return function ensureOptionValue(_x2, _x3) {
        return _ref3.apply(this, arguments);
    };
})();

let ensureFileOptionValue = (() => {
    var _ref4 = (0, _asyncToGenerator3.default)(function* (optionName, optionValue) {
        const isFileOption = FILE_OPTION_NAMES.includes(optionName) && optionValue.length < OS_MAX_PATH_LENGTH;

        if (isFileOption && (yield (0, _promisifiedFunctions.fsObjectExists)(optionValue))) optionValue = yield (0, _promisifiedFunctions.readFile)(optionValue);

        return optionValue;
    });

    return function ensureFileOptionValue(_x4, _x5) {
        return _ref4.apply(this, arguments);
    };
})();

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _promisifiedFunctions = require('./promisified-functions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const MAX_PATH_LENGTH = {
    'Linux': 4096,
    'Windows_NT': 260,
    'Darwin': 1024
};

const OS_MAX_PATH_LENGTH = MAX_PATH_LENGTH[_os2.default.type()];

const OPTIONS_SEPARATOR = ';';
const OPTION_KEY_VALUE_SEPARATOR = '=';
const FILE_OPTION_NAMES = ['cert', 'key', 'pfx'];
const NUMBER_REG_EX = /^[0-9-.,]+$/;
const BOOLEAN_STRING_VALUES = ['true', 'false'];

exports.default = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (optionsStr = '') {
        const splittedOptions = optionsStr.split(OPTIONS_SEPARATOR);

        if (!splittedOptions.length) return null;

        const parsedOptions = {};

        yield _pinkie2.default.all(splittedOptions.map((() => {
            var _ref2 = (0, _asyncToGenerator3.default)(function* (item) {
                const keyValuePair = item.split(OPTION_KEY_VALUE_SEPARATOR);
                const key = keyValuePair[0];
                let value = keyValuePair[1];

                if (!key || !value) return;

                value = yield ensureOptionValue(key, value);

                parsedOptions[key] = value;
            });

            return function (_x) {
                return _ref2.apply(this, arguments);
            };
        })()));

        return parsedOptions;
    });

    return function () {
        return _ref.apply(this, arguments);
    };
})();

function convertToBestFitType(valueStr) {
    if (typeof valueStr !== 'string') return void 0;else if (NUMBER_REG_EX.test(valueStr)) return parseFloat(valueStr);else if (BOOLEAN_STRING_VALUES.includes(valueStr)) return valueStr === 'true';else if (!valueStr.length) return void 0;

    return valueStr;
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9wYXJzZS1zc2wtb3B0aW9ucy5qcyJdLCJuYW1lcyI6WyJvcHRpb25OYW1lIiwib3B0aW9uVmFsdWUiLCJjb252ZXJ0VG9CZXN0Rml0VHlwZSIsImVuc3VyZUZpbGVPcHRpb25WYWx1ZSIsImVuc3VyZU9wdGlvblZhbHVlIiwiaXNGaWxlT3B0aW9uIiwiRklMRV9PUFRJT05fTkFNRVMiLCJpbmNsdWRlcyIsImxlbmd0aCIsIk9TX01BWF9QQVRIX0xFTkdUSCIsIk1BWF9QQVRIX0xFTkdUSCIsIm9zIiwidHlwZSIsIk9QVElPTlNfU0VQQVJBVE9SIiwiT1BUSU9OX0tFWV9WQUxVRV9TRVBBUkFUT1IiLCJOVU1CRVJfUkVHX0VYIiwiQk9PTEVBTl9TVFJJTkdfVkFMVUVTIiwib3B0aW9uc1N0ciIsInNwbGl0dGVkT3B0aW9ucyIsInNwbGl0IiwicGFyc2VkT3B0aW9ucyIsIlByb21pc2UiLCJhbGwiLCJtYXAiLCJpdGVtIiwia2V5VmFsdWVQYWlyIiwia2V5IiwidmFsdWUiLCJ2YWx1ZVN0ciIsInRlc3QiLCJwYXJzZUZsb2F0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O2dEQTBDTyxXQUFrQ0EsVUFBbEMsRUFBOENDLFdBQTlDLEVBQTJEO0FBQzlEQSxzQkFBY0MscUJBQXFCRCxXQUFyQixDQUFkOztBQUVBLGVBQU8sTUFBTUUsc0JBQXNCSCxVQUF0QixFQUFrQ0MsV0FBbEMsQ0FBYjtBQUNILEs7O29CQUpxQkcsaUI7Ozs7OztnREFNdEIsV0FBc0NKLFVBQXRDLEVBQWtEQyxXQUFsRCxFQUErRDtBQUMzRCxjQUFNSSxlQUFlQyxrQkFBa0JDLFFBQWxCLENBQTJCUCxVQUEzQixLQUEwQ0MsWUFBWU8sTUFBWixHQUFxQkMsa0JBQXBGOztBQUVBLFlBQUlKLGlCQUFnQixNQUFNLDBDQUFlSixXQUFmLENBQXRCLENBQUosRUFDSUEsY0FBYyxNQUFNLG9DQUFTQSxXQUFULENBQXBCOztBQUVKLGVBQU9BLFdBQVA7QUFDSCxLOztvQkFQY0UscUI7Ozs7O0FBaERmOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLE1BQU1PLGtCQUFrQjtBQUNwQixhQUFjLElBRE07QUFFcEIsa0JBQWMsR0FGTTtBQUdwQixjQUFjO0FBSE0sQ0FBeEI7O0FBTUEsTUFBTUQscUJBQXFCQyxnQkFBZ0JDLGFBQUdDLElBQUgsRUFBaEIsQ0FBM0I7O0FBRUEsTUFBTUMsb0JBQTZCLEdBQW5DO0FBQ0EsTUFBTUMsNkJBQTZCLEdBQW5DO0FBQ0EsTUFBTVIsb0JBQTZCLENBQUMsTUFBRCxFQUFTLEtBQVQsRUFBZ0IsS0FBaEIsQ0FBbkM7QUFDQSxNQUFNUyxnQkFBNkIsYUFBbkM7QUFDQSxNQUFNQyx3QkFBNkIsQ0FBQyxNQUFELEVBQVMsT0FBVCxDQUFuQzs7OytDQUVlLFdBQWdCQyxhQUFhLEVBQTdCLEVBQWlDO0FBQzVDLGNBQU1DLGtCQUFrQkQsV0FBV0UsS0FBWCxDQUFpQk4saUJBQWpCLENBQXhCOztBQUVBLFlBQUksQ0FBQ0ssZ0JBQWdCVixNQUFyQixFQUNJLE9BQU8sSUFBUDs7QUFFSixjQUFNWSxnQkFBZ0IsRUFBdEI7O0FBRUEsY0FBTUMsaUJBQVFDLEdBQVIsQ0FBWUosZ0JBQWdCSyxHQUFoQjtBQUFBLHdEQUFvQixXQUFNQyxJQUFOLEVBQWM7QUFDaEQsc0JBQU1DLGVBQWVELEtBQUtMLEtBQUwsQ0FBV0wsMEJBQVgsQ0FBckI7QUFDQSxzQkFBTVksTUFBZUQsYUFBYSxDQUFiLENBQXJCO0FBQ0Esb0JBQUlFLFFBQWlCRixhQUFhLENBQWIsQ0FBckI7O0FBRUEsb0JBQUksQ0FBQ0MsR0FBRCxJQUFRLENBQUNDLEtBQWIsRUFDSTs7QUFFSkEsd0JBQVEsTUFBTXZCLGtCQUFrQnNCLEdBQWxCLEVBQXVCQyxLQUF2QixDQUFkOztBQUVBUCw4QkFBY00sR0FBZCxJQUFxQkMsS0FBckI7QUFDSCxhQVhpQjs7QUFBQTtBQUFBO0FBQUE7QUFBQSxhQUFaLENBQU47O0FBYUEsZUFBT1AsYUFBUDtBQUNILEs7Ozs7Ozs7QUFpQkQsU0FBU2xCLG9CQUFULENBQStCMEIsUUFBL0IsRUFBeUM7QUFDckMsUUFBSSxPQUFPQSxRQUFQLEtBQW9CLFFBQXhCLEVBQ0ksT0FBTyxLQUFLLENBQVosQ0FESixLQUdLLElBQUliLGNBQWNjLElBQWQsQ0FBbUJELFFBQW5CLENBQUosRUFDRCxPQUFPRSxXQUFXRixRQUFYLENBQVAsQ0FEQyxLQUdBLElBQUlaLHNCQUFzQlQsUUFBdEIsQ0FBK0JxQixRQUEvQixDQUFKLEVBQ0QsT0FBT0EsYUFBYSxNQUFwQixDQURDLEtBR0EsSUFBSSxDQUFDQSxTQUFTcEIsTUFBZCxFQUNELE9BQU8sS0FBSyxDQUFaOztBQUVKLFdBQU9vQixRQUFQO0FBQ0giLCJmaWxlIjoidXRpbHMvcGFyc2Utc3NsLW9wdGlvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAncGlua2llJztcbmltcG9ydCB7IGZzT2JqZWN0RXhpc3RzLCByZWFkRmlsZSB9IGZyb20gJy4vcHJvbWlzaWZpZWQtZnVuY3Rpb25zJztcblxuY29uc3QgTUFYX1BBVEhfTEVOR1RIID0ge1xuICAgICdMaW51eCc6ICAgICAgNDA5NixcbiAgICAnV2luZG93c19OVCc6IDI2MCxcbiAgICAnRGFyd2luJzogICAgIDEwMjRcbn07XG5cbmNvbnN0IE9TX01BWF9QQVRIX0xFTkdUSCA9IE1BWF9QQVRIX0xFTkdUSFtvcy50eXBlKCldO1xuXG5jb25zdCBPUFRJT05TX1NFUEFSQVRPUiAgICAgICAgICA9ICc7JztcbmNvbnN0IE9QVElPTl9LRVlfVkFMVUVfU0VQQVJBVE9SID0gJz0nO1xuY29uc3QgRklMRV9PUFRJT05fTkFNRVMgICAgICAgICAgPSBbJ2NlcnQnLCAna2V5JywgJ3BmeCddO1xuY29uc3QgTlVNQkVSX1JFR19FWCAgICAgICAgICAgICAgPSAvXlswLTktLixdKyQvO1xuY29uc3QgQk9PTEVBTl9TVFJJTkdfVkFMVUVTICAgICAgPSBbJ3RydWUnLCAnZmFsc2UnXTtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gKG9wdGlvbnNTdHIgPSAnJykge1xuICAgIGNvbnN0IHNwbGl0dGVkT3B0aW9ucyA9IG9wdGlvbnNTdHIuc3BsaXQoT1BUSU9OU19TRVBBUkFUT1IpO1xuXG4gICAgaWYgKCFzcGxpdHRlZE9wdGlvbnMubGVuZ3RoKVxuICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IHBhcnNlZE9wdGlvbnMgPSB7fTtcblxuICAgIGF3YWl0IFByb21pc2UuYWxsKHNwbGl0dGVkT3B0aW9ucy5tYXAoYXN5bmMgaXRlbSA9PiB7XG4gICAgICAgIGNvbnN0IGtleVZhbHVlUGFpciA9IGl0ZW0uc3BsaXQoT1BUSU9OX0tFWV9WQUxVRV9TRVBBUkFUT1IpO1xuICAgICAgICBjb25zdCBrZXkgICAgICAgICAgPSBrZXlWYWx1ZVBhaXJbMF07XG4gICAgICAgIGxldCB2YWx1ZSAgICAgICAgICA9IGtleVZhbHVlUGFpclsxXTtcblxuICAgICAgICBpZiAoIWtleSB8fCAhdmFsdWUpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdmFsdWUgPSBhd2FpdCBlbnN1cmVPcHRpb25WYWx1ZShrZXksIHZhbHVlKTtcblxuICAgICAgICBwYXJzZWRPcHRpb25zW2tleV0gPSB2YWx1ZTtcbiAgICB9KSk7XG5cbiAgICByZXR1cm4gcGFyc2VkT3B0aW9ucztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZU9wdGlvblZhbHVlIChvcHRpb25OYW1lLCBvcHRpb25WYWx1ZSkge1xuICAgIG9wdGlvblZhbHVlID0gY29udmVydFRvQmVzdEZpdFR5cGUob3B0aW9uVmFsdWUpO1xuXG4gICAgcmV0dXJuIGF3YWl0IGVuc3VyZUZpbGVPcHRpb25WYWx1ZShvcHRpb25OYW1lLCBvcHRpb25WYWx1ZSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUZpbGVPcHRpb25WYWx1ZSAob3B0aW9uTmFtZSwgb3B0aW9uVmFsdWUpIHtcbiAgICBjb25zdCBpc0ZpbGVPcHRpb24gPSBGSUxFX09QVElPTl9OQU1FUy5pbmNsdWRlcyhvcHRpb25OYW1lKSAmJiBvcHRpb25WYWx1ZS5sZW5ndGggPCBPU19NQVhfUEFUSF9MRU5HVEg7XG5cbiAgICBpZiAoaXNGaWxlT3B0aW9uICYmIGF3YWl0IGZzT2JqZWN0RXhpc3RzKG9wdGlvblZhbHVlKSlcbiAgICAgICAgb3B0aW9uVmFsdWUgPSBhd2FpdCByZWFkRmlsZShvcHRpb25WYWx1ZSk7XG5cbiAgICByZXR1cm4gb3B0aW9uVmFsdWU7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUb0Jlc3RGaXRUeXBlICh2YWx1ZVN0cikge1xuICAgIGlmICh0eXBlb2YgdmFsdWVTdHIgIT09ICdzdHJpbmcnKVxuICAgICAgICByZXR1cm4gdm9pZCAwO1xuXG4gICAgZWxzZSBpZiAoTlVNQkVSX1JFR19FWC50ZXN0KHZhbHVlU3RyKSlcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsdWVTdHIpO1xuXG4gICAgZWxzZSBpZiAoQk9PTEVBTl9TVFJJTkdfVkFMVUVTLmluY2x1ZGVzKHZhbHVlU3RyKSlcbiAgICAgICAgcmV0dXJuIHZhbHVlU3RyID09PSAndHJ1ZSc7XG5cbiAgICBlbHNlIGlmICghdmFsdWVTdHIubGVuZ3RoKVxuICAgICAgICByZXR1cm4gdm9pZCAwO1xuXG4gICAgcmV0dXJuIHZhbHVlU3RyO1xufVxuXG4iXX0=
