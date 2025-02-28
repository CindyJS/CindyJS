attribute vec2 aTexCoord;
attribute vec3 aPos;

varying   vec2 cgl_pixel;
varying   vec3 cgl_viewDirection;
varying   vec2 plain_pixel;

uniform   vec3 uPointA;
uniform   vec3 uPointB;
uniform   float uRadius;
uniform   vec3 cgl_viewPos;
uniform   mat4 projAndTrafoMatrix;
uniform   mat3 transformMatrix;

void main(void) {
   // pick ray through A or B depending on sign on aPos.y
   // pick point on ray coresponding to distance of the closer of the two points
   vec3 dA = uPointA-cgl_viewPos;
   vec3 dB = uPointB-cgl_viewPos;
   vec3 mPoint = cgl_viewPos+min(length(dA),length(dB))*normalize(aPos.y<0.?dA:dB);
   // create local coordinate system with x-axis parallel to AB and Z axis parallel to viewDirection
   // TODO handle case where dir close to viewDir
   vec3 viewDir = normalize(mPoint-cgl_viewPos);
   vec3 dir= normalize(uPointB-uPointA);
   dir=normalize(dir-dot(dir,viewDir)*viewDir);
   vec3 dir2 = normalize(cross(dir,viewDir));
   vec3 pos3 = mPoint+uRadius*(dir*aPos.y+dir2*aPos.x-viewDir);
   // transform to viewSpace
   gl_Position = projAndTrafoMatrix*vec4(pos3,1);
   cgl_viewDirection = pos3 - cgl_viewPos;
   // 2D coordinates
   plain_pixel = aTexCoord;
   vec3 r = transformMatrix*vec3(plain_pixel,1);
   cgl_pixel = r.xy/r.z;
}
