geoOps={};
geoOps._helper={};

var geoOps = {};
geoOps._helper = {};
var geoOpMap = {};


geoOps.Join =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    el.homog=List.cross(el1.homog,el2.homog);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";  
};
geoOpMap.Join="L";


geoOps.Segment =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    el.homog=List.cross(el1.homog,el2.homog);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";  
};
geoOpMap.Segment="S";



geoOps.Meet =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    el.homog=List.cross(el1.homog,el2.homog);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";  
};

geoOps.Meet.visiblecheck=function(el){
    var visible=true;  
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    
    if(el1.type==="Segment") {
        visible=onSegment(el,el1);
    } 
    if(visible && el1.type==="Segment") {
        visible=onSegment(el,el2);
    }
    el.isshowing=visible;
};

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
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";      
};
geoOpMap.Mid="P";


geoOps.Perp =function(el){
    var l=csgeo.csnames[(el.args[0])].homog;
    var p=csgeo.csnames[(el.args[1])].homog;
    var inf=List.linfty;
    var tt=List.cross(inf,l);
    tt.value=[tt.value[1],CSNumber.neg(tt.value[0]),tt.value[2]];
    el.homog=List.cross(tt,p);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";
};
geoOpMap.Perp="L";


geoOps.Para =function(el){
    var l=csgeo.csnames[(el.args[0])].homog;
    var p=csgeo.csnames[(el.args[1])].homog;
    var inf=List.linfty;
    el.homog=List.cross(List.cross(inf,l),p);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";
};
geoOpMap.Para="L";

geoOps.Horizontal =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    el.homog=List.cross(List.ex,el1.homog);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";  
};
geoOpMap.Horizontal="L";

geoOps.Vertical =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    el.homog=List.cross(List.ey,el1.homog);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";  
};
geoOpMap.Vertical="L";


geoOps.Through =function(el){
    var el1=List.normalizeZ(csgeo.csnames[(el.args[0])].homog);
    
    if(move && move.mover===el){
        var xx=el1.value[0].value.real-mouse.x+move.offset.x;
        var yy=el1.value[1].value.real-mouse.y+move.offset.y;
        el.dir=List.realVector([xx,yy,0]);
    }

    el.homog=List.cross(el.dir,el1);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";  
};
geoOpMap.Through="L";


geoOps.Free =function(el){
    
};
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
};
geoOpMap.PointOnLine="P";



geoOps.PointOnCircle =function(el){//TODO was ist hier zu tun damit das stabil bei tracen bleibt

    var c=csgeo.csnames[(el.args[0])];
    var pts=geoOps._helper.IntersectLC(List.linfty,c.matrix);
    var ln1=General.mult(c.matrix,pts[0]);
    var ln2=General.mult(c.matrix,pts[1]);
    var mid=List.normalizeZ(List.cross(ln1,ln2));
 
    if(move && move.mover===el){
        var xx=mid.value[0].value.real-mouse.x-move.offset.x;
        var yy=mid.value[1].value.real-mouse.y-move.offset.y;
        el.angle=CSNumber.real(Math.atan2(-yy,-xx));
 
    }
    
    var angle=el.angle;

    var pt=List.turnIntoCSList([CSNumber.cos(angle),CSNumber.sin(angle),CSNumber.real(0)]);
    pt=List.scalmult(CSNumber.real(10),pt);
    pt=List.add(mid,pt);

    var ln=List.cross(pt,mid);
    var ints=geoOps._helper.IntersectLC(ln,c.matrix);//TODO richtiges Tracing einbauen!!!
    var int1=List.normalizeZ(ints[0]);
    var int2=List.normalizeZ(ints[1]);
    var d1=List.abs2(List.sub(pt,int1));
    var d2=List.abs2(List.sub(pt,int2));
   
    var erg=ints[0];
    if(d1.value.real>d2.value.real){erg=ints[1];}


    el.homog=erg;
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";

    
    //TODO: Handle complex and infinite Points
    var x=CSNumber.div(el.homog.value[0],el.homog.value[2]);
    var y=CSNumber.div(el.homog.value[1],el.homog.value[2]);
    
    el.sx=x.value.real;
    el.sy=y.value.real;
    el.sz=1;
};
geoOpMap.PointOnCircle="P";



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
    var par;
    if(!move || move.mover===el){
        
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
        par=d1m/d12;
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
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";

    
    //TODO: Handle complex and infinite Points
    var x=CSNumber.div(el.homog.value[0],el.homog.value[2]);
    var y=CSNumber.div(el.homog.value[1],el.homog.value[2]);
    
    el.sx=x.value.real;
    el.sy=y.value.real;
    el.sz=1;
};
geoOpMap.PointOnSegment="P";



geoOps._helper.CenterOfConic =function(c){
        var pts=geoOps._helper.IntersectLC(List.linfty,c);
        var ln1=General.mult(c,pts[0]);
        var ln2=General.mult(c,pts[1]);

        var erg=List.cross(ln1,ln2);

        return erg;
};

geoOps.CenterOfConic =function(el){
    var c=csgeo.csnames[(el.args[0])].matrix;
    var erg=geoOps._helper.CenterOfConic(c);
    el.homog=erg;
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";


};
geoOpMap.CenterOfConic="P";

geoOps._helper.CircleMP=function(m,p){
    var l1=List.crossOperator(m);
    var l2=List.transpose(l1);
    
    
    var tang=General.mult(l2,General.mult(List.fundDual,l1));
    var mu=General.mult(General.mult(p,tang),p);
    var la=General.mult(General.mult(p,List.fund),p);
    var m1=General.mult(mu,List.fund);
    var m2=General.mult(la,tang);
    var erg=List.sub(m1,m2);
    return erg;
};

geoOps.CircleMP =function(el){//TODO Performance Checken. Das ist jetzt der volle CK-ansatz
                                //Weniger Allgemein geht das viiiiel schneller
    var m=csgeo.csnames[(el.args[0])].homog;
    var p=csgeo.csnames[(el.args[1])].homog;
    el.matrix=geoOps._helper.CircleMP(m,p);
    el.matrix=List.normalizeMax(el.matrix);
    el.matrix.usage="Circle";
    
};
geoOpMap.CircleMP="C";


geoOps.CircleMr =function(el){
    var m=csgeo.csnames[(el.args[0])].homog;
    var mid=List.scaldiv(m.value[2],m);
    if(move && move.mover===el){
        var xx=mid.value[0].value.real-mouse.x;
        var yy=mid.value[1].value.real-mouse.y;
        var rad=Math.sqrt(xx*xx+yy*yy);//+move.offsetrad;
        el.radius=CSNumber.real(rad+move.offsetrad);
    }
    var r=el.radius;
    var p=List.turnIntoCSList([r,CSNumber.real(0),CSNumber.real(0)]);
    p=List.add(p,mid);   
    el.matrix=geoOps._helper.CircleMP(mid,p);
    el.matrix=List.normalizeMax(el.matrix);
    el.matrix.usage="Circle";
    
};
geoOpMap.CircleMr="C";



geoOps.CircleMFixedr =function(el){
    var m=csgeo.csnames[(el.args[0])].homog;
    var mid=List.scaldiv(m.value[2],m);

    var r=el.radius;
    var p=List.turnIntoCSList([r,CSNumber.real(0),CSNumber.real(0)]);
    
    el.matrix=geoOps._helper.CircleMP(mid,p);
    el.matrix=List.normalizeMax(el.matrix);
    el.matrix.usage="Circle";
    
};
geoOpMap.CircleMFixedr="C";



geoOps._helper.ConicBy5 =function(el,a,b,c,d,p){

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
};


geoOps.ConicBy5 =function(el){
    var a=csgeo.csnames[(el.args[0])].homog;
    var b=csgeo.csnames[(el.args[1])].homog;
    var c=csgeo.csnames[(el.args[2])].homog;
    var d=csgeo.csnames[(el.args[3])].homog;
    var p=csgeo.csnames[(el.args[4])].homog;

    var erg=geoOps._helper.ConicBy5(el,a,b,c,d,p);

    el.matrix=erg;
    el.matrix=List.normalizeMax(el.matrix);
    el.matrix.usage="Conic";
};
geoOpMap.ConicBy5="C";

geoOps._helper.buildConicMatrix = function(arr){
    var a = arr[0];
    var b = arr[1];
    var c = arr[2];
    var d = arr[3];
    var e = arr[4];
    var f = arr[5];

    var M = List.turnIntoCSList([
	        List.turnIntoCSList([a,b,d]),
	        List.turnIntoCSList([b,c,e]),
	        List.turnIntoCSList([d,e,f])
    		]);
    return M;
};

geoOps._helper.splitDegenConic = function(mat){
    var adj_mat = List.adjoint3(mat);

    var idx = 0, k, l;
    var max = CSNumber.abs(adj_mat.value[0].value[0]).value.real;
    for(k = 1; k < 3; k++){
    	if(CSNumber.abs(adj_mat.value[k].value[k]).value.real > max){
    		idx = k;
    		max = CSNumber.abs(adj_mat.value[k].value[k]).value.real;
    	}
    }
    
    var beta = CSNumber.sqrt(CSNumber.mult(CSNumber.real(-1),adj_mat.value[idx].value[idx]));
    idx = CSNumber.real(idx+1);
    var p = List.column(adj_mat,idx);
    if(CSNumber.abs(beta).value.real < 10e-8){
	    return nada;
    }

    p = List.scaldiv(beta,p);

    
    var lam = p.value[0], mu = p.value[1], tau = p.value[2];
    var M = List.turnIntoCSList([
	    List.turnIntoCSList([CSNumber.real(0), tau, CSNumber.mult(CSNumber.real(-1),mu)]),
	    List.turnIntoCSList([CSNumber.mult(CSNumber.real(-1),tau), CSNumber.real(0), lam]),
	    List.turnIntoCSList([mu, CSNumber.mult(CSNumber.real(-1),lam), CSNumber.real(0)])]);


    var C = List.add(mat,M);
    
    // get nonzero index
    var ii = 0, jj = 0;
    max = 0;
    for(k = 0; k < 3; k++)
    for(l = 0; l < 3; l++){
    	if(CSNumber.abs(C.value[k].value[l]).value.real > max){
    		ii = k;
    		jj = l;
		max = CSNumber.abs(C.value[k].value[l]).value.real;
    	}
    }

    
    var lg = C.value[ii];
    C = List.transpose(C);
    var lh = C.value[jj];

    lg.usage = "Line";
    lh.usage = "Line";

    return [lg, lh];
};

geoOps.SelectConic =function(el){
    var set=csgeo.csnames[(el.args[0])];
    if(!el.inited){
        el.inited=true;
    }
    el.matrix=set.results[el.index-1];
    el.matrix=List.normalizeMax(el.matrix);
    el.matrix.usage="Conic";
};
geoOpMap.SelectConic="C";

// conic by 4 Points and 1 line
geoOps._helper.ConicBy4p1l =function(el,a,b,c,d,l){
    var a1 = List.cross(List.cross(a,c),l);
    var a2 = List.cross(List.cross(b,d),l);
    var b1 = List.cross(List.cross(a,b),l);
    var b2 = List.cross(List.cross(c,d),l);
    var o = List.realVector(csport.to(100*Math.random(),100*Math.random())); 

    var r1 = CSNumber.mult(List.det3(o,a2,b1),List.det3(o,a2,b2));
    r1 = CSNumber.sqrt(r1); 
    var r2 = CSNumber.mult(List.det3(o,a1,b1),List.det3(o,a1,b2));
    r2 = CSNumber.sqrt(r2); 

    var k1 = List.scalmult(r1,a1);
    var k2 = List.scalmult(r2,a2);

    var x = List.add(k1, k2);
    var y = List.sub(k1, k2);

    var t1 = geoOps._helper.ConicBy5(el,a,b,c,d,x);
    var t2 = geoOps._helper.ConicBy5(el,a,b,c,d,y);

    return [t1,t2];
};

geoOps.ConicBy4p1l =function(el){
    var a=csgeo.csnames[(el.args[0])].homog;
    var b=csgeo.csnames[(el.args[1])].homog;
    var c=csgeo.csnames[(el.args[2])].homog;
    var d=csgeo.csnames[(el.args[3])].homog;

    var l=csgeo.csnames[(el.args[4])].homog;

    var erg = geoOps._helper.ConicBy4p1l(el,a,b,c,d,l);

    el.results= erg;

};
geoOpMap.ConicBy4p1l="T";

geoOps.ConicBy1p4l =function(el){
    var l1=csgeo.csnames[(el.args[0])].homog;
    var l2=csgeo.csnames[(el.args[1])].homog;
    var l3=csgeo.csnames[(el.args[2])].homog;
    var l4=csgeo.csnames[(el.args[3])].homog;

    var p=csgeo.csnames[(el.args[4])].homog;

    var erg = geoOps._helper.ConicBy4p1l(el,l1,l2,l3,l4,p);
    var t1 = erg[0];
    var t2 = erg[1];
    t1 = List.adjoint3(t1);
    t2 = List.adjoint3(t2);
    
    erg = [t1,t2];
    el.results= erg;

};
geoOpMap.ConicBy1p4l="T";


geoOps.ConicBy5lines =function(el){
    var a=csgeo.csnames[(el.args[0])].homog;
    var b=csgeo.csnames[(el.args[1])].homog;
    var c=csgeo.csnames[(el.args[2])].homog;
    var d=csgeo.csnames[(el.args[3])].homog;
    var p=csgeo.csnames[(el.args[4])].homog;

    var erg_temp=geoOps._helper.ConicBy5(el,a,b,c,d,p);
    var erg = List.adjoint3(erg_temp);
    el.matrix=erg;
    el.matrix=List.normalizeMax(el.matrix);
    el.matrix.usage="Conic";
};
geoOpMap.ConicBy5lines="C";

geoOps.CircleBy3 =function(el){
    var a=csgeo.csnames[(el.args[0])].homog;
    var b=csgeo.csnames[(el.args[1])].homog;
    var c=List.ii;
    var d=List.jj;
    var p=csgeo.csnames[(el.args[2])].homog;
    var erg=geoOps._helper.ConicBy5(el,a,b,c,d,p);
    el.matrix=List.normalizeMax(erg);
    el.matrix.usage="Circle";

};
geoOpMap.CircleBy3="C";


geoOps._helper.tracing2=function(n1,n2,c1,c2,el){//Billigtracing
    var OK=0;
    var DECREASE_STEP=1;
    var INVALID=2;
    var tooClose=OK;
    var security = 3;

    var do1n1=List.projectiveDistMinScal(c1,n1);
    var do1n2=List.projectiveDistMinScal(c1,n2);
    var do2n1=List.projectiveDistMinScal(c2,n1);
    var do2n2=List.projectiveDistMinScal(c2,n2);

    
    if((do1n1 + do2n2)<(do1n2 + do2n1)){
        el.results=List.turnIntoCSList([n1,n2]);//Das ist "sort Output"
    } else {
        el.results=List.turnIntoCSList([n2,n1]);//Das ist "sort Output"

    }
    
};

geoOps._helper.tracing2X=function(n1,n2,c1,c2,el){
    var OK=0;
    var DECREASE_STEP=1;
    var INVALID=2;
    var tooClose=OK;
    var security = 3;

    var do1n1=List.projectiveDistMinScal(c1,n1);
    var do1n2=List.projectiveDistMinScal(c1,n2);
    var do2n1=List.projectiveDistMinScal(c2,n1);
    var do2n2=List.projectiveDistMinScal(c2,n2);
    var do1o2=List.projectiveDistMinScal(c1,c2);
    var dn1n2=List.projectiveDistMinScal(n1,n2);

    //Das Kommt jetzt eins zu eins aus Cindy
    
    var care = (do1o2 > 0.000001);
    
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
    if (!care || tooClose === INVALID) {
        el.results=List.turnIntoCSList([n1,n2]);//Das ist "sort Output"
        return OK + tooClose;
    }
    return DECREASE_STEP + tooClose;        
    
};

geoOps._helper.IntersectLC=function(l,c){

    var N=CSNumber;
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
    if(absx>=absy && absx>=absz){

        alp=N.div(N.sqrt(N.sub(N.mult(bz,cy),N.mult(by,cz))),xx);
    } 
    if(absy>=absx && absy>=absz){
        alp=N.div(N.sqrt(N.sub(N.mult(cx,az),N.mult(cz,ax))),yy);
    } 
    var erg=List.add(s,List.scalmult(alp,l1));
    var erg1=erg.value[0];
    erg1=List.normalizeMax(erg1);
    erg1.usage="Point";      
    erg=List.transpose(erg);
    var erg2=erg.value[0];
    erg2=List.normalizeMax(erg2);
    erg2.usage="Point";  
    return[erg1,erg2];

};

geoOps.IntersectLC =function(el){
    var l=csgeo.csnames[(el.args[0])].homog;
    var c=csgeo.csnames[(el.args[1])].matrix;
    
    var erg=geoOps._helper.IntersectLC(l,c);
    var erg1=erg[0];
    var erg2=erg[1];
                           
    if(!el.inited){
        el.check1=erg1;
        el.check2=erg2;
        el.inited=true;
        el.results=List.turnIntoCSList([erg1,erg2]);
        
    } else {
        var action=geoOps._helper.tracing2(erg1,erg2,el.check1,el.check2,el);
        if(!List._helper.isNaN(el.results.value[0]) &&!List._helper.isNaN(el.results.value[1])){
            el.check1=el.results.value[0];
            el.check2=el.results.value[1];
        }
    }
};
geoOpMap.IntersectLC="T";

geoOps.IntersectCirCir =function(el){
    var c1=csgeo.csnames[(el.args[0])].matrix;
    var c2=csgeo.csnames[(el.args[1])].matrix;

    var ct1 =c2.value[0].value[0];
    var line1=List.scalmult(ct1,c1.value[2]);
    var ct2 =c1.value[0].value[0];
    var line2=List.scalmult(ct2,c2.value[2]);
    var ll=List.sub(line1,line2);
    ll.value[2]=CSNumber.mult(CSNumber.real(0.5),ll.value[2]);
    ll=List.normalizeMax(ll);

    
    
    var erg=geoOps._helper.IntersectLC(ll,c1);
    var erg1=erg[0];
    var erg2=erg[1];
                           
    if(!el.inited){
        el.check1=erg1;
        el.check2=erg2;
        el.inited=true;
        el.results=List.turnIntoCSList([erg1,erg2]);
        
    } else {
        var action=geoOps._helper.tracing2(erg1,erg2,el.check1,el.check2,el);
        el.check1=el.results.value[0];
        el.check2=el.results.value[1];
    }

};
geoOpMap.IntersectCirCir="T";

geoOps.solveCubic= function(a, b, c, d) {
        return geoOps._helper.solveCubic(a.value.real, a.value.imag, b.value.real, b.value.imag, c.value.real, c.value.imag, d.value.real, d.value.imag);
};


geoOps._helper.solveCubic = function(ar, ai, br, bi, cr, ci, dr, di) {
    // dreist direkt aus dem cinderella2 sourcecode geklaut

    var c1 = 1.25992104989487316476721060727822835057025;  //2^(1/3)
    var c2 = 1.58740105196819947475170563927230826039149;  //2^(2/3)
    
    // t1 = (4ac - b^2)
    
    var acr = ar * cr - ai * ci;
    var aci = ar * ci + ai * cr;
    
    var t1r = 4 * acr - (br * br - bi * bi);
    var t1i = 4 * aci - 2 * br * bi;
    
    // ab = ab
    var abr = ar * br - ai * bi;
    var abi = ar * bi + ai * br;
    
    // t3 = t1 *c - 18 ab * d = (4 ac - b*b)*c - 18 abd
    var t3r = t1r * cr - t1i * ci - 18 * (abr * dr - abi * di);
    var t3i = (t1r * ci + t1i * cr) - 18 * (abr * di + abi * dr);
    
    // aa = 27  a*a
    var aar = 27 * (ar * ar - ai * ai);
    var aai = 54 * (ai * ar);
    
    // aad =  aa *d = 27 aad
    var aadr = aar * dr - aai * di;
    var aadi = aar * di + aai * dr;
    
    // t1 = b^2
    var bbr = br * br - bi * bi;
    var bbi = 2 * br * bi;
    
    // w = b^3
    var wr = bbr * br - bbi * bi;
    var wi = bbr * bi + bbi * br;
    
    // t2 = aad + 4w = 27aad + 4bbb
    var t2r = aadr + 4 * wr;
    var t2i = aadi + 4 * wi;
    
    // t1 = 27 *(t3 * c + t2 *d)
    t1r = t3r * cr - t3i * ci + t2r * dr - t2i * di;
    t1i = t3r * ci + t3i * cr + t2r * di + t2i * dr;
    
    // DIS OK!!
    
    // w = -2 b^3
    wr *= -2;
    wi *= -2;
    
    // w = w + 9 a b c
    wr += 9 * (abr * cr - abi * ci);
    wi += 9 * (abr * ci + abi * cr);
    
    // w = w + -27 a*a d
    wr -= aadr;
    wi -= aadi;
    
    // t1 = (27 dis).Sqrt()
    t1r *= 27;
    t1i *= 27;
    t2r = Math.sqrt(Math.sqrt(t1r * t1r + t1i * t1i));
    t2i = Math.atan2(t1i, t1r);
    t1i = t2r * Math.sin(t2i / 2);
    t1r = t2r * Math.cos(t2i / 2);
    
    // w = w + a * dis // sqrt war schon oben
    wr += t1r * ar - t1i * ai;
    wi += t1r * ai + t1i * ar;
    
    // w ausgerechnet. Jetz w1 und w2
    //     w1.assign(wr,wi);
    //     w2.assign(wr,wi);
    //     w1.sqrt1_3();
    //     w2.sqrt2_3();
    var radius = Math.exp(Math.log(Math.sqrt(wr * wr + wi * wi)) / 3.0);
    var phi = Math.atan2(wi, wr);
    var w1i = radius * Math.sin(phi / 3);
    var w1r = radius * Math.cos(phi / 3);
    
    radius *= radius;
    phi *= 2;
    
    var w2i = radius * Math.sin(phi / 3);
    var w2r = radius * Math.cos(phi / 3);
    
    // x = 2 b^2
    // x = x - 6 ac
    var xr = 2 * bbr - 6 * acr;
    var xi = 2 * bbi - 6 * aci;
    
    //y.assign(-c2).mul(b).mul(w1);
    var yr = -c2 * (br * w1r - bi * w1i);
    var yi = -c2 * (br * w1i + bi * w1r);
    
    //    z.assign(c1).mul(w2);
    var zr = c1 * w2r;
    var zi = c1 * w2i;
    
    //w1.mul(a).mul(3).mul(c2);
    t1r = c2 * 3 * (w1r * ar - w1i * ai);
    t1i = c2 * 3 * (w1r * ai + w1i * ar);
    
    var s = t1r * t1r + t1i * t1i;
    
    t2r = (xr * t1r + xi * t1i) / s;
    t2i = (-xr * t1i + xi * t1r) / s;
    xr = t2r;
    xi = t2i;
    
    t2r = (yr * t1r + yi * t1i) / s;
    t2i = (-yr * t1i + yi * t1r) / s;
    yr = t2r;
    yi = t2i;
    
    t2r = (zr * t1r + zi * t1i) / s;
    t2i = (-zr * t1i + zi * t1r) / s;
    zr = t2r;
    zi = t2i;


	return [xr, xi, yr, yi, yr, zr, zi];
};


geoOps.IntersectConicConic = function(el){
    var A=csgeo.csnames[(el.args[0])].matrix;
    var B=csgeo.csnames[(el.args[1])].matrix;

    var alpha = List.det(A);
//    console.log("alpha",alpha);
    
    // indexing
    var one = CSNumber.real(1);
    var two = CSNumber.real(2);
    var three = CSNumber.real(3);
    
    // beta
     // var b1 = List.turnIntoCSList([List.column(A,one), List.column(A,two), List.column(B,three)]);
    var b1 = List.det3(List.column(A,one), List.column(A,two), List.column(B,three));
    b1 = CSNumber.add(b1, List.det3(List.column(A,one), List.column(B,two), List.column(A,three)));
    b1 = CSNumber.add(b1, List.det3(List.column(B,one), List.column(A,two), List.column(A,three)));
    
    var beta = CSNumber.clone(b1);
    // Blinn
    beta = CSNumber.mult(beta, CSNumber.real(1/3));
    
    // gamma
    var g1 = List.det3(List.column(A,one), List.column(B,two), List.column(B,three));
    g1 = CSNumber.add(g1, List.det3(List.column(B,one), List.column(A,two), List.column(B,three)));
    g1 = CSNumber.add(g1, List.det3(List.column(B,one), List.column(B,two), List.column(A,three)));
    var gamma = CSNumber.clone(g1);
    // Blinn
    gamma = CSNumber.mult(gamma, CSNumber.real(1/3));
    
    var delta = List.det(B);

/*
    // Blinn
    var beta2 = CSNumber.mult(beta,beta);
    var beta3 = CSNumber.mult(beta2,beta);
    var gamma2 = CSNumber.mult(gamma,gamma);
    var gamma3 = CSNumber.mult(gamma2,gamma);

    var d1 = CSNumber.mult(alpha,gamma);
    d1 = CSNumber.sub(d1, beta2);

    var d2 = CSNumber.mult(alpha,delta);
    d2 = CSNumber.sub(d2, CSNumber.mult(beta,gamma));

    var d3 = CSNumber.mult(beta,delta);
    d3 = CSNumber.sub(d3, gamma2);

    var ldel = CSNumber.multiMult([CSNumber.real(4), d1, d3]);
    ldel = CSNumber.sub(ldel, CSNumber.mult(d2,d2));

    console.log("ldel", ldel.value.real);

    var lambda, mu;
    // large if else switch in paper
    if(ldel.value.real < 0){
        console.log("ldel value real < 0 true");
        var abar;
        var dbar;
        var bbar;
        var gbar;
    
        var ifone = CSNumber.sub(CSNumber.mult(beta3, delta), CSNumber.mult(alpha,gamma3));
        //console.log("ifone", ifone);
        if(ifone.value.real >= 0){
        console.log("ifone value real >= 0 true");
            abar = CSNumber.clone(alpha);
            gbar = CSNumber.clone(d1);
            dbar = CSNumber.add(CSNumber.multiMult([CSNumber.real(-2), beta,d1]), CSNumber.mult(alpha,d2));
        }
        else{
        console.log("ifone value real >= 0 false");
            abar = delta;
            gbar = d3;
            dbar = CSNumber.add(CSNumber.multiMult([CSNumber.real(-1), delta, d2]), CSNumber.multiMult([CSNumber.real(2), gamma, d3]));
        }
    
        var signum = function(a){
            if(a.value.real > 0) return CSNumber.real(1);
            else return CSNumber.real(-1);
        }
    
        var T0 = CSNumber.multiMult([CSNumber.real(-1), signum(dbar), CSNumber.abs(abar), CSNumber.sqrt(CSNumber.mult(CSNumber.real(-1), ldel))]);
        var T1 = CSNumber.add(CSNumber.mult(CSNumber.real(-1), dbar), T0);
    
        var pp = CSNumber.pow2(CSNumber.mult(T1, CSNumber.real(0.5)), 1/3);
    
        var qq;
        if(CSNumber.abs(T1, T0).value.real < 0.00000001){
            console.log("p = -q");
            qq = CSNumber.mult(CSNumber.real(-1), pp);
        }
        else {
            console.log("p !!!!= -q");
            qq = CSNumber.div(CSNumber.mult(CSNumber.real(-1),gbar), pp);
        }
    
        var x1;
        if(gbar.value.real <= 0){ 
            console.log("gbar.value.real <= 0 true");
            x1 = CSNumber.add(pp,qq);}
        else {
            console.log("gbar.value.real <= 0 false");
            x1 = CSNumber.mult(CSNumber.real(-1), dbar);
            var tmp = CSNumber.add(CSNumber.mult(pp,pp), CSNumber.mult(qq,qq));
            tmp = CSNumber.add(tmp,gbar);
            x1 = CSNumber.mult(x1, CSNumber.inv(tmp));
        }
    
        var res1;
        if(ifone.value.real >= 0) {
            console.log("ifone.value.real >= 0 true")
            res1 = [CSNumber.sub(x1, beta), alpha];
        }
        else {
            console.log("ifone.value.real >= 0 false")
            res1 = [CSNumber.mult(CSNumber.real(-1),delta), CSNumber.add(x1, gamma)];
        }
    
        //console.log("res1", res1);
        lambda = res1[0];
        mu = res1[1];
    }   //  if(ldel.value.real < 0)
    else{
console.log("ldel.value.real < 0 false");
        // left side of Blinn's paper
        //
        var DAbar = CSNumber.add(CSNumber.multiMult([CSNumber.real(-2), beta, d1]), CSNumber.mult(alpha,d2));
        var CAbar = CSNumber.clone(d1);

        var sigA = CSNumber.arctan2(CSNumber.mult(alpha, CSNumber.sqrt(ldel)), CSNumber.mult(CSNumber.real(-1), DAbar));
        sigA = CSNumber.mult(CSNumber.real(1/3), CSNumber.abs(sigA));

        var CAsqrt = CSNumber.multiMult([CSNumber.real(2), CSNumber.sqrt(CSNumber.mult(CSNumber.real(-1), CAbar))]);

        var x1A = CSNumber.mult(CAsqrt, CSNumber.cos(sigA));
        var x3A = CSNumber.clone(CAsqrt);
        var x3Ainner = CSNumber.mult(CSNumber.real(-0.5), CSNumber.cos(sigA));
        // cos - sin
        x3Ainner = CSNumber.add(x3Ainner, CSNumber.multiMult([CSNumber.real(-0.5), CSNumber.sqrt(CSNumber.real(3)), CSNumber.sin(sigA)]));
        x3A = CSNumber.mult(CAsqrt, x3Ainner);

//        console.log("x1A, x3A, x3Ainner", x1A, x3A,x3Ainner);
        var ifxa = CSNumber.sub(CSNumber.add(x1A, x3A), CSNumber.mult(CSNumber.real(2), beta));

        var xL;
        if(ifxa.value.real > 0){
            console.log( "ifxa.value.real > 0 true");
            xL = x1A;
        }
        else{
            console.log( "ifxa.value.real > 0 false");
            xL = x3A;
        }

        var resL = [CSNumber.sub(xL, beta), alpha];

        // right side of Blinn's paper
        //
        var DDbar = CSNumber.add(CSNumber.multiMult([CSNumber.real(-1), delta, d2]), CSNumber.multiMult([CSNumber.real(2),gamma,d3]));
        var CDbar = CSNumber.clone(d3);
        var sigD = CSNumber.arctan2(CSNumber.mult(delta, CSNumber.sqrt(ldel)), CSNumber.mult(CSNumber.real(-1), DDbar));
        sigD = CSNumber.mult(CSNumber.real(1/3), CSNumber.abs(sigD));

        var CDsqrt = CSNumber.multiMult([CSNumber.real(2), CSNumber.sqrt(CSNumber.mult(CSNumber.real(-1), CDbar))]);

        var x1D = CSNumber.mult(CDsqrt, CSNumber.cos(sigD));
        var x3D = CSNumber.clone(CDsqrt);
        // cos - sin
        var x3Dinner = CSNumber.mult(CSNumber.real(-0.5), CSNumber.cos(sigD));
        x3Dinner = CSNumber.add(x3Dinner, CSNumber.multiMult([CSNumber.real(-0.5), CSNumber.sqrt(CSNumber.real(3)), CSNumber.sin(sigA)]));
        x3D = CSNumber.mult(CAsqrt,x3Dinner);

        console.log("x1D, x3d, x3Dinner", x1D, x3D, x3Dinner);

        var ifxs = CSNumber.sub(CSNumber.add(x1D, x3D), CSNumber.mult(CSNumber.real(2), gamma));

        var xS;
        if(ifxa.value.real < 0){
            console.log("ifxa.value.real < 0 true");
            xS = x1D;
        }
        else{
            console.log("ifxa.value.real < 0 false");
            xS = x3D;
        }

        var resS = [CSNumber.mult(CSNumber.real(-1), delta), CSNumber.add(xS, gamma)];


//        console.log("resL, resS", resL, resS);
        // combine both -- lower end of Blinn's paper
        var EE = CSNumber.mult(resL[1], resS[1]);
        var FF = CSNumber.multiMult([CSNumber.real(-1), resL[0], resS[1]]);
        FF = CSNumber.sub(FF, CSNumber.mult(resL[1], resS[0]));
        var GG = CSNumber.mult(resL[0], resS[0]);

 //       console.log("ee, ff, gg", EE, FF, GG);
        var resg1 = CSNumber.sub(CSNumber.mult(gamma, FF), CSNumber.mult(beta, GG));
        var resg2 = CSNumber.sub(CSNumber.mult(gamma, EE), CSNumber.mult(beta, FF));
//        var regGes = [resg1, resg2];
        lambda = resg1;
        mu = resg2;

    } // end else

   

   console.log("checksol");

//   var lambda = res1[0];
//   var mu = res1[1];
*/
var check_sol = function(lam,muu){
   var tmp = CSNumber.multiMult([alpha,lam,lam,lam]);
   tmp = CSNumber.add(tmp, CSNumber.multiMult([beta,lam,lam,muu]));
   tmp = CSNumber.add(tmp, CSNumber.multiMult([gamma,lam,muu,muu]));
   tmp = CSNumber.add(tmp, CSNumber.multiMult([delta,muu,muu,muu]));
   console.log(tmp.value.real);
   console.log(tmp.value.imag);
   }

    
    var e1 = CSNumber.complex(-0.5, 0.5*Math.sqrt(3));
    var e1bar= CSNumber.complex(-0.5, -0.5*Math.sqrt(3));

    var solges = geoOps.solveCubic(alpha, beta, gamma, delta);
    var sol1 = CSNumber.complex(solges[0], solges[1]);
    var sol2 = CSNumber.complex(solges[2], solges[3]);
    var sol3 = CSNumber.complex(solges[4], solges[5]);
    
    var vsol = List.turnIntoCSList([sol1, sol2, sol3]);
    var ssol = CSNumber.add(CSNumber.add(sol1,sol2), sol3);
    
    var lambda = CSNumber.add(CSNumber.add(sol1, sol2), sol3);
    console.log("lambda1", lambda);


    var C = List.scalmult(lambda, A);
//    C = List.add(C, List.scalmult(lambda, B));
    C = List.add(C, B);


    var lines1 = geoOps._helper.splitDegenConic(C);
    var l11 = lines1[0];
    var l12 = lines1[1]

    var cub2 = List.turnIntoCSList([e1, CSNumber.real(1), e1bar]);

    var solcub2 = List.scalproduct(vsol, cub2);

    lambda = solcub2;
    console.log("lambda2", lambda);
    C = List.scalmult(lambda, A);
//    C = List.add(C, List.scalmult(lambda, B));
    C = List.add(C, B);
    
    var lines2 = geoOps._helper.splitDegenConic(C);
    var l21 = lines2[0];
    var l22 = lines2[1]

    var p1 = List.cross(l11, l12);
    var p2 = List.cross(l12, l21);
    var p3 = List.cross(l11, l21);
    var p4 = List.cross(l12, l22);

    p1.usage="Point";
    p2.usage="Point";
    p3.usage="Point";
    p4.usage="Point";

    console.log("p1 -4", p1, p2, p3, p4);
//    var mu = sol[1];
    
//   check_sol(lambda, mu);

//   C = List.add(C, B);
    
//   C = List.normalizeMax(C); // console.log(C);
   //console.log("lines",lines);
    
//   var checkdegen = function(mat){
//
//    var a = mat.value[0].value[0].value.real;
//    var b = mat.value[1].value[0].value.real;
//    var c = mat.value[1].value[1].value.real;
//    var d = mat.value[2].value[0].value.real;
//    var e = mat.value[2].value[1].value.real;
//    var f = mat.value[2].value[2].value.real;
//    
//    var myMat = [[a,b,d],
//    	         [b,c,e],
//    	         [d,e,f]];
//    
//    var det = a*c*f - a*e*e - b*b*f + 2*b*d*e - c*d*d;
//    var degen = Math.abs(det) < 0.00000001 ? true : false;
//    console.log("degen", degen);
//   };
//    
//   checkdegen(C);
    
//   var pts1 = geoOps._helper.IntersectLC(lines[0],A);
//   var pts2 = geoOps._helper.IntersectLC(lines[1],A);

   el.inited=true;
   el.results=List.turnIntoCSList([p1, p2, p3, p4]);
//   el.results=List.turnIntoCSList([lines[0], lines[1]]);


};
geoOpMap.IntersectConicConic="T";



/*
geoOps.IntersectConicConic = function(el){
    var A=csgeo.csnames[(el.args[0])].matrix;
    var B=csgeo.csnames[(el.args[1])].matrix;

    console.log("A,B", A,B);

    var alpha = List.det(A);
    console.log("alpha",alpha);

    // indexing
    var one = CSNumber.real(1);
    var two = CSNumber.real(2);
    var three = CSNumber.real(3);

    // beta
//    var b1 = List.turnIntoCSList([List.column(A,one), List.column(A,two), List.column(B,three)]);
    var b1 = List.det3(List.column(A,one), List.column(A,two), List.column(B,three));
//    console.log("b11", b1);
    //b1 = List.add(b1, List.turnIntoCSList([List.column(A,one), List.column(B,two), List.column(A,three)]));
    b1 = CSNumber.add(b1, List.det3(List.column(A,one), List.column(B,two), List.column(A,three)));
 //   console.log("b12", b1);
    b1 = CSNumber.add(b1, List.det3(List.column(B,one), List.column(A,two), List.column(A,three)));
  //  console.log("b13", b1);
    var beta = CSNumber.clone(b1);
    console.log("beta", beta);


    // gamma
    var g1 = List.det3(List.column(A,one), List.column(B,two), List.column(B,three));
    g1 = CSNumber.add(g1, List.det3(List.column(B,one), List.column(A,two), List.column(B,three)));
    g1 = CSNumber.add(g1, List.det3(List.column(B,one), List.column(B,two), List.column(A,three)));
    var gamma = CSNumber.clone(g1);
    console.log("gamma", gamma);

    var delta = List.det(B);
    console.log("delta", delta);


    console.log("one",one);
    console.log(CSNumber.multiMult([one,two,three]));
    // calc L/M
    // powers
    var alpha2 = CSNumber.mult(alpha,alpha);
    var alpha3 = CSNumber.mult(alpha2, alpha);

    var beta2 = CSNumber.mult(beta,beta);
    var beta3 = CSNumber.mult(beta2, beta);

    var gamma2 = CSNumber.mult(gamma,gamma);
    var gamma3 = CSNumber.mult(gamma2, gamma);

    var delta2 = CSNumber.mult(delta,delta);
    var delta3 = CSNumber.mult(delta2, delta);

    // W = -2*beta^3 + 9*alpha*beta*gamma - 27*alpha^2*delta
    //
    // -2*beta^2 
    var W = CSNumber.mult(CSNumber.real(-2), beta3);
    // + 9*alpha*beta*gamma
//    W = CSNumber.add(W, CSNumber.mult(CSNumber.mult(CSNumber.mult(alpha,beta),gamma),CSNumber.real(9)));
    W = CSNumber.add(W, CSNumber.multiMult([CSNumber.real(9), alpha, beta, gamma]));
    // - 27*alpha^2*delta
    W = CSNumber.sub(W, CSNumber.mult(CSNumber.mult(CSNumber.real(27), alpha2), delta));


    // D
    // 
    //  - beta^2*gamma^2 + 4*alpha*gamma^3 + 4*beta^3*delta - 18*alpha*beta*gamma*delta + 27*alpha^2*delta^3
    //
    // - beta^2*gamma^2 
    var D = CSNumber.mult(CSNumber.real(-1), CSNumber.mult(beta2,gamma2));
    // + 4*alpha*gamma^3
    D = CSNumber.add(D, CSNumber.mult(CSNumber.mult(CSNumber.real(4), alpha), gamma3));
    // - 18*alpha*beta*gamma*delta 
    D = CSNumber.sub(D, CSNumber.multiMult([CSNumber.real(18), alpha, beta, gamma, delta]));
    // + 27*alpha^2*delta^3
    D = CSNumber.add(D, CSNumber.multiMult([CSNumber.real(27), alpha2, delta3]));
    console.log("D",D);

    // Q = W - alpha*sqrt(27*D)
    var Q = CSNumber.sub(W, CSNumber.mult(alpha, CSNumber.sqrt(CSNumber.mult(CSNumber.real(27),D))));
    console.log("Q",Q);

    // R = 3rd root of 4Q
    var R = CSNumber.pow2(CSNumber.mult(CSNumber.real(4), Q),1/3);
    console.log("R",R);


    // L
    var l1 = CSNumber.mult(CSNumber.real(2),beta2);
    l1 = CSNumber.sub(l1, CSNumber.multiMult([CSNumber.real(6), alpha, gamma]));
    var l2 = CSNumber.mult(CSNumber.real(-1),beta);
    var l3 = CSNumber.clone(R);

    var L = List.turnIntoCSList([l1, l2, l3]);

    // M
    var M = List.turnIntoCSList([R,CSNumber.real(1),CSNumber.real(2)]);
    M = List.scalmult(CSNumber.mult(CSNumber.real(3),alpha), M);
    console.log("M", M);

    var omega = CSNumber.complex(-0.5, Math.sqrt(0.75));
    var omega2 = CSNumber.mult(omega,omega);

    var Mat = List.turnIntoCSList([
        List.turnIntoCSList([omega, one, omega2]),
        List.turnIntoCSList([one, one, one]),
        List.turnIntoCSList([omega2, one, omega])]);


        console.log("Mat", Mat);
    // inverse of Mat
    // t1 = omega + omega^2 - 2
//    var t1 = CSNumber.sub(CSNumber.add(omega, omega2), CSNumber.real(-2));
 //   var omegat1 = CSNumber.mult(t1, omega);
//    var minusOne = CSNumber.real(-1);
//    var omegaPlusOne = CSNumber.add(omega, CSNumber.real(1));
   // var invMat = List.inverse(Mat);
//    console.log(invMat);
    //var lambda  = List.linearsolve(Mat, L);
//    var lambda = General.mult(invMat,L);
//    var mu      = General.mult(invMat, M);
      var lambda  = General.mult(Mat, L);
      var mu = General.mult(Mat,M);

    console.log("lambda", lambda);
    console.log("mu", mu); 

   for(var i = 0; i < 3; i++){
       console.log("lambda real", lambda.value[i].value.real)
       console.log("lambda imag", lambda.value[i].value.imag)
       console.log("mu real", mu.value[i].value.real)
       console.log("mu imag", mu.value[i].value.imag)
   }

    var C = List.scalmult(lambda.value[1], A);
    C = List.add(C, List.scalmult(mu.value[1], B));

//    console.log(C);
//    el.matrix=C;
//    el.matrix=List.normalizeMax(el.matrix);
//    el.matrix.usage="Conic";

//    erg.usage = "Conic";
 //   erg.matrix = C;
    var lines = geoOps._helper.splitDegenConic(C);
    console.log("lines",lines);


    var pts1 = geoOps._helper.IntersectLC(lines[0],A);
    var pts2 = geoOps._helper.IntersectLC(lines[1],A);
//
    console.log("pts");
    console.log(pts1);
    console.log(pts2);
//
//
   var check_sol = function(lam,muu){
       var tmp = CSNumber.multiMult([alpha,lam,lam,lam]);
       tmp = CSNumber.add(tmp, CSNumber.multiMult([beta,lam,lam,muu]));
       tmp = CSNumber.add(tmp, CSNumber.multiMult([gamma,lam,muu,muu]));
       tmp = CSNumber.add(tmp, CSNumber.multiMult([delta,muu,muu,muu]));
    console.log(tmp.value.real);
    console.log(tmp.value.imag);

   };

   console.log("check sol");
   for(var i = 0; i < 3; i++){
   check_sol(lambda.value[i],mu.value[i]);
   }

   el.inited=true;
 //  el.results=List.turnIntoCSList([pts1[0],pts1[1],pts2[0],pts2[1]]);
    el.results=List.turnIntoCSList([lines[0], lines[1]]);






//    var ct1 =c2.value[0].value[0];
//    var line1=List.scalmult(ct1,c1.value[2]);
//    var ct2 =c1.value[0].value[0];
//    var line2=List.scalmult(ct2,c2.value[2]);
//    var ll=List.sub(line1,line2);
//    ll.value[2]=CSNumber.mult(CSNumber.real(0.5),ll.value[2]);
//    ll=List.normalizeMax(ll);
//
//    
//    
//    var erg=geoOps._helper.IntersectLC(ll,c1);
//    var erg1=erg[0];
//    var erg2=erg[1];
//                           
//    if(!el.inited){
//        el.check1=erg1;
//        el.check2=erg2;
//        el.inited=true;
//        el.results=List.turnIntoCSList([erg1,erg2]);
//        
//    } else {
//        var action=geoOps._helper.tracing2(erg1,erg2,el.check1,el.check2,el);
//        el.check1=el.results.value[0];
//        el.check2=el.results.value[1];
//    }

};
geoOpMap.IntersectConicConic="T";
*/

geoOps.SelectP =function(el){
    var set=csgeo.csnames[(el.args[0])];
    if(!el.inited){
        el.inited=true;
    }
    el.homog=set.results.value[el.index-1];
};
geoOpMap.SelectP="P";

geoOps.SelectL =function(el){
    var set=csgeo.csnames[(el.args[0])];
    if(!el.inited){
        el.inited=true;
    }
    el.homog=set.results.value[el.index-1];
    el.homog.usage="Line";  
};
geoOpMap.SelectL="L";


// Define a projective transformation given four points and their images
geoOps.TrProjection = function(el){
    function oneStep(offset){
        var tmp,
            a = csgeo.csnames[el.args[0+offset]].homog,
            b = csgeo.csnames[el.args[2+offset]].homog,
            c = csgeo.csnames[el.args[4+offset]].homog,
            d = csgeo.csnames[el.args[6+offset]].homog;
        // Note: this duplicates functionality from evaluator._helper.basismap
        tmp = List.adjoint3(List.turnIntoCSList([a,b,c]));
        tmp = List.productVM(d,tmp).value;
        tmp = List.transpose(List.turnIntoCSList([
            List.scalmult(tmp[0], a),
            List.scalmult(tmp[1], b),
            List.scalmult(tmp[2], c)]));
        return tmp;
    }
    var m = List.productMM(oneStep(1), List.adjoint3(oneStep(0)));
    m = List.normalizeMax(m);
    el.matrix = m;
};
geoOpMap.TrProjection="Tr";

// Apply a projective transformation to a point
geoOps.TransformP = function(el){
    var m=csgeo.csnames[(el.args[0])].matrix;
    var p=csgeo.csnames[(el.args[1])].homog;
    el.homog=List.normalizeMax(List.productMV(m, p));
    el.homog.usage="Point";      
};
geoOpMap.TransformP="P";    
