var labObjects = {};

/*----------------------------MASS--------------------------*/


labObjects.Mass = {

    reset: function(beh, elem) {
        beh.vel = [0, 0, 0]; //TODO: Das wird später mal die Velocity
        beh.pos = [0, 0, 0, 0]; //Position (homogen) 


        beh.el = elem;
        if (typeof(beh.mass) === 'undefined') beh.mass = 1;
        if (typeof(beh.charge) === 'undefined') beh.charge = 0;
        if (typeof(beh.friction) === 'undefined') beh.friction = 0;
        beh.lnfrict = 0;
        if (typeof(beh.limitspeed) === 'undefined') beh.limitspeed = false;
        if (typeof(beh.fixed) === 'undefined') beh.fixed = false;
        if (typeof(beh.radius) === 'undefined') beh.radius = 1;
        beh.internalmove = false;

        beh.fx = 0;
        beh.fy = 0;
        beh.fz = 0;
        beh.vx = beh.vx || 0;
        beh.vy = beh.vy || 0;
        beh.vz = beh.vz || 0;

        beh.mtype = 0; // TODO: Free, Online, OnCircle

        var x = 0;
        var y = 0;
        var z = 0;
        var xo = 0;
        var yo = 0;
        var zo = 0;
        var vxo = 0;
        var vyo = 0;
        var vzo = 0;
        /*  var x,y,z,xo,yo,zo,vxo,vyo,vzo,oldx,oldy,oldz;
        var oldx1,oldy1,oldz1;
        var oldx2,oldy2,oldz2;
        var oldx3,oldy3,oldz3;
        var oldx4,oldy4,oldz4;*/

        beh.env = labObjects.env; //TODO Environment

        //For Runge Kutta
        beh.deltat = 0;
        beh.mx = 0;
        beh.my = 0;
        beh.mz = 0;
        beh.mvx = 0;
        beh.mvy = 0;
        beh.mvz = 0;
        beh.dx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        beh.dy = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        beh.dz = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        beh.dvx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        beh.dvy = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        beh.dvz = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        beh.midx = 0;
        beh.midy = 0;
        beh.midz = 0;
        beh.lx = 0;
        beh.ly = 0;
        beh.lz = 0;


    },

    resetForces: function(beh) {
        beh.fx = 0;
        beh.fy = 0;
        beh.fz = 0;

    },

    getBlock: false,

    setToTimestep: function(beh, j, a) {},

    initRK: function(beh, dt) {
        var pt = eval_helper.extractPoint(beh.el.homog);

        beh.x = pt.x;
        beh.y = pt.y;
        beh.z = 0;
        beh.xo = beh.x;
        beh.yo = beh.y;
        beh.zo = beh.z;
        beh.vxo = beh.vx;
        beh.vyo = beh.vy;
        beh.vzo = beh.vz;
        beh.deltat = dt;

        beh.fx = 0;
        beh.fy = 0;
        beh.fz = 0;

        /* TODO Implement this
            if (type === TYPE_POINTONCIRCLE) {
                Vec mid = ((PointOnCircle) associatedPoint.algorithm).getCenter();
                midx = mid.xr / mid.zr;
                midy = mid.yr / mid.zr;
                
            }
        if (type === TYPE_POINTONLINE) {
            Vec line = ((PointOnLine) associatedPoint.algorithm).getLine().coord;
            lx = line.yr;
            ly = -line.xr;
            double n = Math.sqrt(lx * lx + ly * ly);
            lx /= n; //Das ist die normierte Geradenrichtung
            ly /= n;
        } 
        */
    },

    setVelocity: function(beh, vx, vy, vz) {
        if (!vz) vz = 0;
        //if (type === TYPE_FREE) {
        if (true) {
            beh.vx = vx;
            beh.vy = vy;
            beh.vz = vz;
        }

        /* TODO Implement
            if (type === TYPE_POINTONCIRCLE) {
                double x = associatedPoint.coord.xr / associatedPoint.coord.zr;
                double y = associatedPoint.coord.yr / associatedPoint.coord.zr;
                Vec mid = ((PointOnCircle) associatedPoint.algorithm).getCenter();
                double midx = mid.xr / mid.zr;
                double midy = mid.yr / mid.zr;
                double dix = y - midy;  //Steht senkrecht auf Radius
                double diy = -x + midx;
                double n = Math.sqrt(dix * dix + diy * diy);
                dix /= n;
                diy /= n;
                double scal = dix * vx + diy * vy;//Es wird nur die wirsame kraftmomponente berücksichtigt
                    
                    this.vx = dix * scal;
                    this.vy = diy * scal;
            }
        if (type === TYPE_POINTONLINE) {
            Vec line = ((PointOnLine) associatedPoint.algorithm).getLine().coord;
            double lx = line.yr;
            double ly = -line.xr;
            double n = Math.sqrt(lx * lx + ly * ly);
            lx /= n; //Das ist die normierte Geradenrichtung
            ly /= n;
            double scal = lx * vx + ly * vy;//Es wird nur die wirsame kraftmomponente berücksichtigt
                this.vx = lx * scal;
                this.vy = ly * scal;
        }
        */


    },


    move: function(beh) {
        // if (type === TYPE_FREE) {
        if (true) {
            beh.pos = [beh.x, beh.y, 1.0];
            beh.internalmove = true;
            if (!move || !mouse.down || beh.el !== move.mover)
                movepointscr(beh.el, List.realVector(beh.pos), "homog");
            (beh.el).sx = beh.x;
            (beh.el).sy = beh.y;

            beh.internalmove = false;
        }


        /*
         if (kernel.simulation.containsMover(associatedPoint)) {
             //Hier wird "werfen" implementiert
             voldx4 = voldx3;
             voldy4 = voldy3;
             voldx3 = voldx2;
             voldy3 = voldy2;
             voldx2 = voldx1;
             voldy2 = voldy1;
             voldx1 = x;
             voldy1 = y;
             x = associatedPoint.coord.xr / associatedPoint.coord.zr;
             y = associatedPoint.coord.yr / associatedPoint.coord.zr;
             //reset();
             fx = 0;
             fy = 0;
             vx = (x - voldx4) / 2.0;
             vy = (y - voldy4) / 2.0;
             return;
         }
         if (type === TYPE_FREE) {
             pos.assign(x, y, 1.0);
             internalmove = true;
             kernel.construction.simulateMoveUnlessFixedByMouse(associatedPoint, pos);
             internalmove = false;
         }
         if (type === TYPE_POINTONCIRCLE) {
             double dix = y - midy;  //Steht senkrecht auf radius
             double diy = -x + midx;
             double n = Math.sqrt(dix * dix + diy * diy);
             dix /= n;
             diy /= n;
             n = Math.sqrt(vx * vx + vy * vy);
             dix *= n;
             diy *= n;
             double scal = dix * vx + diy * vy;
             if (scal < 0) {
                 vx = -dix;
                 vy = -diy;
             } else {
                 vx = dix;
                 vy = diy;
             }
             pos.assign(x, y, 1.0);
             internalmove = true;
             kernel.construction.simulateMoveUnlessFixedByMouse(associatedPoint, pos);
             internalmove = false;
         }
         if (type === TYPE_POINTONLINE) {
             
             double scal = lx * vx + ly * vy;
             vx = scal * lx;
             vy = scal * ly;
             
             pos.assign(x, y, 1.0);
             internalmove = true;
             kernel.construction.simulateMoveUnlessFixedByMouse(associatedPoint, pos);
             internalmove = false;
         }
         
         */
    },

    proceedMotion: function(beh, dt, i, a) {

        if (!beh.fixed
            //&& !associatedPoint.appearance.isPinned()   //TODO
        ) {

            if (true) {

                beh.x = beh.mx;
                beh.y = beh.my;
                beh.z = beh.mz;
                beh.vx = beh.mvx;
                beh.vy = beh.mvy;
                beh.vz = beh.mvz;
                for (var j = 0; j < i; j++) {
                    beh.x += a[j] * beh.dx[j] * beh.deltat;
                    beh.y += a[j] * beh.dy[j] * beh.deltat;
                    beh.z += a[j] * beh.dz[j] * beh.deltat;
                    beh.vx += a[j] * beh.dvx[j] * beh.deltat;
                    beh.vy += a[j] * beh.dvy[j] * beh.deltat;
                    beh.vz += a[j] * beh.dvz[j] * beh.deltat;
                }
            } else {
                beh.vx = 0;
                beh.vy = 0;
                beh.vz = 0;
            }
        }
    },

    calculateForces: function(beh) {
        var bv = Math.sqrt(beh.vx * beh.vx + beh.vy * beh.vy + beh.vz * beh.vz);
        var bvv = (bv > 0.1 && beh.limitSpeed) ? 0.1 / bv : 1;
        var fri = (1 - beh.env.friction) * bvv;
        beh.lnfrict = -Math.log((1 - beh.friction) * fri);

        //        if (Double.isInfinite(lnfrict)) lnfrict = 10000000000000.0; TODO
        beh.fx += -beh.vx * beh.lnfrict * beh.mass; //Reibung F_R=v*f*m (richtige Formel ?)
        beh.fy += -beh.vy * beh.lnfrict * beh.mass;
        beh.fz += -beh.vz * beh.lnfrict * beh.mass;

    },

    calculateDelta: function(beh, i) {

        //  if (type === TYPE_FREE) {
        if (true) {
            beh.dx[i] = beh.vx; //x'=v
            beh.dy[i] = beh.vy;
            beh.dz[i] = beh.vz;
            beh.dvx[i] = beh.fx / beh.mass; //v'=F/m
            beh.dvy[i] = beh.fy / beh.mass;
            beh.dvz[i] = beh.fz / beh.mass;
        }
        /* TODO Implement
        if (type === TYPE_POINTONCIRCLE) {
            double dix = y - midy;  //Steht senkrecht auf Radius
            double diy = -x + midx;
            double n = Math.sqrt(dix * dix + diy * diy);
            dix /= n;
            diy /= n;
            double scal = dix * fx + diy * fy;//Es wird nur die wirsame kraftmomponente berücksichtigt
                dx[i] = vx;             //x'=v
                dy[i] = vy;
                dvx[i] = dix * scal / mass;       //v'=F/m
                dvy[i] = diy * scal / mass;
        }
        if (type === TYPE_POINTONLINE) {
            double scal = lx * fx + ly * fy;//Es wird nur die wirsame kraftmomponente berücksichtigt
            dx[i] = vx;             //x'=v
            dy[i] = vy;
            dvx[i] = lx * scal / mass;       //v'=F/m
            dvy[i] = ly * scal / mass;
        }
        */


    },

    savePos: function(beh, i) {
        beh.dx[i] = beh.x;
        beh.dy[i] = beh.y;
        beh.dz[i] = beh.z;
        beh.dvx[i] = beh.vx;
        beh.dvy[i] = beh.vy;
        beh.dvz[i] = beh.vz;
    },

    restorePos: function(beh, i) {

        if (!beh.fixed) {
            beh.x = beh.dx[i];
            beh.y = beh.dy[i];
            beh.z = beh.dz[i];
            beh.vx = beh.dvx[i];
            beh.vy = beh.dvy[i];
            beh.vz = beh.dvz[i];
        }
    },


    sqDist: function(beh, i, j) {
        var dist = (beh.dx[i] - beh.dx[j]) * (beh.dx[i] - beh.dx[j]);
        dist += (beh.dy[i] - beh.dy[j]) * (beh.dy[i] - beh.dy[j]);
        dist += (beh.dz[i] - beh.dz[j]) * (beh.dz[i] - beh.dz[j]);
        dist += (beh.dvx[i] - beh.dvx[j]) * (beh.dvx[i] - beh.dvx[j]);
        dist += (beh.dvy[i] - beh.dvy[j]) * (beh.dvy[i] - beh.dvy[j]);
        dist += (beh.dvz[i] - beh.dvz[j]) * (beh.dvz[i] - beh.dvz[j]);
        return dist;
    },

    kineticEnergy: function(beh) {
        var vsq = beh.vx * beh.vx + beh.vy * beh.vy + beh.vz * beh.vz;
        return 0.5 * beh.mass * vsq;
    },

    storePosition: function(beh) {
        beh.mx = beh.x;
        beh.my = beh.y;
        beh.mz = beh.z;
        beh.mvx = beh.vx;
        beh.mvy = beh.vy;
        beh.mvz = beh.vz;
    },

    recallPosition: function(beh) {
        if (!beh.fixed) {
            beh.x = beh.mx;
            beh.y = beh.my;
            beh.z = beh.mz;
            beh.vx = beh.mvx;
            beh.vy = beh.mvy;
            beh.vz = beh.mvz;
        }
    },

    doCollisions: function(beh) {}


};

/*----------------------------SUN--------------------------*/


labObjects.Sun = {

    reset: function(beh, elem) {
        beh.vel = [0, 0, 0]; //TODO: Das wird später mal die Velocity
        beh.pos = [0, 0, 0, 0]; //Position (homogen) 

        beh.el = elem;
        if (typeof(beh.mass) === 'undefined') beh.mass = 10;
        if (typeof(beh.friction) === 'undefined') beh.friction = 0;

        beh.charge = 0;
        beh.x = 0;
        beh.y = 0;
        beh.z = 0;

    },

    resetForces: function(beh) {},

    getBlock: false,

    setToTimestep: function(beh, j, a) {},

    initRK: function(beh, dt) {
        var pt = eval_helper.extractPoint(beh.el.homog);

        beh.x = pt.x;
        beh.y = pt.y;
        beh.z = 0;
    },

    setVelocity: function(beh, vx, vy, vz) {},


    move: function(beh) {},

    proceedMotion: function(beh, dt, i, a) {},

    calculateDelta: function(beh, i) {},


    calculateForces: function(beh) {

        var x1 = beh.x;
        var y1 = beh.y;
        var z1 = beh.z;
        for (var i = 0; i < masses.length; i++) {
            var m = masses[i];
            var x2 = m.behavior.x;
            var y2 = m.behavior.y;
            var z2 = m.behavior.z;
            var l = Math.sqrt(
                (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2)
            );
            var fx = (x1 - x2) * beh.mass * m.behavior.mass / (l * l * l);
            var fy = (y1 - y2) * beh.mass * m.behavior.mass / (l * l * l);
            var fz = (z1 - z2) * beh.mass * m.behavior.mass / (l * l * l);
            m.behavior.fx += fx * m.behavior.mass;
            m.behavior.fy += fy * m.behavior.mass;
            m.behavior.fz += fz * m.behavior.mass;


        }


        /*    masses = kernel.simulation.masses;
              double x1 = p1.coord.xr / p1.coord.zr;
              double y1 = p1.coord.yr / p1.coord.zr;
              for (int i = 0; i < masses.size(); i++) {
                  Mass m = ((Mass) masses.elementAt(i));
                  double x2 = m.x;
                  double y2 = m.y;
                  double l = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
                  double fx = (x1 - x2) * mass * m.mass / (l * l * l);
                  double fy = (y1 - y2) * mass * m.mass / (l * l * l);
                  m.fx += fx * m.mass;
                  m.fy += fy * m.mass;
              }
              */


    },

    savePos: function(beh, i) {},

    restorePos: function(beh, i) {},


    sqDist: function(beh, i, j) {
        return 0;
    },

    kineticEnergy: function(beh) {},

    storePosition: function(beh) {},

    recallPosition: function(beh) {},

    doCollisions: function(beh) {}


};


/*-------------------------VELOCITY-----------------------*/
labObjects.Velocity = {


    reset: function(beh) {
        var mass = csgeo.csnames[beh.geo[1]];
        console.log(mass);
        var base = eval_helper.extractPoint(mass.homog);
        var tip = eval_helper.extractPoint(csgeo.csnames[beh.geo[2]].homog);
        var bb = mass.behavior;
        labObjects[bb.type].setVelocity(bb, tip.x - base.x, tip.y - base.y, 0);
    },

    resetForces: function(beh) {},

    getBlock: false,

    setToTimestep: function(beh, j, a) {},

    initRK: function(beh, dt) {},

    setVelocity: function(beh, vx, vy, vz) {},

    move: function(beh) {
        var tip = csgeo.csnames[beh.geo[2]];
        if (move && mouse.down && tip === move.mover) return;
        var mass = csgeo.csnames[beh.geo[1]];
        var base = eval_helper.extractPoint(mass.homog);
        var bb = mass.behavior;
        var pos = List.realVector([base.x + bb.vx, base.y + bb.vy, 1]);
        movepointscr(tip, pos, "homog");
    },

    proceedMotion: function(beh, dt, i, a) {},

    calculateForces: function(beh) {},

    calculateDelta: function(beh, i) {},

    savePos: function(beh, i) {},

    restorePos: function(beh, i) {},

    sqDist: function(beh, i, j) {
        return 0;
    },

    kineticEnergy: function(beh) {},

    storePosition: function(beh) {},

    recallPosition: function(beh) {},

    doCollisions: function(beh) {}


};


/*----------------------------GRAVITY--------------------------*/


labObjects.Gravity = {

    reset: function(beh, elem) {
        beh.vel = [0, 0, 0]; //TODO: Das wird später mal die Velocity
        beh.pos = [0, 0, 0, 0]; //Position (homogen) 

        beh.el = elem;
        if (typeof(beh.strength) === 'undefined') beh.strength = 1;

        beh.namea = elem.args[0];
        beh.nameb = elem.args[1];
        beh.ma = csgeo.csnames[beh.namea];
        beh.mb = csgeo.csnames[beh.nameb];

    },

    resetForces: function(beh) {},

    getBlock: false,

    setToTimestep: function(beh, j, a) {},

    initRK: function(beh, dt) {

    },

    setVelocity: function(beh, vx, vy, vz) {},

    move: function(beh) {},

    proceedMotion: function(beh, dt, i, a) {},

    calculateDelta: function(beh, i) {},


    calculateForces: function(beh) {

        var pta = eval_helper.extractPoint(beh.ma.homog);
        var ptb = eval_helper.extractPoint(beh.mb.homog);

        var xa = pta.x;
        var ya = pta.y;
        var xb = ptb.x;
        var yb = ptb.y;

        var fx = (xb - xa) * beh.strength;
        var fy = (yb - ya) * beh.strength;
        var fz = 0;
        for (var i = 0; i < masses.length; i++) {
            var m = masses[i];

            m.behavior.fx += fx * m.behavior.mass;
            m.behavior.fy += fy * m.behavior.mass;
            m.behavior.fz += fz * m.behavior.mass;


        }


    },

    savePos: function(beh, i) {},

    restorePos: function(beh, i) {},


    sqDist: function(beh, i, j) {
        return 0;
    },

    kineticEnergy: function(beh) {},

    storePosition: function(beh) {},

    recallPosition: function(beh) {},

    doCollisions: function(beh) {}


};


/*-------------------------SPRING-----------------------*/
labObjects.Spring = {

    reset: function(beh, elem) {

        beh.el = elem;
        if (typeof(beh.strength) === 'undefined') beh.strength = 1;
        if (typeof(beh.amplitude) === 'undefined') beh.amplitude = 0;
        if (typeof(beh.phase) === 'undefined') beh.phase = 0;
        if (typeof(beh.speed) === 'undefined') beh.speed = 1;
        if (typeof(beh.l0) === 'undefined') beh.l0 = 0;
        //0=HOOK, 1=RUBBER, 2=NEWTON, 3=ELECTRO
        if (typeof(beh.stype) === 'undefined') beh.stype = 1;
        if (typeof(beh.readOnInit) === 'undefined') beh.readOnInit = false;

        beh.namea = elem.args[0];
        beh.nameb = elem.args[1];
        beh.ma = csgeo.csnames[beh.namea];
        beh.mb = csgeo.csnames[beh.nameb];
        var pta = eval_helper.extractPoint(beh.ma.homog);
        var ptb = eval_helper.extractPoint(beh.mb.homog);
        if (true) {
            beh.l0 = (Math.sqrt((pta.x - ptb.x) * (pta.x - ptb.x) + (pta.y - ptb.y) * (pta.y - ptb.y)));
        }
        beh.env = labObjects.env; //TODO Environment


    },

    resetForces: function(beh) {},

    getBlock: false,

    setToTimestep: function(beh, j, a) {},

    initRK: function(beh, dt) {},

    setVelocity: function(beh, vx, vy, vz) {},

    move: function(beh) {},

    proceedMotion: function(beh, dt, i, a) {},

    calculateForces: function(beh) {
        var xa, xb, ya, yb;
        if (beh.ma.behavior && (!move || !mouse.down || beh.ma !== move.mover)) {
            xa = beh.ma.behavior.x;
            ya = beh.ma.behavior.y;
        } else {
            var pta = eval_helper.extractPoint(beh.ma.homog);
            xa = pta.x;
            ya = pta.y;
        }
        if (beh.mb.behavior && (!move || !mouse.down || beh.mb !== move.mover)) {
            xb = beh.mb.behavior.x;
            yb = beh.mb.behavior.y;
        } else {
            var ptb = eval_helper.extractPoint(beh.mb.homog);
            xb = ptb.x;
            yb = ptb.y;
        }


        var l = (Math.sqrt((xa - xb) * (xa - xb) + (ya - yb) * (ya - yb)));

        var lact = beh.l0; //TODO Motor
        var mytype = beh.stype;

        if (mytype === 1) {
            lact = 0;
        }

        var factor = 0;

        if (mytype === 2 || mytype === 3) {
            factor = beh.ma.behavior.mass * beh.mb.behavior.mass * beh.strength;
        }

        if (mytype === 2) factor = -factor; //NEWTON

        var fx, fy;
        if (l !== 0.0 && (mytype === 0 || mytype === 1)) {
            fx = -(xa - xb) * beh.strength * (l - lact) / l * beh.env.springstrength;
            fy = -(ya - yb) * beh.strength * (l - lact) / l * beh.env.springstrength;
        } else if (beh.ma.behavior && beh.mb.behavior && l !== 0.0) {
            var l3 = (l * l * l);
            if (mytype === 2 || mytype === 3) { //NEWTON //ELECTRO
                fx = (xa - xb) * factor / l3;
                fy = (ya - yb) * factor / l3;
            }
        } else {
            fx = fy = 0.0;
        }

        //if (a !== null) {
        if (beh.ma.behavior) {
            beh.ma.behavior.fx += fx;
            beh.ma.behavior.fy += fy;
        }
        //if (b !== null) {
        if (beh.mb.behavior) {
            beh.mb.behavior.fx -= fx;
            beh.mb.behavior.fy -= fy;
        }

    },

    calculateDelta: function(beh, i) {},

    savePos: function(beh, i) {},

    restorePos: function(beh, i) {},

    sqDist: function(beh, i, j) {
        return 0;
    },

    kineticEnergy: function(beh) {},

    storePosition: function(beh) {},

    recallPosition: function(beh) {},

    doCollisions: function(beh) {}


};


/*-------------------------Bouncer-----------------------*/
labObjects.det = function(x1, y1, x2, y2, x3, y3) {
    return x2 * y3 - x3 * y2 + x3 * y1 - x1 * y3 + x1 * y2 - x2 * y1;
};


labObjects.Bouncer = {


    reset: function(beh, elem) {

        beh.el = elem;
        if (typeof(beh.xdamp) === 'undefined') beh.xdamp = 0;
        if (typeof(beh.ydamp) === 'undefined') beh.ydamp = 0;
        if (typeof(beh.motorchanger) === 'undefined') beh.motorchanger = true;

        beh.namea = elem.args[0];
        beh.nameb = elem.args[1];
        beh.ma = csgeo.csnames[beh.namea];
        beh.mb = csgeo.csnames[beh.nameb];
        var pta = eval_helper.extractPoint(beh.ma.homog);
        var ptb = eval_helper.extractPoint(beh.mb.homog);
        beh.x1o = pta.x * 1.01 - ptb.x * 0.01;
        beh.y1o = pta.y * 1.01 - ptb.y * 0.01;
        beh.x2o = ptb.x * 1.01 - pta.x * 0.01;
        beh.y2o = ptb.y * 1.01 - pta.y * 0.01;

        beh.env = labObjects.env; //TODO Environment


    },

    resetForces: function(beh) {},

    getBlock: false,

    setToTimestep: function(beh, j, a) {},

    initRK: function(beh, dt) {
        beh.deltat = dt;
    },

    setVelocity: function(beh, vx, vy, vz) {},

    move: function(beh) {},

    proceedMotion: function(beh, dt, i, a) {},

    calculateForces: function(beh) {},

    calculateDelta: function(beh, i) {},

    savePos: function(beh, i) {},

    restorePos: function(beh, i) {},

    sqDist: function(beh, i, j) {
        return 0;
    },

    kineticEnergy: function(beh) {},

    storePosition: function(beh) {},

    recallPosition: function(beh) {},

    doCollisions: function(beh) {


        var pta = eval_helper.extractPoint(beh.ma.homog);
        var ptb = eval_helper.extractPoint(beh.mb.homog);
        var x1 = pta.x;
        var y1 = pta.y;
        var x2 = ptb.x;
        var y2 = ptb.y;

        var x1o = beh.x1o;
        var y1o = beh.y1o;
        var x2o = beh.x2o;
        var y2o = beh.y2o;

        var n = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
        var nx = (x1 - x2) / n;
        var ny = (y1 - y2) / n;


        for (var i = 0; i < masses.length; i++) {

            var mass = masses[i];

            //a1=x1o+i*y1o
            //b1=x2o+i*y2o
            //c1=mass.xo+i*mass.yo
            //a2=x1+i*y1
            //b2=x2+i*y2
            //Nun berechne (a1*b2-b1*a2+c1*a2-c1*b2)/(a1-b1);
            //Dass ist eine abgefahrene aber effektive Art eine Ähnlichkeitstransformation zu bestimmen

            /*          aa.assign(x1o, y1o).mul(x2, y2);
                        bb.assign(x2o, y2o).mul(x1, y1);
                        aa.sub(bb);
                        bb.assign(mass.xo, mass.yo).mul(x1, y1);
                        aa.add(bb);
                        bb.assign(mass.xo, mass.yo).mul(x2, y2);
                        aa.sub(bb);
                        bb.assign(x1o, y1o).sub(x2o, y2o);
                        aa.div(bb);
            */


            var mxo = mass.behavior.xo;
            var myo = mass.behavior.yo;
            var mx = mass.behavior.x;
            var my = mass.behavior.y;

            var aa = CSNumber.mult(CSNumber.complex(x1o, y1o), CSNumber.complex(x2, y2));
            var bb = CSNumber.mult(CSNumber.complex(x2o, y2o), CSNumber.complex(x1, y1));

            aa = CSNumber.sub(aa, bb);
            bb = CSNumber.mult(CSNumber.complex(mxo, myo), CSNumber.complex(x1, y1));
            aa = CSNumber.add(aa, bb);
            bb = CSNumber.mult(CSNumber.complex(mxo, myo), CSNumber.complex(x2, y2));
            aa = CSNumber.sub(aa, bb);
            bb = CSNumber.sub(CSNumber.complex(x1o, y1o), CSNumber.complex(x2o, y2o));
            aa = CSNumber.div(aa, bb);

            if (labObjects.det(x1, y1, x2, y2, mx, my) * labObjects.det(x1, y1, x2, y2, aa.value.real, aa.value.imag) < 0 &&
                labObjects.det(x1, y1, mx, my, aa.value.real, aa.value.imag) * labObjects.det(x2, y2, mx, my, aa.value.real, aa.value.imag) < 0) {


                // doHitScript(mass);//TODO


                //TODO                if (motorChanger)
                //                    kernel.simulation.motor.dir *= -1;

                var vvx = mass.behavior.mvx + beh.deltat * (-aa.value.real + mass.behavior.xo);
                var vvy = mass.behavior.mvy + beh.deltat * (-aa.value.imag + mass.behavior.yo);

                var ss1 = nx * vvx + ny * vvy;
                var ss2 = ny * vvx - nx * vvy;
                //TODO Nächsten zwei zeilen sind gepfuscht, erhalten aber die Energie

                mass.behavior.x = aa.value.real;
                mass.behavior.y = aa.value.imag;
                mass.behavior.vx = nx * ss1 * (1.0 - beh.xdamp);
                mass.behavior.vy = ny * ss1 * (1.0 - beh.xdamp);
                mass.behavior.vx += -ny * ss2 * (1.0 - beh.ydamp);
                mass.behavior.vy += nx * ss2 * (1.0 - beh.ydamp);

            }
        }
        beh.x1o = x1;
        beh.y1o = y1;
        beh.x2o = x2;
        beh.y2o = y2;
    }


};


/*-------------------------ENVIRONMENT-----------------------*/
labObjects.Environment = {


    init: function(beh) {
        if (typeof(beh.gravity) === 'undefined') beh.gravity = 0;
        if (typeof(beh.friction) === 'undefined') beh.friction = 0;
        if (typeof(beh.springstrength) === 'undefined') beh.springstrength = 1;
        if (typeof(beh.accuracy) !== 'undefined') simaccuracy = beh.accuracy;
        if (typeof(beh.deltat) !== 'undefined') setSpeed(beh.deltat / 0.6);
        if (typeof(beh.charges) === 'undefined') beh.charges = false;
        if (typeof(beh.balls) === 'undefined') beh.balls = false;
        if (typeof(beh.newton) === 'undefined') beh.newton = false;
        if (typeof(beh.ballInteractionBoosting) === 'undefined') beh.ballInteractionBoosting = 1;
        labObjects.env = beh;
        beh.errorbound = 0.001;
        beh.lowestdeltat = 0.0000001;
        beh.slowdownfactor = 2;

    },

    reset: function(beh) {},

    resetForces: function(beh) {},

    getBlock: false,

    setToTimestep: function(beh, j, a) {},

    initRK: function(beh, dt) {},

    setVelocity: function(beh, vx, vy, vz) {},

    move: function(beh) {},

    proceedMotion: function(beh, dt, i, a) {},

    calculateForces: function(beh) {
        var i, m1, x1, y1, j, m2, x2, y2, k, fx, fy, r, l;
        if (beh.newton) {
            for (i = 0; i < masses.length - 1; i++) {
                m1 = masses[i];
                x1 = m1.behavior.x;
                y1 = m1.behavior.y;
                for (j = i + 1; j < masses.length; j++) {

                    m2 = masses[j];
                    x2 = m2.behavior.x;
                    y2 = m2.behavior.y;
                    l = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
                    fx = (x1 - x2) * m1.behavior.mass * m2.behavior.mass / (l * l * l);
                    fy = (y1 - y2) * m1.behavior.mass * m2.behavior.mass / (l * l * l);

                    m1.behavior.fx -= fx;
                    m1.behavior.fy -= fy;
                    m2.behavior.fx += fx;
                    m2.behavior.fy += fy;
                }
            }
        }

        if (beh.charges) {
            for (i = 0; i < masses.length - 1; i++) {
                m1 = masses[i];
                x1 = m1.behavior.x;
                y1 = m1.behavior.y;
                for (j = i + 1; j < masses.length; j++) {

                    m2 = masses[j];
                    x2 = m2.behavior.x;
                    y2 = m2.behavior.y;
                    l = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
                    fx = (x1 - x2) * m1.behavior.charge * m2.behavior.charge / (l * l * l);
                    fy = (y1 - y2) * m1.behavior.charge * m2.behavior.charge / (l * l * l);

                    m1.behavior.fx += fx;
                    m1.behavior.fy += fy;
                    m2.behavior.fx -= fx;
                    m2.behavior.fy -= fy;
                }
            }
        }

        if (beh.balls) {

            for (i = 0; i < masses.length - 1; i++) {
                m1 = masses[i];
                if (m1.behavior.radius !== 0) {
                    x1 = m1.behavior.x;
                    y1 = m1.behavior.y;
                    for (j = i + 1; j < masses.length; j++) {

                        m2 = masses[j];
                        if (m2.behavior.radius !== 0) {

                            x2 = m2.behavior.x;
                            y2 = m2.behavior.y;

                            r = m1.behavior.radius + m2.behavior.radius;
                            l = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
                            fx = 0;
                            fy = 0;

                            if (beh.ballInteractionBoosting === 0) {
                                fx = (x1 - x2) / (l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                                fy = (y1 - y2) / (l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                            } else {
                                if (beh.ballInteractionBoosting === 1) {

                                    fx = (x1 - x2) / (l * l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                                    fy = (y1 - y2) / (l * l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                                } else {
                                    fx = (x1 - x2) / (l * l * l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                                    fy = (y1 - y2) / (l * l * l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                                }
                            }


                            m1.behavior.fx += fx;
                            m1.behavior.fy += fy;
                            m2.behavior.fx -= fx;
                            m2.behavior.fy -= fy;
                        }
                    }
                }
            }
        }


        for (i = 0; i < masses.length; i++) {
            var m = masses[i];

            m.behavior.fx += 0;
            m.behavior.fy += -beh.gravity;
            m.behavior.fz += 0;


        }
    },

    calculateDelta: function(beh, i) {},

    savePos: function(beh, i) {},

    restorePos: function(beh, i) {},

    sqDist: function(beh, i, j) {
        return 0;
    },

    kineticEnergy: function(beh) {},

    storePosition: function(beh) {},

    recallPosition: function(beh) {},

    doCollisions: function(beh) {}


};
