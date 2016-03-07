//*************************************************************
// and here are the accessors for properties and elements
//*************************************************************

var Accessor = {};

Accessor.generalFields = { //Übersetungstafel der Feldnamen 
    color: "color",
    colorhsb: "",
    size: "size",
    alpha: "alpha",
    isshowing: "isshowing",
    visible: "visible",
    name: "name",
    caption: "caption",
    trace: "trace",
    tracelength: "",
    selected: ""
};

Accessor.getGeoField = function(geoname, field) {
    if (typeof csgeo.csnames[geoname] !== 'undefined') {
        return Accessor.getField(csgeo.csnames[geoname], field);
    }
    return nada;
};


Accessor.setGeoField = function(geoname, field, value) {
    if (typeof csgeo.csnames[geoname] !== 'undefined') {
        return Accessor.setField(csgeo.csnames[geoname], field, value);
    }
    return nada;
};

function dehom(v) {
    v = v.value.slice();
    var n = v.length - 1;
    var d = CSNumber.inv(v[n]);
    v.length = n;
    for (var i = 0; i < n; ++i)
        v[i] = CSNumber.mult(d, v[i]);
    return List.turnIntoCSList(v);
}

Accessor.getField = function(geo, field) {
    var erg;
    if (geo.kind === "P") {
        if (field === "xy") {
            erg = dehom(geo.homog);
            return General.withUsage(erg, "Point");
        }

        if (field === "homog") {
            return General.withUsage(geo.homog, "Point");
        }


        if (field === "x") {
            return CSNumber.div(geo.homog.value[0], geo.homog.value[2]);
        }

        if (field === "y") {
            return CSNumber.div(geo.homog.value[1], geo.homog.value[2]);
        }
    }
    if (geo.kind === "L" || geo.kind === "S") {
        if (field === "homog") {
            return General.withUsage(geo.homog, "Line");
        }
        if (field === "angle") {
            erg = List.eucangle(List.ey, geo.homog);
            return General.withUsage(erg, "Angle");
        }

    }
    if (geo.kind === "Tr") {
        if (field === "matrix") {
            return geo.matrix;
        }
    }
    if (geo.kind === "C") {
        if (field === "radius") { //Assumes that we have a circle
            var s = geo.matrix;
            var ax = s.value[0].value[0];
            var az = s.value[0].value[2];
            var bz = s.value[1].value[2];
            var cz = s.value[2].value[2];


            var n = CSNumber.mult(ax, ax);
            var aa = CSNumber.div(az, ax);
            var bb = CSNumber.div(bz, ax);
            var cc = CSNumber.div(cz, ax);
            erg = CSNumber.sqrt(CSNumber.sub(CSNumber.add(CSNumber.mult(aa, aa),
                    CSNumber.mult(bb, bb)),
                cc));

            return erg;
        }

        if (field === "size") {
            return geo.size;
        }

        if (field === "matrix") {
            return geo.matrix;
        }

        if (field === "center") {
            var cen = geoOps._helper.CenterOfConic(geo.matrix);
            cen = dehom(cen);
            return General.withUsage(cen, "Point");
        }

        if (field === "dualMatrix") {
            return List.normalizeMax(List.adjoint3(geo.matrix));
        }
    }

    if (Accessor.generalFields[field]) { //must be defined an an actual string
        erg = geo[Accessor.generalFields[field]];
        if (erg && erg.ctype) {
            return erg;
        } else if (typeof erg !== "object") {
            return General.wrap(erg);
        } else {
            return nada;
        }
    }
    //Accessors for masses
    if (geo.behavior) {
        if (field === "mass" && geo.behavior.type === "Mass") {
            return CSNumber.real(geo.behavior.mass);
        }
        if (field === "radius" && geo.behavior.type === "Mass") {
            return CSNumber.real(geo.behavior.radius);
        }
        if (field === "charge" && geo.behavior.type === "Mass") {
            return CSNumber.real(geo.behavior.charge);
        }
        if (field === "friction" && geo.behavior.type === "Mass") {
            return CSNumber.real(geo.behavior.friction);
        }
        if (field === "vx" && geo.behavior.type === "Mass") {
            return CSNumber.real(geo.behavior.vx);
        }
        if (field === "vy" && geo.behavior.type === "Mass") {
            return CSNumber.real(geo.behavior.vy);
        }
        if (field === "v" && geo.behavior.type === "Mass") {
            return List.realVector([geo.behavior.vx, geo.behavior.vy]);
        }
        if (field === "fx" && geo.behavior.type === "Mass") {
            return CSNumber.real(geo.behavior.fx);
        }
        if (field === "fy" && geo.behavior.type === "Mass") {
            return CSNumber.real(geo.behavior.fy);
        }
        if (field === "f" && geo.behavior.type === "Mass") {
            return List.realVector([geo.behavior.fx, geo.behavior.fy]);
        }

    }
    return nada;


};

Accessor.setField = function(geo, field, value) {
    var dir;

    if (field === "color") {
        geo.color = value;
    }
    if (field === "size") {
        geo.size = value;
    }
    if (field === "alpha") {
        geo.alpha = value;
    }
    if (field === "visible") {
        if (value.ctype === "boolean") {
            geo.visible = value.value;
        }
    }
    if (field === "pinned") {
        if (value.ctype === "boolean") {
            geo.pinned = value.value;
        }
    }
    if (field === "printlabel") {
        geo.printname = niceprint(value);
    }

    if (field === "xy" && geo.kind === "P" && geo.movable && List._helper.isNumberVecN(value, 2)) {
        movepointscr(geo, List.turnIntoCSList([value.value[0], value.value[1], CSNumber.real(1)]), "homog");
    }

    if (field === "xy" && geo.kind === "P" && geo.movable && List._helper.isNumberVecN(value, 3)) {
        movepointscr(geo, value, "homog");
    }

    if (field === "x" && geo.kind === "P" && geo.movable && value.ctype === "number") {
        movepointscr(geo, List.turnIntoCSList([CSNumber.mult(value, geo.homog.value[2]), geo.homog.value[1], geo.homog.value[2]]), "homog");
    }

    if (field === "y" && geo.kind === "P" && geo.movable && value.ctype === "number") {
        movepointscr(geo, List.turnIntoCSList([geo.homog.value[0], CSNumber.mult(value, geo.homog.value[2]), geo.homog.value[2]]), "homog");
    }


    if (field === "homog" && geo.kind === "P" && geo.movable && List._helper.isNumberVecN(value, 3)) {
        movepointscr(geo, value, "homog");
    }

    if (field === "homog" && geo.type === "FreeLine" && geo.movable && List._helper.isNumberVecN(value, 3)) {
        geo.homog = General.withUsage(value, "Line"); // TODO tracing (analogous to movepointscr)
    }

    if (field === "homog" && geo.type === "Through" && geo.movable && List._helper.isNumberVecN(value, 3)) {
        dir = List.turnIntoCSList([value.value[1], CSNumber.neg(value.value[0]), CSNumber.real(0)]);
        geo.homog = General.withUsage(value, "Line");
        movepointscr(geo, dir, "dir");
    }

    if (field === "angle" && geo.type === "Through") {
        var cc = CSNumber.cos(value);
        var ss = CSNumber.sin(value);
        dir = List.turnIntoCSList([cc, ss, CSNumber.real(0)]);
        movepointscr(geo, dir, "dir");
    }
    if (geo.kind === "C") {
        if (field === "radius" && geo.type === "CircleMr" && value.ctype === "number") {
            movepointscr(geo, value, "radius");
        }
    }
    if (geo.behavior) {
        if (field === "mass" && geo.behavior.type === "Mass" && value.ctype === "number") {
            geo.behavior.mass = value.value.real;
        }
        if (field === "mass" && geo.behavior.type === "Sun" && value.ctype === "number") {
            geo.behavior.mass = value.value.real;
        }
        if (field === "friction" && geo.behavior.type === "Mass" && value.ctype === "number") {
            geo.behavior.friction = value.value.real;
        }
        if (field === "charge" && geo.behavior.type === "Mass" && value.ctype === "number") {
            geo.behavior.charge = value.value.real;
        }
        if (field === "radius" && geo.behavior.type === "Mass" && value.ctype === "number") {
            geo.behavior.radius = value.value.real;
        }
        if (field === "vx" && geo.behavior.type === "Mass" && value.ctype === "number") {
            geo.behavior.vx = value.value.real;
        }
        if (field === "vy" && geo.behavior.type === "Mass" && value.ctype === "number") {
            geo.behavior.vy = value.value.real;
        }
        if (field === "v" && geo.behavior.type === "Mass" && List._helper.isNumberVecN(value, 2)) {
            geo.behavior.vx = value.value[0].value.real;
            geo.behavior.vy = value.value[1].value.real;
        }
    }


};
