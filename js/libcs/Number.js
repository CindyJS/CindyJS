
//==========================================
//      Complex Numbers
//==========================================
Number={};
Number.niceprint= function(a){
    if (a.value.imag==0) {
        return ""+a.value.real;
    }
    
    if(a.value.imag>0){
        return ""+a.value.real+" + i*"+a.value.imag;
    } else {
        return ""+a.value.real+" - i*"+(-a.value.imag);
    }
    return "";
}

Number.complex=function(r,i){
    return {"ctype":"number" ,  "value":{'real':r,'imag':i}}
}

Number.real=function(r){
    return {"ctype":"number" ,  "value":{'real':r,'imag':0}}
}



Number.clone=function(a){
    return {"ctype":"number" ,  "value":{'real':a.value.real,
        'imag':a.value.imag}}
}


Number.add=function(a,b){
    return {"ctype":"number" ,  "value":{'real':a.value.real+b.value.real,
        'imag':a.value.imag+b.value.imag}}
}

Number.sub=function(a,b){
    return {"ctype":"number" ,  "value":{'real':a.value.real-b.value.real,
        'imag':a.value.imag-b.value.imag}}
}

Number.neg=function(a){
    return {"ctype":"number" ,  "value":{'real':-a.value.real,
        'imag':-a.value.imag}}
}

Number.mult=function(a,b){
    return {"ctype":"number" ,
        "value":{'real':a.value.real*b.value.real-a.value.imag*b.value.imag,
            'imag':a.value.real*b.value.imag+a.value.imag*b.value.real}};
}

Number.inv=function(a){
    var s=a.value.real*a.value.real+a.value.imag*a.value.imag;
    return {"ctype":"number" ,
        "value":{'real':a.value.real/s,
            'imag':-a.value.imag/s}}
}


Number.div=function(a,b){
    return Number.mult(a,Number.inv(b));
}


Number.eps=0.0000001;

Number.snap=function(a){
    var r=a.value.real;
    var i=a.value.imag;
    if(Math.floor(r+Number.eps)!=Math.floor(r-Number.eps)){
        r=Math.round(r);
    }
    if(Math.floor(i+Number.eps)!=Math.floor(i-Number.eps)){
        i=Math.round(i);
    }
    return {"ctype":"number" ,"value":{'real':r,'imag':i}};
    
}

Number.exp=function(a){
    var n = Math.exp(a.value.real);
    var r = n * Math.cos(a.value.imag);
    var i = n * Math.sin(a.value.imag);
    return {"ctype":"number" ,"value":{'real':r,'imag':i}};
}

Number.cos=function(a) {
    var rr=a.value.real;
    var ii=a.value.imag;
    var n = Math.exp(ii);
    var imag1 = n * Math.sin(-rr);
    var real1 = n * Math.cos(-rr);
    n = Math.exp(-ii);
    var imag2 = n * Math.sin(rr);
    var real2 = n * Math.cos(rr);
    var i = (imag1 + imag2) / 2.0;
    var r = (real1 + real2) / 2.0;
  //  if (i * i < 1E-30) i = 0;
  //  if (r * r < 1E-30) r = 0;
    return {"ctype":"number" ,"value":{'real':r,'imag':i}};
}

Number.sin=function(a) {
    var rr=a.value.real;
    var ii=a.value.imag;
    var n = Math.exp(ii);
    var imag1 = n * Math.sin(-rr);
    var real1 = n * Math.cos(-rr);
    n = Math.exp(-ii);
    var imag2 = n * Math.sin(rr);
    var real2 = n * Math.cos(rr);
    var r = -(imag1 - imag2) / 2.0;
    var i = (real1 - real2) / 2.0;
  //  if (i * i < 1E-30) i = 0;
  //  if (r * r < 1E-30) r = 0;
    return {"ctype":"number" ,"value":{'real':r,'imag':i}};
}

Number.sqrt=function(a)  {
    var rr=a.value.real;
    var ii=a.value.imag;
    var n = Math.sqrt(Math.sqrt(rr * rr + ii * ii));
    var w = Math.atan2(ii, rr);
    var i = n * Math.sin(w / 2);
    var r = n * Math.cos(w / 2);
    return {"ctype":"number" ,"value":{'real':r,'imag':i}};
}


Number.log=function(a){
    var re=a.value.real;
    var im=a.value.imag;
    var s = Math.sqrt(re*re+im*im);
    var i = im;
    
    console.log(re);
    console.log(i);
    var imag = Math.atan2(im, re);
    if (i < 0) {
        imag += (2 * Math.PI);
    }
    if (i == 0 && re < 0) {
        imag = Math.PI;
    }
    if (imag > Math.PI) {
        imag -= (2 * Math.PI)
    };
    var real = Math.log(s);
    
    return Number.snap({"ctype":"number" ,"value":{'real':real,'imag':imag}});
}

Number.pow=function(a,b){
    
    if(b.value.real==Math.round(b.value.real)&& b.value.imag==0){//TODO später mal effizienter machen
        var erg={"ctype":"number" ,"value":{'real':1,'imag':0}};
        for(var i=0;i<Math.abs(b.value.real);i++){
            erg=Number.mult(erg,a);
        }
        if (b.value.real<0){
            return Number.inv(erg);
        }
        return(erg);
        
    }
    var res=Number.exp(Number.mult(Number.log(a),b));
    return res;
}




Number.mod=function(a,b){
    var a1=a.value.real;
    var a2=b.value.real;
    var b1=a.value.imag;
    var b2=b.value.imag;
    
    var r = a1 - Math.floor(a1 / a2) * a2;
    var i = b1 - Math.floor(b1 / b2) * b2;
    if(a2==0) {r=0};
    if(b2==0) {i=0};
    
    return Number.snap({"ctype":"number" ,"value":{'real':r,'imag':i}});
}
