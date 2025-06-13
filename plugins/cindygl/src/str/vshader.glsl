#version 300 es
in vec3 aPos;
in vec2 aTexCoord;
out   vec2 cgl_pixel;
out   vec2 plain_pixel;
uniform   mat3 transformMatrix;
void main(void) {
   gl_Position = vec4(aPos, 1.);
   plain_pixel = aTexCoord;
   vec3 r = transformMatrix*vec3(plain_pixel,1);
   cgl_pixel = r.xy/r.z;
}
