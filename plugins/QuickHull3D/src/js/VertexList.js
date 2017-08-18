var VertexList = function() {
    this.head = this.tail = null;
};

VertexList.prototype.clear = function() {
    this.head = this.tail = null;
};

VertexList.prototype.add = function(vertex) {
    if (this.head === null) {
        this.head = vertex;
    } else {
        this.tail.next = vertex;
    }

    vertex.previous = this.tail;
    vertex.next = null;
    this.tail = vertex;
};

VertexList.prototype.addAll = function(vertex) {
    if (this.head === null) {
        this.head = vertex;
    } else {
        this.tail.next = vertex;
    }

    vertex.previous = this.tail;

    while (vertex.next !== null) {
        vertex = vertex.next;
    }

    this.tail = vertex;
};

VertexList.prototype.delete = function(vertex1, vertex2) {
    if (vertex2 === void 0) {
        vertex2 = vertex1;
    }

    if (vertex1.previous === null) {
        this.head = vertex2.next;
    } else {
        vertex1.previous.next = vertex2.next;
    }

    if (vertex2.next === null) {
        this.tail = vertex1.previous;
    } else {
        vertex2.next.previous = vertex1.previous;
    }
};

VertexList.prototype.insertBefore = function(vertex, target) {
    vertex.previous = target.previous;

    if (target.previous === null) {
        this.head = vertex;
    } else {
        target.previous.next = vertex;
    }

    vertex.next = target;
    target.previous = vertex;
};

VertexList.prototype.isEmpty = function() {
    return this.head === null;
};

VertexList.prototype.length = function() {
    var result = 0;

    for (var vertex = this.head; vertex !== null; vertex = vertex.next) {
        result++;
    }

    return result;
};
