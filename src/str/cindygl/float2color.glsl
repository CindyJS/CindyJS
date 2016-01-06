vec4 float2color(float f)
{
   f = clamp(f,0.,1.);
   return vec4(f,f,f,1.);
}
