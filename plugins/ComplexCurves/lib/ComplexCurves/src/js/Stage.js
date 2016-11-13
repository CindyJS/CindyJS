/** @interface */
function Stage() {}

/** @type {function(StateGL,WebGLRenderingContext)|function(StateGL,WebGLRenderingContext,State3D)} */
Stage.prototype.render = function(stategl, gl, state3d) {};
