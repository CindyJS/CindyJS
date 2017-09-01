precision highp float;

attribute vec4 aPos;
varying vec2 vPos;

void main() {
  vPos = aPos.zw;
  gl_Position = vec4(aPos.xy, 0, 1);
}
