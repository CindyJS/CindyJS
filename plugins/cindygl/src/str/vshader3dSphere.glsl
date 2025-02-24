attribute vec3 aCenter;
attribute vec2 aTexCoord;
attribute vec3 aRadius;

varying   vec2 cgl_pixel;
varying   vec3 cgl_pixel3d;
varying   vec2 plain_pixel;

uniform   float z0;
uniform   mat3 transformMatrix;
uniform   mat4 projectionMatrix;
uniform   mat4 spaceTransformMatrix;

void main(void) {
   // TODO on which cord-system should the transform be applied
   vec4 vCenter = spaceTransformMatrix*vec4(aCenter, 1.);
   vec4 viewRoot = vec4(0.,0.,z0,1.);
   vec4 n4= vCenter-viewRoot;
   // create local coordinate system
   vec3 dir=normalize(n4.xyz/n4.w);
   vec3 up = normalize(cross(dir,vec3(0.,1.,0.)));
   vec3 right = normalize(cross(dir,up));
   // TODO compute pixel position in model space, in addition to view-space position
   cgl_pixel3d=vCenter+aRadius.x*right+aRadius.y*up-aRadius.z*dir;
   gl_Position = projectionMatrix*cgl_pixel3d;

   plain_pixel = aTexCoord;
   vec3 r = transformMatrix*vec3(plain_pixel,1);
   cgl_pixel = r.xy/r.z;
}
