#version 300 es
in vec3 aPos;
in vec2 aTexCoord;
out   vec2 cgl_pixel;

void main(void) {
   gl_Position = vec4(aPos, 1.);
   cgl_pixel = aTexCoord;
}
