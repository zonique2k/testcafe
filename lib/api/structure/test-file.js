'use strict';

exports.__esModule = true;
const BORROWED_TEST_PROPERTIES = ['skip', 'only', 'pageUrl', 'authCredentials'];

class TestFile {
    constructor(filename) {
        this.filename = filename;
        this.currentFixture = null;
        this.collectedTests = [];
    }

    getTests() {
        this.collectedTests.forEach(test => {
            BORROWED_TEST_PROPERTIES.forEach(prop => {
                test[prop] = test[prop] || test.fixture[prop];
            });

            if (test.disablePageReloads === void 0) test.disablePageReloads = test.fixture.disablePageReloads;
        });

        return this.collectedTests;
    }
}
exports.default = TestFile;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvc3RydWN0dXJlL3Rlc3QtZmlsZS5qcyJdLCJuYW1lcyI6WyJCT1JST1dFRF9URVNUX1BST1BFUlRJRVMiLCJUZXN0RmlsZSIsImNvbnN0cnVjdG9yIiwiZmlsZW5hbWUiLCJjdXJyZW50Rml4dHVyZSIsImNvbGxlY3RlZFRlc3RzIiwiZ2V0VGVzdHMiLCJmb3JFYWNoIiwidGVzdCIsInByb3AiLCJmaXh0dXJlIiwiZGlzYWJsZVBhZ2VSZWxvYWRzIl0sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFNQSwyQkFBMkIsQ0FBQyxNQUFELEVBQVMsTUFBVCxFQUFpQixTQUFqQixFQUE0QixpQkFBNUIsQ0FBakM7O0FBRWUsTUFBTUMsUUFBTixDQUFlO0FBQzFCQyxnQkFBYUMsUUFBYixFQUF1QjtBQUNuQixhQUFLQSxRQUFMLEdBQXNCQSxRQUF0QjtBQUNBLGFBQUtDLGNBQUwsR0FBc0IsSUFBdEI7QUFDQSxhQUFLQyxjQUFMLEdBQXNCLEVBQXRCO0FBQ0g7O0FBRURDLGVBQVk7QUFDUixhQUFLRCxjQUFMLENBQW9CRSxPQUFwQixDQUE0QkMsUUFBUTtBQUNoQ1IscUNBQXlCTyxPQUF6QixDQUFpQ0UsUUFBUTtBQUNyQ0QscUJBQUtDLElBQUwsSUFBYUQsS0FBS0MsSUFBTCxLQUFjRCxLQUFLRSxPQUFMLENBQWFELElBQWIsQ0FBM0I7QUFDSCxhQUZEOztBQUlBLGdCQUFJRCxLQUFLRyxrQkFBTCxLQUE0QixLQUFLLENBQXJDLEVBQ0lILEtBQUtHLGtCQUFMLEdBQTBCSCxLQUFLRSxPQUFMLENBQWFDLGtCQUF2QztBQUNQLFNBUEQ7O0FBU0EsZUFBTyxLQUFLTixjQUFaO0FBQ0g7QUFsQnlCO2tCQUFUSixRIiwiZmlsZSI6ImFwaS9zdHJ1Y3R1cmUvdGVzdC1maWxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgQk9SUk9XRURfVEVTVF9QUk9QRVJUSUVTID0gWydza2lwJywgJ29ubHknLCAncGFnZVVybCcsICdhdXRoQ3JlZGVudGlhbHMnXTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGVzdEZpbGUge1xuICAgIGNvbnN0cnVjdG9yIChmaWxlbmFtZSkge1xuICAgICAgICB0aGlzLmZpbGVuYW1lICAgICAgID0gZmlsZW5hbWU7XG4gICAgICAgIHRoaXMuY3VycmVudEZpeHR1cmUgPSBudWxsO1xuICAgICAgICB0aGlzLmNvbGxlY3RlZFRlc3RzID0gW107XG4gICAgfVxuXG4gICAgZ2V0VGVzdHMgKCkge1xuICAgICAgICB0aGlzLmNvbGxlY3RlZFRlc3RzLmZvckVhY2godGVzdCA9PiB7XG4gICAgICAgICAgICBCT1JST1dFRF9URVNUX1BST1BFUlRJRVMuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgICAgICAgICAgICB0ZXN0W3Byb3BdID0gdGVzdFtwcm9wXSB8fCB0ZXN0LmZpeHR1cmVbcHJvcF07XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHRlc3QuZGlzYWJsZVBhZ2VSZWxvYWRzID09PSB2b2lkIDApXG4gICAgICAgICAgICAgICAgdGVzdC5kaXNhYmxlUGFnZVJlbG9hZHMgPSB0ZXN0LmZpeHR1cmUuZGlzYWJsZVBhZ2VSZWxvYWRzO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jb2xsZWN0ZWRUZXN0cztcbiAgICB9XG59XG4iXX0=
