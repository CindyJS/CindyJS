var HalfEdge = function(vertex, face) {
    this._vertex = vertex;
    this.face = face;
};

HalfEdge.prototype.setOpposite = function(edge) {
    this.opposite = edge;
    edge.opposite = this;
};

HalfEdge.prototype.head = function() {
    return this._vertex;
};

HalfEdge.prototype.getPrev = function() {
    return this.previous;
};

HalfEdge.prototype.setPrev = function(edge) {
    this.previous = edge;
};

HalfEdge.prototype.getNext = function() {
    return this.next;
};

HalfEdge.prototype.setNext = function(edge) {
    this.next = edge;
};

HalfEdge.prototype.getFace = function() {
    return this.face;
};

HalfEdge.prototype.tail = function() {
    return (this.previous !== null) ? this.previous.head() : null;
};

HalfEdge.prototype.oppositeFace = function() {
    return (this.opposite !== null) ? this.opposite.face : null;
};

HalfEdge.prototype.getVertexString = function() {
    var tail = this.tail();

    return (tail !== null) ? (tail.index + '-' + this._vertex.index) : ('?-' + this._vertex.index);
};

HalfEdge.prototype.length = function() {
    var tail = this.tail();

    return (tail !== null) ? VectorOperations.abs(VectorOperations.sub(this._vertex.point, tail.point)) : -1;
};

HalfEdge.prototype.lengthSquared = function() {
    var tail = this.tail();

    return (tail !== null) ? VectorOperations.abs2(VectorOperations.sub(this._vertex.point, tail.point)) : -1;
};
