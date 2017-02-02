varying vec4 vPos;
varying vec4 vNormal;

uniform bool uTextured;
uniform sampler2D uTexture;

void main() {
  if (uTextured) // color is actually a texture coordinate
    gColor = texture2DProj(uTexture, vColor.xyz);
  else
    gColor = vColor;
  finish(vPos.xyz / vPos.w, normalize(vNormal.xyz));
}
