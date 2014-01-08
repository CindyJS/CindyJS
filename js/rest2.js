
var csmouse = [100, 100];
var cscount = 0;
var csw = 600;
var csh = 600;
csport.drawingstate.matrix.ty=csport.drawingstate.matrix.ty-csh;
csport.drawingstate.initialmatrix.ty=csport.drawingstate.initialmatrix.ty-csh;

var csconsole;
var csgeo={};
var svg;

var i=0;

var gslp=[
    {name:"A", kind:"P", type:"Free", sx:4,sy:8,sz:1},
    {name:"B", kind:"P", type:"Free", sx:-9,sy:8,sz:1}/*,
    {name:"D", kind:"P", type:"Free", sx:-1,sy:0,sz:1},
     {name:"C", kind:"P", type:"Free", sx:4,sy:3,sz:1},
     {name:"X", kind:"P", type:"Free", sx:-8,sy:8,sz:1},
     {name:"Y", kind:"P", type:"Free", sx:-8,sy:.8,sz:1},
     {name:"Z", kind:"P", type:"Free", sx:-6,sy:0,sz:1}*/
    ];

csinit(gslp);
var images={};




var c=document.getElementById("CSCanvas");
//c.width=csw;
//c.height=csh;
csw=c.width;
csh=c.height;
var csctx=c.getContext("2d");
var cscode=document.getElementById("firstDrawing").text;
cscode=condense(cscode);
var cserg=analyse(cscode,false);



var mouse={};
var move;
var lastmove;

getmover = function(mouse){
    
    var mov;
    var adist=1000000;
    var diff;
    for (var i=0;i<csgeo.free.length;i++){
        var pt=csgeo.free[i];
        var dx=pt.px-mouse.x;
        var dy=pt.py-mouse.y;
        var dist=Math.sqrt(dx*dx+dy*dy);
        console.log(dist);
        if(dist<adist){
            adist=dist;
            mov=pt;
            diff={x:dx,y:dy};
        }
    }
    lastmove={x:mov.px,y:mov.py}     

    return {mover:mov,offset:diff};
}

function start() {
    var canvas=document.getElementById("CSCanvas");
    
    canvas.onmousedown = function (e) {
        console.log("DOWN ");
        
        mouse.button  = e.which;
        mouse.px      = mouse.x;
        mouse.py      = mouse.y;
        var rect      = canvas.getBoundingClientRect();
        mouse.x       = e.clientX - rect.left;
        mouse.y       = e.clientY - rect.top;
        mouse.down    = true;
        
        move=getmover(mouse);

        startit();
        e.preventDefault();
    };
    
    canvas.onmouseup = function (e) {
        mouse.down = false;
        updateCindy();
        
        e.preventDefault();
    };
    
    canvas.onmousemove = function (e) {
            console.log("MOVE ");

        mouse.px  = mouse.x;
        mouse.py  = mouse.y;
        var rect  = canvas.getBoundingClientRect();
        mouse.x   = e.clientX - rect.left;
        mouse.y   = e.clientY - rect.top;
        if(mouse.down){
            movepoint(move);
        }
        

        e.preventDefault();
    };
    
    
    
    function touchMove(e) {
        if (!e)
            var e = event;
        mouse.px  = mouse.x;
        mouse.py  = mouse.y;
        var rect  = canvas.getBoundingClientRect();
        
        mouse.x = e.targetTouches[0].pageX - canvas.offsetLeft;
        mouse.y = e.targetTouches[0].pageY - canvas.offsetTop;
        if(mouse.down){
            movepoint(move);

        }

        e.preventDefault();
        
    }
    
    function touchDown(e) {
           if (!e)
            var e = event;
        mouse.px  = mouse.x;
        mouse.py  = mouse.y;
        var rect  = canvas.getBoundingClientRect();
        
        mouse.x = e.targetTouches[0].pageX - canvas.offsetLeft;
        mouse.y = e.targetTouches[0].pageY - canvas.offsetTop;
        mouse.down = true;
        move=getmover(mouse);
        startit();
        e.preventDefault();
        
    }
    
    function touchUp(e) {
        mouse.down = false;
        updateCindy();
        
        e.preventDefault();
        
    }
    
    canvas.addEventListener("touchstart", touchDown, false);
    canvas.addEventListener("touchmove", touchMove, true);
    canvas.addEventListener("touchend", touchUp, false);
    document.body.addEventListener("touchcancel", touchUp, false);
    //    document.body.addEventListener("mouseup", mouseUp, false);
    
    
    updateCindy2();
}


window.requestAnimFrame =
window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame ||
function (callback) {
    //                window.setTimeout(callback, 1000 / 60);
    window.setTimeout(callback, 0);
};

function drawupdate() {
    size=6;
    if(mouse.down){size=10;}
    for(var i=0;i<pts.length;i++){
        drawpt(pts[i])
    }
    if(mouse.down){
        drawpt(mouse);
        
    }
    
}

var ct=0;
var doit=function(){
  updateCindy();
  return !mouse.down;

}

var startit=function(){
//    d3.timer(doit)
}

function updateCindy2(){
return;
        recalc();                          
        csctx.save();
        csctx.clearRect ( 0   , 0 , csw , csh );
        evaluate(cserg);
        render();
        csctx.restore();
        
}


function updateCindy(){
    return;
    if(move.mover.px!=lastmove.x || move.mover.py!=lastmove.y){ 
            console.log("DRAW IT ");

        recalc();                          
        csctx.save();
        csctx.clearRect ( 0   , 0 , csw , csh );
        evaluate(cserg);
        render();
        csctx.restore();
        
        lastmove={x:move.mover.px,y:move.mover.py}     
    }
    
}


movepoint=function (move){
    
    move.mover.px=mouse.x+move.offset.x;
    move.mover.py=mouse.y+move.offset.y;
    
}


function update() {
    
    updateCindy();
    if(mouse.down)
        requestAnimFrame(update);
}


drawpt= function (p){
    csctx.lineWidth = 2;
    
    
    csctx.beginPath();
    csctx.arc(p.x,p.y,size,0,2*Math.PI);
    csctx.fillStyle="#000000";
    csctx.fill();
}

window.onload = function () {
    
    
    
    
 //   start();
//    startit();
};


