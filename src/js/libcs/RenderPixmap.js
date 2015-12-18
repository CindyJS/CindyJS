function RenderPixmap(ctxt) {
    this.ctxt = ctxt;
}

["arc",
 "beginPath",
 "clearRect",
 "clip",
 "closePath",
 "drawImage",
 "fill",
 "fillRect",
 "lineTo",
 "moveTo",
 "rect",
 "restore",
 "rotate",
 "save",
 "scale",
 "stroke",
 "transform",
 "translate",
].forEach(function(methodName) {
    RenderPixmap.prototype[methodName] = function() {
        this.ctxt[methodName].apply(this.ctxt, arguments);
    };
});

["fillStyle",
 "font",
 "globalAlpha",
 "lineCap",
 "lineJoin",
 "lineWidth",
 "mozFillRule",
 "strokeStyle",
].forEach(function(propertyName) {
    

"mozDash",
"setLineDash",
"webkitLineDash",
"setLineDash",
