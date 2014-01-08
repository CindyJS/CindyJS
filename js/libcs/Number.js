
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
    return {"ctype":"number" ,  
            "value":{'real':a.value.real,'imag':a.value.imag}, 
            "usage":a.usage}
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
    return {"ctype":"number" ,
        "value":{'real':-a.value.real, 'imag':-a.value.imag}}
}


Number.re=function(a){
    return {"ctype":"number" ,
        "value":{'real':a.value.real, 'imag':0}}
}


Number.im=function(a){
    return {"ctype":"number" ,
        "value":{'real':a.value.imag, 'imag':0}}
}

Number.conjugate=function(a){
    return {"ctype":"number" ,
        "value":{'real':a.value.real, 'imag':-a.value.imag}}
}



Number.round=function(a){
    return {"ctype":"number" ,
        "value":{'real':Math.round(a.value.real), 'imag':Math.round(a.value.imag)}}
}

Number.ceil=function(a){
    return {"ctype":"number" ,
        "value":{'real':Math.ceil(a.value.real), 'imag':Math.ceil(a.value.imag)}}
}

Number.floor=function(a){
    return {"ctype":"number" ,
        "value":{'real':Math.floor(a.value.real), 'imag':Math.floor(a.value.imag)}}
}



Number.mult=function(a,b){
    return {"ctype":"number" ,
        "value":{'real':a.value.real*b.value.real-a.value.imag*b.value.imag,
            'imag':a.value.real*b.value.imag+a.value.imag*b.value.real}};
}


Number.abs2=function(a,b){
    return {"ctype":"number" ,
        "value":{'real':a.value.real*a.value.real+a.value.imag*a.value.imag,
            'imag':0}};
}

Number.abs=function(a1){
    return Number.sqrt(Number.abs2(a1))
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

Number.tan=function(a) {
    var s=Number.sin(a);
    var c=Number.cos(a);
    return Number.div(s,c);
}

Number.arccos=function(a) {  //OK hässlich aber tuts.
    var t2=Number.mult(a,Number.neg(a));
    var tmp=Number.sqrt(Number.add(Number.real(1),t2));
    var tmp1=Number.add(Number.mult(a,Number.complex(0,1)),tmp);
    var erg=Number.add(Number.mult(Number.log(tmp1),Number.complex(0,1)),Number.real(Math.PI*0.5));
    erg.usage = 'angle';
    return erg;
}

Number.arcsin=function(a) {  //OK hässlich aber tuts.
    var t2=Number.mult(a,Number.neg(a));
    var tmp=Number.sqrt(Number.add(Number.real(1),t2));
    var tmp1=Number.add(Number.mult(a,Number.complex(0,1)),tmp);
    var erg=Number.mult(Number.log(tmp1),Number.complex(0,-1));
    erg.usage = 'angle';
    return erg;
}

Number.arctan=function(a) {  //OK hässlich aber tuts.
    var t1=Number.log(Number.add(Number.mult(a,Number.complex(0,-1)),Number.real(1)));
    var t2=Number.log(Number.add(Number.mult(a,Number.complex(0,1)),Number.real(1)));
    var erg=Number.mult(Number.sub(t1,t2),Number.complex(0,0.5));
    erg.usage = 'angle';
    return erg;
}


//Das ist jetzt genau so wie in Cindy.
//Da wurde das aber niemals voll auf complexe Zahlen umgestellt
//Bei Beiden Baustellen machen!!!
Number.arctan2=function(a,b) {  //OK
    var erg= Number.real(Math.atan2(b.value.real,a.value.real));
    erg.usage = 'angle';
    return erg;
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

Number.helper={};

Number.helper.seed='NO';
Number.eps=0.0000000001;
Number.epsbig=0.000001;

Number.helper.seedrandom=function(a){
    a=a-Math.floor(a);
    a=a*.8+.1;
    Number.helper.seed=a;
}

Number.helper.rand=function(){
    if(Number.helper.seed=='NO'){
        return Math.random();
    }
    var a=Number.helper.seed;
    a=Math.sin(1000*a)*1000;
    a=a-Math.floor(a);
    Number.helper.seed=a;
    return a;
}

Number.helper.randnormal=function(){
    var a=Number.helper.rand();
    var b=Number.helper.rand();
    return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*b);
}


Number.helper.isEqual=function(a,b) {
    return (a.value.real == b.value.real) && (a.value.imag == b.value.imag);
}

Number.helper.isLessThan=function(a,b) {

    return(a.value.real < b.value.real 
           || a.value.real == b.value.real && a.value.imag < b.value.imag)
}

Number.helper.compare=function(a,b) {
    if(Number.helper.isLessThan(a,b)){return -1}
    if(Number.helper.isEqual(a,b)){return 0}
    return 1;
}

Number.helper.isAlmostEqual=function(a,b) {
    var r=a.value.real-b.value.real;
    var i=a.value.imag-b.value.imag;
    return (r<Number.eps) && (r>-Number.eps)&&(i<Number.eps) && (i>-Number.eps);
}

Number.helper.isZero=function(a) {
    return (a.value.real == 0) && (a.value.imag == 0);
}

Number.helper.isAlmostZero=function(a) {
    var r=a.value.real;
    var i=a.value.imag;
    return (r<Number.eps) && (r>-Number.eps)&&(i<Number.eps) && (i>-Number.eps);
}



Number.helper.isReal=function(a) {
    return (a.value.imag == 0) ;
}

Number.helper.isAlmostReal=function(a) {
    var i=a.value.imag;
    return (i<Number.epsbig) && (i>-Number.epsbig);//So gemacht wie in Cindy
}

Number.helper.isAlmostImag=function(a) {
    var r=a.value.real;
    return (r<Number.epsbig) && (r>-Number.epsbig);//So gemacht wie in Cindy
}

