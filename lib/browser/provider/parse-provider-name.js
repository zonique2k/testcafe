'use strict';

exports.__esModule = true;

exports.default = function (providerName) {
    var _BROWSER_PROVIDER_NAM = BROWSER_PROVIDER_NAME_RE.exec(providerName);

    let scope = _BROWSER_PROVIDER_NAM[1],
        name = _BROWSER_PROVIDER_NAM[2];


    if (!scope) scope = '';

    if (name.indexOf(BROWSER_PROVIDER_MODULE_NAME_PREFIX) === 0) name = name.replace(BROWSER_PROVIDER_MODULE_NAME_PREFIX, '');

    return {
        providerName: scope + name,
        moduleName: scope + BROWSER_PROVIDER_MODULE_NAME_PREFIX + name
    };
};

const BROWSER_PROVIDER_NAME_RE = /^(@(?:[^/]+)\/)?(.+)$/;
const BROWSER_PROVIDER_MODULE_NAME_PREFIX = 'testcafe-browser-provider-';

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9icm93c2VyL3Byb3ZpZGVyL3BhcnNlLXByb3ZpZGVyLW5hbWUuanMiXSwibmFtZXMiOlsicHJvdmlkZXJOYW1lIiwiQlJPV1NFUl9QUk9WSURFUl9OQU1FX1JFIiwiZXhlYyIsInNjb3BlIiwibmFtZSIsImluZGV4T2YiLCJCUk9XU0VSX1BST1ZJREVSX01PRFVMRV9OQU1FX1BSRUZJWCIsInJlcGxhY2UiLCJtb2R1bGVOYW1lIl0sIm1hcHBpbmdzIjoiOzs7O2tCQUllLFVBQVVBLFlBQVYsRUFBd0I7QUFBQSxnQ0FDWEMseUJBQXlCQyxJQUF6QixDQUE4QkYsWUFBOUIsQ0FEVzs7QUFBQSxRQUMzQkcsS0FEMkI7QUFBQSxRQUNwQkMsSUFEb0I7OztBQUduQyxRQUFJLENBQUNELEtBQUwsRUFDSUEsUUFBUSxFQUFSOztBQUVKLFFBQUlDLEtBQUtDLE9BQUwsQ0FBYUMsbUNBQWIsTUFBc0QsQ0FBMUQsRUFDSUYsT0FBT0EsS0FBS0csT0FBTCxDQUFhRCxtQ0FBYixFQUFrRCxFQUFsRCxDQUFQOztBQUVKLFdBQU87QUFDSE4sc0JBQWNHLFFBQVFDLElBRG5CO0FBRUhJLG9CQUFjTCxRQUFRRyxtQ0FBUixHQUE4Q0Y7QUFGekQsS0FBUDtBQUlILEM7O0FBakJELE1BQU1ILDJCQUFzQyx1QkFBNUM7QUFDQSxNQUFNSyxzQ0FBc0MsNEJBQTVDIiwiZmlsZSI6ImJyb3dzZXIvcHJvdmlkZXIvcGFyc2UtcHJvdmlkZXItbmFtZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEJST1dTRVJfUFJPVklERVJfTkFNRV9SRSAgICAgICAgICAgID0gL14oQCg/OlteL10rKVxcLyk/KC4rKSQvO1xuY29uc3QgQlJPV1NFUl9QUk9WSURFUl9NT0RVTEVfTkFNRV9QUkVGSVggPSAndGVzdGNhZmUtYnJvd3Nlci1wcm92aWRlci0nO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChwcm92aWRlck5hbWUpIHtcbiAgICBsZXQgWyAsIHNjb3BlLCBuYW1lIF0gPSBCUk9XU0VSX1BST1ZJREVSX05BTUVfUkUuZXhlYyhwcm92aWRlck5hbWUpO1xuXG4gICAgaWYgKCFzY29wZSlcbiAgICAgICAgc2NvcGUgPSAnJztcblxuICAgIGlmIChuYW1lLmluZGV4T2YoQlJPV1NFUl9QUk9WSURFUl9NT0RVTEVfTkFNRV9QUkVGSVgpID09PSAwKVxuICAgICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKEJST1dTRVJfUFJPVklERVJfTU9EVUxFX05BTUVfUFJFRklYLCAnJyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBwcm92aWRlck5hbWU6IHNjb3BlICsgbmFtZSxcbiAgICAgICAgbW9kdWxlTmFtZTogICBzY29wZSArIEJST1dTRVJfUFJPVklERVJfTU9EVUxFX05BTUVfUFJFRklYICsgbmFtZVxuICAgIH07XG59XG4iXX0=
