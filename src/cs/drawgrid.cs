drawgrid(s, axes):=(
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
      if (xmin+x*s ~!= 0 % !axes,
        draw([xmin+x*s,ymin], [xmin+x*s,ymax],
             color->(0,0,0), alpha->0.1, size->1));
   );
   repeat(ny,y,
      if (ymin+y*s ~!= 0 % !axes,
        draw([xmin,ymin+y*s],[xmax,ymin+y*s],
             color->(0,0,0), alpha->0.1, size->1));
   );
);

drawaxes():=(
    regional(b);
    b=screenbounds();
    draw([b_4_1, 0], [b_2_1, 0],
         arrowsides->"==>", color->(0,0,0), alpha->0.2, size->3,
         lineCap->"butt", lineJoin->"miter");
    draw([0, b_4_2], [0, b_2_2],
         arrowsides->"==>", color->(0,0,0), alpha->0.2, size->3,
         lineCap->"butt", lineJoin->"miter");
);
