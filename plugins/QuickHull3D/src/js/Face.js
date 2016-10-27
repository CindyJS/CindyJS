var Face = function() {
    this.mark = this.constructor.VISIBLE;
    this.outside = null;
};

Face.VISIBLE = 1;
Face.NON_CONVEX = 2;
Face.DELETED = 3;

Face.prototype.computeCentroid = function() {
    var halfEdge = this.halfEdge0;
    this.centroid = VectorOperations.zerovector();

    do {
        this.centroid = VectorOperations.add(this.centroid, halfEdge.head.point);
        halfEdge = halfEdge.next;
    } while (halfEdge !== this.halfEdge0);

    this.centroid = VectorOperations.scaldiv(this.numberOfVertices, this.centroid);
};

Face.prototype.computeNormal = function(minArea) {
    var halfEdgeMax, lenSqrMax, lenMax,
        halfEdge, lenSqr,
        headPoint, tailPoint, u, dot;

    var halfEdge1 = this.halfEdge0.next;
    var halfEdge2 = halfEdge1.next;

    var point0 = this.halfEdge0.head.point;
    var point2 = halfEdge1.head.point;

    var d2p = VectorOperations.sub(point0, point2);
    var d1p;

    this.normal = VectorOperations.zerovector();
    this.numberOfVertices = 2;

    while (halfEdge2 !== this.halfEdge0) {
        d1p = d2p;

        point2 = halfEdge2.head.point;
        d2p = VectorOperations.sub(point0, point2);

        this.normal = VectorOperations.add(this.normal, VectorOperations.cross(d1p, d2p));

        halfEdge2 = halfEdge2.next;
        this.numberOfVertices++;
    }

    this.area = VectorOperations.abs(this.normal);
    this.normal = VectorOperations.scaldiv(this.area, this.normal);

    if (minArea === void 0) {
        return;
    }

    if (this.area < minArea) {
        halfEdgeMax = null;
        lenSqrMax = 0;

        halfEdge = this.halfEdge0;

        do {
            lenSqr = halfEdge.lengthSqr();

            if (lenSqr > lenSqrMax) {
                halfEdgeMax = halfEdge;
                lenSqrMax = lenSqr;
            }

            halfEdge = halfEdge.next;
        } while (halfEdge !== this.halfEdge0);

        headPoint = halfEdgeMax.head.point;
        tailPoint = halfEdgeMax.tail().point;

        lenMax = Math.sqrt(lenSqrMax);

        u = VectorOperations.scaldiv(lenMax, VectorOperations.sub(headPoint, tailPoint));
        dot = VectorOperations.scalproduct(u, this.normal);

        this.normal = VectorOperations.sub(this.normal, VectorOperations.scalmult(dot, u));
    }
};

Face.prototype.getEdge = function(index) {
    var halfEdge = this.halfEdge0;

    while (index > 0) {
        index--;
        halfEdge = halfEdge.next;
    }

    while (index < 0) {
        index++;
        halfEdge = halfEdge.previous;
    }

    return halfEdge;
};

Face.prototype.findEdge = function(tailVertex, headVertex) {
    var halfEdge = this.halfEdge0;

    do {
        if (halfEdge.head.index === headVertex.index) {
            if (halfEdge.tail().index === tailVertex.index) {
                return halfEdge;
            } else {
                return null;
            }
        }

        halfEdge = halfEdge.next;
    } while (halfEdge !== this.halfEdge0);

    return null;
};

Face.prototype.distanceToPlane = function(point) {
    return VectorOperations.scalproduct(this.normal, point) - this.planeOffset;
};

Face.prototype.getVertexString = function() {
    var result = this.halfEdge0.head.index,
        halfEdge = this.halfEdge0.next;

    while (halfEdge !== this.halfEdge0) {
        result += ' ' + halfEdge.head.index;
        halfEdge = halfEdge.next;
    }

    return result;
};

Face.prototype.getVertexIndices = function() {
    var result = [],
        halfEdge = this.halfEdge0;

    do {
        result.push(halfEdge.head.index);
        halfEdge = halfEdge.next;
    } while (halfEdge !== this.halfEdge0);

    return result;
};

Face.prototype.checkConsistency = function() {
    // do a sanity check on the face
    var hedge = this.halfEdge0;
    var maxd = 0;
    var numv = 0;

    if (this.numberOfVertices < 3) {
        throw new Error('degenerate face: ' + this.getVertexString());
    }

    do {
        var hedgeOpp = hedge.opposite;
        if (hedgeOpp === null) {
            throw new Error('face ' + this.getVertexString() + ': ' +
                'unreflected half edge ' + hedge.getVertexString());
        } else if (hedgeOpp.opposite !== hedge) {
            throw new Error('face ' + this.getVertexString() + ': ' +
                'opposite half edge ' + hedgeOpp.getVertexString() +
                ' has opposite ' + hedgeOpp.opposite.getVertexString());
        }
        if (hedgeOpp.head !== hedge.tail() || hedge.head !== hedgeOpp.tail()) {
            throw new Error('face ' + this.getVertexString() + ': ' +
                'half edge ' + hedge.getVertexString() +
                ' reflected by ' + hedgeOpp.getVertexString());
        }
        var oppFace = hedgeOpp.face;
        if (oppFace === null) {
            throw new Error('face ' + this.getVertexString() + ': ' +
                'no face on half edge ' + hedgeOpp.getVertexString());
        } else if (oppFace.mark === this.constructor.DELETED) {
            throw new Error('face ' + this.getVertexString() + ': ' +
                'opposite face ' + oppFace.getVertexString() +
                ' not on hull');
        }

        var d = Math.abs(this.distanceToPlane(hedge.head.point));

        if (d > maxd) {
            maxd = d;
        }

        numv++;
        hedge = hedge.next;
    } while (hedge !== this.halfEdge0);

    if (numv !== this.numberOfVertices) {
        throw new Error('face ' + this.getVertexString() + ' numVerts=' + this.numberOfVertices + ' should be ' + numv);
    }
};

Face.prototype.mergeAdjacentFace = function(hedgeAdj, discarded) {
    var numDiscarded = 0,
        oppFace = hedgeAdj.oppositeFace();

    discarded[numDiscarded++] = oppFace;

    oppFace.mark = this.constructor.DELETED;

    var hedgeOpp = hedgeAdj.opposite;

    var hedgeAdjPrev = hedgeAdj.previous;
    var hedgeAdjNext = hedgeAdj.next;
    var hedgeOppPrev = hedgeOpp.previous;
    var hedgeOppNext = hedgeOpp.next;

    while (hedgeAdjPrev.oppositeFace() === oppFace) {
        hedgeAdjPrev = hedgeAdjPrev.previous;
        hedgeOppNext = hedgeOppNext.next;
    }

    while (hedgeAdjNext.oppositeFace() === oppFace) {
        hedgeOppPrev = hedgeOppPrev.previous;
        hedgeAdjNext = hedgeAdjNext.next;
    }

    var hedge;

    for (hedge = hedgeOppNext; hedge !== hedgeOppPrev.next; hedge = hedge.next) {
        hedge.face = this;
    }

    if (hedgeAdj === this.halfEdge0) {
        this.halfEdge0 = hedgeAdjNext;
    }

    // handle the half edges at the head
    var discardedFace;

    discardedFace = this._connectHalfEdges(hedgeOppPrev, hedgeAdjNext);

    if (discardedFace !== null) {
        discarded[numDiscarded++] = discardedFace;
    }

    // handle the half edges at the tail
    discardedFace = this._connectHalfEdges(hedgeAdjPrev, hedgeOppNext);

    if (discardedFace !== null) {
        discarded[numDiscarded++] = discardedFace;
    }

    this._computeNormalAndCentroid();
    this.checkConsistency();

    return numDiscarded;
};

Face.prototype.getSquaredArea = function(hedge0, hedge1) {
    // return the squared area of the triangle defined
    // by the half edge hedge0 and the point at the
    // head of hedge1.

    var p0 = hedge0.tail().point;
    var p1 = hedge0.head.point;
    var p2 = hedge1.head.point;

    var dx1 = p1.x - p0.x;
    var dy1 = p1.y - p0.y;
    var dz1 = p1.z - p0.z;

    var dx2 = p2.x - p0.x;
    var dy2 = p2.y - p0.y;
    var dz2 = p2.z - p0.z;

    var x = dy1 * dz2 - dz1 * dy2;
    var y = dz1 * dx2 - dx1 * dz2;
    var z = dx1 * dy2 - dy1 * dx2;

    return x * x + y * y + z * z;
};

Face.prototype.triangulate = function(newFaces, minArea) {
    if (this.numberOfVertices < 4) {
        return;
    }

    var v0 = this.halfEdge0.head;
    var prevFace = null;
    var hedge = this.halfEdge0.next;
    var oppPrev = hedge.opposite;
    var face0 = null;
    var face;

    for (hedge = hedge.next; hedge !== this.halfEdge0.previous; hedge = hedge.next) {
        face = this.createTriangle(v0, hedge.previous.head, hedge.head, minArea);
        face.halfEdge0.next.setOpposite(oppPrev);
        face.halfEdge0.previous.setOpposite(hedge.opposite);
        oppPrev = face.halfEdge0;
        newFaces.push(face);
        if (face0 === null) {
            face0 = face;
        }
    }

    hedge = new HalfEdge(this.halfEdge0.previous.previous.head, this);
    hedge.setOpposite(oppPrev);

    hedge.previous = this.halfEdge0;
    hedge.previous.next = hedge;

    hedge.next = this.halfEdge0.previous;
    hedge.next.previous = hedge;

    this._computeNormalAndCentroid(minArea);
    this.checkConsistency();

    for (face = face0; face !== null; face = face.next) {
        face.checkConsistency();
    }
};

Face.prototype._computeNormalAndCentroid = function(minArea) {
    var numberOfVertices, halfEdge;

    this.computeNormal(minArea);
    this.computeCentroid();
    this.planeOffset = VectorOperations.scalproduct(this.normal, this.centroid);

    if (minArea !== void 0) {
        numberOfVertices = 0;
        halfEdge = this.halfEdge0;

        do {
            numberOfVertices++;
            halfEdge = halfEdge.next;
        } while (halfEdge !== this.halfEdge0);

        if (numberOfVertices !== this.numberOfVertices) {
            throw new Error('Face ' + this.getVertexString() + ' should be ' + this.numberOfVertices);
        }
    }
};

Face.prototype._connectHalfEdges = function(hedgePrev, hedge) {
    var discardedFace = null,
        oppFace = hedge.oppositeFace(),
        hedgeOpp;

    if (hedgePrev.oppositeFace() === oppFace) {
        if (hedgePrev === this.halfEdge0) {
            this.halfEdge0 = hedge;
        }

        if (oppFace.numberOfVertices === 3) {
            hedgeOpp = hedge.opposite.previous.opposite;
            oppFace.mark = this.constructor.DELETED;
            discardedFace = oppFace;
        } else {
            hedgeOpp = hedge.opposite.next;

            if (oppFace.halfEdge0 === hedgeOpp.previous) {
                oppFace.halfEdge0 = hedgeOpp;
            }

            hedgeOpp.previous = hedgeOpp.previous.previous;
            hedgeOpp.previous.next = hedgeOpp;
        }

        hedge.previous = hedgePrev.previous;
        hedge.previous.next = hedge;

        hedge.opposite = hedgeOpp;
        hedgeOpp.opposite = hedge;

        oppFace._computeNormalAndCentroid();
    } else {
        hedgePrev.next = hedge;
        hedge.previous = hedgePrev;
    }

    return discardedFace;
};

Face.createTriangle = function(vertex0, vertex1, vertex2, minArea) {
    minArea = minArea || 0;

    var face = new Face(),
        halfEdge0 = new HalfEdge(vertex0, face),
        halfEdge1 = new HalfEdge(vertex1, face),
        halfEdge2 = new HalfEdge(vertex2, face);

    halfEdge0.previous = halfEdge2;
    halfEdge0.next = halfEdge1;

    halfEdge1.previous = halfEdge0;
    halfEdge1.next = halfEdge2;

    halfEdge2.previous = halfEdge1;
    halfEdge2.next = halfEdge0;

    face.halfEdge0 = halfEdge0;

    face._computeNormalAndCentroid(minArea);

    return face;
};

Face.create = function(vertices, indices) {
    var face = new Face(),
        hePrev = null;

    indices.forEach(function(index) {
        var he = new HalfEdge(vertices[index], face);

        if (hePrev !== null) {
            he.previous = hePrev;
            hePrev.next = he;
        } else {
            face.halfEdge0 = he;
        }

        hePrev = he;
    });

    face.halfEdge0.previous = hePrev;
    hePrev.next = face.halfEdge0;

    face._computeNormalAndCentroid();

    return face;
};

