geoOps={};
geoOps.helper={};

var geoOpMap={};


geoOps.Join =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    el.homog=List.cross(el1.homog,el2.homog);
    el.homog.usage="Line";  
}
geoOpMap.Join="L";


geoOps.Segment =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    el.homog=List.cross(el1.homog,el2.homog);
    el.homog.usage="Line";  
}
geoOpMap.Segment="S";



geoOps.Meet =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    el.homog=List.cross(el1.homog,el2.homog);
    el.homog.usage="Point";  
}

geoOps.Meet.visiblecheck=function(el){
    var visible=true;  
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    
    if(el1.type=="Segment") {
        visible=onSegment(el,el1)
    } 
    if(visible && el1.type=="Segment") {
        visible=onSegment(el,el2)
    }
    el.isshowing=visible;
}

geoOpMap.Meet="P";



geoOps.Mid =function(el){
    var x=csgeo.csnames[(el.args[0])].homog;
    var y=csgeo.csnames[(el.args[1])].homog;
    
    var line=List.cross(x, y);
    var infp=List.cross(line, List.linfty);
    var ix= List.det3(x, infp, line);
    var iy= List.det3(y, infp, line);
    var z1=List.scalmult(iy,x);
    var z2=List.scalmult(ix,y);
    el.homog=List.add(z1,z2);
    el.homog.usage="Point";      
}
geoOpMap.Mid="P";


geoOps.Perp =function(el){
    var l=csgeo.csnames[(el.args[0])].homog;
    var p=csgeo.csnames[(el.args[1])].homog;
    var inf=List.linfty;
    var tt=List.cross(inf,l);
    tt.value=[tt.value[1],CSNumber.neg(tt.value[0]),tt.value[2]];
    el.homog=List.cross(tt,p);
    el.homog.usage="Line";
}
geoOpMap.Perp="L";


geoOps.Para =function(el){
    var l=csgeo.csnames[(el.args[0])].homog;
    var p=csgeo.csnames[(el.args[1])].homog;
    var inf=List.linfty;
    el.homog=List.cross(List.cross(inf,l),p);
    el.homog.usage="Line";
}
geoOpMap.Para="L";

geoOps.Horizontal =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    el.homog=List.cross(List.ex,el1.homog);
    el.homog.usage="Line";  
}
geoOpMap.Horizontal="L";

geoOps.Vertical =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    el.homog=List.cross(List.ey,el1.homog);
    el.homog.usage="Line";  
}
geoOpMap.Vertical="L";


geoOps.Free =function(el){
    
}
geoOpMap.Free="P";

geoOps.PointOnLine =function(el){
    var l=csgeo.csnames[(el.args[0])].homog;
    var p=el.homog;
    var inf=List.linfty;
    var tt=List.cross(inf,l);
    tt.value=[tt.value[1],CSNumber.neg(tt.value[0]),tt.value[2]];
    var perp=List.cross(tt,p);
    el.homog=List.cross(perp,l);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";
    //TODO: Handle complex and infinite Points
    var x=CSNumber.div(el.homog.value[0],el.homog.value[2]);
    var y=CSNumber.div(el.homog.value[1],el.homog.value[2]);
    el.sx=x.value.real;
    el.sy=y.value.real;
    el.sz=1;
}
geoOpMap.PointOnLine="P";


geoOps.PointOnSegment =function(el){//TODO was ist hier zu tun damit das stabil bei tracen bleibt
    
    var l=csgeo.csnames[(el.args[0])].homog;
    var el1=csgeo.csnames[csgeo.csnames[(el.args[0])].args[0]].homog;
    var el2=csgeo.csnames[csgeo.csnames[(el.args[0])].args[1]].homog;
    var elm=el.homog;
    
    var xx1=CSNumber.div(el1.value[0],el1.value[2]);
    var yy1=CSNumber.div(el1.value[1],el1.value[2]);
    var xx2=CSNumber.div(el2.value[0],el2.value[2]);
    var yy2=CSNumber.div(el2.value[1],el2.value[2]);
    var xxm=CSNumber.div(elm.value[0],elm.value[2]);
    var yym=CSNumber.div(elm.value[1],elm.value[2]);
    if(!move || move.mover==el){
        
        var p=el.homog;
        var inf=List.linfty;
        var tt=List.cross(inf,l);
        tt.value=[tt.value[1],CSNumber.neg(tt.value[0]),tt.value[2]];
        var perp=List.cross(tt,p);
        el.homog=List.cross(perp,l);
        el.homog=List.normalizeMax(el.homog);
        el.homog.usage="Point";
        
        
        
        
        var x1=xx1.value.real;
        var y1=yy1.value.real;
        var x2=xx2.value.real;
        var y2=yy2.value.real;
        var xm=xxm.value.real;
        var ym=yym.value.real;
        var d12=Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
        var d1m=Math.sqrt((x1-xm)*(x1-xm)+(y1-ym)*(y1-ym));
        var d2m=Math.sqrt((x2-xm)*(x2-xm)+(y2-ym)*(y2-ym));
        var dd=d12-d1m-d2m;
        var par=d1m/d12;
        if (d1m>d12) par=1;
        if (d2m>d12) par=0;
        el.param=CSNumber.real(par);
        
    }
    
    par=el.param;
    
    var diffx=CSNumber.sub(xx2,xx1);
    var ergx=CSNumber.add(xx1,CSNumber.mult(el.param,diffx));
    var diffy=CSNumber.sub(yy2,yy1);
    var ergy=CSNumber.add(yy1,CSNumber.mult(el.param,diffy));
    var ergz=CSNumber.real(1);
    el.homog=List.turnIntoCSList([ergx,ergy,ergz]);
    
    
    
    //TODO: Handle complex and infinite Points
    var x=CSNumber.div(el.homog.value[0],el.homog.value[2]);
    var y=CSNumber.div(el.homog.value[1],el.homog.value[2]);
    
    el.sx=x.value.real;
    el.sy=y.value.real;
    el.sz=1;
}
geoOpMap.PointOnSegment="P";



geoOps.CircleMP =function(el){//TODO Performance Checken. Das ist jetzt der volle CK-ansatz
                                //Weniger Allgemein geht das viiiiel schneller
    var m=csgeo.csnames[(el.args[0])].homog;
    var p=csgeo.csnames[(el.args[1])].homog;
    var l1=List.crossOperator(m);
    var l2=List.transpose(l1);
    
    
    var tang=General.mult(l2,General.mult(List.fundDual,l1));
    var mu=General.mult(General.mult(p,tang),p);
    var la=General.mult(General.mult(p,List.fund),p);
    var m1=General.mult(mu,List.fund);
    var m2=General.mult(la,tang);
    var erg=List.sub(m1,m2);
    el.matrix=erg;
    el.usage="Circle";
    
}
geoOpMap.CircleMP="C";

geoOps.helper.ConicBy5 =function(el,a,b,c,d,p){

    var v23=List.turnIntoCSList([List.cross(b, c)]);
    var v14=List.turnIntoCSList([List.cross(a, d)]);
    var v12=List.turnIntoCSList([List.cross(a, b)]);
    var v34=List.turnIntoCSList([List.cross(c, d)]);
    var deg1=General.mult(List.transpose(v14),v23);

    var deg2=General.mult(List.transpose(v34),v12);
    deg1=List.add(deg1,List.transpose(deg1));
    deg2=List.add(deg2,List.transpose(deg2));
    var mu=General.mult(General.mult(p,deg1),p);
    var la=General.mult(General.mult(p,deg2),p);
    var m1=General.mult(mu,deg2);
    var m2=General.mult(la,deg1);

    var erg=List.sub(m1,m2);
    return erg;
}


geoOps.ConicBy5 =function(el){
    var a=csgeo.csnames[(el.args[0])].homog;
    var b=csgeo.csnames[(el.args[1])].homog;
    var c=csgeo.csnames[(el.args[2])].homog;
    var d=csgeo.csnames[(el.args[3])].homog;
    var p=csgeo.csnames[(el.args[4])].homog;
    var erg=geoOps.helper.ConicBy5(el,a,b,c,d,p);
    el.matrix=erg;
    el.usage="Conic";
}
geoOpMap.ConicBy5="C";

geoOps.CircleBy3 =function(el){
    var a=csgeo.csnames[(el.args[0])].homog;
    var b=csgeo.csnames[(el.args[1])].homog;
    var c=List.ii;
    var d=List.jj;
    var p=csgeo.csnames[(el.args[2])].homog;
    var erg=geoOps.helper.ConicBy5(el,a,b,c,d,p);
    el.matrix=List.normalizeMax(erg);
    el.usage="Circle";

}
geoOpMap.CircleBy3="C";


geoOps.helper.tracing2=function(n1,n2,c1,c2,el){
    var OK=0;
    var DECREASE_STEP=1;
    var INVALID=2;
    var tooClose=OK;
    var security = 3;
    var security = 3;

    var do1n1=List.projectiveDistMinScal(c1,n1);
    var do1n2=List.projectiveDistMinScal(c1,n2);
    var do2n1=List.projectiveDistMinScal(c2,n1);
    var do2n2=List.projectiveDistMinScal(c2,n2);
    var do1o2=List.projectiveDistMinScal(c1,c2);
    var dn1n2=List.projectiveDistMinScal(n1,n2);

    //Das Kommt jetzt eins zu eins aus Cindy
    
    var care = (do1o2 > .000001);
    
    // First we try to assign the points
    
    if (do1o2 / security > do1n1 + do2n2 && dn1n2 / security > do1n1 + do2n2) {
        el.results=List.turnIntoCSList([n1,n2]);//Das ist "sort Output"
        return OK + tooClose;
    }
    
    if (do1o2 / security > do1n2 + do2n1 && dn1n2 / security > do1n2 + do2n1) {
        el.results=List.turnIntoCSList([n2,n1]);//Das ist "sort Output"
        return OK + tooClose;
    }
    
    //  Maybe they are too close?
    
    if (dn1n2 < 0.00001) {
        // They are. Do we care?
        if (care) {
            tooClose = INVALID;
            el.results=List.turnIntoCSList([n1,n2]);
            return OK + tooClose;
        } else {
            el.results=List.turnIntoCSList([n1,n2]);
            return OK + tooClose;
        }
    }
    
    // They are far apart. We care now.
    if (!care || tooClose == INVALID) {
        el.results=List.turnIntoCSList([n1,n2]);//Das ist "sort Output"
        return OK + tooClose;
    }
    return DECREASE_STEP + tooClose;        
    
}

geoOps.IntersectLC =function(el){
    var N=CSNumber;
    var l=csgeo.csnames[(el.args[0])].homog;
    var c=csgeo.csnames[(el.args[1])].matrix;
    var l1=List.crossOperator(l);
    var l2=List.transpose(l1);
    var s=General.mult(l2,General.mult(c,l1));

    var ax=s.value[0].value[0];
    var ay=s.value[0].value[1];
    var az=s.value[0].value[2];
    var bx=s.value[1].value[0];
    var by=s.value[1].value[1];
    var bz=s.value[1].value[2];
    var cx=s.value[2].value[0];
    var cy=s.value[2].value[1];
    var cz=s.value[2].value[2];

    var xx=l.value[0];
    var yy=l.value[1];
    var zz=l.value[2];
    

    var absx=N.abs(xx).value.real;
    var absy=N.abs(yy).value.real;
    var absz=N.abs(zz).value.real;

    var alp;
    if(absz>=absx && absz>=absy){
        alp=N.div(N.sqrt(N.sub(N.mult(ay,bx),N.mult(ax,by))),zz);
    } 
    if(absy>=absx && absy>=absz){

        alp=N.div(N.sqrt(N.sub(N.mult(bz,cy),N.mult(by,cz))),xx);
    } 
    if(absx>=absy && absx>=absz){
        alp=N.div(N.sqrt(N.sub(N.mult(cx,az),N.mult(cz,ax))),yy);
    } 

    
    var erg=List.add(s,List.scalmult(alp,l1));
    var erg1=erg.value[0];
    erg1.usage="Point";      
    erg=List.transpose(erg);
    var erg2=erg.value[0];
    erg2.usage="Point";  
    
    //Here comes the tracing  
                           
    if(!el.inited){
        el.check1=erg1;
        el.check2=erg2;
        el.inited=true;
        el.results=List.turnIntoCSList([erg1,erg2]);
        
    } else {
        var action=geoOps.helper.tracing2(erg1,erg2,el.check1,el.check2,el);
        el.check1=el.results.value[0];
        el.check2=el.results.value[1];
    }
}
geoOpMap.IntersectLC="T";

geoOps.SelectP =function(el){
    var set=csgeo.csnames[(el.args[0])];
    if(!el.inited){
        el.inited=true;
    }
    el.homog=set.results.value[el.index-1];

}
geoOpMap.SelectP="P";

