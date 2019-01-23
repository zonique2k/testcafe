'use strict';

exports.__esModule = true;
// -------------------------------------------------------------
// WARNING: this file is used by both the client and the server.
// Do not use any browser or node-specific API!
// -------------------------------------------------------------

const NODE_SNAPSHOT_PROPERTIES = exports.NODE_SNAPSHOT_PROPERTIES = ['nodeType', 'textContent', 'childNodeCount', 'hasChildNodes', 'childElementCount', 'hasChildElements'];

const ELEMENT_SNAPSHOT_PROPERTIES = exports.ELEMENT_SNAPSHOT_PROPERTIES = ['tagName', 'visible', 'focused', 'attributes', 'boundingClientRect', 'classNames', 'style', 'innerText', 'namespaceURI', 'id', 'value', 'checked', 'selected', 'selectedIndex', 'scrollWidth', 'scrollHeight', 'scrollLeft', 'scrollTop', 'offsetWidth', 'offsetHeight', 'offsetLeft', 'offsetTop', 'clientWidth', 'clientHeight', 'clientLeft', 'clientTop'];

const SNAPSHOT_PROPERTIES = exports.SNAPSHOT_PROPERTIES = NODE_SNAPSHOT_PROPERTIES.concat(ELEMENT_SNAPSHOT_PROPERTIES);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQtZnVuY3Rpb25zL3NlbGVjdG9ycy9zbmFwc2hvdC1wcm9wZXJ0aWVzLmpzIl0sIm5hbWVzIjpbIk5PREVfU05BUFNIT1RfUFJPUEVSVElFUyIsIkVMRU1FTlRfU05BUFNIT1RfUFJPUEVSVElFUyIsIlNOQVBTSE9UX1BST1BFUlRJRVMiLCJjb25jYXQiXSwibWFwcGluZ3MiOiI7OztBQUFBO0FBQ0E7QUFDQTtBQUNBOztBQUVPLE1BQU1BLDhEQUEyQixDQUNwQyxVQURvQyxFQUVwQyxhQUZvQyxFQUdwQyxnQkFIb0MsRUFJcEMsZUFKb0MsRUFLcEMsbUJBTG9DLEVBTXBDLGtCQU5vQyxDQUFqQzs7QUFTQSxNQUFNQyxvRUFBOEIsQ0FDdkMsU0FEdUMsRUFFdkMsU0FGdUMsRUFHdkMsU0FIdUMsRUFJdkMsWUFKdUMsRUFLdkMsb0JBTHVDLEVBTXZDLFlBTnVDLEVBT3ZDLE9BUHVDLEVBUXZDLFdBUnVDLEVBU3ZDLGNBVHVDLEVBVXZDLElBVnVDLEVBV3ZDLE9BWHVDLEVBWXZDLFNBWnVDLEVBYXZDLFVBYnVDLEVBY3ZDLGVBZHVDLEVBZXZDLGFBZnVDLEVBZ0J2QyxjQWhCdUMsRUFpQnZDLFlBakJ1QyxFQWtCdkMsV0FsQnVDLEVBbUJ2QyxhQW5CdUMsRUFvQnZDLGNBcEJ1QyxFQXFCdkMsWUFyQnVDLEVBc0J2QyxXQXRCdUMsRUF1QnZDLGFBdkJ1QyxFQXdCdkMsY0F4QnVDLEVBeUJ2QyxZQXpCdUMsRUEwQnZDLFdBMUJ1QyxDQUFwQzs7QUE2QkEsTUFBTUMsb0RBQXNCRix5QkFBeUJHLE1BQXpCLENBQWdDRiwyQkFBaEMsQ0FBNUIiLCJmaWxlIjoiY2xpZW50LWZ1bmN0aW9ucy9zZWxlY3RvcnMvc25hcHNob3QtcHJvcGVydGllcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFdBUk5JTkc6IHRoaXMgZmlsZSBpcyB1c2VkIGJ5IGJvdGggdGhlIGNsaWVudCBhbmQgdGhlIHNlcnZlci5cbi8vIERvIG5vdCB1c2UgYW55IGJyb3dzZXIgb3Igbm9kZS1zcGVjaWZpYyBBUEkhXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBjb25zdCBOT0RFX1NOQVBTSE9UX1BST1BFUlRJRVMgPSBbXG4gICAgJ25vZGVUeXBlJyxcbiAgICAndGV4dENvbnRlbnQnLFxuICAgICdjaGlsZE5vZGVDb3VudCcsXG4gICAgJ2hhc0NoaWxkTm9kZXMnLFxuICAgICdjaGlsZEVsZW1lbnRDb3VudCcsXG4gICAgJ2hhc0NoaWxkRWxlbWVudHMnXG5dO1xuXG5leHBvcnQgY29uc3QgRUxFTUVOVF9TTkFQU0hPVF9QUk9QRVJUSUVTID0gW1xuICAgICd0YWdOYW1lJyxcbiAgICAndmlzaWJsZScsXG4gICAgJ2ZvY3VzZWQnLFxuICAgICdhdHRyaWJ1dGVzJyxcbiAgICAnYm91bmRpbmdDbGllbnRSZWN0JyxcbiAgICAnY2xhc3NOYW1lcycsXG4gICAgJ3N0eWxlJyxcbiAgICAnaW5uZXJUZXh0JyxcbiAgICAnbmFtZXNwYWNlVVJJJyxcbiAgICAnaWQnLFxuICAgICd2YWx1ZScsXG4gICAgJ2NoZWNrZWQnLFxuICAgICdzZWxlY3RlZCcsXG4gICAgJ3NlbGVjdGVkSW5kZXgnLFxuICAgICdzY3JvbGxXaWR0aCcsXG4gICAgJ3Njcm9sbEhlaWdodCcsXG4gICAgJ3Njcm9sbExlZnQnLFxuICAgICdzY3JvbGxUb3AnLFxuICAgICdvZmZzZXRXaWR0aCcsXG4gICAgJ29mZnNldEhlaWdodCcsXG4gICAgJ29mZnNldExlZnQnLFxuICAgICdvZmZzZXRUb3AnLFxuICAgICdjbGllbnRXaWR0aCcsXG4gICAgJ2NsaWVudEhlaWdodCcsXG4gICAgJ2NsaWVudExlZnQnLFxuICAgICdjbGllbnRUb3AnXG5dO1xuXG5leHBvcnQgY29uc3QgU05BUFNIT1RfUFJPUEVSVElFUyA9IE5PREVfU05BUFNIT1RfUFJPUEVSVElFUy5jb25jYXQoRUxFTUVOVF9TTkFQU0hPVF9QUk9QRVJUSUVTKTtcbiJdfQ==