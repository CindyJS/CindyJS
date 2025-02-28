attribute vec2 aTexCoord;
attribute vec3 aPos;

varying   vec2 cgl_pixel;
varying   vec3 cgl_viewDirection;
varying   vec2 plain_pixel;

uniform   vec3 uCenter;
uniform   float uRadius;
uniform   vec3 cgl_viewPos;
uniform   mat4 projAndTrafoMatrix;
uniform   mat3 transformMatrix;

void main(void) {
   // compute square in front of sphere seen from cgl_viewPos
   vec3 n4= uCenter-cgl_viewPos;
   // create local coordinate system
   vec3 dir=normalize(n4);
   vec3 up = normalize(cross(dir,dir.x<dir.y?vec3(1.,0.,0.):vec3(0.,1.,0.)));
   vec3 right = normalize(cross(dir,up));
   vec3 pos3 = uCenter+uRadius*(aPos.x*right+aPos.y*up-dir);
   // transform to viewSpace
   gl_Position = projAndTrafoMatrix*vec4(pos3,1);
   cgl_viewDirection = pos3 - cgl_viewPos;
   // 2D coordinates
   plain_pixel = aTexCoord;
   vec3 r = transformMatrix*vec3(plain_pixel,1);
   cgl_pixel = r.xy/r.z;
}
