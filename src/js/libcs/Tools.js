var activeTool = "Move"; // Current selected tool
var element; // The constructed element
var elements = []; // Contains all grabbed or temporary created elements (except the constructed "element" above)
var idx = 0; // Next free index for the elements array
var pIndex = 0; // Current element index
var step = 0; // Current step

/**
 * Returns the current element at mouse
 *
 * TODO Rewrite
 *
 * @param mouse
 * @returns {*}
 */
function getElementAtMouse(mouse) {
    var mov = null;
    var adist = 1000000;
    var diff;

    console.log("getElementAtMouse");

    for (var i = 0; i < csgeo.gslp.length; i++) {
        var el = csgeo.gslp[i];

        if (el.pinned || el.visible === false || el.tmp === true)
            continue;

        var dx, dy, dist;
        var sc = csport.drawingstate.matrix.sdet;
        if (el.kind === "P") {
            var p = List.normalizeZ(el.homog);
            if (!List._helper.isAlmostReal(p))
                continue;
            dx = p.value[0].value.real - mouse.x;
            dy = p.value[1].value.real - mouse.y;
            dist = Math.sqrt(dx * dx + dy * dy);
            if (el.narrow & dist > 20 / sc) dist = 10000;
        } else if (el.kind === "C") { //Must be CircleMr
            var mid = csgeo.csnames[el.args[0]];
            var rad = 0;

            //console.log(el.radius);

            if (typeof el.radius !== "undefined") {
                rad = el.radius.value.real;

                // For CircleMP
            } else if (el.args.length === 2) {
                /*var p1 = csgeo.csnames[el.args[0]];
                var p2 = csgeo.csnames[el.args[1]];

                var p1xx = CSNumber.div(p1.homog.value[0], p1.homog.value[2]).value.real;
                var p1yy = CSNumber.div(p1.homog.value[1], p1.homog.value[2]).value.real;

                var p2xx = CSNumber.div(p2.homog.value[0], p2.homog.value[2]).value.real;
                var p2yy = CSNumber.div(p2.homog.value[1], p2.homog.value[2]).value.real;

                rad = Math.sqrt(Math.pow(p2xx - p1xx, 2) + Math.pow(p2yy - p1yy, 2));

                console.log("radius");
                console.log(rad);*/
            }

            var xx = CSNumber.div(mid.homog.value[0], mid.homog.value[2]).value.real;
            var yy = CSNumber.div(mid.homog.value[1], mid.homog.value[2]).value.real;
            dx = xx - mouse.x;
            dy = yy - mouse.y;
            var ref = Math.sqrt(dx * dx + dy * dy);

            dist = ref - rad;
            dx = 0;
            dy = 0;
            if (dist < 0) {
                dist = -dist;
            }

            dist = dist + 30 / sc;

        } else if (el.kind === "L" || el.kind === "S") { //Must be ThroughPoint(Horizontal/Vertical not treated yet)
            var l = el.homog;
            var N = CSNumber;
            var nn = N.add(N.mult(l.value[0], N.conjugate(l.value[0])),
                N.mult(l.value[1], N.conjugate(l.value[1])));
            var ln = List.scaldiv(N.sqrt(nn), l);
            dist = ln.value[0].value.real * mouse.x + ln.value[1].value.real * mouse.y + ln.value[2].value.real;
            dx = ln.value[0].value.real * dist;
            dy = ln.value[1].value.real * dist;

            if (dist < 0) {
                dist = -dist;
            }
            dist = dist + 1;
        }

        if (dist < adist + 0.2 / sc) { //A bit a dirty hack, prefers new points
            adist = dist;
            mov = el;
            diff = {
                x: dx,
                y: dy
            };
        }
    }

    if (mov === null)
        return null;
    return {
        mover: mov,
        offset: diff,
        prev: {
            x: mouse.x,
            y: mouse.y
        }
    };
}

/**
 * Sets the active tool
 *
 * @param tool
 */
function setActiveTool(tool) {
    activeTool = tool;

    var actions = tools[activeTool].actions;

    if (typeof actions[0].tooltip !== "undefined") {
        document.getElementById("tooltip").innerHTML = actions[0].tooltip;
    }

    elements = [];
    idx = 0;
    step = 0;
}

/**
 * Gets the next free name for an element
 *
 * TODO Rewrite
 *
 * @returns {string}
 */
function getNextFreeName() {
    return "P" + pIndex++;
}

/**
 * Removes all temporary created elements
 */
function removeTmpElements() {
    for (var i = 0; i < csgeo.gslp.length; i++) {
        var el = csgeo.gslp[i];

        if (el.tmp === true) {
            removeElement(el.name);
        }
    }
}

/**
 * Makes tmp elements to regular elements
 */
function adoptTmpElements() {
    for (var i = 0; i < csgeo.gslp.length; i++) {
        var el = csgeo.gslp[i];

        if (el.tmp === true) {
            el.tmp = false;
        }
    }
}

/**
 * Each tool has a set of actions which are defined in a specific order. An action is linked with an event (e. g. mouse down).
 * Only if this event is triggered and the action returned true, the next action could be executed. Otherwise nothing happend.
 *
 * @param event
 */
function manage(event) {
    var actions = tools[activeTool].actions;

    if (actions[step].event === event) {
        var success = actions[step].do();

        if (success) {
            scheduleUpdate();

            if (step === actions.length - 1) {
                elements = [];
                idx = 0;
                step = 0;

            } else {
                step++;
            }
        }
    }
}

/**
 * Returns true, if an element is at mouse
 *
 * @param element
 * @returns {boolean}
 */
function isElementAtMouse(element) {
    return element && Math.abs(element.offset.x) < 0.5 && Math.abs(element.offset.y) < 0.5 && !element.mover.tmp;
}

/**
 * Returns true, if a point is at mouse
 *
 * @param element
 * @returns {boolean}
 */
function isPointAtMouse(element) {
    return isElementAtMouse(element) && (element.mover.kind === "P");
}

/**
 * Returns true, if a line is at mouse
 *
 * @param element
 * @returns {boolean}
 */
function isLineAtMouse(element) {
    return isElementAtMouse(element) && (element.mover.kind === "L" || element.mover.kind === "S");
}

/**
 * Returns true, if a circle is at mouse
 *
 * @param element
 * @returns {*|boolean}
 */
function isConicAtMouse(element) {
    return isElementAtMouse(element) && (element.mover.kind === "C");
}

/**
 * Set a specific element at mouse
 *
 * @param element
 */
function setElementAtMouse(element) {
    move = {
        mover: element,
        offset: {
            x: 0,
            y: 0
        },
        prev: {
            x: mouse.x,
            y: mouse.y
        }
    };
}

/**
 * Grabs a point if it is present at mouse or creates a temporary one
 */
function grabPoint() {
    var el = getElementAtMouse(mouse);

    if (isPointAtMouse(el)) {
        elements[idx] = el.mover;

    } else {
        elements[idx] = {
            type: "Free",
            name: getNextFreeName(),
            labeled: true,
            pos: [csmouse[0], csmouse[1], 1]
        };

        addElement(elements[idx]);
    }

    idx++;
}

/**
 * Grabs a line if it is present at mouse
 *
 * @returns {boolean}
 */
function grabLine() {
    var el = getElementAtMouse(mouse);

    if (isLineAtMouse(el)) {
        elements[idx] = el.mover;

        idx++;

        return true;
    }

    return false;
}

/**
 * Grabs a line or circle if it is present at mouse
 *
 * @returns {boolean}
 */
function grabLineOrConic() {
    var el = getElementAtMouse(mouse);

    if (isLineAtMouse(el) || isConicAtMouse(el)) {
        elements[idx] = el.mover;

        idx++;

        return true;
    }

    return false;
}

/**
 * Grabs the last point if it is present at mouse or uses the temporary created one
 */
function grabLastPoint() {
    var p2 = getElementAtMouse(mouse);

    if (isPointAtMouse(p2)) {
        element.args[1] = p2.mover.name;
        removeTmpElements();

    } else {
        adoptTmpElements();
    }
}

/**
 * Creates a new element
 *
 * @param type
 */
function create(type) {
    var tmpPoint = {
        type: "Free",
        name: getNextFreeName(),
        labeled: true,
        pos: [csmouse[0], csmouse[1], 1],
        tmp: true
    };

    tmpPoint = addElement(tmpPoint);

    element = addElement({
        type: type,
        name: getNextFreeName(),
        labeled: true,
        args: [elements[0].name, tmpPoint.name]
    });

    setElementAtMouse(tmpPoint);
}

//
// Tools
//
// Each tool has a set of actions which are defined in a specific order. An action is linked with an event (e. g. mouse down).
// Only if this event is triggered and the action returned true, the next action could be executed. Otherwise nothing happend.
//
var tools = {};

// Delete
tools.Delete = {};
tools.Delete.actions = [];
tools.Delete.actions[0] = {};
tools.Delete.actions[0].event = "mousedown";
tools.Delete.actions[0].tooltip = "...";
tools.Delete.actions[0].do = function() {
    move = getElementAtMouse(mouse);

    if (move !== null) {
        removeElement(move.mover.name);
    }

    return true;
};

// Move
tools.Move = {};
tools.Move.actions = [];
tools.Move.actions[0] = {};
tools.Move.actions[0].event = "mousedown";
tools.Move.actions[0].tooltip = "Move free elements by dragging the mouse";
tools.Move.actions[0].do = function() {
    move = getmover(mouse);

    return true;
};

// Point
tools.Point = {};
tools.Point.actions = [];
tools.Point.actions[0] = {};
tools.Point.actions[0].event = "mousedown";
tools.Point.actions[0].tooltip = "Add a single point with the mouse";
tools.Point.actions[0].do = function() {
    addElement({
        type: "Free",
        name: getNextFreeName(),
        labeled: true,
        pos: [csmouse[0], csmouse[1], 1]
    });

    return true;
};

// Mid
tools.Mid = {};
tools.Mid.actions = [];
tools.Mid.actions[0] = {};
tools.Mid.actions[0].event = "mousedown";
tools.Mid.actions[0].tooltip = "Construct two points and their midpoint by dragging";
tools.Mid.actions[0].do = function() {
    grabPoint();

    return true;
};

tools.Mid.actions[1] = {};
tools.Mid.actions[1].event = "mousemove";
tools.Mid.actions[1].do = function() {
    create("Mid");

    return true;
};

tools.Mid.actions[2] = {};
tools.Mid.actions[2].event = "mouseup";
tools.Mid.actions[2].do = function() {
    grabLastPoint();

    return true;
};

// Circle
tools.Circle = {};
tools.Circle.actions = [];
tools.Circle.actions[0] = {};
tools.Circle.actions[0].event = "mousedown";
tools.Circle.actions[0].tooltip = "Construct two points and a circle by dragging the mouse";
tools.Circle.actions[0].do = function() {
    grabPoint();

    return true;
};

tools.Circle.actions[1] = {};
tools.Circle.actions[1].event = "mousemove";
tools.Circle.actions[1].do = function() {
    create("CircleMP");

    return true;
};

tools.Circle.actions[2] = {};
tools.Circle.actions[2].event = "mouseup";
tools.Circle.actions[2].do = function() {
    grabLastPoint();

    return true;
};

// Compass
tools.Compass = {};
tools.Compass.actions = [];
tools.Compass.actions[0] = {};
tools.Compass.actions[0].event = "mousedown";
tools.Compass.actions[0].tooltip = "...";
tools.Compass.actions[0].do = function() {
    grabPoint();

    return true;
};

tools.Compass.actions[1] = {};
tools.Compass.actions[1].event = "mousedown";
tools.Compass.actions[1].tooltip = "...";
tools.Compass.actions[1].do = function() {
    grabPoint();

    return true;
};

tools.Compass.actions[2] = {};
tools.Compass.actions[2].event = "mousedown";
tools.Compass.actions[2].tooltip = "...";
tools.Compass.actions[2].do = function() {
    grabPoint();

    addElement({
        type: "Compass",
        name: getNextFreeName(),
        labeled: true,
        args: [elements[0].name, elements[1].name, elements[2].name]
    });

    return true;
};

// Line
tools.Line = {};
tools.Line.actions = [];
tools.Line.actions[0] = {};
tools.Line.actions[0].event = "mousedown";
tools.Line.actions[0].tooltip = "Construct two points and their connecting line by dragging the mouse";
tools.Line.actions[0].do = function() {
    grabPoint();

    return true;
};

tools.Line.actions[1] = {};
tools.Line.actions[1].event = "mousemove";
tools.Line.actions[1].do = function() {
    create("Join");

    return true;
};

tools.Line.actions[2] = {};
tools.Line.actions[2].event = "mouseup";
tools.Line.actions[2].do = function() {
    grabLastPoint();

    return true;
};

// Segment
tools.Segment = {};
tools.Segment.actions = [];
tools.Segment.actions[0] = {};
tools.Segment.actions[0].event = "mousedown";
tools.Segment.actions[0].tooltip = "Draw a segment by dragging the mouse";
tools.Segment.actions[0].do = function() {
    grabPoint();

    return true;
};

tools.Segment.actions[1] = {};
tools.Segment.actions[1].event = "mousemove";
tools.Segment.actions[1].do = function() {
    create("Segment");

    return true;
};

tools.Segment.actions[2] = {};
tools.Segment.actions[2].event = "mouseup";
tools.Segment.actions[2].do = function() {
    grabLastPoint();

    return true;
};

// Parallel
tools.Parallel = {};
tools.Parallel.actions = [];
tools.Parallel.actions[0] = {};
tools.Parallel.actions[0].event = "mousedown";
tools.Parallel.actions[0].tooltip = "Construct a parallel line by dragging a line";
tools.Parallel.actions[0].do = function() {
    return grabLine();
};

tools.Parallel.actions[1] = {};
tools.Parallel.actions[1].event = "mousemove";
tools.Parallel.actions[1].do = function() {
    var tmpPoint = {
        type: "Free",
        name: getNextFreeName(),
        labeled: true,
        pos: [csmouse[0], csmouse[1], 1],
        tmp: true
    };

    tmpPoint = addElement(tmpPoint);

    element = addElement({
        type: "Para",
        name: getNextFreeName(),
        labeled: true,
        args: [elements[0].name, tmpPoint.name]
    });

    setElementAtMouse(tmpPoint);

    return true;
};

tools.Parallel.actions[2] = {};
tools.Parallel.actions[2].event = "mouseup";
tools.Parallel.actions[2].do = function() {
    grabLastPoint();

    return true;
};

// Orthogonal
tools.Orthogonal = {};
tools.Orthogonal.actions = [];
tools.Orthogonal.actions[0] = {};
tools.Orthogonal.actions[0].event = "mousedown";
tools.Orthogonal.actions[0].tooltip = "Construct a orthogonal line by dragging a line";
tools.Orthogonal.actions[0].do = function() {
    if (grabLine()) {
        var tmpPoint = {
            type: "Free",
            name: getNextFreeName(),
            labeled: true,
            pos: [csmouse[0], csmouse[1], 1],
            tmp: true
        };

        tmpPoint = addElement(tmpPoint);

        element = addElement({
            type: "Perp",
            name: getNextFreeName(),
            labeled: true,
            args: [elements[0].name, tmpPoint.name]
        });

        setElementAtMouse(tmpPoint);

        return true;
    }

    return false;
};

tools.Orthogonal.actions[1] = {};
tools.Orthogonal.actions[1].event = "mouseup";
tools.Orthogonal.actions[1].do = function() {
    grabLastPoint();

    return true;
};

// Meet
//
// TODO Conic, ...
tools.Meet = {};
tools.Meet.actions = [];
tools.Meet.actions[0] = {};
tools.Meet.actions[0].event = "mousedown";
tools.Meet.actions[0].tooltip = "Select two elements to define their intersection";
tools.Meet.actions[0].do = function() {
    return grabLineOrConic();
};

tools.Meet.actions[1] = {};
tools.Meet.actions[1].event = "mousedown";
tools.Meet.actions[1].do = function() {
    if (grabLineOrConic()) {
        element = addElement({
            type: "Meet",
            name: getNextFreeName(),
            labeled: true,
            args: [elements[0].name, elements[1].name]
        });

        return true;
    }

    return false;
};
