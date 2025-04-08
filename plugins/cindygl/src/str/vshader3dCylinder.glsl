#version 300 es
in vec2 aTexCoord;
in vec3 aPos;

out   vec2 cgl_pixel;
out   vec3 cgl_viewDirection;
out   vec2 plain_pixel;

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
   vec3 viewDir = normalize(mPoint-cgl_viewPos);
   vec3 dir= normalize(uPointB-uPointA);
   float a = dot(dir,viewDir);
   if(abs(a)>0.9999) { // dir close to viewDir -> fall back to unit vector as second coordiante
      dir=viewDir.x<viewDir.y?vec3(1,0,0):vec3(0,1,0);
   } else {
      dir=normalize(dir-a*viewDir);
   }
   vec3 dir2 = normalize(cross(dir,viewDir));
   vec3 pos3 = mPoint+uRadius*(dir*aPos.y+dir2*aPos.x-viewDir);
   // transform to viewSpace
   gl_Position = projAndTrafoMatrix*vec4(pos3,1);
   gl_Position.z=0.0;
   cgl_viewDirection = pos3 - cgl_viewPos;
   // 2D coordinates
   plain_pixel = aTexCoord;
   vec3 r = transformMatrix*vec3(plain_pixel,1);
   cgl_pixel = r.xy/r.z;
}
