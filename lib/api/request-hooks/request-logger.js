'use strict';

exports.__esModule = true;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

exports.default = createRequestLogger;

var _testcafeHammerhead = require('testcafe-hammerhead');

var _hook = require('./hook');

var _hook2 = _interopRequireDefault(_hook);

var _useragent = require('useragent');

var _testRunTracker = require('../test-run-tracker');

var _testRunTracker2 = _interopRequireDefault(_testRunTracker);

var _reExecutablePromise = require('../../utils/re-executable-promise');

var _reExecutablePromise2 = _interopRequireDefault(_reExecutablePromise);

var _runtime = require('../../errors/runtime');

var _message = require('../../errors/runtime/message');

var _message2 = _interopRequireDefault(_message);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DEFAULT_OPTIONS = {
    logRequestHeaders: false,
    logRequestBody: false,
    stringifyRequestBody: false,
    logResponseHeaders: false,
    logResponseBody: false,
    stringifyResponseBody: false
};

class RequestLoggerImplementation extends _hook2.default {
    constructor(requestFilterRuleInit, options) {
        options = (0, _assign2.default)({}, DEFAULT_OPTIONS, options);
        RequestLoggerImplementation._assertLogOptions(options);

        const configureResponseEventOptions = new _testcafeHammerhead.ConfigureResponseEventOptions(options.logResponseHeaders, options.logResponseBody);

        super(requestFilterRuleInit, configureResponseEventOptions);

        this.options = options;

        this._internalRequests = {};
    }

    static _assertLogOptions(logOptions) {
        if (!logOptions.logRequestBody && logOptions.stringifyRequestBody) throw new _runtime.APIError('RequestLogger', _message2.default.requestHookConfigureAPIError, 'RequestLogger', 'Cannot stringify the request body because it is not logged. Specify { logRequestBody: true } in log options.');

        if (!logOptions.logResponseBody && logOptions.stringifyResponseBody) throw new _runtime.APIError('RequestLogger', _message2.default.requestHookConfigureAPIError, 'RequestLogger', 'Cannot stringify the response body because it is not logged. Specify { logResponseBody: true } in log options.');
    }

    onRequest(event) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const userAgent = (0, _useragent.parse)(event._requestInfo.userAgent).toString();

            const loggedReq = {
                id: event._requestInfo.requestId,
                testRunId: event._requestInfo.sessionId,
                userAgent,
                request: {
                    url: event._requestInfo.url,
                    method: event._requestInfo.method
                }
            };

            if (_this.options.logRequestHeaders) loggedReq.request.headers = (0, _assign2.default)({}, event._requestInfo.headers);

            if (_this.options.logRequestBody) loggedReq.request.body = _this.options.stringifyRequestBody ? event._requestInfo.body.toString() : event._requestInfo.body;

            _this._internalRequests[loggedReq.id] = loggedReq;
        })();
    }

    onResponse(event) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            const loggerReq = _this2._internalRequests[event.requestId];

            // NOTE: If the 'clear' method is called during a long running request,
            // we should not save a response part - request part has been already removed.
            if (!loggerReq) return;

            loggerReq.response = {};
            loggerReq.response.statusCode = event.statusCode;

            if (_this2.options.logResponseHeaders) loggerReq.response.headers = (0, _assign2.default)({}, event.headers);

            if (_this2.options.logResponseBody) {
                loggerReq.response.body = _this2.options.stringifyResponseBody && event.body ? event.body.toString() : event.body;
            }
        })();
    }

    _prepareInternalRequestInfo() {
        const testRun = _testRunTracker2.default.resolveContextTestRun();
        let preparedRequests = (0, _values2.default)(this._internalRequests);

        if (testRun) preparedRequests = preparedRequests.filter(r => r.testRunId === testRun.id);

        return preparedRequests;
    }

    _getCompletedRequests() {
        return this._prepareInternalRequestInfo().filter(r => r.response);
    }

    // API
    contains(predicate) {
        var _this3 = this;

        return _reExecutablePromise2.default.fromFn((0, _asyncToGenerator3.default)(function* () {
            return !!_this3._getCompletedRequests().find(predicate);
        }));
    }

    count(predicate) {
        var _this4 = this;

        return _reExecutablePromise2.default.fromFn((0, _asyncToGenerator3.default)(function* () {
            return _this4._getCompletedRequests().filter(predicate).length;
        }));
    }

    clear() {
        const testRun = _testRunTracker2.default.resolveContextTestRun();

        if (testRun) {
            (0, _keys2.default)(this._internalRequests).forEach(id => {
                if (this._internalRequests[id].testRunId === testRun.id) delete this._internalRequests[id];
            });
        } else this._internalRequests = {};
    }

    get requests() {
        return this._prepareInternalRequestInfo();
    }
}

function createRequestLogger(requestFilterRuleInit, logOptions) {
    return new RequestLoggerImplementation(requestFilterRuleInit, logOptions);
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvcmVxdWVzdC1ob29rcy9yZXF1ZXN0LWxvZ2dlci5qcyJdLCJuYW1lcyI6WyJjcmVhdGVSZXF1ZXN0TG9nZ2VyIiwiREVGQVVMVF9PUFRJT05TIiwibG9nUmVxdWVzdEhlYWRlcnMiLCJsb2dSZXF1ZXN0Qm9keSIsInN0cmluZ2lmeVJlcXVlc3RCb2R5IiwibG9nUmVzcG9uc2VIZWFkZXJzIiwibG9nUmVzcG9uc2VCb2R5Iiwic3RyaW5naWZ5UmVzcG9uc2VCb2R5IiwiUmVxdWVzdExvZ2dlckltcGxlbWVudGF0aW9uIiwiUmVxdWVzdEhvb2siLCJjb25zdHJ1Y3RvciIsInJlcXVlc3RGaWx0ZXJSdWxlSW5pdCIsIm9wdGlvbnMiLCJfYXNzZXJ0TG9nT3B0aW9ucyIsImNvbmZpZ3VyZVJlc3BvbnNlRXZlbnRPcHRpb25zIiwiQ29uZmlndXJlUmVzcG9uc2VFdmVudE9wdGlvbnMiLCJfaW50ZXJuYWxSZXF1ZXN0cyIsImxvZ09wdGlvbnMiLCJBUElFcnJvciIsIk1FU1NBR0UiLCJyZXF1ZXN0SG9va0NvbmZpZ3VyZUFQSUVycm9yIiwib25SZXF1ZXN0IiwiZXZlbnQiLCJ1c2VyQWdlbnQiLCJfcmVxdWVzdEluZm8iLCJ0b1N0cmluZyIsImxvZ2dlZFJlcSIsImlkIiwicmVxdWVzdElkIiwidGVzdFJ1bklkIiwic2Vzc2lvbklkIiwicmVxdWVzdCIsInVybCIsIm1ldGhvZCIsImhlYWRlcnMiLCJib2R5Iiwib25SZXNwb25zZSIsImxvZ2dlclJlcSIsInJlc3BvbnNlIiwic3RhdHVzQ29kZSIsIl9wcmVwYXJlSW50ZXJuYWxSZXF1ZXN0SW5mbyIsInRlc3RSdW4iLCJ0ZXN0UnVuVHJhY2tlciIsInJlc29sdmVDb250ZXh0VGVzdFJ1biIsInByZXBhcmVkUmVxdWVzdHMiLCJmaWx0ZXIiLCJyIiwiX2dldENvbXBsZXRlZFJlcXVlc3RzIiwiY29udGFpbnMiLCJwcmVkaWNhdGUiLCJSZUV4ZWN1dGFibGVQcm9taXNlIiwiZnJvbUZu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QUFvQ0ksU0FBcEMsRUFBK0NLLE1BQXREO0FBQ0gsU0FGTSxFQUFQO0FBR0g7O0FBRURDLFlBQVM7QUFDTCxjQUFNZCxVQUFVQyx5QkFBZUMscUJBQWYsRUFBaEI7O0FBRUEsWUFBSUYsT0FBSixFQUFhO0FBQ1QsZ0NBQVksS0FBS3pCLGlCQUFqQixFQUFvQ3dDLE9BQXBDLENBQTRDN0IsTUFBTTtBQUM5QyxvQkFBSSxLQUFLWCxpQkFBTCxDQUF1QlcsRUFBdkIsRUFBMkJFLFNBQTNCLEtBQXlDWSxRQUFRZCxFQUFyRCxFQUNJLE9BQU8sS0FBS1gsaUJBQUwsQ0FBdUJXLEVBQXZCLENBQVA7QUFDUCxhQUhEO0FBSUgsU0FMRCxNQU9JLEtBQUtYLGlCQUFMLEdBQXlCLEVBQXpCO0FBQ1A7O0FBRUQsUUFBSXlDLFFBQUosR0FBZ0I7QUFDWixlQUFPLEtBQUtqQiwyQkFBTCxFQUFQO0FBQ0g7QUEzR2lEOztBQThHdkMsU0FBU3hDLG1CQUFULENBQThCVyxxQkFBOUIsRUFBcURNLFVBQXJELEVBQWlFO0FBQzVFLFdBQU8sSUFBSVQsMkJBQUosQ0FBZ0NHLHFCQUFoQyxFQUF1RE0sVUFBdkQsQ0FBUDtBQUNIIiwiZmlsZSI6ImFwaS9yZXF1ZXN0LWhvb2tzL3JlcXVlc3QtbG9nZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uZmlndXJlUmVzcG9uc2VFdmVudE9wdGlvbnMgfSBmcm9tICd0ZXN0Y2FmZS1oYW1tZXJoZWFkJztcbmltcG9ydCBSZXF1ZXN0SG9vayBmcm9tICcuL2hvb2snO1xuaW1wb3J0IHsgcGFyc2UgYXMgcGFyc2VVc2VyQWdlbnQgfSBmcm9tICd1c2VyYWdlbnQnO1xuaW1wb3J0IHRlc3RSdW5UcmFja2VyIGZyb20gJy4uL3Rlc3QtcnVuLXRyYWNrZXInO1xuaW1wb3J0IFJlRXhlY3V0YWJsZVByb21pc2UgZnJvbSAnLi4vLi4vdXRpbHMvcmUtZXhlY3V0YWJsZS1wcm9taXNlJztcbmltcG9ydCB7IEFQSUVycm9yIH0gZnJvbSAnLi4vLi4vZXJyb3JzL3J1bnRpbWUnO1xuaW1wb3J0IE1FU1NBR0UgZnJvbSAnLi4vLi4vZXJyb3JzL3J1bnRpbWUvbWVzc2FnZSc7XG5cbmNvbnN0IERFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBsb2dSZXF1ZXN0SGVhZGVyczogICAgIGZhbHNlLFxuICAgIGxvZ1JlcXVlc3RCb2R5OiAgICAgICAgZmFsc2UsXG4gICAgc3RyaW5naWZ5UmVxdWVzdEJvZHk6ICBmYWxzZSxcbiAgICBsb2dSZXNwb25zZUhlYWRlcnM6ICAgIGZhbHNlLFxuICAgIGxvZ1Jlc3BvbnNlQm9keTogICAgICAgZmFsc2UsXG4gICAgc3RyaW5naWZ5UmVzcG9uc2VCb2R5OiBmYWxzZVxufTtcblxuY2xhc3MgUmVxdWVzdExvZ2dlckltcGxlbWVudGF0aW9uIGV4dGVuZHMgUmVxdWVzdEhvb2sge1xuICAgIGNvbnN0cnVjdG9yIChyZXF1ZXN0RmlsdGVyUnVsZUluaXQsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfT1BUSU9OUywgb3B0aW9ucyk7XG4gICAgICAgIFJlcXVlc3RMb2dnZXJJbXBsZW1lbnRhdGlvbi5fYXNzZXJ0TG9nT3B0aW9ucyhvcHRpb25zKTtcblxuICAgICAgICBjb25zdCBjb25maWd1cmVSZXNwb25zZUV2ZW50T3B0aW9ucyA9IG5ldyBDb25maWd1cmVSZXNwb25zZUV2ZW50T3B0aW9ucyhvcHRpb25zLmxvZ1Jlc3BvbnNlSGVhZGVycywgb3B0aW9ucy5sb2dSZXNwb25zZUJvZHkpO1xuXG4gICAgICAgIHN1cGVyKHJlcXVlc3RGaWx0ZXJSdWxlSW5pdCwgY29uZmlndXJlUmVzcG9uc2VFdmVudE9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICAgICAgdGhpcy5faW50ZXJuYWxSZXF1ZXN0cyA9IHt9O1xuICAgIH1cblxuICAgIHN0YXRpYyBfYXNzZXJ0TG9nT3B0aW9ucyAobG9nT3B0aW9ucykge1xuICAgICAgICBpZiAoIWxvZ09wdGlvbnMubG9nUmVxdWVzdEJvZHkgJiYgbG9nT3B0aW9ucy5zdHJpbmdpZnlSZXF1ZXN0Qm9keSlcbiAgICAgICAgICAgIHRocm93IG5ldyBBUElFcnJvcignUmVxdWVzdExvZ2dlcicsIE1FU1NBR0UucmVxdWVzdEhvb2tDb25maWd1cmVBUElFcnJvciwgJ1JlcXVlc3RMb2dnZXInLCAnQ2Fubm90IHN0cmluZ2lmeSB0aGUgcmVxdWVzdCBib2R5IGJlY2F1c2UgaXQgaXMgbm90IGxvZ2dlZC4gU3BlY2lmeSB7IGxvZ1JlcXVlc3RCb2R5OiB0cnVlIH0gaW4gbG9nIG9wdGlvbnMuJyk7XG5cbiAgICAgICAgaWYgKCFsb2dPcHRpb25zLmxvZ1Jlc3BvbnNlQm9keSAmJiBsb2dPcHRpb25zLnN0cmluZ2lmeVJlc3BvbnNlQm9keSlcbiAgICAgICAgICAgIHRocm93IG5ldyBBUElFcnJvcignUmVxdWVzdExvZ2dlcicsIE1FU1NBR0UucmVxdWVzdEhvb2tDb25maWd1cmVBUElFcnJvciwgJ1JlcXVlc3RMb2dnZXInLCAnQ2Fubm90IHN0cmluZ2lmeSB0aGUgcmVzcG9uc2UgYm9keSBiZWNhdXNlIGl0IGlzIG5vdCBsb2dnZWQuIFNwZWNpZnkgeyBsb2dSZXNwb25zZUJvZHk6IHRydWUgfSBpbiBsb2cgb3B0aW9ucy4nKTtcbiAgICB9XG5cbiAgICBhc3luYyBvblJlcXVlc3QgKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHVzZXJBZ2VudCA9IHBhcnNlVXNlckFnZW50KGV2ZW50Ll9yZXF1ZXN0SW5mby51c2VyQWdlbnQpLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgY29uc3QgbG9nZ2VkUmVxID0ge1xuICAgICAgICAgICAgaWQ6ICAgICAgICBldmVudC5fcmVxdWVzdEluZm8ucmVxdWVzdElkLFxuICAgICAgICAgICAgdGVzdFJ1bklkOiBldmVudC5fcmVxdWVzdEluZm8uc2Vzc2lvbklkLFxuICAgICAgICAgICAgdXNlckFnZW50LFxuICAgICAgICAgICAgcmVxdWVzdDogICB7XG4gICAgICAgICAgICAgICAgdXJsOiAgICBldmVudC5fcmVxdWVzdEluZm8udXJsLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogZXZlbnQuX3JlcXVlc3RJbmZvLm1ldGhvZCxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmxvZ1JlcXVlc3RIZWFkZXJzKVxuICAgICAgICAgICAgbG9nZ2VkUmVxLnJlcXVlc3QuaGVhZGVycyA9IE9iamVjdC5hc3NpZ24oe30sIGV2ZW50Ll9yZXF1ZXN0SW5mby5oZWFkZXJzKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmxvZ1JlcXVlc3RCb2R5KVxuICAgICAgICAgICAgbG9nZ2VkUmVxLnJlcXVlc3QuYm9keSA9IHRoaXMub3B0aW9ucy5zdHJpbmdpZnlSZXF1ZXN0Qm9keSA/IGV2ZW50Ll9yZXF1ZXN0SW5mby5ib2R5LnRvU3RyaW5nKCkgOiBldmVudC5fcmVxdWVzdEluZm8uYm9keTtcblxuICAgICAgICB0aGlzLl9pbnRlcm5hbFJlcXVlc3RzW2xvZ2dlZFJlcS5pZF0gPSBsb2dnZWRSZXE7XG4gICAgfVxuXG4gICAgYXN5bmMgb25SZXNwb25zZSAoZXZlbnQpIHtcbiAgICAgICAgY29uc3QgbG9nZ2VyUmVxID0gdGhpcy5faW50ZXJuYWxSZXF1ZXN0c1tldmVudC5yZXF1ZXN0SWRdO1xuXG4gICAgICAgIC8vIE5PVEU6IElmIHRoZSAnY2xlYXInIG1ldGhvZCBpcyBjYWxsZWQgZHVyaW5nIGEgbG9uZyBydW5uaW5nIHJlcXVlc3QsXG4gICAgICAgIC8vIHdlIHNob3VsZCBub3Qgc2F2ZSBhIHJlc3BvbnNlIHBhcnQgLSByZXF1ZXN0IHBhcnQgaGFzIGJlZW4gYWxyZWFkeSByZW1vdmVkLlxuICAgICAgICBpZiAoIWxvZ2dlclJlcSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBsb2dnZXJSZXEucmVzcG9uc2UgICAgICAgICAgICA9IHt9O1xuICAgICAgICBsb2dnZXJSZXEucmVzcG9uc2Uuc3RhdHVzQ29kZSA9IGV2ZW50LnN0YXR1c0NvZGU7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2dSZXNwb25zZUhlYWRlcnMpXG4gICAgICAgICAgICBsb2dnZXJSZXEucmVzcG9uc2UuaGVhZGVycyA9IE9iamVjdC5hc3NpZ24oe30sIGV2ZW50LmhlYWRlcnMpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9nUmVzcG9uc2VCb2R5KSB7XG4gICAgICAgICAgICBsb2dnZXJSZXEucmVzcG9uc2UuYm9keSA9IHRoaXMub3B0aW9ucy5zdHJpbmdpZnlSZXNwb25zZUJvZHkgJiYgZXZlbnQuYm9keVxuICAgICAgICAgICAgICAgID8gZXZlbnQuYm9keS50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgOiBldmVudC5ib2R5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3ByZXBhcmVJbnRlcm5hbFJlcXVlc3RJbmZvICgpIHtcbiAgICAgICAgY29uc3QgdGVzdFJ1biAgICAgICAgPSB0ZXN0UnVuVHJhY2tlci5yZXNvbHZlQ29udGV4dFRlc3RSdW4oKTtcbiAgICAgICAgbGV0IHByZXBhcmVkUmVxdWVzdHMgPSBPYmplY3QudmFsdWVzKHRoaXMuX2ludGVybmFsUmVxdWVzdHMpO1xuXG4gICAgICAgIGlmICh0ZXN0UnVuKVxuICAgICAgICAgICAgcHJlcGFyZWRSZXF1ZXN0cyA9IHByZXBhcmVkUmVxdWVzdHMuZmlsdGVyKHIgPT4gci50ZXN0UnVuSWQgPT09IHRlc3RSdW4uaWQpO1xuXG4gICAgICAgIHJldHVybiBwcmVwYXJlZFJlcXVlc3RzO1xuICAgIH1cblxuICAgIF9nZXRDb21wbGV0ZWRSZXF1ZXN0cyAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wcmVwYXJlSW50ZXJuYWxSZXF1ZXN0SW5mbygpLmZpbHRlcihyID0+IHIucmVzcG9uc2UpO1xuICAgIH1cblxuICAgIC8vIEFQSVxuICAgIGNvbnRhaW5zIChwcmVkaWNhdGUpIHtcbiAgICAgICAgcmV0dXJuIFJlRXhlY3V0YWJsZVByb21pc2UuZnJvbUZuKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhIXRoaXMuX2dldENvbXBsZXRlZFJlcXVlc3RzKCkuZmluZChwcmVkaWNhdGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb3VudCAocHJlZGljYXRlKSB7XG4gICAgICAgIHJldHVybiBSZUV4ZWN1dGFibGVQcm9taXNlLmZyb21Gbihhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0Q29tcGxldGVkUmVxdWVzdHMoKS5maWx0ZXIocHJlZGljYXRlKS5sZW5ndGg7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNsZWFyICgpIHtcbiAgICAgICAgY29uc3QgdGVzdFJ1biA9IHRlc3RSdW5UcmFja2VyLnJlc29sdmVDb250ZXh0VGVzdFJ1bigpO1xuXG4gICAgICAgIGlmICh0ZXN0UnVuKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLl9pbnRlcm5hbFJlcXVlc3RzKS5mb3JFYWNoKGlkID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faW50ZXJuYWxSZXF1ZXN0c1tpZF0udGVzdFJ1bklkID09PSB0ZXN0UnVuLmlkKVxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5faW50ZXJuYWxSZXF1ZXN0c1tpZF07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLl9pbnRlcm5hbFJlcXVlc3RzID0ge307XG4gICAgfVxuXG4gICAgZ2V0IHJlcXVlc3RzICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ByZXBhcmVJbnRlcm5hbFJlcXVlc3RJbmZvKCk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVSZXF1ZXN0TG9nZ2VyIChyZXF1ZXN0RmlsdGVyUnVsZUluaXQsIGxvZ09wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IFJlcXVlc3RMb2dnZXJJbXBsZW1lbnRhdGlvbihyZXF1ZXN0RmlsdGVyUnVsZUluaXQsIGxvZ09wdGlvbnMpO1xufVxuXG4iXX0=
