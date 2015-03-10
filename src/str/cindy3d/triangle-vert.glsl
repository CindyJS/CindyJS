uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

attribute vec4 aPos;
attribute vec4 aNormalAndShininess;
attribute vec4 aColor;

varying vec4 vPos;
varying vec4 vNormal;
varying vec4 vColor;

void main() {
  vPos = uModelViewMatrix * aPos;
  gl_Position = uProjectionMatrix * vPos;
  vNormal = uModelViewMatrix * vec4(aNormalAndShininess.xyz, 0.0);
  vShininess = aNormalAndShininess.w;
  vColor = aColor;
}
