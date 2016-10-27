/**
 * Creates a convex hull object.
 * If set of points is specialized initializes it to the convex hull.
 */
var QuickHull3D = function(points) {
    this.pointBuffer = [];

    this.minVertices = [];
    this.maxVertices = [];
    this.vertexPointIndices = [];
    this.faces = [];
    this.discardedFaces = [];

    this.horizon = [];

    this._claimed = new VertexList();
    this._unclaimed = new VertexList();

    if (points !== void 0) {
        this.build(points);
    }
};

QuickHull3D.INDEXED_FROM_ONE = 0x2;
QuickHull3D.INDEXED_FROM_ZERO = 0x4;
QuickHull3D.POINT_RELATIVE = 0x8;
QuickHull3D.prototype.debug = false;
QuickHull3D.prototype._findIndex = -1;

QuickHull3D.NONCONVEX_WRT_LARGER_FACE = 1;
QuickHull3D.NONCONVEX = 2;

QuickHull3D.DOUBLE_PRECISION = 2.2204460492503131e-16;
QuickHull3D.AUTOMATIC_TOLERANCE = -1;
QuickHull3D.prototype.explicitTolerance = QuickHull3D.AUTOMATIC_TOLERANCE;

QuickHull3D.prototype._addPointToFace = function(vertex, face) {
    vertex.face = face;

    if (face.outside === null) {
        this._claimed.add(vertex);
    } else {
        this._claimed.insertBefore(vertex, face.outside);
    }

    face.outside = vertex;
};

QuickHull3D.prototype._removePointFromFace = function(vertex, face) {
    if (vertex === face.outside) {
        if (vertex.next !== null && vertex.next.face === face) {
            face.outside = vertex.next;
        } else {
            face.outside = null;
        }
    }

    this._claimed.delete(vertex);
};

/**
 * Constructs the convex hull of a set of points
 */
QuickHull3D.prototype.build = function(points, numberOfPoints) {
    // if first element is a number then it is array of coordinates, else - array of points
    var numberOfGivenPoints = typeof points[0] === 'number' ? points.length / 3 : points.length;

    if (numberOfPoints === void 0) {
        numberOfPoints = numberOfGivenPoints;
    }

    if (numberOfPoints < 4) {
        throw new Error('Less than 4 input points specified');
    }

    if (numberOfGivenPoints < numberOfPoints) {
        throw new Error('Coordinate array too small for specified number of points');
    }

    this._initBuffers(numberOfPoints);
    this._setPoints(points);
    this._buildHull();
};


/**
 * @returns {CSList[]} array of points
 */
QuickHull3D.prototype.getVertices = function() {
    return this.vertexPointIndices.map(function(index) {
        var vertex = this.pointBuffer[index];
        return {
            ctype: "list",
            value: [
                { ctype: "number", value: { real: vertex.point.x, imag: 0 } },
                { ctype: "number", value: { real: vertex.point.y, imag: 0 } },
                { ctype: "number", value: { real: vertex.point.z, imag: 0 } }
            ]
        };
    }, this);
};

/**
 * Returns the faces associated with this hull.
 *
 * <p>Each face is represented by an integer array which gives the
 * indices of the vertices. By default, these indices are numbered with
 * respect to the hull vertices (as opposed to the input points), are
 * zero-based, and are arranged counter-clockwise. However, this
 * can be changed by setting {@link #POINT_RELATIVE POINT_RELATIVE},
 * {@link #INDEXED_FROM_ONE INDEXED_FROM_ONE}, or
 * {@link #CLOCKWISE CLOCKWISE} in the indexFlags parameter.
 *
 * @param indexFlags specifies index characteristics (0 results
 * in the default)
 * @returns {CSList[]} array of lists giving the vertex
 * indices for each face.
 */
QuickHull3D.prototype.getFaces = function(indexFlags) {
    if (indexFlags === void 0) {
        indexFlags = 0;
    }

    var allFaces = this.faces.map(function(face) {
        return this._getFaceIndices(face, indexFlags);
    }, this);


    return allFaces;
};

/**
 * Initialize
 */
QuickHull3D.prototype._initBuffers = function(numberOfPoints) {
    this.vertexPointIndices = [];

    for (var i = this.pointBuffer.length; i < numberOfPoints; i++) {
        this.pointBuffer.push(new Vertex());
    }

    this.faces = [];
    this._claimed.clear();
    this.numberOfFaces = 0;
    this.numberOfPoints = numberOfPoints;
};

/**
 * Sets passed points to this.pointBuffer
 */
QuickHull3D.prototype._setPoints = function(points) {
    if (typeof points[0] === 'number') {
        this.pointBuffer.forEach(function(vertex, i) {
            vertex.point = new Vector(points[3 * i + 0],
                points[3 * i + 1],
                points[3 * i + 2]);

            vertex.index = i;
        });
    } else {
        this.pointBuffer.forEach(function(vertex, i) {
            vertex.point = points[i];
            vertex.index = i;
        });
    }

};

/**
 * Finds extreme vertices along each cardinal axis and
 * sets them to this.maxVertices and this.minVertices
 * @todo split to several functions
 */
QuickHull3D.prototype._computeMaxAndMin = function() {
    var max = VectorOperations.copy(this.pointBuffer[0].point),
        min = VectorOperations.copy(this.pointBuffer[0].point),
        amplitude;

    for (var i = 0; i < 3; i++) {
        this.maxVertices[i] = this.minVertices[i] = this.pointBuffer[0];
    }

    this.pointBuffer.forEach(function(vertex) {
        var point = vertex.point,
            x = point.x,
            y = point.y,
            z = point.z;

        if (x > max.x) {
            max.x = x;
            this.maxVertices[0] = vertex;
        } else if (x < min.x) {
            min.x = x;
            this.minVertices[0] = vertex;
        }

        if (y > max.y) {
            max.y = y;
            this.maxVertices[1] = vertex;
        } else if (y < min.y) {
            min.y = y;
            this.minVertices[1] = vertex;
        }

        if (z > max.z) {
            max.z = z;
            this.maxVertices[2] = vertex;
        } else if (z < min.z) {
            min.z = z;
            this.minVertices[2] = vertex;
        }
    }, this);

    this.charLength = Math.max(max.x - min.x, max.y - min.y, max.z - min.z);

    if (this.explicitTolerance === this.constructor.AUTOMATIC_TOLERANCE) {
        this.tolerance = 3 * this.constructor.DOUBLE_PRECISION *
            (Math.max(Math.abs(max.x), Math.abs(min.x)) +
                Math.max(Math.abs(max.y), Math.abs(min.y)) +
                Math.max(Math.abs(max.z), Math.abs(min.z)));
    } else {
        this.tolerance = this.explicitTolerance;
    }
};

/**
 * Creates the initial simplex from which the hull will be built.
 * @todo split to several functions
 */

QuickHull3D.MAP_XYZ = ['x', 'y', 'z'];
QuickHull3D.prototype._createInitialSimplex = function() {
    var max = 0,
        imax = 0,
        vertices,
        i, difference;
    var map = this.constructor.MAP_XYZ;

    this.constructor.MAP_XYZ.forEach(function(axis, i) {
        var difference = this.maxVertices[i].point[axis] - this.minVertices[i].point[axis];

        if (difference > max) {
            max = difference;
            imax = i;
        }
    }, this);

    if (max <= this.tolerance) {
        throw new Error('Input points appear to be coincident');
    }

    // set first two vertices to be those with the greatest
    // one dimensional separation
    vertices = [this.maxVertices[imax], this.minVertices[imax]];

    // set third vertex to be the vertex farthest from
    // the line between vertex0 and vertex1
    var u0 = VectorOperations.sub(vertices[1].point, vertices[0].point),
        maxSquared = 0,
        normal;

    u0 = VectorOperations.normalize(u0);

    var l = this.pointBuffer.length;

    this.pointBuffer.forEach(function(vertex) {
        if (vertex.index === vertices[0].index || vertex.index === vertices[1].index) {
            return;
        }

        var difference02 = VectorOperations.sub(vertex.point, vertices[0].point),
            crossProduct = VectorOperations.cross(u0, difference02),
            lengthSquared = VectorOperations.abs2(crossProduct);

        if (lengthSquared > maxSquared) {
            maxSquared = lengthSquared;
            vertices[2] = vertex;
            normal = crossProduct;
        }
    });

    if (Math.sqrt(maxSquared) <= 100 * this.tolerance) {
        throw new Error('Input points appear to be colinear');
    }

    normal = VectorOperations.normalize(normal);

    var maxDistance = 0,
        d0 = VectorOperations.scalproduct(vertices[2].point, normal);

    this.pointBuffer.forEach(function(vertex) {
        if (vertex.index === vertices[0].index ||
            vertex.index === vertices[1].index ||
            vertex.index === vertices[2].index) {
            return;
        }

        var distance = Math.abs(VectorOperations.scalproduct(vertex.point, normal) - d0);

        if (distance > maxDistance) {
            maxDistance = distance;
            vertices[3] = vertex;
        }
    });

    if (maxDistance < 100 * this.tolerance) {
        throw new Error('Input points appear to be coplanar');
    }

    if (this.debug) {
        console.log('Initial vertices');
        vertices.forEach(function(vertex) {
            console.log(vertex.index + ' : ', vertex.point);
        });
    }

    var tris = [],
        k;
    if (VectorOperations.scalproduct(vertices[3].point, normal) - d0 < 0) {
        tris.push(Face.createTriangle(vertices[0], vertices[1], vertices[2]));
        tris.push(Face.createTriangle(vertices[3], vertices[1], vertices[0]));
        tris.push(Face.createTriangle(vertices[3], vertices[2], vertices[1]));
        tris.push(Face.createTriangle(vertices[3], vertices[0], vertices[2]));

        for (i = 0; i < 3; i++) {
            k = (i + 1) % 3;
            tris[i + 1].getEdge(1).setOpposite(tris[k + 1].getEdge(0));
            tris[i + 1].getEdge(2).setOpposite(tris[0].getEdge(k));
        }
    } else {
        tris.push(Face.createTriangle(vertices[0], vertices[2], vertices[1]));
        tris.push(Face.createTriangle(vertices[3], vertices[0], vertices[1]));
        tris.push(Face.createTriangle(vertices[3], vertices[1], vertices[2]));
        tris.push(Face.createTriangle(vertices[3], vertices[2], vertices[0]));

        for (i = 0; i < 3; i++) {
            k = (i + 1) % 3;
            tris[i + 1].getEdge(0).setOpposite(tris[k + 1].getEdge(1));
            tris[i + 1].getEdge(2).setOpposite(tris[0].getEdge((3 - i) % 3));
        }
    }

    this.faces = tris;

    this.pointBuffer.forEach(function(vertex) {
        var maxDistance = this.tolerance,
            maxFace;

        if (vertex.index === vertices[0].index ||
            vertex.index === vertices[1].index ||
            vertex.index === vertices[2].index ||
            vertex.index === vertices[3].index) {
            return;
        }

        tris.forEach(function(tri) {
            var distance = tri.distanceToPlane(vertex.point);

            if (distance > maxDistance) {
                maxFace = tri;
                maxDistance = distance;
            }

        });

        if (maxFace !== void 0) {
            this._addPointToFace(vertex, maxFace);
        }
    }, this);

};

/**
 * Returns the vertex points in this hull.
 * @return {CSList} list of vertex indices.
 */
QuickHull3D.prototype._getFaceIndices = function(face, flags) {
    var clockwise = (flags & this.constructor.CLOCKWISE) === 0,
        indexedFromOne = true, //((flags & this.constructor.INDEXED_FROM_ONE) !== 0),
        pointRelative = (flags & this.constructor.POINT_RELATIVE) !== 0,
        halfEdge = face.halfEdge0,
        index,
        indices = [];

    do {
        index = halfEdge.head.index;

        if (pointRelative) {
            index = this.vertexPointIndices[index];
        }

        if (indexedFromOne) {
            index++;
        }

        indices.push({
            ctype: "number",
            value: {
                real: index,
                imag: 0
            }
        });

        halfEdge = clockwise ? halfEdge.next : halfEdge.previous;
    } while (halfEdge !== face.halfEdge0);

    return {
        ctype: "list",
        value: indices
    };
};

QuickHull3D.prototype._resolveUnclaimedPoints = function(newFaces) {
    var maxDist, maxFace, newFace, i, vertex, nextVertex;
    var length = newFaces.length;
    var dist;

    for (vertex = this._unclaimed.head; vertex !== null; vertex = nextVertex) {
        nextVertex = vertex.next;

        maxDist = this.tolerance;
        maxFace = null;

        for (i = 0; i < length; i++) {
            newFace = newFaces[i];

            if (newFace.mark === Face.VISIBLE) {
                dist = newFace.distanceToPlane(vertex.point);

                if (dist > maxDist) {
                    maxDist = dist;
                    maxFace = newFace;
                }
                if (maxDist > 1000 * this.tolerance) {
                    break;
                }
            }
        }

        if (maxFace !== null) {
            this._addPointToFace(vertex, maxFace);
            if (this.debug && vertex.index === this._findIndex) {
                console.log(this._findIndex + " CLAIMED BY " + maxFace.getVertexString());
            }
        } else if (this.debug && vertex.index === this._findIndex) {
            console.log(this._findIndex + " DISCARDED");
        }
    }
};

QuickHull3D.prototype._removeAllPointsFromFace = function(face) {
    if (face.outside === null) {
        return null;
    }

    var end = face.outside;

    while (end.next !== null && end.next.face === face) {
        end = end.next;
    }

    this._claimed.delete(face.outside, end);
    end.next = null;

    return face.outside;
};

QuickHull3D.prototype._deleteFacePoints = function(face, absorbingFace) {
    var faceVertex = this._removeAllPointsFromFace(face);

    if (faceVertex === null) {
        return;
    }

    if (absorbingFace === null) {
        this._unclaimed.addAll(faceVertex);
        return;
    }
    var next;

    for (var vertex = faceVertex; vertex !== null; vertex = next) {
        next = vertex.next;
        var distance = absorbingFace.distanceToPlane(vertex.point);

        if (distance > this.tolerance) {
            this._addPointToFace(vertex, absorbingFace);
        } else {
            this._unclaimed.add(vertex);
        }
    }
};

QuickHull3D.prototype._oppFaceDistance = function(halfEdge) {
    return halfEdge.face.distanceToPlane(halfEdge.opposite.face.centroid);
};

QuickHull3D.prototype._doAdjacentMerge = function(face, mergeType) {
    var hedge = face.halfEdge0;
    var convex = true;
    var oppFace, merge;

    do {
        oppFace = hedge.oppositeFace();
        merge = false;

        if (mergeType === this.constructor.NONCONVEX) {
            // then merge faces if they are definitively non-convex
            if (this._oppFaceDistance(hedge) > -this.tolerance ||
                this._oppFaceDistance(hedge.opposite) > -this.tolerance) {
                merge = true;
            }
        } else {
            // mergeType === NONCONVEX_WRT_LARGER_FACE
            // merge faces if they are parallel or non-convex
            // wrt to the larger face; otherwise, just mark
            // the face non-convex for the second pass.
            if (face.area > oppFace.area) {
                if (this._oppFaceDistance(hedge) > -this.tolerance) {
                    merge = true;
                } else if (this._oppFaceDistance(hedge.opposite) > -this.tolerance) {
                    convex = false;
                }
            } else {
                if (this._oppFaceDistance(hedge.opposite) > -this.tolerance) {
                    merge = true;
                } else if (this._oppFaceDistance(hedge) > -this.tolerance) {
                    convex = false;
                }
            }
        }

        if (merge) {
            if (this.debug) {
                console.log(
                    "  merging " + face.getVertexString() + "  and  " +
                    oppFace.getVertexString());
            }

            var numd = face.mergeAdjacentFace(hedge, this.discardedFaces);

            for (var i = 0; i < numd; i++) {
                this._deleteFacePoints(this.discardedFaces[i], face);
            }

            if (this.debug) {
                console.log("  result: " + face.getVertexString());
            }

            return true;
        }

        hedge = hedge.next;
    } while (hedge !== face.halfEdge0);

    if (!convex) {
        face.mark = Face.NON_CONVEX;
    }

    return false;
};

QuickHull3D.prototype._calculateHorizon = function(eyePoint, edge0, face, horizon) {
    this._deleteFacePoints(face, null);
    face.mark = Face.DELETED;

    if (this.debug) {
        console.log('Visiting face ' + face.getVertexString());
    }

    var edge;

    if (edge0 === null) {
        edge0 = face.getEdge(0);
        edge = edge0;
    } else {
        edge = edge0.next;
    }

    var oppositeFace;

    do {
        oppositeFace = edge.oppositeFace();

        if (oppositeFace.mark === Face.VISIBLE) {
            if (oppositeFace.distanceToPlane(eyePoint) > this.tolerance) {
                this._calculateHorizon(eyePoint, edge.opposite, oppositeFace, horizon);
            } else {
                horizon.push(edge);

                if (this.debug) {
                    console.log('Adding horizon edge ' + edge.getVertexString());
                }
            }
        }

        edge = edge.next;
    } while (edge !== edge0);
};

QuickHull3D.prototype._addAdjoiningFace = function(eyeVertex, halfEdge) {
    var face = Face.createTriangle(eyeVertex, halfEdge.tail(), halfEdge.head);

    this.faces.push(face);
    face.getEdge(-1).setOpposite(halfEdge.opposite);

    return face.getEdge(0);
};

QuickHull3D.prototype._addNewFaces = function(newFaces, eyeVertex, horizon) {
    this.newFaces = [];

    var hedgeSidePrev = null;
    var hedgeSideBegin = null;

    this.horizon.forEach(function(horizonHe) {
        var hedgeSide = this._addAdjoiningFace(eyeVertex, horizonHe);

        if (this.debug) {
            console.log("new face: " + hedgeSide.face.getVertexString());
        }

        if (hedgeSidePrev !== null) {
            hedgeSide.next.setOpposite(hedgeSidePrev);
        } else {
            hedgeSideBegin = hedgeSide;
        }

        this.newFaces.push(hedgeSide.face);
        hedgeSidePrev = hedgeSide;
    }, this);

    hedgeSideBegin.next.setOpposite(hedgeSidePrev);
};

QuickHull3D.prototype._nextPointToAdd = function() {
    if (this._claimed.isEmpty()) {
        return null;
    }

    var eyeFace = this._claimed.head.face;
    var eyeVertex = null;
    var maxDistance = 0;
    var vertex, distance;

    for (vertex = eyeFace.outside; vertex !== null && vertex.face === eyeFace; vertex = vertex.next) {
        distance = eyeFace.distanceToPlane(vertex.point);

        if (distance > maxDistance) {
            maxDistance = distance;
            eyeVertex = vertex;
        }
    }

    return eyeVertex;
};

QuickHull3D.prototype._addPointToHull = function(eyeVertex) {
    this.horizon = [];
    this._unclaimed.clear();

    if (this.debug) {
        console.log('Adding point:', eyeVertex.index, '\n which is ' +
            eyeVertex.face.distanceToPlane(eyeVertex.point) +
            'above face ' + eyeVertex.face.getVertexString());
    }

    this._removePointFromFace(eyeVertex, eyeVertex.face);
    this._calculateHorizon(eyeVertex.point, null, eyeVertex.face, this.horizon);

    this.newFaces = [];
    this._addNewFaces(this.newFaces, eyeVertex, this.horizon);

    // first merge pass ... merge faces which are non-convex
    // as determined by the larger face

    this.newFaces.forEach(function(face) {
        if (face.mark === Face.VISIBLE) {
            while (this._doAdjacentMerge(face, this.constructor.NONCONVEX_WRT_LARGER_FACE)) {}
        }
    }, this);

    // second merge pass ... merge faces which are non-convex
    // wrt either face
    this.newFaces.forEach(function(face) {
        if (face.mark === Face.NON_CONVEX) {
            face.mark = Face.VISIBLE;
            while (this._doAdjacentMerge(face, this.constructor.NONCONVEX)) {}
        }
    }, this);

    this._resolveUnclaimedPoints(this.newFaces);
};

/**
 * Builds hull:
 * finds extreme points;
 * creates initial simplex;
 * adds points to hull.
 */
QuickHull3D.prototype._buildHull = function() {
    var cnt = 0,
        eyeVertex;

    this._computeMaxAndMin();
    this._createInitialSimplex();

    while ((eyeVertex = this._nextPointToAdd()) !== null) {
        this._addPointToHull(eyeVertex);
        cnt++;

        if (this.debug) {
            console.log('Iteration ' + cnt + ' done');
        }
    }

    this._reindexFacesAndVertices();

    if (this.debug) {
        console.log('Hull done');
    }
};

QuickHull3D.prototype._markFaceVertices = function(face, mark) {
    var halfEdge = face.halfEdge0;

    do {
        halfEdge.head.index = mark;
        halfEdge = halfEdge.next;
    } while (halfEdge !== face.halfEdge0);
};

QuickHull3D.prototype._reindexFacesAndVertices = function() {
    this.pointBuffer.forEach(function(vertex) {
        vertex.index = -1;
    });

    this.numberOfFaces = 0;
    var newFaces = [];

    // remove inactive faces and mark active vertices
    this.faces.forEach(function(face) {
        if (face.mark === Face.VISIBLE) {
            newFaces.push(face);
            this._markFaceVertices(face, 0);
            this.numberOfFaces++;
        }
    }, this);

    this.faces = newFaces;

    // reindex vertices
    this.numberOfVertices = 0;

    this.pointBuffer.forEach(function(vertex, index) {
        if (vertex.index === 0) {
            this.vertexPointIndices[this.numberOfVertices] = index;
            vertex.index = this.numberOfVertices++;
        }
    }, this);
};
