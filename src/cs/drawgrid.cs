drawgrid(s):=(
   regional(b,xmin,xmax,ymin,ymax,nx,ny);
   b=screenbounds();
   xmin=b_4_1-s;
   xmax=b_2_1+s;
   ymin=b_4_2-s;
   ymax=b_2_2+s;
   nx=round((xmax-xmin)/s);
   ny=round((ymax-ymin)/s);
   xmin=floor(xmin/s)*s;
   ymin=floor(ymin/s)*s;
   repeat(nx,x,
      draw((xmin+x*s,ymin),(xmin+x*s,ymax),color->(1,1,1)*.9,size->1);
   );
   repeat(ny,y,
      draw((xmin,ymin+y*s),(xmax,ymin+y*s),color->(1,1,1)*.9,size->1);
   ) 
);

drawaxes():=(
    regional(b);
    b=screenbounds();
    draw([b_4_1, 0], [b_2_1, 0],
         arrowsides->"==>", color->(1,1,1)*0.8, size->3,
         lineCap->"butt", lineJoin->"miter");
    draw([0, b_4_2], [0, b_2_2],
         arrowsides->"==>", color->(1,1,1)*0.8, size->3,
         lineCap->"butt", lineJoin->"miter");
);
