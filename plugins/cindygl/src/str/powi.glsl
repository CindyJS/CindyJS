float powi(float a, int b){
  if(mod(float(b), 2.) < .5)
    return pow(abs(a), float(b));
  else
    return sign(a)*pow(abs(a), float(b));
}
