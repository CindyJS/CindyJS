
if ( !window.requestAnimationFrame ) {
				window.requestAnimationFrame = ( function() {
                    
					return window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame ||
					window.oRequestAnimationFrame ||
					window.msRequestAnimationFrame ||
					function ( callback, element ) {
                        
						window.setTimeout( callback, 1000 / 60 );
                        
					};
                    
				} )();
    
}

// Greetings to Iq/RGBA! ;)

var  canvaswebgl, gl, buffer, currentProgram,
vertex_position, 
parameters = { 
start_time: Date.now(), 
timestamp: Date.now(), 
time: 0, 
mouseX: 0, mouseY: 0, 
screenWidth: 0, screenHeight: 0, 
speed:0.0,
varlist:["a","b"]
};
var ispressed;
webglinfo={};
webglinfo.uniforms="";
webglinfo.typelist={};
webglinfo.code="";

init();
animate();

function init() {
				var effect = document.createElement( 'div' );
				document.body.appendChild( effect );
                
				//canvas = document.createElement( 'canvas' );
                canvaswebgl=document.getElementById('CSCanvasB');
				//body.appendChild( canvas );
                
				
                
                
                
				// Initialise WebGL
                
				try {
                    
    gl = canvaswebgl.getContext("webgl") || canvaswebgl.getContext("experimental-webgl");
                    
				} catch( error ) { }
                
				if ( !gl ) {
                    
					alert("WebGL not supported");
					throw "cannot create webgl context";
                    
				}
                
				// Create Vertex buffer (2 triangles)
                
				buffer = gl.createBuffer();
				gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
				gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [ - 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0 ] ), gl.STATIC_DRAW );
                ispresses=false;
                
                
			//	compile();
                
				onWindowResize();
				window.addEventListener( 'resize', onWindowResize, false );
                
}


function setupWebGL() {

  evaluator.WebGLvariables=function(args,modifs){
    var text="";

    for(var name in modifs) {
        var val=modifs[name];
        if(val.ctype=="string") { 
          type=val.value;
          if(type=="complex") {text=text+"uniform vec2 "+name+";\n";}
          if(type=="point") {text=text+"uniform vec2 "+name+";\n";}
          if(type=="real") {text=text+"uniform float "+name+";\n";}
          if(type=="homog") {text=text+"uniform vec3 "+name+";\n";}
          if(type=="point3D") {text=text+"uniform vec3 "+name+";\n";}
          if(type=="color") {text=text+"uniform vec3 "+name+";\n";}
          if(type=="colora") {text=text+"uniform vec4 "+name+";\n";}
          webglinfo.typelist[name]=type;
          
        }
    }
    webglinfo.uniforms=text;
  }

  evaluator.WebGLcode=function(args,modifs){
      if(args.length==1) {
         var val=evaluate(args[0]);
         if(val.ctype=="string") {
            webglinfo.code=val.value;
            compile(webglinfo.code)
         }
         
      }
      if(args.length==0) {
                  compile()

      }


  }


}

function compile(text) {
console.log("compile");
				var program = gl.createProgram();
				fragment0=document.getElementById("shader-fs-declare").text;
				fragment1=document.getElementById("shader-fs-pre").text;
				fragment2=document.getElementById("shader-fs-main").text;
                if(text){
                  fragment2=text;
                }
				fragment3=document.getElementById("shader-fs-post").text;
                fragment=fragment0+webglinfo.uniforms+fragment1+fragment2+fragment3;

				var vs = createShader( 'attribute highp vec3 position; void main() { gl_Position = vec4( position, 1.0 ); }', gl.VERTEX_SHADER );
				var fs = createShader( fragment, gl.FRAGMENT_SHADER );
                
				if ( vs == null || fs == null ) return null;
                
				gl.attachShader( program, vs );
				gl.attachShader( program, fs );
                
				gl.deleteShader( vs );
				gl.deleteShader( fs );
                
				gl.linkProgram( program );
                
				if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
                    
					console.error( 'VALIDATE_STATUS: ' + gl.getProgramParameter( program, gl.VALIDATE_STATUS ), 'ERROR: ' + gl.getError() );
                    
                    
					return;
                    
				}
                
				if ( currentProgram ) {
                    
					gl.deleteProgram( currentProgram );
				//	window.location.replace( '#' + encodeURIComponent( fragment ) );
                    
				}
                
				currentProgram = program;
                
                
                
}

function createShader( src, type ) {
				var shader = gl.createShader( type );
    
				gl.shaderSource( shader, src );
				gl.compileShader( shader );
                
                
				if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
                    
					var error = gl.getShaderInfoLog( shader );
                    
                    
					return null;
                    
				}
                
				return shader;
                
}

function onWindowResize( event ) {
    
    
				canvaswebgl.width = window.innerWidth;
				canvaswebgl.height = window.innerHeight;
				canvaswebgl.width = 800;
				canvaswebgl.height = 500;
                
				parameters.screenWidth = canvaswebgl.width;
				parameters.screenHeight = canvaswebgl.height;
                
				gl.viewport( 0, 0, canvaswebgl.width, canvaswebgl.height );
                
}

function animate() {
				requestAnimationFrame( animate );
			//	renderwegbl();
                
}




function renderwegbl() {
console.log("render pre");    

				if ( !currentProgram ) return;
console.log("render");    
				parameters.time = parameters.time +(Date.now() - parameters.timestamp);
				parameters.timestamp = Date.now();
                
				gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
                
				// Load program into GPU
                
				gl.useProgram( currentProgram );
                
                
                gl.uniform1f( gl.getUniformLocation( currentProgram, 'time' ), parameters.time / 1000 );
                gl.uniform1f( gl.getUniformLocation( currentProgram, 'speed' ), 1.0 );

				gl.uniform2f( gl.getUniformLocation( currentProgram, 'mouse' ), parameters.mouseX, parameters.mouseY);
				gl.uniform2f( gl.getUniformLocation( currentProgram, 'translate' ),
                    csport.drawingstate.initialmatrix.tx, 
                    csport.drawingstate.initialmatrix.ty+csh);
				gl.uniform1f( gl.getUniformLocation( currentProgram, 'scale' ), csport.drawingstate.initialmatrix.sdet);

  
                for(var name in webglinfo.typelist) {
                    var aa=namespace.getvar(name);
                    if(webglinfo.typelist[name]=="point") {
                        var xx=aa.value[0].value.real
                        var yy=aa.value[1].value.real;
                        gl.uniform2f( gl.getUniformLocation( currentProgram, name ), xx, yy);

                    }

                }
				gl.uniform2f( gl.getUniformLocation( currentProgram, 'resolution' ), 
                parameters.screenWidth, parameters.screenHeight );
                
        
                // Render geometry
                
				gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
				gl.vertexAttribPointer( vertex_position, 2, gl.FLOAT, false, 0, 0 );
				gl.enableVertexAttribArray( vertex_position );
				gl.drawArrays( gl.TRIANGLES, 0, 6 );
				gl.disableVertexAttribArray( vertex_position );
                
}

