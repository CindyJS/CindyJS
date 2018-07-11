/*jshint esversion: 6 */
var geometrycodes = {
  "init": `
        //======CODE FOR BUTTONS==========
 
        setmode(m):=(
           mode=m;
           print(mode);
           dopinning();
        );
        ////////
    
    dopinning() := (
      if(mode=="move",
        //unpin everything in tmppinned
        
        apply(tmppinned, #.pinned=false);
        tmppinned = [];
        ,
        
        //else: pin everything and save pinned results into tmppinned
        newpinned = select(allelements(), #.pinned==false);
        tmppinned = tmppinned ++ newpinned;
        apply(newpinned, #.pinned=true);
      
      );
    );

    mode = "move";
    
    ptcnt=0;
    lncnt=0;
    cncnt=0;

    inaction=false;
    selpts=[];
    sellns=[];
    selcns=[];
    tmppts=[];
    tmplns=[];
    tmpcns=[];
    
    tmppinned = [];

    iscircle(c):=contains(circs,c);
    issegment(s):=contains(segments,s);

    ishotp(pos,p):=|pos,p|<.5;

    ishotli(pos,l):=(
       regional(p);
       p=meet(l.homog,perp(line(l.homog),pos));
       |p.xy,pos|<.4;
    );

    ishotseg(pos,l):=(
       regional(p,a,b,test1,test2);
       p=meet(l.homog,perp(line(l.homog),pos));
       test1=(|p.xy,pos|<.4);
       (a,b)=inputs(l);
       test2=or((a.x-p.x)*(p.x-b.x)>0,(a.y-p.y)*(p.y-b.y)>0);
       test1&test2;
    );

    ishotl(pos,l):=(
       if(algorithm(l)=="Segment",
          ishotseg(pos,l)
         ,
          ishotli(pos,l)

       );
    );
    
    ishotc(p,c):=(
       regional(mat,p1,p2,p3,p4,s1,s2,s3,s4);
       mat=c.matrix;
       p1=(p+(.4,0)).homog;
       p2=(p-(.4,0)).homog;
       p3=(p+(0,.4)).homog;
       p4=(p-(0,.4)).homog;
       s1=if(p1*mat*p1>0,1,-1);
       s2=if(p2*mat*p2>0,1,-1);
       s3=if(p3*mat*p3>0,1,-1);
       s4=if(p4*mat*p4>0,1,-1);

       set([s1,s2,s3,s4])==[-1,1];
    );
 
    
    elementsAtPos(pos):=(
      regional(spts,slns,scns);
      nearpts=select(pts,ishotp(pos,#));
      nearlns=select(lns,ishotl(pos,#));
      nearcns=select(cns,ishotc(pos,#));

      spts=nearpts;
      slns=[];
      scns=[];

      slns=if(spts==[],nearlns,[]);
      scns=if(spts==[],nearcns,[]);
      (spts,slns,scns);

    );

    resetsels():=(
      selpts=[];
      sellns=[];
      selcns=[];
    );

    //======GENERIC TRAP FOR  MOUSE EVENTS==========

    dodown():=( 
           pos=mouse().xy;
           inaction=true;
           parse(mode+"Down(pos)");
    );

    dodrag():=(
     if(inaction,
        pos=mouse().xy;
        parse(mode+"Drag(pos)");
       );
    );

    doup():=(
      if(inaction,
        pos=mouse().xy;
        parse(mode+"Up(pos)");

     );
     dopinning();
     javascript("Inspector.update('" + (selpts++sellns++selcns) + "')");
    );

adjoint(m):=(
    (
      det(((m_2_2,m_2_3),(m_3_2,m_3_3))),
     -det(((m_2_1,m_2_3),(m_3_1,m_3_3))),
      det(((m_2_1,m_2_2),(m_3_1,m_3_2)))
    ),
    (
     -det(((m_1_2,m_1_3),(m_3_2,m_3_3))),
      det(((m_1_1,m_1_3),(m_3_1,m_3_3))),
     -det(((m_1_1,m_1_2),(m_3_1,m_3_2)))
    ),
    (
      det(((m_1_2,m_1_3),(m_2_2,m_2_3))),
     -det(((m_1_1,m_1_3),(m_2_1,m_2_3))),
      det(((m_1_1,m_1_2),(m_2_1,m_2_2)))
    )
);
crossop(l):=((0,l_3,-l_2),
             (-l_3,0,l_1),
             (l_2,-l_1,0));

intersectcc(c1,c2):=(
    cc=c1++c2;
    d3=det(cc_[1,2,3]);
    d2=det(cc_[1,2,6])+det(cc_[1,5,3])+det(cc_[4,2,3]);
    d1=det(cc_[4,5,3])+det(cc_[4,2,6])+det(cc_[1,5,6]);
    d0=det(cc_[4,5,6]);
    //TODO Degenerierte Fälle abfangen
    sols=roots([d0,d1,d2,d3]);
    sol1=sols_1;
    sol2=sols_2;
    deg1=c1*sol1+c2;
    deg2=c1*sol2+c2;

    ad1=adjoint(deg1);
    ad2=adjoint(deg2);
    p1=ad1_1/sqrt(-ad1_1_1);
    p2=ad2_1/sqrt(-ad2_1_1);

    mm1=crossop(p1);
    mm2=crossop(p2);
    sp1=mm1+deg1;
    sp2=mm2+deg2;

    l1=sp1_1;
    l2=transpose(sp1)_1;
    l3=sp2_1;
    l4=transpose(sp2)_1;

    [meet(l1,l3),meet(l2,l3),meet(l1,l4),meet(l2,l4)];
);


intersectcircir(c1,c2):=(
   ln=c2_1_1*c1_3-c1_1_1*c2_3;
   ln=(ln_1,ln_2,.5*ln_3);
   intersectcl(c1,ln);
);



intersectcl(c,l):=(

    l1 = crossop(l);
    l2=transpose(l1);
    s=l2*c*l1;
    maxidx=sort(1..3,-|l_#|)_1;
    idx=(1..3)--[maxidx];
    a11 = s_(idx_1)_(idx_1);
    a12 = s_(idx_1)_(idx_2);
    a21 = s_(idx_2)_(idx_1);
    a22 = s_(idx_2)_(idx_2);
    b = l_maxidx;
    alp=sqrt(-det(((a11,a12),(a21,a22))))/b;
    erg=s+alp*l1;
    //TODO select col row
    erg1=point(erg_1);
    erg2=point(transpose(erg)_1);
    [erg1.xy, erg2.xy];
);

closest(list,pt):=(
   sort(list,|#.xy,pt.xy|)_1;
);

projecttocircle(c,pt):=(

   mid=(inverse(c)*(0,0,1)).xy;
   cc=c/c_1_1;//TODO: Das ist jetzt grad recht euklidisch gerechnet
   r=sqrt((cc_1_3)^2+(cc_2_3)^2-cc_3_3);
   vec=(pt.xy-mid);
   mid+r*(vec/|vec|);
);

circlepp(mid,pt):=(
  mm=mid.xy;
  pp=pt.homog;
  mat1=((1,0,-mm.x),(0,1,-mm.y),(-mm.x,-mm.y,mm.x^2+mm.y^2));
  mat2=((0,0,0),(0,0,0),(0,0,1));
  mat1*(pp*mat2*pp)-mat2*(pp*mat1*pp) 
);

circlepr(mid,r):=(
   circlepp(mid,mid.xy+(0,r)); 
);

//======THE MODI ==========

toggleset(a,b):=(a--b)++(b--a);


//=======  MOVE  ==============
    moveDown(pos):=(
        movedown=true;
        perhapsclick=true;
        movedownpos=mouse().xy;   
    );

    moveUp(pos):=(
       if(|movedownpos,mouse().xy|>.1,perhapsclick=false);
       if(perhapsclick,
            (spts,slns,scns)=elementsAtPos(pos);
            if((spts,slns,scns)==([],[],[]),
              (selpts,sellns,selcns)=([],[],[]);
            ,
              selpts=toggleset(selpts,spts);
              sellns=toggleset(sellns,slns);
              selcns=toggleset(selcns,scns);
            );

       );
    );

    moveDrag(pos):=(
      if(|movedownpos,mouse().xy|>.1,perhapsclick=false);

    );
//==============================


createSinglePoint(pos):=(
      regional(pt,prepare);

         (selpts,sellns,selcns)=elementsAtPos(pos);

         pt=pos;
         prepare="Free";
         params=[];
         if(length(selpts)==1,
            pt=(selpts_1).xy;
            prepare="Old";
            params=[selpts_1]
         );
         if(length(sellns)==1 & length(selcns)==0 ,
           pt=meet((sellns_1).homog,perp((sellns_1).homog,pos)).xy;
           prepare="PointOnLine";
           if(algorithm(sellns_1)=="Segment",prepare="PointOnSegment";);
           params=[sellns_1];
         );
         if(length(sellns)==0 & length(selcns)==1 ,
           if(iscircle(selcns_1),
             pt=projecttocircle((selcns_1).matrix,pos);
             prepare="PointOnCircle";
             params=[selcns_1];
           )
         );
         if(length(sellns)>=2 & length(selcns)==0 ,
            pt=meet((sellns_1).homog,(sellns_2).homog);
            prepare="Meet";
            params=[sellns_1,sellns_2];

         );
         if(length(sellns)>=1 & length(selcns)==1 ,
           pt=closest(intersectcl((selcns_1).matrix,(sellns_1).homog),pos);
           prepare="IntersectLC";
           params=[sellns_1,selcns_1];

         );
         if(length(sellns)==1 & length(selcns)>=1 ,
           pt=closest(intersectcl((selcns_1).matrix,(sellns_1).homog),pos);
           prepare="IntersectLC";
           params=[sellns_1,selcns_1];

         );
         if(length(sellns)==0 & length(selcns)>=2 ,
           pt=closest(intersectcc((selcns_1).matrix,(selcns_2).matrix),pos);
           prepare="IntersectionConicConic";
           if(iscircle(selcns_1) &iscircle(selcns_2),
              pt=closest(intersectcircir((selcns_1).matrix,(selcns_2).matrix),pos);
              print("PT:"+pt);
              prepare="IntersectionCircleCircle";
           );
           params=[selcns_1,selcns_2];
         );
         [pt,prepare,params]; 

);



finalizetmps():=(
   regional(P,type,el);
   newpts=[]; 
   selpts=[];
   sellns=[];
   selcns=[];
   apply(tmppts,tmp,
      if(tmp_4=="final",
         type="plain";
          if(tmp_2=="Old",type="Old");
          if(tmp_2=="Mid",type="Mid");

          if(type=="plain",
            P = create(tmp_2,tmp_3, pos->tmp_1);
            selpts=[P];
            newpts=newpts++[P];
         );

    
          if(type=="Mid",
            el=create(tmp_2,newpts);
            selpts=[el];
         );

    
         if(type=="Old",
            selpts=[tmp_3_1];
            (tmp_3_1).alpha=1;
            newpts=newpts++[tmp_3_1];
         );

      );

   );

   apply(tmplns,tmp,
   print(tmp);
         if(tmp_2=="Join";,
            el=create(tmp_2,newpts);
            sellns=[el];
            selpts=[];
         );
         
         if(tmp_2=="Segment";,
            el=create(tmp_2,newpts);
            sellns=[el];
            selpts=[];
         );
        if(tmp_2=="Para";,
            el=create(tmp_2,[anchorline]++newpts);
            sellns=[el];
            selpts=[];
         );

         if(tmp_2=="Perp";,
            el=create(tmp_2,[anchorline]++newpts);
            sellns=[el];
            selpts=[];
         );
   );

   apply(tmpcns,tmp,
         if(tmp_2=="CircleMP";,
            el=create(tmp_2,newpts);
            selcns=[el];
            selpts=[];

         );
         if(tmp_2=="CircleMr";,
            el=create(tmp_2,newpts, radius->radius);
            selcns=[el];
            selpts=[];

         );
   );


);
//=========ADD POINT============
    singlepointDown(pos):=(
         (pt,prepare,params)=createSinglePoint(pos);
         tmppts=[[pt,prepare,params,"final"]];
    );


    singlepointDrag(pos):=(
        
         (pt,prepare,params)=createSinglePoint(pos);
         tmppts=[[pt,prepare,params,"final"]];

    );


    singlepointUp(pos):=(
       resetsels();
       finalizetmps();
       tmppts=[];
    );

//==============================


//============ADD LINE==================
    singlelineDown(pos):=(
         (pt,prepare,params)=createSinglePoint(pos);
         first=[pt,prepare,params,"final"];
         tmppts=[first];
    );

    singlelineUp(pos):=(
       resetsels();
       finalizetmps();
       tmppts=[];
       tmplns=[];
       selpts=[];

    );

    singlelineDrag(pos):=(
        (pt,prepare,params)=createSinglePoint(pos);
         second=[pt,prepare,params,"final"];
         line=meet(first_1,second_1);
         tmppts=[first,second];
         tmplns=[[line,"Join",[first,second],"final"]];

    );
//==============================

//============ADD SEGMENT==================
    singlesegmentDown(pos):=(
         (pt,prepare,params)=createSinglePoint(pos);
         first=[pt,prepare,params,"final"];
         tmppts=[first];
    );

    singlesegmentUp(pos):=(
       resetsels();
       finalizetmps();
       tmppts=[];
       tmplns=[];
       selpts=[];
    );

    singlesegmentDrag(pos):=(
        (pt,prepare,params)=createSinglePoint(pos);
         second=[pt,prepare,params,"final"];
         line=meet(first_1,second_1);
         tmppts=[first,second];
         tmplns=[[line,"Segment",[first,second],"final"]];

    );
//==============================

//============ADD PARALLEL==================
    parallelDown(pos):=(
         (selpts,sellns,selcns)=elementsAtPos(pos);
         parallelactiv=false;
         if(length(sellns)==1,
            anchorline=sellns_1;
            parallelactiv=true;

         );

         (pt,prepare,params)=createSinglePoint(pos);
         first=[pt,prepare,params,"final"];
         tmppts=[first];
    );

    parallelUp(pos):=(
       if(parallelactiv,
        resetsels();
        finalizetmps();
        tmppts=[];
        tmplns=[];
        );
    );

    parallelDrag(pos):=(
        if(parallelactiv,
 
          (pt,prepare,params)=createSinglePoint(pos);
          first=[pt,prepare,params,"final"];
          line=join(first_1,meet(anchorline.homog,(0,0,1)));
          tmppts=[first];
          tmplns=[[line,"Para",[anchorline,first],"final"]];
        );
    );
//==============================


//============ADD PERP==================
    perpDown(pos):=(
         (selpts,sellns,selcns)=elementsAtPos(pos);
         parallelactiv=false;
         if(length(sellns)==1,
            anchorline=sellns_1;
            parallelactiv=true;

         );

         (pt,prepare,params)=createSinglePoint(pos);
         first=[pt,prepare,params,"final"];
         tmppts=[first];
    );

    perpUp(pos):=(
       if(parallelactiv,
        resetsels();
        finalizetmps();
        tmppts=[];
        tmplns=[];
        );
    );

    perpDrag(pos):=(
        if(parallelactiv,
 
          (pt,prepare,params)=createSinglePoint(pos);
          first=[pt,prepare,params,"final"];
          line=perp(first_1,anchorline.homog);
          tmppts=[first];
          tmplns=[[line,"Perp",[anchorline,first],"final"]];
        );
    );
//==============================




//============ADD MID==================
    middleDown(pos):=(
         (pt,prepare,params)=createSinglePoint(pos);
         first=[pt,prepare,params,"final"];
         tmppts=[first];
    );

    middleUp(pos):=(
       resetsels();
       finalizetmps();
       tmppts=[];
    );

    middleDrag(pos):=(
        (pt,prepare,params)=createSinglePoint(pos);
         second=[pt,prepare,params,"final"];
         mid=((first_1).xy+(second_1).xy)/2;
         tmppts=[first,second,[mid,"Mid",[first,second],"final"]];

    );
//==============================



//============ADD CIRCLEPP==================
    circleppDown(pos):=(
         (pt,prepare,params)=createSinglePoint(pos);
         first=[pt,prepare,params,"final"];
         tmppts=[first];
    );

    circleppUp(pos):=(
       resetsels();
       finalizetmps();
       tmppts=[];
       tmpcns=[];
    );

    circleppDrag(pos):=(
        (pt,prepare,params)=createSinglePoint(pos);
         second=[pt,prepare,params,"final"];
         circ=circlepp(first_1,second_1);
         tmppts=[first,second];
         tmpcns=[[circ,"CircleMP",[first,second],"final"]];

    );
//==============================


//============ADD CIRCLEMR==================
    circleprDown(pos):=(
         (pt,prepare,params)=createSinglePoint(pos);
         first=[pt,prepare,params,"final"];
         tmppts=[first];
    );

    circleprUp(pos):=(
       resetsels();
       finalizetmps();
       tmppts=[];
       tmpcns=[];
    );

    circleprDrag(pos):=(
         (pt,prepare,params)=createSinglePoint(pos);
         second=[pt,prepare,params,"final"];
        if(prepare!="Old",
           circ=circlepr(first_1,|pos.xy,(first_1).xy|);
           radius=|pos.xy,(first_1).xy|;
           tmppts=[first];
           tmpcns=[[circ,"CircleMr",[first,radius],"final"]];
        ,
           circ=circlepp(first_1,second_1);
           tmppts=[first,second];
           tmpcns=[[circ,"CircleMP",[first,second],"final"]];

        );


    );
//==============================
`,
  "draw": `
/*
data = apply(allelements(),([[#.name],algorithm(#),inputs(#),#.alpha]));
c=0;
forall(data, drawtext((-14,17-c*.5),#_(1..3),size->10,alpha->if(#_4==0,.3,1));c=c+1;);
*/
    pts=allpoints();
    lns=alllines();
    cns=allconics();
    circs=allcircles();
    segments=allsegments();
    apply(selpts,draw(#,size->#.size+4,color->(1,1,1),border->false));
    apply(sellns,
      if(algorithm(#)=="Segment",
        draw(inputs(#),size->#.size+4,color->(1,1,1))

      ,
        draw(#.homog,size->#.size+4,color->(1,1,1))
      )  
    );
    apply(selcns,drawconic(#.matrix,size->#.size+4,color->(1,1,1)));
    apply(tmppts,
      draw(#_1,size->5,color->(1,0,0));
      drawtext(#_1+(.2,.2),apply(#_1,q,format(q,2)),size->13,color->(1,1,1)*.4);
    );
    apply(tmplns,
      if(#_2=="Segment",
         draw(#_3_1_1,#_3_2_1);
      ,
         draw(line(#_1),size->1,color->(0,0,1));
      )
    );
    apply(tmpcns,
      drawconic(#_1,size->1,color->(0,0,1));
    );
`,
  "mousedown": `
pos=mouse().xy;
dodown();
`,
  "mousedrag": `
dodrag();
`,

  "mouseup": `
doup();
`
};

makepluginfromcscode(geometrycodes, "geometryeditor");
