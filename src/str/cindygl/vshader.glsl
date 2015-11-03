attribute vec3 aPos;
attribute vec2 aTexCoord;
varying   vec2 pixel;
uniform   mat3 transformMatrix;
void main(void) {
   gl_Position = vec4(aPos, 1.);
   vec3 r = transformMatrix*vec3(aTexCoord,1);
   pixel = r.xy/r.z;
}
