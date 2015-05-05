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


var rk = doPri45;
var behaviors;
var masses = [];
var csPhysicsInited = false;

function csreinitphys(behavs) {
    behaviors.forEach(function(beh) {
     var geoname = beh.name;
     labObjects[beh.behavior.type].init(beh.behavior, csgeo.csnames[geoname]);

    }
    );
}


function csinitphys(behavs) {
    csPhysicsInited = (behavs.length !== 0);
    //console.log(csPhysicsInited);

    behaviors = behavs;
    masses = [];


    behaviors.forEach(function(beh) {
            if (beh.name) {
                var geoname = beh.name;
                if (csgeo.csnames[geoname]) {
                    csgeo.csnames[geoname].behavior = beh.behavior;
                    labObjects[beh.behavior.type].init(beh.behavior, csgeo.csnames[geoname]);
                    if (beh.behavior.type === "Mass") {
                        masses.push(csgeo.csnames[geoname]);
                    }


                }
            } else {
                labObjects[beh.behavior.type].init(beh.behavior);
            }
        }


    );

}


lab.tick = function() {

    for (var i = 0; i < labObjects.env.accuracy; i++) {
        lab.tick1(labObjects.env.deltat / labObjects.env.accuracy);
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
    behaviors.forEach(function(b) {
        var beh = b.behavior;
        labObjects[beh.type].restorePos(beh, rk.size + 2);
    });
    //for (Behavior beh : all) {
    //    if (!beh.getBlock()) {
    //        beh.restorePos(rk.getSize() + 2);
    //    }
    //}
};

lab.doCollisions = function() {
    behaviors.forEach(function(b) {
        var beh = b.behavior;
        labObjects[beh.type].doCollisions(beh);
    });

};

lab.calculateForces = function() {
    behaviors.forEach(function(b) {
        var beh = b.behavior;
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
    behaviors.forEach(function(b) {
        var beh = b.behavior;
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

        behaviors.forEach(function(b) {
            var beh = b.behavior;
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
        behaviors.forEach(function(b) {
            var beh = b.behavior;
            labObjects[beh.type].setToTimestep(beh, rk.dt[j]);
        });
        //   for (Behavior anAll : all) {
        //   if (!anAll.getBlock()) {
        //       anAll.setToTimestep(rk.getDt(j));
        //   }
        //}
    };

    var proceedMotion = function(j) {
        behaviors.forEach(function(b) {
            var beh = b.behavior;
            labObjects[beh.type].proceedMotion(beh, rk.dt[j], j, rk.a[j]);
        });
        //for (Behavior anAll : all) {
        //    if (!anAll.getBlock()) {
        //        anAll.proceedMotion(rk.getDt(j), j, rk.getA(j));
        //    }
        //}

    };

    var resetForces = function() {
        behaviors.forEach(function(b) {
            var beh = b.behavior;
            labObjects[beh.type].resetForces(beh);
        });
        //for (Behavior anAll : all) {
        //    if (!anAll.getBlock()) {
        //        anAll.resetForces();
        //    }
        //}
    };

    var calculateDelta = function(j) {
        behaviors.forEach(function(b) {
            var beh = b.behavior;
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
        behaviors.forEach(function(b) {
            var beh = b.behavior;
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
        behaviors.forEach(function(b) {
            var beh = b.behavior;
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

        if (error > 0.001 && mydeltat > 0.0000001) {
            //            if (error > 0.1 && mydeltat > 0.001) {
            mydeltat /= 2;
            recallInitialPosition();
        } else {

            madeIt = true;
        }

    }


    return mydeltat;
};
