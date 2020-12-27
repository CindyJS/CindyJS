var FaceOperations = {};
var FO = FaceOperations;

var Face = function () {
    this.mark = FO.VISIBLE;
    this.outside = null;
};

FO.VISIBLE = 1;
FO.NON_CONVEX = 2;
FO.DELETED = 3;

FO.computeCentroid = function (face) {
    var halfEdge = face.halfEdge0;
    face.centroid = VectorOperations.zerovector();

    do {
        face.centroid = VectorOperations.add(face.centroid, halfEdge.head.point);
        halfEdge = halfEdge.next;
    } while (halfEdge !== face.halfEdge0);

    face.centroid = VectorOperations.scaldiv(face.numberOfVertices, face.centroid);
};

FO.computeNormal = function (face, minArea) {
    var halfEdgeMax, lenSqrMax, lenMax, halfEdge, lenSqr, headPoint, tailPoint, u, dot;

    var halfEdge1 = face.halfEdge0.next;
    var halfEdge2 = halfEdge1.next;

    var point0 = face.halfEdge0.head.point;
    var point2 = halfEdge1.head.point;

    var d2p = VectorOperations.sub(point0, point2);
    var d1p;

    face.normal = VectorOperations.zerovector();
    face.numberOfVertices = 2;

    while (halfEdge2 !== face.halfEdge0) {
        d1p = d2p;

        point2 = halfEdge2.head.point;
        d2p = VectorOperations.sub(point0, point2);

        face.normal = VectorOperations.add(face.normal, VectorOperations.cross(d1p, d2p));

        halfEdge2 = halfEdge2.next;
        face.numberOfVertices++;
    }

    face.area = VectorOperations.abs(face.normal);
    face.normal = VectorOperations.scaldiv(face.area, face.normal);

    if (minArea === void 0) {
        return;
    }

    if (face.area < minArea) {
        halfEdgeMax = null;
        lenSqrMax = 0;

        halfEdge = face.halfEdge0;

        do {
            lenSqr = halfEdge.lengthSqr();

            if (lenSqr > lenSqrMax) {
                halfEdgeMax = halfEdge;
                lenSqrMax = lenSqr;
            }

            halfEdge = halfEdge.next;
        } while (halfEdge !== face.halfEdge0);

        headPoint = halfEdgeMax.head.point;
        tailPoint = HEO.tail(halfEdgeMax).point;

        lenMax = Math.sqrt(lenSqrMax);

        u = VectorOperations.scaldiv(lenMax, VectorOperations.sub(headPoint, tailPoint));
        dot = VectorOperations.scalproduct(u, face.normal);

        face.normal = VectorOperations.sub(face.normal, VectorOperations.scalmul(dot, u));
    }
};

FO.getEdge = function (face, index) {
    var halfEdge = face.halfEdge0;

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

FO.findEdge = function (face, tailVertex, headVertex) {
    var halfEdge = face.halfEdge0;

    do {
        if (halfEdge.head.index === headVertex.index) {
            if (HEO.tail(halfEdge).index === tailVertex.index) {
                return halfEdge;
            } else {
                return null;
            }
        }

        halfEdge = halfEdge.next;
    } while (halfEdge !== face.halfEdge);

    return null;
};

FO.distanceToPlane = function (face, point) {
    return VectorOperations.scalproduct(face.normal, point) - face.planeOffset;
};

FO.getVertexString = function (face) {
    var result = face.halfEdge0.head.index,
        halfEdge = face.halfEdge0.next;

    while (halfEdge !== face.halfEdge0) {
        result += " " + halfEdge.head.index;
        halfEdge = halfEdge.next;
    }

    return result;
};

FO.getVertexIndices = function (face) {
    var result = [],
        halfEdge = face.halfEdge0;

    do {
        result.push(halfEdge.head.index);
        halfEdge = halfEdge.next;
    } while (halfEdge !== face.halfEdge0);

    return result;
};

FO._checkConsistency = function (face) {
    // do a sanity check on the face
    var hedge = face.halfEdge0;
    var maxd = 0;
    var numv = 0;

    if (face.numberOfVertices < 3) {
        throw new Error("degenerate face: " + FO.getVertexString(face));
    }

    do {
        var hedgeOpp = hedge.opposite;
        if (hedgeOpp === null) {
            throw new Error(
                "face " + FO.getVertexString(face) + ": " + "unreflected half edge " + HEO.getVertexString(hedge)
            );
        } else if (hedgeOpp.opposite !== hedge) {
            throw new Error(
                "face " +
                    FO.getVertexString(face) +
                    ": " +
                    "opposite half edge " +
                    HEO.getVertexString(hedgeOpp) +
                    " has opposite " +
                    hedgeOpp.opposite.getVertexString()
            );
        }
        if (hedgeOpp.head !== HEO.tail(hedge) || hedge.head !== HEO.tail(hedgeOpp)) {
            throw (
                new Error("face " + FO.getVertexString(face) + ": " + "half edge " + HEO.getVertexString(hedge)) +
                " reflected by " +
                HEO.getVertexString(hedgeOpp)
            );
        }
        var oppFace = hedgeOpp.face;
        if (oppFace === null) {
            throw new Error(
                "face " + FO.getVertexString(face) + ": " + "no face on half edge " + HEO.getVertexString(hedgeOpp)
            );
        } else if (oppFace.mark === FO.DELETED) {
            throw new Error(
                "face " +
                    FO.getVertexString(face) +
                    ": " +
                    "opposite face " +
                    FO.getVertexString(oppFace) +
                    " not on hull"
            );
        }

        var d = Math.abs(FO.distanceToPlane(face, hedge.head.point));

        if (d > maxd) {
            maxd = d;
        }

        numv++;
        hedge = hedge.next;
    } while (hedge !== face.halfEdge0);

    if (numv !== face.numberOfVertices) {
        throw new Error(
            "face " + FO.getVertexString(face) + " numVerts=" + face.numberOfVertices + " should be " + numv
        );
    }
};

FO.mergeAdjacentFace = function (face, hedgeAdj, discarded) {
    var numDiscarded = 0,
        oppFace = HEO.oppositeFace(hedgeAdj);

    discarded[numDiscarded++] = oppFace;

    oppFace.mark = FO.DELETED;

    var hedgeOpp = hedgeAdj.opposite;

    var hedgeAdjPrev = hedgeAdj.previous;
    var hedgeAdjNext = hedgeAdj.next;
    var hedgeOppPrev = hedgeOpp.previous;
    var hedgeOppNext = hedgeOpp.next;

    while (HEO.oppositeFace(hedgeAdjPrev) === oppFace) {
        hedgeAdjPrev = hedgeAdjPrev.previous;
        hedgeOppNext = hedgeOppNext.next;
    }

    while (HEO.oppositeFace(hedgeAdjNext) === oppFace) {
        hedgeOppPrev = hedgeOppPrev.previous;
        hedgeAdjNext = hedgeAdjNext.next;
    }

    var hedge;

    for (hedge = hedgeOppNext; hedge !== hedgeOppPrev.next; hedge = hedge.next) {
        hedge.face = face;
    }

    if (hedgeAdj === face.halfEdge0) {
        face.halfEdge0 = hedgeAdjNext;
    }

    // handle the half edges at the head
    var discardedFace;

    discardedFace = FO._connectHalfEdges(face, hedgeOppPrev, hedgeAdjNext);

    if (discardedFace !== null) {
        discarded[numDiscarded++] = discardedFace;
    }

    // handle the half edges at the tail
    discardedFace = FO._connectHalfEdges(face, hedgeAdjPrev, hedgeOppNext);

    if (discardedFace !== null) {
        discarded[numDiscarded++] = discardedFace;
    }

    FO._computeNormalAndCentroid(face);
    FO._checkConsistency(face);

    return numDiscarded;
};

FO.getSquaredArea = function (face, hedge0, hedge1) {
    // return the squared area of the triangle defined
    // by the half edge hedge0 and the point at the
    // head of hedge1.

    var p0 = HEO.tail(hedge0).point;
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

FO.triangulate = function (face, newFaces, minArea) {
    if (face.numberOfVertices < 4) {
        return;
    }

    var v0 = face.halfEdge0.head;
    var prevFace = null;
    var hedge = face.halfEdge0.next;
    var oppPrev = hedge.opposite;
    var face0 = null;
    var newFace;

    for (hedge = hedge.next; hedge !== face.halfEdge0.previous; hedge = hedge.next) {
        newFace = FO.createTriangle(v0, hedge.previous.head, hedge.head, minArea);
        HEO.setOpposite(newFace.halfEdge0.next, oppPrev);
        HEO.setOpposite(newFace.halfEdge0.previous, hedge.opposite);
        oppPrev = newFace.halfEdge0;
        newFaces.push(newFace);
        if (face0 === null) {
            face0 = newFace;
        }
    }

    hedge = new HalfEdge(face.halfEdge0.previous.previous.head, face);
    HEO.setOpposite(hedge, oppPrev);

    hedge.previous = face.halfEdge0;
    hedge.previous.next = hedge;

    hedge.next = face.halfEdge0.previous;
    hedge.next.previous = hedge;

    FO.computeNormalAndCentroid(face, minArea);
    FO.checkConsistency(face);

    for (var f = face0; f !== null; f = f.next) {
        FO.checkConsistency(f);
    }
};

FO._computeNormalAndCentroid = function (face, minArea) {
    var numberOfVertices, halfEdge;

    FO.computeNormal(face, minArea);
    FO.computeCentroid(face);
    face.planeOffset = VectorOperations.scalproduct(face.normal, face.centroid);

    if (minArea !== void 0) {
        numberOfVertices = 0;
        halfEdge = face.halfEdge0;

        do {
            numberOfVertices++;
            halfEdge = halfEdge.next;
        } while (halfEdge !== face.halfEdge0);

        if (numberOfVertices !== face.numberOfVertices) {
            throw new Error("Face " + FO.getVertexString(face) + " should be " + face.numberOfVertices);
        }
    }
};

FO._connectHalfEdges = function (face, hedgePrev, hedge) {
    var discardedFace = null,
        oppFace = HEO.oppositeFace(hedge),
        hedgeOpp;

    if (HEO.oppositeFace(hedgePrev) === oppFace) {
        if (hedgePrev === face.halfEdge0) {
            face.halfEdge0 = hedge;
        }

        if (oppFace.numberOfVertices === 3) {
            hedgeOpp = hedge.opposite.previous.opposite;
            oppFace.mark = FO.DELETED;
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

        FO._computeNormalAndCentroid(oppFace);
    } else {
        hedgePrev.next = hedge;
        hedge.previous = hedgePrev;
    }

    return discardedFace;
};

FO.create = function (vertices, indices) {
    var face = new Face(),
        hePrev = null;

    indices.forEach(function (index) {
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

    FO._computeNormalAndCentroid(face);

    return face;
};

FO.createTriangle = function (vertex0, vertex1, vertex2, minArea) {
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

    FO._computeNormalAndCentroid(face, minArea);

    return face;
};
