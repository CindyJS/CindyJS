/**
 * Class representing a 3D point (vec3) with an additional index attribute (number).
 * @param {vec3} position The point position.
 */
function IndexedPoint(position) {
    this.position = position;
    /** @type {vec3} */
    this.index = 0; /** @type {number} */
}

/**
 * A node in the k-d-tree. It stores in which axis the space is partitioned (x,y,z)
 * as an index, the position of the node, and its left and right children.
 * @param {number} axis
 * @param {IndexedPoint} point
 */
function KDNode(axis, point) {
    this.axis = axis;
    /** @type {number} */
    this.point = point;
    /** @type {IndexedPoint} */
    this.left = null;
    /** @type {KDNode} */
    this.right = null; /** @type {KDNode} */
}

/**
 * An axis aligned (bounding) box for search queries in the k-d-tree.
 * @param {vec3} min The minimum coordinate corner of the 3D cuboid.
 * @param {vec3} max The maximum coordinate corner of the 3D cuboid.
 */
function AxisAlignedBox(min, max) {
    this.min = min;
    this.max = max;
}

/**
 * Tests whether the axis aligned box contains a point.
 * @param {vec3} pt The point.
 * @return {boolean} True if the box contains the point.
 */
AxisAlignedBox.prototype.contains = function (pt) {
    return (
        pt.x >= this.min.x &&
        pt.y >= this.min.y &&
        pt.z >= this.min.z &&
        pt.x <= this.max.x &&
        pt.y <= this.max.y &&
        pt.z <= this.max.z
    );
};

/**
 * The k-d-tree class. Used for searching point sets in space efficiently.
 */
function KDTree() {
    this.root = null;
}

/**
 * Builds a k-d-tree from the passed point array.
 * @param {IndexedPoint[]} points The point array.
 */
KDTree.prototype.build = function (points) {
    this.root = this._build(points, 0);
};

/**
 * Builds a k-d-tree from the passed point array recursively (for internal use only).
 * @param {IndexedPoint[]} points The point array.
 * @return {KDNode} The parent node of the current sub-tree.
 */
KDTree.prototype._build = function (points, depth) {
    const k = 3; // Number of dimensions

    if (points.length == 0) {
        return null;
    }

    let axis = depth % k;
    points.sort((a, b) => {
        if (axis == 0) return a.position.x - b.position.x;
        if (axis == 1) return a.position.y - b.position.y;
        return a.position.z - b.position.z;
    });
    let medianIndex = Math.floor(points.length / 2);
    let leftPoints = points.slice(0, medianIndex);
    let rightPoints = points.slice(medianIndex + 1, points.length);

    let node = new KDNode(axis, points[medianIndex]);
    node.left = this._build(leftPoints, depth + 1);
    node.right = this._build(rightPoints, depth + 1);
    return node;
};

/**
 * Adds a point to the k-d-tree.
 * NOTE: If you want to add more than one point, rather use @see build.
 * The addPoint method can generate a degenerate tree if the points come in in an unfavorable order.
 * @param {IndexedPoint} point The point to add to the tree.
 */
KDTree.prototype.addPoint = function (point) {
    this.root = this._addPoint(this.root, 0, point);
};

/**
 * Adds a point to the k-d-tree (for internal use only).
 * @param {KDNode} node The current node to process (or null).
 * @param {number} depth The current depth in the tree.
 * @param {IndexedPoint} point The point to add to the tree.
 * @return {KDNode} The node object above or a new leaf node.
 */
KDTree.prototype._addPoint = function (node, depth, point) {
    const k = 3; // Number of dimensions
    let axis = depth % k;

    if (node == null) {
        return new KDNode(axis, point);
    }

    if (
        (axis == 0 && point.position.x < node.point.position.x) ||
        (axis == 1 && point.position.y < node.point.position.y) ||
        (axis == 2 && point.position.z < node.point.position.z)
    ) {
        node.left = this._addPoint(node.left, depth + 1, point);
    } else {
        node.right = this._addPoint(node.right, depth + 1, point);
    }
    return node;
};

/**
 * Performs an area search in the k-d-tree and returns all points within a certain bounding box.
 * @param {AxisAlignedBox} aabb The bounding box.
 * @return {IndexedPoint[]} The points of the k-d-tree inside of the bounding box.
 */
KDTree.prototype.findPointsInAxisAlignedBox = function (box) {
    let points = [];
    this._findPointsInAxisAlignedBox(box, this.root, points);
    return points;
};

/**
 * Performs an area search in the k-d-tree and returns all points within a certain bounding box
 * (for internal use only).
 * @param {AxisAlignedBox} aabb The bounding box.
 * @param {KDNode} node The current k-d-tree node that is searched.
 * @param {IndexedPoint[]} points The points of the k-d-tree inside of the bounding box.
 */
KDTree.prototype._findPointsInAxisAlignedBox = function (box, node, points) {
    if (node == null) {
        return;
    }

    if (box.contains(node.point.position)) {
        points.push(node.point);
    }

    if (
        (node.axis == 0 && box.min.x <= node.point.position.x) ||
        (node.axis == 1 && box.min.y <= node.point.position.y) ||
        (node.axis == 2 && box.min.z <= node.point.position.z)
    ) {
        this._findPointsInAxisAlignedBox(box, node.left, points);
    }
    if (
        (node.axis == 0 && box.max.x >= node.point.position.x) ||
        (node.axis == 1 && box.max.y >= node.point.position.y) ||
        (node.axis == 2 && box.max.z >= node.point.position.z)
    ) {
        this._findPointsInAxisAlignedBox(box, node.right, points);
    }
};

/**
 * Performs an area search in the k-d-tree and returns the closest point to a certain specified point.
 * If no point is found within a specified maximum distance, null is returned.
 * @param {IndexedPoint} centerPoint The point of which to find the closest neighbor (excluding itself).
 * @param {number} maxDistance The maximum distance the two points may have.
 * @return {IndexedPoint} The closest neighbor within the maximum distance.
 */
KDTree.prototype.findCloseIndexedPoint = function (centerPoint, maxDistance) {
    // Find all points in bounding rectangle and test if their distance is less or equal than searched one
    let min = new vec3(
        centerPoint.position.x - maxDistance,
        centerPoint.position.y - maxDistance,
        centerPoint.position.z - maxDistance
    );
    let max = new vec3(
        centerPoint.position.x + maxDistance,
        centerPoint.position.y + maxDistance,
        centerPoint.position.z + maxDistance
    );
    let box = new AxisAlignedBox(min, max);

    let pointsInBox = this.findPointsInAxisAlignedBox(box);

    let closestPoint = null;
    let closestDistance = 1e10;
    for (let i = 0; i < pointsInBox.length; i++) {
        let point = pointsInBox[i];
        let currDistance = vec3length(vec3sub(centerPoint.position, point.position));
        if (currDistance < closestDistance && currDistance < maxDistance && point !== centerPoint) {
            closestPoint = point;
            closestDistance = currDistance;
        }
    }
    return closestPoint;
};
