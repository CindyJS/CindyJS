var Vertex = function(x, y, z, index) {
    if (arguments.length === 0) {
        this.point = { type: "list", value: []};
    } else {
        this.point = { type: "list", value: [x, y, z]};
        this.index = index;
    }

    this.next = null;
    this.previous = null;
};

