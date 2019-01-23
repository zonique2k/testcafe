'use strict';

exports.__esModule = true;

var _graphlib = require('graphlib');

class ModulesGraph {
    constructor() {
        this.graph = new _graphlib.Graph();
    }

    _updateChildren(node, cache) {
        const cached = cache[node];

        if (!cached) return;

        const outEdges = this.graph.outEdges(node) || [];

        outEdges.forEach(edge => this.graph.removeEdge(edge.v, edge.w));

        const children = cached && cached.children.map(child => child.id);

        if (!children) return;

        children.filter(child => child.indexOf('node_modules') === -1).forEach(child => {
            this.addNode(child, cache);
            this.graph.setEdge(node, child);
        });
    }

    addNode(node, cache) {
        if (this.graph.hasNode(node)) return;

        const cached = cache[node];

        if (cached) this.graph.setNode(node);

        const parent = cached && cached.parent;

        if (parent && parent.id.indexOf('node_modules') < 0) {
            this.addNode(parent.id, cache);
            this.graph.setEdge(parent.id, node);
        }

        this._updateChildren(node, cache);
    }

    build(cache, nodes) {
        nodes.forEach(node => this.addNode(node, cache, true));
    }

    rebuildNode(cache, node) {
        this._updateChildren(node, cache);
    }

    clearParentsCache(cache, node) {
        if (!cache[node]) return;

        cache[node] = null;

        const parentEdges = this.graph.inEdges(node);

        if (!parentEdges || !parentEdges.length) return;

        parentEdges.map(edge => edge.v).forEach(parent => this.clearParentsCache(cache, parent));
    }
}
exports.default = ModulesGraph;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXZlL2ZpbGUtd2F0Y2hlci9tb2R1bGVzLWdyYXBoLmpzIl0sIm5hbWVzIjpbIk1vZHVsZXNHcmFwaCIsImNvbnN0cnVjdG9yIiwiZ3JhcGgiLCJHcmFwaCIsIl91cGRhdGVDaGlsZHJlbiIsIm5vZGUiLCJjYWNoZSIsImNhY2hlZCIsIm91dEVkZ2VzIiwiZm9yRWFjaCIsImVkZ2UiLCJyZW1vdmVFZGdlIiwidiIsInciLCJjaGlsZHJlbiIsIm1hcCIsImNoaWxkIiwiaWQiLCJmaWx0ZXIiLCJpbmRleE9mIiwiYWRkTm9kZSIsInNldEVkZ2UiLCJoYXNOb2RlIiwic2V0Tm9kZSIsInBhcmVudCIsImJ1aWxkIiwibm9kZXMiLCJyZWJ1aWxkTm9kZSIsImNsZWFyUGFyZW50c0NhY2hlIiwicGFyZW50RWRnZXMiLCJpbkVkZ2VzIiwibGVuZ3RoIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7O0FBRWUsTUFBTUEsWUFBTixDQUFtQjtBQUM5QkMsa0JBQWU7QUFDWCxhQUFLQyxLQUFMLEdBQWEsSUFBSUMsZUFBSixFQUFiO0FBQ0g7O0FBRURDLG9CQUFpQkMsSUFBakIsRUFBdUJDLEtBQXZCLEVBQThCO0FBQzFCLGNBQU1DLFNBQVNELE1BQU1ELElBQU4sQ0FBZjs7QUFFQSxZQUFJLENBQUNFLE1BQUwsRUFDSTs7QUFFSixjQUFNQyxXQUFXLEtBQUtOLEtBQUwsQ0FBV00sUUFBWCxDQUFvQkgsSUFBcEIsS0FBNkIsRUFBOUM7O0FBRUFHLGlCQUFTQyxPQUFULENBQWlCQyxRQUFRLEtBQUtSLEtBQUwsQ0FBV1MsVUFBWCxDQUFzQkQsS0FBS0UsQ0FBM0IsRUFBOEJGLEtBQUtHLENBQW5DLENBQXpCOztBQUVBLGNBQU1DLFdBQVdQLFVBQVVBLE9BQU9PLFFBQVAsQ0FBZ0JDLEdBQWhCLENBQW9CQyxTQUFTQSxNQUFNQyxFQUFuQyxDQUEzQjs7QUFFQSxZQUFJLENBQUNILFFBQUwsRUFBZTs7QUFFZkEsaUJBQVNJLE1BQVQsQ0FBZ0JGLFNBQVNBLE1BQU1HLE9BQU4sQ0FBYyxjQUFkLE1BQWtDLENBQUMsQ0FBNUQsRUFDS1YsT0FETCxDQUNhTyxTQUFTO0FBQ2QsaUJBQUtJLE9BQUwsQ0FBYUosS0FBYixFQUFvQlYsS0FBcEI7QUFDQSxpQkFBS0osS0FBTCxDQUFXbUIsT0FBWCxDQUFtQmhCLElBQW5CLEVBQXlCVyxLQUF6QjtBQUNILFNBSkw7QUFLSDs7QUFFREksWUFBU2YsSUFBVCxFQUFlQyxLQUFmLEVBQXNCO0FBQ2xCLFlBQUksS0FBS0osS0FBTCxDQUFXb0IsT0FBWCxDQUFtQmpCLElBQW5CLENBQUosRUFDSTs7QUFFSixjQUFNRSxTQUFTRCxNQUFNRCxJQUFOLENBQWY7O0FBRUEsWUFBSUUsTUFBSixFQUNJLEtBQUtMLEtBQUwsQ0FBV3FCLE9BQVgsQ0FBbUJsQixJQUFuQjs7QUFFSixjQUFNbUIsU0FBU2pCLFVBQVVBLE9BQU9pQixNQUFoQzs7QUFFQSxZQUFJQSxVQUFVQSxPQUFPUCxFQUFQLENBQVVFLE9BQVYsQ0FBa0IsY0FBbEIsSUFBb0MsQ0FBbEQsRUFBcUQ7QUFDakQsaUJBQUtDLE9BQUwsQ0FBYUksT0FBT1AsRUFBcEIsRUFBd0JYLEtBQXhCO0FBQ0EsaUJBQUtKLEtBQUwsQ0FBV21CLE9BQVgsQ0FBbUJHLE9BQU9QLEVBQTFCLEVBQThCWixJQUE5QjtBQUNIOztBQUVELGFBQUtELGVBQUwsQ0FBcUJDLElBQXJCLEVBQTJCQyxLQUEzQjtBQUNIOztBQUVEbUIsVUFBT25CLEtBQVAsRUFBY29CLEtBQWQsRUFBcUI7QUFDakJBLGNBQU1qQixPQUFOLENBQWNKLFFBQVEsS0FBS2UsT0FBTCxDQUFhZixJQUFiLEVBQW1CQyxLQUFuQixFQUEwQixJQUExQixDQUF0QjtBQUNIOztBQUVEcUIsZ0JBQWFyQixLQUFiLEVBQW9CRCxJQUFwQixFQUEwQjtBQUN0QixhQUFLRCxlQUFMLENBQXFCQyxJQUFyQixFQUEyQkMsS0FBM0I7QUFDSDs7QUFFRHNCLHNCQUFtQnRCLEtBQW5CLEVBQTBCRCxJQUExQixFQUFnQztBQUM1QixZQUFJLENBQUNDLE1BQU1ELElBQU4sQ0FBTCxFQUNJOztBQUVKQyxjQUFNRCxJQUFOLElBQWMsSUFBZDs7QUFFQSxjQUFNd0IsY0FBYyxLQUFLM0IsS0FBTCxDQUFXNEIsT0FBWCxDQUFtQnpCLElBQW5CLENBQXBCOztBQUVBLFlBQUksQ0FBQ3dCLFdBQUQsSUFBZ0IsQ0FBQ0EsWUFBWUUsTUFBakMsRUFDSTs7QUFFSkYsb0JBQ0tkLEdBREwsQ0FDU0wsUUFBUUEsS0FBS0UsQ0FEdEIsRUFFS0gsT0FGTCxDQUVhZSxVQUFVLEtBQUtJLGlCQUFMLENBQXVCdEIsS0FBdkIsRUFBOEJrQixNQUE5QixDQUZ2QjtBQUdIO0FBbkU2QjtrQkFBYnhCLFkiLCJmaWxlIjoibGl2ZS9maWxlLXdhdGNoZXIvbW9kdWxlcy1ncmFwaC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdyYXBoIH0gZnJvbSAnZ3JhcGhsaWInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb2R1bGVzR3JhcGgge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5ncmFwaCA9IG5ldyBHcmFwaCgpO1xuICAgIH1cblxuICAgIF91cGRhdGVDaGlsZHJlbiAobm9kZSwgY2FjaGUpIHtcbiAgICAgICAgY29uc3QgY2FjaGVkID0gY2FjaGVbbm9kZV07XG5cbiAgICAgICAgaWYgKCFjYWNoZWQpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgY29uc3Qgb3V0RWRnZXMgPSB0aGlzLmdyYXBoLm91dEVkZ2VzKG5vZGUpIHx8IFtdO1xuXG4gICAgICAgIG91dEVkZ2VzLmZvckVhY2goZWRnZSA9PiB0aGlzLmdyYXBoLnJlbW92ZUVkZ2UoZWRnZS52LCBlZGdlLncpKTtcblxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IGNhY2hlZCAmJiBjYWNoZWQuY2hpbGRyZW4ubWFwKGNoaWxkID0+IGNoaWxkLmlkKTtcblxuICAgICAgICBpZiAoIWNoaWxkcmVuKSByZXR1cm47XG5cbiAgICAgICAgY2hpbGRyZW4uZmlsdGVyKGNoaWxkID0+IGNoaWxkLmluZGV4T2YoJ25vZGVfbW9kdWxlcycpID09PSAtMSlcbiAgICAgICAgICAgIC5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE5vZGUoY2hpbGQsIGNhY2hlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdyYXBoLnNldEVkZ2Uobm9kZSwgY2hpbGQpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYWRkTm9kZSAobm9kZSwgY2FjaGUpIHtcbiAgICAgICAgaWYgKHRoaXMuZ3JhcGguaGFzTm9kZShub2RlKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBjb25zdCBjYWNoZWQgPSBjYWNoZVtub2RlXTtcblxuICAgICAgICBpZiAoY2FjaGVkKVxuICAgICAgICAgICAgdGhpcy5ncmFwaC5zZXROb2RlKG5vZGUpO1xuXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IGNhY2hlZCAmJiBjYWNoZWQucGFyZW50O1xuXG4gICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LmlkLmluZGV4T2YoJ25vZGVfbW9kdWxlcycpIDwgMCkge1xuICAgICAgICAgICAgdGhpcy5hZGROb2RlKHBhcmVudC5pZCwgY2FjaGUpO1xuICAgICAgICAgICAgdGhpcy5ncmFwaC5zZXRFZGdlKHBhcmVudC5pZCwgbm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl91cGRhdGVDaGlsZHJlbihub2RlLCBjYWNoZSk7XG4gICAgfVxuXG4gICAgYnVpbGQgKGNhY2hlLCBub2Rlcykge1xuICAgICAgICBub2Rlcy5mb3JFYWNoKG5vZGUgPT4gdGhpcy5hZGROb2RlKG5vZGUsIGNhY2hlLCB0cnVlKSk7XG4gICAgfVxuXG4gICAgcmVidWlsZE5vZGUgKGNhY2hlLCBub2RlKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNoaWxkcmVuKG5vZGUsIGNhY2hlKTtcbiAgICB9XG5cbiAgICBjbGVhclBhcmVudHNDYWNoZSAoY2FjaGUsIG5vZGUpIHtcbiAgICAgICAgaWYgKCFjYWNoZVtub2RlXSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBjYWNoZVtub2RlXSA9IG51bGw7XG5cbiAgICAgICAgY29uc3QgcGFyZW50RWRnZXMgPSB0aGlzLmdyYXBoLmluRWRnZXMobm9kZSk7XG5cbiAgICAgICAgaWYgKCFwYXJlbnRFZGdlcyB8fCAhcGFyZW50RWRnZXMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHBhcmVudEVkZ2VzXG4gICAgICAgICAgICAubWFwKGVkZ2UgPT4gZWRnZS52KVxuICAgICAgICAgICAgLmZvckVhY2gocGFyZW50ID0+IHRoaXMuY2xlYXJQYXJlbnRzQ2FjaGUoY2FjaGUsIHBhcmVudCkpO1xuICAgIH1cbn1cbiJdfQ==