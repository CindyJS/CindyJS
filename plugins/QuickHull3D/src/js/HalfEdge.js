var HalfEdge = function (vertex, face) {
    this.head = vertex;
    this.face = face;
};

var HalfEdgeOperations = {};
var HEO = HalfEdgeOperations;

HEO.setOpposite = function (edge, oppEdge) {
    edge.opposite = oppEdge;
    oppEdge.opposite = edge;
};

HEO.tail = function (edge) {
    return edge.previous !== null ? edge.previous.head : null;
};

HEO.oppositeFace = function (edge) {
    return edge.opposite !== null ? edge.opposite.face : null;
};

HEO.getVertexString = function (edge) {
    var tail = HEO.tail(edge);

    return tail !== null ? tail.index + "-" + edge.head.index : "?-" + edge.head.index;
};

HEO.length = function (edge) {
    var tail = HEO.tail(edge);

    return tail !== null ? VectorOperations.abs(VectorOperations.sub(edge.head.point, tail.point)) : -1;
};

HEO.lengthSquared = function (edge) {
    var tail = HEO.tail(edge);

    return tail !== null ? VectorOperations.abs2(VectorOperations.sub(edge.head.point, tail.point)) : -1;
};
