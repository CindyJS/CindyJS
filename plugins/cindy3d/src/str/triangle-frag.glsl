varying vec4 vPos;
varying vec4 vNormal;

void main() {
  finish(vPos.xyz / vPos.w, normalize(vNormal.xyz));
}
