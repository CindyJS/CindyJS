vec2 logc(vec2 a){
    float re=a.x;
    float im=a.y;
    float s = sqrt(re*re+im*im);
    float i = im;
    float imag = atan(im, re);
    if (i < 0.0) {
        imag += (2.0 * pi);
    }
    if (i == 0.0 && re < 0.0) {
        imag = pi;
    }
    if (imag > pi) {
        imag -= (2.0 * pi);
    };
    float real = log(s);    
 //   return CSNumber.snap({"ctype":"number" ,"value":{'real':real,'imag':imag}});
    return vec2(real,imag); 
}
