attribute vec3 aPos;
attribute vec2 aTexCoord;
varying   vec2 cgl_pixel;

void main(void) {
   gl_Position = vec4(aPos, 1.);
   cgl_pixel = aTexCoord;
}
