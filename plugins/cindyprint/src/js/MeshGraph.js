/**
 * Constructs a graph node.
 */
function GraphNode() {
    // Contains the indices of all nodes connected by an edge
    this.neighbors = [];

    // All edges connecting this node with another node
    this.edges = [];

    // Whether this node was visited by a search algorithm
    this.visited = false;
}

/**
 * Constructs a graph edge between the nodes with index i and j.
 */
function GraphEdge(i, j) {
    // Contains exactly two node indices
    this.connectedNodes = [i, j];

    // Contains How often this edge exists in the triangle mesh
    this.meshEdgeCount = 1;
}

/**
 * The class MeshGraph generates a graph from a @ref TriangleMesh.
 * A graph consists of nodes (i.e. the vertex positions) and eges
 * (i.e. the edges of the indexed triangles).
 * @param {TriangleMesh} triangleMesh The triangle mesh.
 * @param {boolean} orderIndices Whether the indices stored in the
 * edges should be ordered.
 */
function MeshGraph(triangleMesh, orderIndices = true) {
    this.nodes = [];
    this.edges = [];
    this.orderIndices = orderIndices;

    // Iterate over all vertices
    for (let i = 0; i < triangleMesh.vertices.length; i++) {
        this.nodes.push(new GraphNode());
    }

    // Iterate over all triangles
    for (let i = 0; i < triangleMesh.indices.length; i += 3) {
        let index0 = triangleMesh.indices[i];
        let index1 = triangleMesh.indices[i + 1];
        let index2 = triangleMesh.indices[i + 2];

        this.addEdge(index0, index1);
        this.addEdge(index1, index2);
        this.addEdge(index2, index0);
    }
}

/**
 * Adds an (undirected) edge between the nodes i and j.
 */
MeshGraph.prototype.addEdge = function (i, j) {
    if (this.nodes[i].neighbors.indexOf(j) !== -1) {
        // Edge exists already. Just increase count of the edge.
        for (let edgeIndex = 0; edgeIndex < this.nodes[i].edges.length; edgeIndex++) {
            if (this.nodes[i].edges[edgeIndex].connectedNodes.indexOf(j) !== -1) {
                this.nodes[i].edges[edgeIndex].meshEdgeCount += 1;
            }
        }
    } else {
        // Edge does not exist. Add a new edge.
        if (i > j && this.orderIndices) {
            let temp = i;
            i = j;
            j = temp;
        }
        let edge = new GraphEdge(i, j);
        this.nodes[i].neighbors.push(j);
        this.nodes[j].neighbors.push(i);
        this.nodes[i].edges.push(edge);
        this.nodes[j].edges.push(edge);
        this.edges.push(edge);
    }
};

/**
 * @return {boolean} Returns true if the mesh has no holes.
 * A mesh has no holes if each edge is shared by exactly two triangles
 */
MeshGraph.prototype.hasNoHoles = function () {
    for (let i = 0; i < this.edges.length; i++) {
        if (this.edges[i].meshEdgeCount != 2) {
            console.log(this.edges[i]);
            return false;
        }
    }
    return true;
};

/**
 * @return {boolean} Returns true if the mesh consists of only one connected component.
 * For this, a depth-first-search is started at the first node.
 * If the search doesn't reach all nodes, return false.
 */
MeshGraph.prototype.isFullyConnected = function () {
    // Reset the "visited" property of all nodes
    for (let i = 0; i < this.nodes.length; i++) {
        this.nodes[i].visited = false;
    }

    // Perform a breadth-first-search starting at the first node.
    let bfsQueue = [0];
    let closedSet = new Set();
    while (bfsQueue.length > 0) {
        let currentNodeIndex = bfsQueue.shift();
        let currentNode = this.nodes[currentNodeIndex];
        currentNode.visited = true;
        closedSet.add(currentNodeIndex);

        for (let i = 0; i < currentNode.neighbors.length; i++) {
            let neighborIndex = currentNode.neighbors[i];
            if (!closedSet.has(neighborIndex) && !bfsQueue.indexOf(neighborIndex) !== -1) {
                bfsQueue.push(neighborIndex);
            }
        }
    }

    // Test whether the search reached all nodes.
    for (let i = 0; i < this.nodes.length; i++) {
        if (!this.nodes[i].visited) {
            return false;
        }
    }
    return true;
};
