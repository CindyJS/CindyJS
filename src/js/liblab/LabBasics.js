var lab = {};

var doPri45 = {};


doPri45.a = [
    [],
    [1 / 5],
    [3 / 40, 9 / 40],
    [44 / 45, -56 / 15, 32 / 9],
    [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
    [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
    [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]
];
doPri45.dt = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];
doPri45.b1 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
doPri45.b2 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];
doPri45.size = 7; //is this 5, 6 or 7

var fehlberg78 = {};

fehlberg78.a = [
    [],
    [2 / 27],
    [1 / 36, 1 / 12],
    [1 / 24, 0, 1 / 8],
    [5 / 12, 0, -25 / 16, 25 / 16],
    [1 / 20, 0, 0, 1 / 4, 1 / 5],
    [-25 / 108, 0, 0, 125 / 108, -65 / 27, 125 / 54],
    [31 / 300, 0, 0, 0, 61 / 225, -2 / 9, 13 / 900],
    [2, 0, 0, -53 / 6, 704 / 45, -107 / 9, 67 / 90, 3],
    [-91 / 108, 0, 0, 23 / 108, -976 / 135, 311 / 54, -19 / 60, 17 / 6, -1 / 12],
    [2383 / 4100, 0, 0, -341 / 164, 4496 / 1025, -301 / 82, 2133 / 4100, 45 / 82, 45 / 164, 18 / 41],
    [3 / 205, 0, 0, 0, 0, -6 / 41, -3 / 205, -3 / 41, 3 / 41, 6 / 41, 0],
    [-1777 / 4100, 0, 0, -341 / 164, 4496 / 1025, -289 / 82, 2193 / 4100, 51 / 82, 33 / 164, 12 / 41, 0, 1],
    [0, 0, 0, 0, 0, 34 / 105, 9 / 35, 9 / 35, 9 / 280, 9 / 280, 0, 41 / 840, 41 / 840]
];
fehlberg78.dt = [0, 2 / 27, 1 / 9, 1 / 6, 5 / 12, 1 / 2, 5 / 6, 1 / 6, 2 / 3, 1 / 3, 1, 0, 1];
fehlberg78.b1 = [0, 0, 0, 0, 0, 34 / 105, 9 / 35, 9 / 35, 9 / 280, 9 / 280, 0, 41 / 840, 41 / 840];
fehlberg78.b2 = [41 / 840, 0, 0, 0, 0, 34 / 105, 9 / 35, 9 / 35, 9 / 280, 9 / 280, 41 / 840, 0, 0];
fehlberg78.size = 13;


//var rk = fehlberg78;
var rk = doPri45;
var behaviors;
var masses = [];
var springs = [];
var csPhysicsInited = false;

function csreinitphys() {
    behaviors.forEach(function(beh) {
        var geo = (beh.geo || []).map(function(name) {
            return csgeo.csnames[name];
        });
        labObjects[beh.type].init(beh, geo[0], geo);
    });
}


function csinitphys(behavs) {
    csPhysicsInited = (behavs.length !== 0);
    //console.log(csPhysicsInited);

    behaviors = [];
    masses = [];
    springs = [];

    labObjects.Environment.init({}); // Set defaults
    behavs.forEach(function(beh) {
        if (beh.behavior) { // Legacy format
            if (beh.name) {
                beh.behavior.geo = [beh.name];
            }
            beh = beh.behavior;
            if (beh.gravity) {
                beh.gravity = -beh.gravity; // positive was up but now is down
            }
        } else {
            geo = beh.geo;
        }
        var geo = (beh.geo || []).map(function(name) {
            return csgeo.csnames[name];
        });
        var mainGeo = geo[0]; // may be undefined!
        var op = labObjects[beh.type];
        if (!op) {
            console.error(beh);
            console.error("Behavior " + beh.type + " not implemented yet");
            return;
        }
        op.init(beh, mainGeo, geo);
        if (mainGeo) {
            mainGeo.behavior = beh;
            if (beh.type === "Mass") {
                masses.push(mainGeo);
            } else if (beh.type === "Spring") {
                springs.push(mainGeo);
            }
        }
        behaviors.push(beh);
    });

}


lab.tick = function() {

    for (var i = 0; i < labObjects.env.accuracy; i++) {
        lab.tick1(labObjects.env.deltat / labObjects.env.accuracy);
        cs_simulationstep();
    }
};

lab.tick1 = function(deltat) {

    var mydeltat = deltat;


    var proceeded = 0;
    var actualdelta;

    while (deltat > 0 && proceeded < deltat * 0.999 || deltat < 0 && proceeded > deltat * 0.999) {


        actualdelta = lab.oneRKStep(mydeltat);

        proceeded += actualdelta;
        mydeltat = Math.min(actualdelta * 2, deltat - proceeded);
        mydeltat = Math.max(mydeltat, 0.0000000000000001);
        lab.restorePosition();
        lab.doCollisions();
        lab.calculateForces();
        lab.moveToFinalPos();
    }
    return true;
};

lab.restorePosition = function() {
    behaviors.forEach(function(beh) {
        labObjects[beh.type].restorePos(beh, rk.size + 2);
    });
    //for (Behavior beh : all) {
    //    if (!beh.getBlock()) {
    //        beh.restorePos(rk.getSize() + 2);
    //    }
    //}
};

lab.doCollisions = function() {
    behaviors.forEach(function(beh) {
        labObjects[beh.type].doCollisions(beh);
    });

};

lab.calculateForces = function() {
    behaviors.forEach(function(beh) {
        labObjects[beh.type].calculateForces(beh);
    });
    //dispatcher.callScriptsForOccasion(Assignments.OCCASION_STEP);
    //for (Behavior anAll : all) {
    //    if (!anAll.getBlock()) {
    //        anAll.calculateForces();
    //    }
    //}
};
lab.moveToFinalPos = function() {
    behaviors.forEach(function(beh) {
        labObjects[beh.type].move(beh);
    });
    //for (Behavior beh : all) {
    //    if (!beh.getBlock()) {
    //        beh.move();
    //    }
    //}
};


lab.oneRKStep = function(mydeltat) {

    var initRKTimeStep = function(deltat) {

        behaviors.forEach(function(beh) {
            labObjects[beh.type].initRK(beh, deltat);
            labObjects[beh.type].storePosition(beh);
        });
        //for (Behavior anAll : all) {
        //    if (!anAll.getBlock()) {
        //        anAll.initRK(mydeltat);
        //        anAll.storePosition();
        //    }
        //}
    };

    var setToTimestep = function(j) {
        behaviors.forEach(function(beh) {
            labObjects[beh.type].setToTimestep(beh, rk.dt[j]);
        });
        //   for (Behavior anAll : all) {
        //   if (!anAll.getBlock()) {
        //       anAll.setToTimestep(rk.getDt(j));
        //   }
        //}
    };

    var proceedMotion = function(j) {
        behaviors.forEach(function(beh) {
            labObjects[beh.type].proceedMotion(beh, rk.dt[j], j, rk.a[j]);
        });
        //for (Behavior anAll : all) {
        //    if (!anAll.getBlock()) {
        //        anAll.proceedMotion(rk.getDt(j), j, rk.getA(j));
        //    }
        //}

    };

    var resetForces = function() {
        behaviors.forEach(function(beh) {
            labObjects[beh.type].resetForces(beh);
        });
        //for (Behavior anAll : all) {
        //    if (!anAll.getBlock()) {
        //        anAll.resetForces();
        //    }
        //}
    };

    var calculateDelta = function(j) {
        behaviors.forEach(function(beh) {
            labObjects[beh.type].calculateDelta(beh, j);
        });
        //for (Behavior anAll : all) {
        //    if (!anAll.getBlock()) {
        //        anAll.calculateDelta(j);
        //    }
        //}
    };


    var calculateError = function(j) {
        var error = 0;
        behaviors.forEach(function(beh) {
            var j = rk.size;
            labObjects[beh.type].proceedMotion(beh, rk.dt[j - 1], j, rk.b1);
            labObjects[beh.type].savePos(beh, j + 1);
            labObjects[beh.type].proceedMotion(beh, rk.dt[j - 1], j, rk.b2);
            labObjects[beh.type].savePos(beh, j + 2);
            error += labObjects[beh.type].sqDist(beh, j + 1, j + 2);

        });

        error = Math.sqrt(error) / mydeltat;
        return error;

        //var error = 0;
        //for (Behavior beh : all) {
        //    if (!beh.getBlock()) {
        //        beh.proceedMotion(rk.getDt(rk.getSize() - 1), rk.getSize(), rk.getB1());
        //        beh.savePos(rk.getSize() + 1);
        //        beh.proceedMotion(rk.getDt(rk.getSize() - 1), rk.getSize(), rk.getB2());
        //        beh.savePos(rk.getSize() + 2);
        //        error += beh.sqDist(rk.getSize() + 1, rk.getSize() + 2);
        //    }
        //}
        //error = Math.sqrt(error) / mydeltat;
        //return error;
    };

    var recallInitialPosition = function(j) {
        behaviors.forEach(function(beh) {
            labObjects[beh.type].recallPosition(beh);
        });

        //for (Behavior beh : all) {
        //    if (!beh.getBlock()) {
        //        beh.recallPosition();
        //    }
        //}
    };


    var rksize = rk.size;
    var madeIt = false;
    while (!madeIt) {
        initRKTimeStep(mydeltat);
        for (var j = 0; j < rksize; j++) {
            setToTimestep(j);
            proceedMotion(j);
            resetForces();
            lab.calculateForces();
            calculateDelta(j);

        }
        var error = calculateError(mydeltat);
        //console.log(error);
        //console.log(mydeltat);
        if (error > labObjects.env.errorbound && mydeltat > labObjects.env.lowestdeltat) {
            //          if (error > 0.0001 && mydeltat > 0.0000000001) {
            mydeltat /= labObjects.env.slowdownfactor;
            //            mydeltat /= 4;
            recallInitialPosition();
        } else {

            madeIt = true;
        }

    }


    return mydeltat;
};
