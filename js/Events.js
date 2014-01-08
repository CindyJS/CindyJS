

var mouse={};
var move;

movepoint=function (move){
    
    move.mover.px=mouse.x+move.offset.x;
    move.mover.py=mouse.y+move.offset.y;
    
}


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
    return {mover:mov,offset:diff};
}


setuplisteners =function(canvas) {
    
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
        startit();//starts d3-timer
        e.preventDefault();
    };
    
    canvas.onmouseup = function (e) {
        mouse.down = false;
        updateCindy();
        
        e.preventDefault();
    };
    
    canvas.onmousemove = function (e) {
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
    
    
    updateCindy();
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

var doit=function(){//Callback for d3-timer
  updateCindy();
  return !mouse.down;

}

var startit=function(){
    d3.timer(doit)
}

function updateCindy(){
    recalc();                          
    csctx.save();
    csctx.clearRect ( 0   , 0 , csw , csh );
    evaluate(cserg);
    render();
    csctx.restore();
    
}



function update() {
    
    updateCindy();
    if(mouse.down)
        requestAnimFrame(update);
}

