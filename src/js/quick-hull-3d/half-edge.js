var HalfEdge = function(vertex, face) {
    this.head = vertex;
    this.face = face;
};

HalfEdge.prototype.setOpposite = function(edge) {
    this.opposite = edge;
    edge.opposite = this;
};

HalfEdge.prototype.tail = function() {
    return (this.previous !== null) ? this.previous.head : null;
};

HalfEdge.prototype.oppositeFace = function() {
    return (this.opposite !== null) ? this.opposite.face : null;
};

HalfEdge.prototype.getVertexString = function() {
    var tail = this.tail();

    return (tail !== null) ? (tail.index + '-' + this.head.index) : ('?-' + this.head.index);
};

HalfEdge.prototype.length = function() {
    var tail = this.tail();

    return (tail !== null) ? VectorOperations.abs(VectorOperations.sub(this.head.point, tail.point)) : -1;
};

HalfEdge.prototype.lengthSquared = function() {
    var tail = this.tail();

    return (tail !== null) ? VectorOperations.abs2(VectorOperations.sub(this.head.point, tail.point)) : -1;
};
