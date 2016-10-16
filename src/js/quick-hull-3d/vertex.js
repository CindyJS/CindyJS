var Vertex = function(x, y, z, index) {
    if (arguments.length === 0) {
        this.point = List.turnIntoCSList([]);
    } else {
        this.point = List.turnIntoCSList([x, y, z]);
        this.index = index;
    }

    this.next = null;
    this.previous = null;
};
