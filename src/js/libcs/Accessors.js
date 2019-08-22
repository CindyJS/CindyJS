//*************************************************************
// and here are the accessors for properties and elements
//*************************************************************

var Accessor = {};

Accessor.generalFields = { // fieldname translation
    color: "color",
    colorhsb: "",
    size: "size",
    alpha: "alpha",
    fillcolor: "fillcolor",
    fillalpha: "fillalpha",
    isshowing: "isshowing",
    visible: "visible",
    name: "name",
    caption: "caption",
    trace: "",
    tracelength: "",
    selected: "",
    labeled: "labeled",
    labelled: "labeled",
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

Accessor.getField = function(geo, field) {
    var erg;
    if (geo.kind === "P") {
        if (field === "xy") {
            erg = List.dehom(geo.homog);
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
        if (field === "narrow") {
            return General.wrap(geo.narrow);
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
        if (field === "slope") {
            return CSNumber.neg(CSNumber.div(
                geo.homog.value[0], geo.homog.value[1]));
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
            cen = List.dehom(cen);
            return General.withUsage(cen, "Point");
        }

        if (field === "dualMatrix") {
            return List.normalizeMax(List.adjoint3(geo.matrix));
        }

        if (field === "narrow") {
            return General.wrap(geo.narrow);
        }
    }
    if (geo.kind === "Text") {
        if (field === "pressed") {
            if (geo.checkbox) {
                return General.bool(geo.checkbox.checked);
            } else {
                return General.bool(false);
            }
        }
        if (field === "xy") {
            erg = List.dehom(geo.homog);
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
    if (field === "trace") {
        return General.bool(!!geo.drawtrace);
    }
    if (field === "pinned") {
        return General.bool(!!geo.pinned);
    }
    if (Accessor.generalFields[field]) { //must be defined as an actual string
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
        if (field === "ldiff" && geo.behavior.type === "Spring") {
            return CSNumber.real(geo.behavior.ldiff);
        }

    }
    var getter = geoOps[geo.type]["get_" + field];
    if (typeof getter === "function") {
        return getter(geo);
    }
    return nada;


};

Accessor.setField = function(geo, field, value) {
    var dir;

    if (field === "color" && List._helper.isNumberVecN(value, 3)) {
        geo.color = value;
    }
    if (field === "size" && value.ctype === "number") {
        geo.size = value;
    }
    if (field === "alpha" && value.ctype === "number") {
        geo.alpha = value;
    }
    if (field === "fillcolor" && List._helper.isNumberVecN(value, 3)) {
        geo.fillcolor = value;
    }
    if (field === "fillalpha" && value.ctype === "number") {
        geo.fillalpha = value;
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
    if (field === "labeled" || field === "labelled") {
        if (value.ctype === "boolean") {
            geo.labeled = value.value;
        }
    }
    if (field === "printlabel") {
        geo.printname = niceprint(value);
    }
    if (field === "trace") {
        if (value.ctype === "boolean") {
            if (value.value && !geo.drawtrace) {
                geo.drawtrace = true;
                setupTraceDrawing(geo);
            } else {
                geo.drawtrace = value.value;
            }
        }
    }

    if (geo.kind === "P" && geo.movable) {
        if (field === "xy" && List._helper.isNumberVecN(value, 2)) {
            movepointscr(geo, List.turnIntoCSList([value.value[0], value.value[1], CSNumber.real(1)]), "homog");
        }

        if (field === "xy" && List._helper.isNumberVecN(value, 3)) {
            movepointscr(geo, value, "homog");
        }

        if (field === "x" && value.ctype === "number") {
            movepointscr(geo, List.turnIntoCSList([CSNumber.mult(value, geo.homog.value[2]), geo.homog.value[1], geo.homog.value[2]]), "homog");
        }

        if (field === "y" && value.ctype === "number") {
            movepointscr(geo, List.turnIntoCSList([geo.homog.value[0], CSNumber.mult(value, geo.homog.value[2]), geo.homog.value[2]]), "homog");
        }

        if (field === "homog" && List._helper.isNumberVecN(value, 3)) {
            movepointscr(geo, value, "homog");
        }
    }

    if (field === "homog" && geo.kind === "L" && geo.movable && List._helper.isNumberVecN(value, 3)) {
        movepointscr(geo, value, "homog");
    }

    if (geo.kind === "Text") {
        if (field === "pressed" && value.ctype === "boolean" && geo.checkbox) {
            geo.checkbox.checked = value.value;
        }
        if (geo.movable) { // Texts may move without tracing
            if (field === "xy") {
                if (List._helper.isNumberVecN(value, 2)) {
                    geo.homog = List.turnIntoCSList([value.value[0], value.value[1], CSNumber.real(1)]);
                } else if (List._helper.isNumberVecN(value, 3)) {
                    geo.homog = value;
                }
            } else if (field === "homog" && List._helper.isNumberVecN(value, 3)) {
                geo.homog = value;
            } else if (field === "x" && value.ctype === "number") {
                geo.homog = List.turnIntoCSList([CSNumber.mult(value, geo.homog.value[2]), geo.homog.value[1], geo.homog.value[2]]);
            } else if (field === "y" && value.ctype === "number") {
                geo.homog = List.turnIntoCSList([geo.homog.value[0], CSNumber.mult(value, geo.homog.value[2]), geo.homog.value[2]]);
            }
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

    if (field === "narrow" && ["P", "C"].includes(geo.kind)) {
        if (value.ctype === "boolean") geo.narrow = value.value;
        if (value.ctype === "number" && CSNumber._helper.isAlmostReal(value)) geo.narrow = value.value.real;
    }

    var setter = geoOps[geo.type]["set_" + field];
    if (typeof setter === "function") {
        return setter(geo, value);
    }


};

Accessor.getuserData = function(obj, key) {
    var val;
    if (obj.userData && obj.userData[key]) val = obj.userData[key];

    if (val && val.ctype) {
        return val;
    } else if (typeof val !== "object") {
        return General.wrap(val);
    } else {
        return nada;
    }
};

Accessor.setuserData = function(obj, key, value) {
    if (!obj.userData) obj.userData = {};
    obj.userData[key] = value;
};
