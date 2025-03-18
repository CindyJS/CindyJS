#version 300 es
in vec2 aTexCoord;
in vec3 aPos;

out   vec2 cgl_pixel;
out   vec3 cgl_viewDirection;
out   vec2 plain_pixel;

uniform   vec3 cgl_viewPos;
uniform   mat4 projAndTrafoMatrix;
uniform   mat3 transformMatrix;

void main(void) {
   // transform to screen space
   vec4 screenPos = projAndTrafoMatrix*vec4(aPos,1);
   // use same z-coordinate as cglInit shaders
   // TODO find better way to synchronize z-coords between surface and triangle renderers
   //   ? is distance from viewPosition constant?
   float z = length(aPos-cgl_viewPos)/(2.*length(cgl_viewPos));
   gl_Position = vec4(
      screenPos.xy/screenPos.w,
      // TODO is there a way to modify the clip planes in webgl
      2.*z-1.,// coordinate system is changed from range -1.. 1 to 0...1 between vertex and fragment shader
      1.
   );
   cgl_viewDirection = aPos - cgl_viewPos;
   // 2D coordinates
   plain_pixel = aTexCoord;
   // TODO? transform texture coordinates
   // vec3 r = transformMatrix*vec3(plain_pixel,1);
   // cgl_pixel = r.xy/r.z;
   cgl_pixel = aTexCoord;
}
