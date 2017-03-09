var Vertex = function(x, y, z, index) {
    if (arguments.length === 0) {
        this.point = turnIntoCSList([]);
    } else {
        this.point = turnIntoCSList([x, y, z]);
        this.index = index;
    }

    this.next = null;
    this.previous = null;
};
