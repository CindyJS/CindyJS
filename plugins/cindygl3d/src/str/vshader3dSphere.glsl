attribute vec2 aTexCoord;
attribute vec3 aPos;

varying   vec2 cgl_pixel;
varying   vec3 cgl_pixel3d;
varying   vec2 plain_pixel;

uniform   vec3 uCenter; // TODO should center be uniform or attribute
uniform   vec3 cgl_viewPos;
uniform   mat4 projectionMatrix;
uniform   mat4 spaceTransformMatrix;
uniform   mat3 transformMatrix;

void main(void) {
   // compute square in from of sphere seen from cgl_viewPos
   vec3 n4= uCenter-cgl_viewPos;
   // create local coordinate system
   vec3 dir=normalize(n4);
   // dir and dir+(.5,0,0) are distinct non-zero vectors
   vec3 up = normalize(cross(dir,dir+vec3(.5,0.,0.)));
   vec3 right = normalize(cross(dir,up));
   cgl_pixel3d=uCenter+aPos.x*right+aPos.y*up-aPos.z*dir;
   // transform to viewSpace
   gl_Position = projectionMatrix*spaceTransformMatrix*vec4(cgl_pixel3d,1);
   // 2D coordinates
   plain_pixel = aTexCoord;
   vec3 r = transformMatrix*vec3(plain_pixel,1);
   cgl_pixel = r.xy/r.z;
}
