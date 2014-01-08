var csmouse = [100, 100];
var cscount = 0;


//Width and height
var csw = 500;
var csh = 500;
//csport.drawingstate.matrix.ty=csport.drawingstate.matrix.ty-csh;
//csport.drawingstate.initialmatrix.ty=csport.drawingstate.initialmatrix.ty-csh;

var csconsole;
var csgeo={};

var i=0;

var gslp=[
    {name:"A", kind:"P", type:"Free", sx:4,sy:8,sz:1},
    {name:"B", kind:"P", type:"Free", sx:-9,sy:8,sz:1},
    {name:"D", kind:"P", type:"Free", sx:-1,sy:0,sz:1},
    {name:"C", kind:"P", type:"Free", sx:4,sy:3,sz:1},
    {name:"X", kind:"P", type:"Free", sx:-8,sy:8,sz:1},
    {name:"Y", kind:"P", type:"Free", sx:-8,sy:.8,sz:1},
    {name:"Z", kind:"P", type:"Free", sx:-6,sy:0,sz:1}
    ];

csinit(gslp);
var images={};

/*


var c=document.getElementById("CSCanvas");
//c.width=csw;
//c.height=csh;
csw=c.width;
csh=c.height;
var csctx=c.getContext("2d");
var cscode=document.getElementById("firstDrawing").text;
cscode=condense(cscode);
var cserg=analyse(cscode,false);
*/

var mouse={};
function start() {
    var canvas=document.getElementById("CSCanvas");
    console.log("starting "+canvas);
    canvas.onmouseDown = function (e) {
        console.log("DOWN ");

        mouse.button  = e.which;
        mouse.px      = mouse.x;
        mouse.py      = mouse.y;
        var rect      = canvas.getBoundingClientRect();
        mouse.x       = e.clientX - rect.left,
            mouse.y       = e.clientY - rect.top,
            mouse.down    = true;
        refresh();

        e.preventDefault();
    };
    
    canvas.onmouseUp = function (e) {
        mouse.down = false;
        e.preventDefault();
    };
    
    canvas.onmouseMove = function (e) {
        mouse.px  = mouse.x;
        mouse.py  = mouse.y;
        var rect  = canvas.getBoundingClientRect();
        mouse.x   = e.clientX - rect.left,
            mouse.y   = e.clientY - rect.top,
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
        e.preventDefault();
        
    }
    
    function touchDown(e) {
        mouse.down = true;
        e.preventDefault();
        
    }
    
    function touchUp(e) {
        mouse.down = false;
        e.preventDefault();
        
    }
    
    canvas.addEventListener("touchstart", touchDown, false);
    canvas.addEventListener("touchmove", touchMove, true);
    canvas.addEventListener("touchend", touchUp, false);
    document.body.addEventListener("touchcancel", touchUp, false);
//    document.body.addEventListener("mouseup", mouseUp, false);
    
}


window.requestAnimFrame =
window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame ||
function (callback) {
    window.setTimeout(callback, 1000 / 60);
};



refresh=function(){
console.log("HALLO");
    update();
    
    requestAnimFrame(refresh);

}


update=function(){
return;
    recalc();                          
    csctx.save();
    csctx.clearRect ( 0   , 0 , csw , csh );
    evaluate(cserg);
    render();
    csctx.restore();
}




window.onload = function () {
    
    start();
    update();
};







