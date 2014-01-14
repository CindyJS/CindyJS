

var mouse={};
var move;

movepoint=function (move){
    m=move.mover;
    m.sx=mouse.x+move.offset.x;
    m.sy=mouse.y+move.offset.y;
    m.sz=1;
    m.homog=List.realVector([m.sx,m.sy,m.sz]);

}


getmover = function(mouse){
    var mov;
    var adist=1000000;
    var diff,orad;
    for (var i=0;i<csgeo.free.length;i++){
        var el=csgeo.free[i];
        var dx,dy;
        if(el.kind=="P"){
            dx=el.sx-mouse.x;
            dy=el.sy-mouse.y;
            var dist=Math.sqrt(dx*dx+dy*dy);
        }
        if(el.kind=="C"){//Must be Circle by Rad
            var mid=csgeo.csnames[el.args[0]];
            var rad=el.radius;
            dx=mid.sx-mouse.x;
            dy=mid.sy-mouse.y;
            var ref=Math.sqrt(dx*dx+dy*dy);
            var dist=ref-rad.value.real;
            orad=-dist;
            dx=0;dy=0;
            if(dist<0){dist=-dist;}
            dist=dist+1;
        }
        if(dist<adist+.2){//A bit a dirty hack, prefers new points
            adist=dist;
            mov=el;
            diff={x:dx,y:dy};
        }
    }
    return {mover:mov,offset:diff,offsetrad:orad};
}


setuplisteners =function(canvas) {
    
    updatePostition= function(x,y){
        var pos=csport.to(x,y);
        mouse.prevx      = mouse.x;
        mouse.prevy      = mouse.y;
        mouse.x       = pos[0];
        mouse.y       = pos[1];
        
    }
    
    canvas.onmousedown = function (e) {
        mouse.button  = e.which;
        var rect      = canvas.getBoundingClientRect();
        updatePostition(e.clientX - rect.left,e.clientY - rect.top);
        move=getmover(mouse);
        startit();//starts d3-timer
            
            mouse.down    = true;
            e.preventDefault();
    };
    
    canvas.onmouseup = function (e) {
        mouse.down = false;
        updateCindy();
        
        e.preventDefault();
    };
    
    canvas.onmousemove = function (e) {
        var rect  = canvas.getBoundingClientRect();
        updatePostition(e.clientX - rect.left,e.clientY - rect.top);
        if(mouse.down){
            movepoint(move);
        }
        e.preventDefault();
    };
    
    
    
    function touchMove(e) {
        if (!e)
            var e = event;
        
        updatePostition(e.targetTouches[0].pageX - canvas.offsetLeft,
                        e.targetTouches[0].pageY - canvas.offsetTop);
        if(mouse.down){
            movepoint(move);
            
        }
        
        e.preventDefault();
        
    }
    
    function touchDown(e) {
        if (!e)
            var e = event;
        
        updatePostition(e.targetTouches[0].pageX - canvas.offsetLeft,
                        e.targetTouches[0].pageY - canvas.offsetTop);
        
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

