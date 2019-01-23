'use strict';

exports.__esModule = true;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _promisifiedFunctions = require('../utils/promisified-functions');

var _option = require('./option');

var _option2 = _interopRequireDefault(_option);

var _optionSource = require('./option-source');

var _optionSource2 = _interopRequireDefault(_optionSource);

var _lodash = require('lodash');

var _parseSslOptions = require('../utils/parse-ssl-options');

var _optionNames = require('./option-names');

var _optionNames2 = _interopRequireDefault(_optionNames);

var _getFilterFn = require('../utils/get-filter-fn');

var _getFilterFn2 = _interopRequireDefault(_getFilterFn);

var _resolvePathRelativelyCwd = require('../utils/resolve-path-relatively-cwd');

var _resolvePathRelativelyCwd2 = _interopRequireDefault(_resolvePathRelativelyCwd);

var _json = require('json5');

var _json2 = _interopRequireDefault(_json);

var _warningMessage = require('../notifications/warning-message');

var _warningMessage2 = _interopRequireDefault(_warningMessage);

var _renderTemplate = require('../utils/render-template');

var _renderTemplate2 = _interopRequireDefault(_renderTemplate);

var _prepareReporters = require('../utils/prepare-reporters');

var _prepareReporters2 = _interopRequireDefault(_prepareReporters);

var _defaultValues = require('./default-values');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CONFIGURATION_FILENAME = '.testcaferc.json';

const OPTION_FLAG_NAMES = [_optionNames2.default.skipJsErrors, _optionNames2.default.disablePageReloads, _optionNames2.default.quarantineMode, _optionNames2.default.debugMode, _optionNames2.default.debugOnFail, _optionNames2.default.skipUncaughtErrors, _optionNames2.default.stopOnFirstFail, _optionNames2.default.disableTestSyntaxValidation, _optionNames2.default.takeScreenshotsOnFails];

class Configuration {
    constructor() {
        this._options = {};
        this._filePath = (0, _resolvePathRelativelyCwd2.default)(CONFIGURATION_FILENAME);
        this._overridenOptions = [];
    }

    static _fromObj(obj) {
        const result = (0, _create2.default)(null);

        (0, _entries2.default)(obj).forEach(([key, value]) => {
            const option = new _option2.default(key, value);

            result[key] = option;
        });

        return result;
    }

    _load() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (!(yield (0, _promisifiedFunctions.fsObjectExists)(_this.filePath))) return;

            let configurationFileContent = null;

            try {
                configurationFileContent = yield (0, _promisifiedFunctions.readFile)(_this.filePath);
            } catch (e) {
                console.log(_warningMessage2.default.errorReadConfigFile); // eslint-disable-line no-console
            }

            try {
                const optionsObj = _json2.default.parse(configurationFileContent);

                _this._options = Configuration._fromObj(optionsObj);
            } catch (e) {
                console.log(_warningMessage2.default.errorConfigFileCannotBeParsed); // eslint-disable-line no-console
            }

            yield _this._normalizeOptionsAfterLoad();
        })();
    }

    _normalizeOptionsAfterLoad() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            yield _this2._prepareSslOptions();
            _this2._prepareFilterFn();
            _this2._ensureArrayOption(_optionNames2.default.src);
            _this2._ensureArrayOption(_optionNames2.default.browsers);
            _this2._prepareReporters();
        })();
    }

    _ensureArrayOption(name) {
        const options = this._options[name];

        if (!options) return;

        options.value = (0, _lodash.castArray)(options.value);
    }

    _prepareFilterFn() {
        const filterOption = this._ensureOption(_optionNames2.default.filter, null);

        if (!filterOption.value) return;

        filterOption.value = (0, _getFilterFn2.default)(filterOption.value);
    }

    _prepareReporters() {
        const reporterOption = this._options[_optionNames2.default.reporter];

        if (!reporterOption) return;

        const optionValue = (0, _lodash.castArray)(reporterOption.value);

        reporterOption.value = (0, _prepareReporters2.default)(optionValue);
    }

    _prepareSslOptions() {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const sslOptions = _this3._options[_optionNames2.default.ssl];

            if (!sslOptions) return;

            yield _pinkie2.default.all((0, _entries2.default)(sslOptions.value).map((() => {
                var _ref = (0, _asyncToGenerator3.default)(function* ([key, value]) {
                    sslOptions.value[key] = yield (0, _parseSslOptions.ensureOptionValue)(key, value);
                });

                return function (_x) {
                    return _ref.apply(this, arguments);
                };
            })()));
        })();
    }

    _ensureOption(name, value, source) {
        let option = null;

        if (name in this._options) option = this._options[name];else {
            option = new _option2.default(name, value, source);

            this._options[name] = option;
        }

        return option;
    }

    _ensureOptionWithValue(name, defaultValue, source) {
        const option = this._ensureOption(name, defaultValue, source);

        if (option.value !== void 0) return;

        option.value = defaultValue;
        option.source = source;
    }

    init(options = {}) {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            yield _this4._load();
            _this4.mergeOptions(options);
        })();
    }

    mergeOptions(options) {
        (0, _entries2.default)(options).map(([key, value]) => {
            const option = this._ensureOption(key, value, _optionSource2.default.input);

            if (value === void 0) return;

            if (option.value !== value && option.source === _optionSource2.default.configuration) this._overridenOptions.push(key);

            option.value = value;
            option.source = _optionSource2.default.input;
        });
    }

    _prepareFlags() {
        OPTION_FLAG_NAMES.forEach(name => {
            const option = this._ensureOption(name, void 0, _optionSource2.default.configuration);

            option.value = !!option.value;
        });
    }

    _setDefaultValues() {
        this._ensureOptionWithValue(_optionNames2.default.selectorTimeout, _defaultValues.DEFAULT_TIMEOUT.selector, _optionSource2.default.configuration);
        this._ensureOptionWithValue(_optionNames2.default.assertionTimeout, _defaultValues.DEFAULT_TIMEOUT.assertion, _optionSource2.default.configuration);
        this._ensureOptionWithValue(_optionNames2.default.pageLoadTimeout, _defaultValues.DEFAULT_TIMEOUT.pageLoad, _optionSource2.default.configuration);
        this._ensureOptionWithValue(_optionNames2.default.speed, _defaultValues.DEFAULT_SPEED_VALUE, _optionSource2.default.configuration);
        this._ensureOptionWithValue(_optionNames2.default.appInitDelay, _defaultValues.DEFAULT_APP_INIT_DELAY, _optionSource2.default.configuration);
        this._ensureOptionWithValue(_optionNames2.default.concurrency, _defaultValues.DEFAULT_CONCURRENCY_VALUE, _optionSource2.default.configuration);
    }

    prepare() {
        this._prepareFlags();
        this._setDefaultValues();
    }

    notifyAboutOverridenOptions() {
        if (!this._overridenOptions.length) return;

        const optionsStr = this._overridenOptions.map(option => `"${option}"`).join(', ');
        const optionsSuffix = this._overridenOptions.length > 1 ? 's' : '';

        console.log((0, _renderTemplate2.default)(_warningMessage2.default.configOptionsWereOverriden, optionsStr, optionsSuffix)); // eslint-disable-line no-console

        this._overridenOptions = [];
    }

    getOption(key) {
        if (!key) return void 0;

        const option = this._options[key];

        if (!option) return void 0;

        return option.value;
    }

    getOptions() {
        const result = (0, _create2.default)(null);

        (0, _entries2.default)(this._options).forEach(([name, option]) => {
            result[name] = option.value;
        });

        return result;
    }

    clone() {
        return (0, _lodash.cloneDeep)(this);
    }

    get startOptions() {
        const result = {
            hostname: this.getOption('hostname'),
            port1: this.getOption('port1'),
            port2: this.getOption('port2'),
            options: {
                ssl: this.getOption('ssl'),
                developmentMode: this.getOption('developmentMode'),
                retryTestPages: !!this.getOption('retryTestPages')
            }
        };

        if (result.options.retryTestPages) result.options.staticContentCaching = _defaultValues.STATIC_CONTENT_CACHING_SETTINGS;

        return result;
    }

    get filePath() {
        return this._filePath;
    }
}
exports.default = Configuration;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb25maWd1cmF0aW9uL2luZGV4LmpzIl0sIm5hbWVzIjpbIkNPTkZJR1VSQVRJT05fRklMRU5BTUUiLCJPUFRJT05fRkxBR19OQU1FUyIsIk9QVElPTl9OQU1FUyIsInNraXBKc0Vycm9ycyIsImRpc2FibGVQYWdlUmVsb2FkcyIsInF1YXJhbnRpbmVNb2RlIiwiZGVidWdNb2RlIiwiZGVidWdPbkZhaWwiLCJza2lwVW5jYXVnaHRFcnJvcnMiLCJzdG9wT25GaXJzdEZhaWwiLCJkaXNhYmxlVGVzdFN5bnRheFZhbGlkYXRpb24iLCJ0YWtlU2NyZWVuc2hvdHNPbkZhaWxzIiwiQ29uZmlndXJhdGlvbiIsImNvbnN0cnVjdG9yIiwiX29wdGlvbnMiLCJfZmlsZVBhdGgiLCJfb3ZlcnJpZGVuT3B0aW9ucyIsIl9mcm9tT2JqIiwib2JqIiwicmVzdWx0IiwiZm9yRWFjaCIsImtleSIsInZhbHVlIiwib3B0aW9uIiwiT3B0aW9uIiwiX2xvYWQiLCJmaWxlUGF0aCIsImNvbmZpZ3VyYXRpb25GaWxlQ29udGVudCIsImUiLCJjb25zb2xlIiwibG9nIiwid2FybmluZ01lc3NhZ2UiLCJlcnJvclJlYWRDb25maWdGaWxlIiwib3B0aW9uc09iaiIsIkpTT041IiwicGFyc2UiLCJlcnJvckNvbmZpZ0ZpbGVDYW5ub3RCZVBhcnNlZCIsIl9ub3JtYWxpemVPcHRpb25zQWZ0ZXJMb2FkIiwiX3ByZXBhcmVTc2xPcHRpb25zIiwiX3ByZXBhcmVGaWx0ZXJGbiIsIl9lbnN1cmVBcnJheU9wdGlvbiIsInNyYyIsImJyb3dzZXJzIiwiX3ByZXBhcmVSZXBvcnRlcnMiLCJuYW1lIiwib3B0aW9ucyIsImZpbHRlck9wdGlvbiIsIl9lbnN1cmVPcHRpb24iLCJmaWx0ZXIiLCJyZXBvcnRlck9wdGlvbiIsInJlcG9ydGVyIiwib3B0aW9uVmFsdWUiLCJzc2xPcHRpb25zIiwic3NsIiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsInNvdXJjZSIsIl9lbnN1cmVPcHRpb25XaXRoVmFsdWUiLCJkZWZhdWx0VmFsdWUiLCJpbml0IiwibWVyZ2VPcHRpb25zIiwib3B0aW9uU291cmNlIiwiaW5wdXQiLCJjb25maWd1cmF0aW9uIiwicHVzaCIsIl9wcmVwYXJlRmxhZ3MiLCJfc2V0RGVmYXVsdFZhbHVlcyIsInNlbGVjdG9yVGltZW91dCIsIkRFRkFVTFRfVElNRU9VVCIsInNlbGVjdG9yIiwiYXNzZXJ0aW9uVGltZW91dCIsImFzc2VydGlvbiIsInBhZ2VMb2FkVGltZW91dCIsInBhZ2VMb2FkIiwic3BlZWQiLCJERUZBVUxUX1NQRUVEX1ZBTFVFIiwiYXBwSW5pdERlbGF5IiwiREVGQVVMVF9BUFBfSU5JVF9ERUxBWSIsImNvbmN1cnJlbmN5IiwiREVGQVVMVF9DT05DVVJSRU5DWV9WQUxVRSIsInByZXBhcmUiLCJub3RpZnlBYm91dE92ZXJyaWRlbk9wdGlvbnMiLCJsZW5ndGgiLCJvcHRpb25zU3RyIiwiam9pbiIsIm9wdGlvbnNTdWZmaXgiLCJjb25maWdPcHRpb25zV2VyZU92ZXJyaWRlbiIsImdldE9wdGlvbiIsImdldE9wdGlvbnMiLCJjbG9uZSIsInN0YXJ0T3B0aW9ucyIsImhvc3RuYW1lIiwicG9ydDEiLCJwb3J0MiIsImRldmVsb3BtZW50TW9kZSIsInJldHJ5VGVzdFBhZ2VzIiwic3RhdGljQ29udGVudENhY2hpbmciLCJTVEFUSUNfQ09OVEVOVF9DQUNISU5HX1NFVFRJTkdTIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQVFBLE1BQU1BLHlCQUF5QixrQkFBL0I7O0FBRUEsTUFBTUMsb0JBQW9CLENBQ3RCQyxzQkFBYUMsWUFEUyxFQUV0QkQsc0JBQWFFLGtCQUZTLEVBR3RCRixzQkFBYUcsY0FIUyxFQUl0Qkgsc0JBQWFJLFNBSlMsRUFLdEJKLHNCQUFhSyxX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QkFBZSxLQUFLTCxRQUFwQixFQUE4Qk0sT0FBOUIsQ0FBc0MsQ0FBQyxDQUFDd0IsSUFBRCxFQUFPckIsTUFBUCxDQUFELEtBQW9CO0FBQ3RESixtQkFBT3lCLElBQVAsSUFBZXJCLE9BQU9ELEtBQXRCO0FBQ0gsU0FGRDs7QUFJQSxlQUFPSCxNQUFQO0FBQ0g7O0FBRUR1RSxZQUFTO0FBQ0wsZUFBTyx1QkFBVSxJQUFWLENBQVA7QUFDSDs7QUFFRCxRQUFJQyxZQUFKLEdBQW9CO0FBQ2hCLGNBQU14RSxTQUFTO0FBQ1h5RSxzQkFBVSxLQUFLSixTQUFMLENBQWUsVUFBZixDQURDO0FBRVhLLG1CQUFVLEtBQUtMLFNBQUwsQ0FBZSxPQUFmLENBRkM7QUFHWE0sbUJBQVUsS0FBS04sU0FBTCxDQUFlLE9BQWYsQ0FIQztBQUlYM0MscUJBQVU7QUFDTlEscUJBQWlCLEtBQUttQyxTQUFMLENBQWUsS0FBZixDQURYO0FBRU5PLGlDQUFpQixLQUFLUCxTQUFMLENBQWUsaUJBQWYsQ0FGWDtBQUdOUSxnQ0FBaUIsQ0FBQyxDQUFDLEtBQUtSLFNBQUwsQ0FBZSxnQkFBZjtBQUhiO0FBSkMsU0FBZjs7QUFXQSxZQUFJckUsT0FBTzBCLE9BQVAsQ0FBZW1ELGNBQW5CLEVBQ0k3RSxPQUFPMEIsT0FBUCxDQUFlb0Qsb0JBQWYsR0FBc0NDLDhDQUF0Qzs7QUFFSixlQUFPL0UsTUFBUDtBQUNIOztBQUVELFFBQUlPLFFBQUosR0FBZ0I7QUFDWixlQUFPLEtBQUtYLFNBQVo7QUFDSDtBQXpOOEI7a0JBQWRILGEiLCJmaWxlIjoiY29uZmlndXJhdGlvbi9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQcm9taXNlIGZyb20gJ3BpbmtpZSc7XG5pbXBvcnQgeyBmc09iamVjdEV4aXN0cywgcmVhZEZpbGUgfSBmcm9tICcuLi91dGlscy9wcm9taXNpZmllZC1mdW5jdGlvbnMnO1xuaW1wb3J0IE9wdGlvbiBmcm9tICcuL29wdGlvbic7XG5pbXBvcnQgb3B0aW9uU291cmNlIGZyb20gJy4vb3B0aW9uLXNvdXJjZSc7XG5pbXBvcnQgeyBjbG9uZURlZXAsIGNhc3RBcnJheSB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBlbnN1cmVPcHRpb25WYWx1ZSBhcyBlbnN1cmVTc2xPcHRpb25WYWx1ZSB9IGZyb20gJy4uL3V0aWxzL3BhcnNlLXNzbC1vcHRpb25zJztcbmltcG9ydCBPUFRJT05fTkFNRVMgZnJvbSAnLi9vcHRpb24tbmFtZXMnO1xuaW1wb3J0IGdldEZpbHRlckZuIGZyb20gJy4uL3V0aWxzL2dldC1maWx0ZXItZm4nO1xuaW1wb3J0IHJlc29sdmVQYXRoUmVsYXRpdmVseUN3ZCBmcm9tICcuLi91dGlscy9yZXNvbHZlLXBhdGgtcmVsYXRpdmVseS1jd2QnO1xuaW1wb3J0IEpTT041IGZyb20gJ2pzb241JztcbmltcG9ydCB3YXJuaW5nTWVzc2FnZSBmcm9tICcuLi9ub3RpZmljYXRpb25zL3dhcm5pbmctbWVzc2FnZSc7XG5pbXBvcnQgcmVuZGVyVGVtcGxhdGUgZnJvbSAnLi4vdXRpbHMvcmVuZGVyLXRlbXBsYXRlJztcbmltcG9ydCBwcmVwYXJlUmVwb3J0ZXJzIGZyb20gJy4uL3V0aWxzL3ByZXBhcmUtcmVwb3J0ZXJzJztcbmltcG9ydCB7XG4gICAgREVGQVVMVF9USU1FT1VULFxuICAgIERFRkFVTFRfU1BFRURfVkFMVUUsXG4gICAgU1RBVElDX0NPTlRFTlRfQ0FDSElOR19TRVRUSU5HUyxcbiAgICBERUZBVUxUX0FQUF9JTklUX0RFTEFZLFxuICAgIERFRkFVTFRfQ09OQ1VSUkVOQ1lfVkFMVUVcbn0gZnJvbSAnLi9kZWZhdWx0LXZhbHVlcyc7XG5cbmNvbnN0IENPTkZJR1VSQVRJT05fRklMRU5BTUUgPSAnLnRlc3RjYWZlcmMuanNvbic7XG5cbmNvbnN0IE9QVElPTl9GTEFHX05BTUVTID0gW1xuICAgIE9QVElPTl9OQU1FUy5za2lwSnNFcnJvcnMsXG4gICAgT1BUSU9OX05BTUVTLmRpc2FibGVQYWdlUmVsb2FkcyxcbiAgICBPUFRJT05fTkFNRVMucXVhcmFudGluZU1vZGUsXG4gICAgT1BUSU9OX05BTUVTLmRlYnVnTW9kZSxcbiAgICBPUFRJT05fTkFNRVMuZGVidWdPbkZhaWwsXG4gICAgT1BUSU9OX05BTUVTLnNraXBVbmNhdWdodEVycm9ycyxcbiAgICBPUFRJT05fTkFNRVMuc3RvcE9uRmlyc3RGYWlsLFxuICAgIE9QVElPTl9OQU1FUy5kaXNhYmxlVGVzdFN5bnRheFZhbGlkYXRpb24sXG4gICAgT1BUSU9OX05BTUVTLnRha2VTY3JlZW5zaG90c09uRmFpbHNcbl07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbmZpZ3VyYXRpb24ge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5fb3B0aW9ucyAgPSB7fTtcbiAgICAgICAgdGhpcy5fZmlsZVBhdGggPSByZXNvbHZlUGF0aFJlbGF0aXZlbHlDd2QoQ09ORklHVVJBVElPTl9GSUxFTkFNRSk7XG4gICAgICAgIHRoaXMuX292ZXJyaWRlbk9wdGlvbnMgPSBbXTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX2Zyb21PYmogKG9iaikge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKG9iaikuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSBuZXcgT3B0aW9uKGtleSwgdmFsdWUpO1xuXG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IG9wdGlvbjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBhc3luYyBfbG9hZCAoKSB7XG4gICAgICAgIGlmICghYXdhaXQgZnNPYmplY3RFeGlzdHModGhpcy5maWxlUGF0aCkpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgbGV0IGNvbmZpZ3VyYXRpb25GaWxlQ29udGVudCA9IG51bGw7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25GaWxlQ29udGVudCA9IGF3YWl0IHJlYWRGaWxlKHRoaXMuZmlsZVBhdGgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh3YXJuaW5nTWVzc2FnZS5lcnJvclJlYWRDb25maWdGaWxlKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uc09iaiA9IEpTT041LnBhcnNlKGNvbmZpZ3VyYXRpb25GaWxlQ29udGVudCk7XG5cbiAgICAgICAgICAgIHRoaXMuX29wdGlvbnMgPSBDb25maWd1cmF0aW9uLl9mcm9tT2JqKG9wdGlvbnNPYmopO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh3YXJuaW5nTWVzc2FnZS5lcnJvckNvbmZpZ0ZpbGVDYW5ub3RCZVBhcnNlZCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fbm9ybWFsaXplT3B0aW9uc0FmdGVyTG9hZCgpO1xuICAgIH1cblxuICAgIGFzeW5jIF9ub3JtYWxpemVPcHRpb25zQWZ0ZXJMb2FkICgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5fcHJlcGFyZVNzbE9wdGlvbnMoKTtcbiAgICAgICAgdGhpcy5fcHJlcGFyZUZpbHRlckZuKCk7XG4gICAgICAgIHRoaXMuX2Vuc3VyZUFycmF5T3B0aW9uKE9QVElPTl9OQU1FUy5zcmMpO1xuICAgICAgICB0aGlzLl9lbnN1cmVBcnJheU9wdGlvbihPUFRJT05fTkFNRVMuYnJvd3NlcnMpO1xuICAgICAgICB0aGlzLl9wcmVwYXJlUmVwb3J0ZXJzKCk7XG4gICAgfVxuXG4gICAgX2Vuc3VyZUFycmF5T3B0aW9uIChuYW1lKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLl9vcHRpb25zW25hbWVdO1xuXG4gICAgICAgIGlmICghb3B0aW9ucylcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBvcHRpb25zLnZhbHVlID0gY2FzdEFycmF5KG9wdGlvbnMudmFsdWUpO1xuICAgIH1cblxuICAgIF9wcmVwYXJlRmlsdGVyRm4gKCkge1xuICAgICAgICBjb25zdCBmaWx0ZXJPcHRpb24gPSB0aGlzLl9lbnN1cmVPcHRpb24oT1BUSU9OX05BTUVTLmZpbHRlciwgbnVsbCk7XG5cbiAgICAgICAgaWYgKCFmaWx0ZXJPcHRpb24udmFsdWUpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgZmlsdGVyT3B0aW9uLnZhbHVlID0gZ2V0RmlsdGVyRm4oZmlsdGVyT3B0aW9uLnZhbHVlKTtcbiAgICB9XG5cbiAgICBfcHJlcGFyZVJlcG9ydGVycyAoKSB7XG4gICAgICAgIGNvbnN0IHJlcG9ydGVyT3B0aW9uID0gdGhpcy5fb3B0aW9uc1tPUFRJT05fTkFNRVMucmVwb3J0ZXJdO1xuXG4gICAgICAgIGlmICghcmVwb3J0ZXJPcHRpb24pXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgY29uc3Qgb3B0aW9uVmFsdWUgPSBjYXN0QXJyYXkocmVwb3J0ZXJPcHRpb24udmFsdWUpO1xuXG4gICAgICAgIHJlcG9ydGVyT3B0aW9uLnZhbHVlID0gcHJlcGFyZVJlcG9ydGVycyhvcHRpb25WYWx1ZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgX3ByZXBhcmVTc2xPcHRpb25zICgpIHtcbiAgICAgICAgY29uc3Qgc3NsT3B0aW9ucyA9IHRoaXMuX29wdGlvbnNbT1BUSU9OX05BTUVTLnNzbF07XG5cbiAgICAgICAgaWYgKCFzc2xPcHRpb25zKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKE9iamVjdC5lbnRyaWVzKHNzbE9wdGlvbnMudmFsdWUpLm1hcChhc3luYyAoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICBzc2xPcHRpb25zLnZhbHVlW2tleV0gPSBhd2FpdCBlbnN1cmVTc2xPcHRpb25WYWx1ZShrZXksIHZhbHVlKTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIF9lbnN1cmVPcHRpb24gKG5hbWUsIHZhbHVlLCBzb3VyY2UpIHtcbiAgICAgICAgbGV0IG9wdGlvbiA9IG51bGw7XG5cbiAgICAgICAgaWYgKG5hbWUgaW4gdGhpcy5fb3B0aW9ucylcbiAgICAgICAgICAgIG9wdGlvbiA9IHRoaXMuX29wdGlvbnNbbmFtZV07XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb3B0aW9uID0gbmV3IE9wdGlvbihuYW1lLCB2YWx1ZSwgc291cmNlKTtcblxuICAgICAgICAgICAgdGhpcy5fb3B0aW9uc1tuYW1lXSA9IG9wdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvcHRpb247XG4gICAgfVxuXG4gICAgX2Vuc3VyZU9wdGlvbldpdGhWYWx1ZSAobmFtZSwgZGVmYXVsdFZhbHVlLCBzb3VyY2UpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gdGhpcy5fZW5zdXJlT3B0aW9uKG5hbWUsIGRlZmF1bHRWYWx1ZSwgc291cmNlKTtcblxuICAgICAgICBpZiAob3B0aW9uLnZhbHVlICE9PSB2b2lkIDApXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgb3B0aW9uLnZhbHVlICA9IGRlZmF1bHRWYWx1ZTtcbiAgICAgICAgb3B0aW9uLnNvdXJjZSA9IHNvdXJjZTtcbiAgICB9XG5cbiAgICBhc3luYyBpbml0IChvcHRpb25zID0ge30pIHtcbiAgICAgICAgYXdhaXQgdGhpcy5fbG9hZCgpO1xuICAgICAgICB0aGlzLm1lcmdlT3B0aW9ucyhvcHRpb25zKTtcbiAgICB9XG5cbiAgICBtZXJnZU9wdGlvbnMgKG9wdGlvbnMpIHtcbiAgICAgICAgT2JqZWN0LmVudHJpZXMob3B0aW9ucykubWFwKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IHRoaXMuX2Vuc3VyZU9wdGlvbihrZXksIHZhbHVlLCBvcHRpb25Tb3VyY2UuaW5wdXQpO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHZvaWQgMClcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChvcHRpb24udmFsdWUgIT09IHZhbHVlICYmXG4gICAgICAgICAgICAgICAgb3B0aW9uLnNvdXJjZSA9PT0gb3B0aW9uU291cmNlLmNvbmZpZ3VyYXRpb24pXG4gICAgICAgICAgICAgICAgdGhpcy5fb3ZlcnJpZGVuT3B0aW9ucy5wdXNoKGtleSk7XG5cbiAgICAgICAgICAgIG9wdGlvbi52YWx1ZSAgPSB2YWx1ZTtcbiAgICAgICAgICAgIG9wdGlvbi5zb3VyY2UgPSBvcHRpb25Tb3VyY2UuaW5wdXQ7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9wcmVwYXJlRmxhZ3MgKCkge1xuICAgICAgICBPUFRJT05fRkxBR19OQU1FUy5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gdGhpcy5fZW5zdXJlT3B0aW9uKG5hbWUsIHZvaWQgMCwgb3B0aW9uU291cmNlLmNvbmZpZ3VyYXRpb24pO1xuXG4gICAgICAgICAgICBvcHRpb24udmFsdWUgPSAhIW9wdGlvbi52YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX3NldERlZmF1bHRWYWx1ZXMgKCkge1xuICAgICAgICB0aGlzLl9lbnN1cmVPcHRpb25XaXRoVmFsdWUoT1BUSU9OX05BTUVTLnNlbGVjdG9yVGltZW91dCwgREVGQVVMVF9USU1FT1VULnNlbGVjdG9yLCBvcHRpb25Tb3VyY2UuY29uZmlndXJhdGlvbik7XG4gICAgICAgIHRoaXMuX2Vuc3VyZU9wdGlvbldpdGhWYWx1ZShPUFRJT05fTkFNRVMuYXNzZXJ0aW9uVGltZW91dCwgREVGQVVMVF9USU1FT1VULmFzc2VydGlvbiwgb3B0aW9uU291cmNlLmNvbmZpZ3VyYXRpb24pO1xuICAgICAgICB0aGlzLl9lbnN1cmVPcHRpb25XaXRoVmFsdWUoT1BUSU9OX05BTUVTLnBhZ2VMb2FkVGltZW91dCwgREVGQVVMVF9USU1FT1VULnBhZ2VMb2FkLCBvcHRpb25Tb3VyY2UuY29uZmlndXJhdGlvbik7XG4gICAgICAgIHRoaXMuX2Vuc3VyZU9wdGlvbldpdGhWYWx1ZShPUFRJT05fTkFNRVMuc3BlZWQsIERFRkFVTFRfU1BFRURfVkFMVUUsIG9wdGlvblNvdXJjZS5jb25maWd1cmF0aW9uKTtcbiAgICAgICAgdGhpcy5fZW5zdXJlT3B0aW9uV2l0aFZhbHVlKE9QVElPTl9OQU1FUy5hcHBJbml0RGVsYXksIERFRkFVTFRfQVBQX0lOSVRfREVMQVksIG9wdGlvblNvdXJjZS5jb25maWd1cmF0aW9uKTtcbiAgICAgICAgdGhpcy5fZW5zdXJlT3B0aW9uV2l0aFZhbHVlKE9QVElPTl9OQU1FUy5jb25jdXJyZW5jeSwgREVGQVVMVF9DT05DVVJSRU5DWV9WQUxVRSwgb3B0aW9uU291cmNlLmNvbmZpZ3VyYXRpb24pO1xuICAgIH1cblxuICAgIHByZXBhcmUgKCkge1xuICAgICAgICB0aGlzLl9wcmVwYXJlRmxhZ3MoKTtcbiAgICAgICAgdGhpcy5fc2V0RGVmYXVsdFZhbHVlcygpO1xuICAgIH1cblxuICAgIG5vdGlmeUFib3V0T3ZlcnJpZGVuT3B0aW9ucyAoKSB7XG4gICAgICAgIGlmICghdGhpcy5fb3ZlcnJpZGVuT3B0aW9ucy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgY29uc3Qgb3B0aW9uc1N0ciAgICA9IHRoaXMuX292ZXJyaWRlbk9wdGlvbnMubWFwKG9wdGlvbiA9PiBgXCIke29wdGlvbn1cImApLmpvaW4oJywgJyk7XG4gICAgICAgIGNvbnN0IG9wdGlvbnNTdWZmaXggPSB0aGlzLl9vdmVycmlkZW5PcHRpb25zLmxlbmd0aCA+IDEgPyAncycgOiAnJztcblxuICAgICAgICBjb25zb2xlLmxvZyhyZW5kZXJUZW1wbGF0ZSh3YXJuaW5nTWVzc2FnZS5jb25maWdPcHRpb25zV2VyZU92ZXJyaWRlbiwgb3B0aW9uc1N0ciwgb3B0aW9uc1N1ZmZpeCkpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcblxuICAgICAgICB0aGlzLl9vdmVycmlkZW5PcHRpb25zID0gW107XG4gICAgfVxuXG4gICAgZ2V0T3B0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKCFrZXkpXG4gICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuXG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHRoaXMuX29wdGlvbnNba2V5XTtcblxuICAgICAgICBpZiAoIW9wdGlvbilcbiAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XG5cbiAgICAgICAgcmV0dXJuIG9wdGlvbi52YWx1ZTtcbiAgICB9XG5cbiAgICBnZXRPcHRpb25zICgpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgICAgICBPYmplY3QuZW50cmllcyh0aGlzLl9vcHRpb25zKS5mb3JFYWNoKChbbmFtZSwgb3B0aW9uXSkgPT4ge1xuICAgICAgICAgICAgcmVzdWx0W25hbWVdID0gb3B0aW9uLnZhbHVlO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGNsb25lICgpIHtcbiAgICAgICAgcmV0dXJuIGNsb25lRGVlcCh0aGlzKTtcbiAgICB9XG5cbiAgICBnZXQgc3RhcnRPcHRpb25zICgpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICAgICAgaG9zdG5hbWU6IHRoaXMuZ2V0T3B0aW9uKCdob3N0bmFtZScpLFxuICAgICAgICAgICAgcG9ydDE6ICAgIHRoaXMuZ2V0T3B0aW9uKCdwb3J0MScpLFxuICAgICAgICAgICAgcG9ydDI6ICAgIHRoaXMuZ2V0T3B0aW9uKCdwb3J0MicpLFxuICAgICAgICAgICAgb3B0aW9uczogIHtcbiAgICAgICAgICAgICAgICBzc2w6ICAgICAgICAgICAgIHRoaXMuZ2V0T3B0aW9uKCdzc2wnKSxcbiAgICAgICAgICAgICAgICBkZXZlbG9wbWVudE1vZGU6IHRoaXMuZ2V0T3B0aW9uKCdkZXZlbG9wbWVudE1vZGUnKSxcbiAgICAgICAgICAgICAgICByZXRyeVRlc3RQYWdlczogICEhdGhpcy5nZXRPcHRpb24oJ3JldHJ5VGVzdFBhZ2VzJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAocmVzdWx0Lm9wdGlvbnMucmV0cnlUZXN0UGFnZXMpXG4gICAgICAgICAgICByZXN1bHQub3B0aW9ucy5zdGF0aWNDb250ZW50Q2FjaGluZyA9IFNUQVRJQ19DT05URU5UX0NBQ0hJTkdfU0VUVElOR1M7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBnZXQgZmlsZVBhdGggKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZVBhdGg7XG4gICAgfVxufVxuIl19
