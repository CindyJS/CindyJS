/*jshint esversion: 6 */

generateColorwheel = function () {
    return CindyJS({
        scripts: {
            init: `rgb2hsl(rgb) := (
    maxv = max(rgb);
    minv = min(rgb);
    l = (maxv + minv) / 2;
    if(maxv==minv,
      h = 0;// achromatic
      s = 0;
      ,
      d = maxv-minv;
      s = if(l>.5, d/(2-maxv-minv), d/(maxv+minv));
      if(maxv==rgb_1, h = (rgb_2 - rgb_3) / d + if(rgb_3 < rgb_2, 6, 0));
      if(maxv==rgb_2, h = (rgb_3 - rgb_1) / d + 2);
      if(maxv==rgb_3, h = (rgb_1 - rgb_2) / d + 4);
       
      h = h/6;
    );
    [h,s,l]
  );

  barycentric(p) := (
    M = inverse(transpose([B.homog, K.homog, L.homog]));
    M*[p_1,p_2,1]
  );

  invbarycentric(lambda) := (
    M = transpose([B.homog, K.homog, L.homog]);
    M*lambda
  );

  readcolor(lambda) := (
    beta = arctan2(B-A);
    basecolor = if(active, hue(beta/(2*pi)), [.5,.5,.5]);
    lambda_1*basecolor+lambda_2*[1,1,1]
  );
  
  activate(color) := (
    active = true;
    hsl = rgb2hsl(color);
    B.xy = (cos(hsl_1*2*pi),sin(hsl_1*2*pi));
    scol = hue(hsl_1);
    mi = min(color);
    ma = max(color);
    b = [ma-mi, mi, 1-ma];
    U.homog = invbarycentric(b);
    change = false;
  );
  deactivate() := (
    active = false;
  );
  
  active = false;
  change = false;

  fullalpha(c) := (c_1,c_2,c_3,1);`,

            draw: `
  colorplot(
    lambda = barycentric(#);
    if(min(lambda)>=0,
       fullalpha(readcolor(lambda)),
       if(.9 < |#| & |#|<1.1,
          phi = arctan2(#);
          fullalpha(if(active, hue(phi/(2*pi)), [.5,.5,.5]) ),
          [0,0,0,0]
         )
      )
  );

  U.color = readcolor(barycentric(U.xy));
  `,

            mouseclick: `
  p = mouse();
  if(.9 < |p| & |p|<1.1,
    B.xy = p;
    U.homog = invbarycentric(prevbarycentric);
    ,
    b = barycentric(p);
    if(max(b)<=1 & min(b)>=0,
      U.homog = invbarycentric(b);
    )
  );
  `,

            move: `
  if(mover()==B,
    U.homog = invbarycentric(prevbarycentric);
    change = true;
  );

  if(mover()==U,
     b = barycentric(U.xy);
     b = apply(b, max(0, min(1, #)));
     U.homog = invbarycentric(b);
     change = true;
    );

  prevbarycentric = barycentric(U.xy);
  if(active & change, javascript("Inspector.updatecolor('" + readcolor(barycentric(U.xy)) + "')"));
  `,
        },
        defaultAppearance: {
            dimDependent: 0.7,
            fontFamily: "sans-serif",
            lineSize: 1,
            pointSize: 5,
            textsize: 12,
        },
        angleUnit: "°",
        exclusive: false,
        geometry: [
            {
                name: "A",
                pinned: true,
                type: "Free",
                visible: false,
                pos: [0, 0, 1],
            },
            {
                alpha: 1,
                args: ["A"],
                clip: "none",
                color: [0, 0, 1],
                labeled: true,
                name: "C0",
                pinned: true,
                radius: 1,
                type: "CircleMr",
                visible: false,
                pos: {
                    xx: 1,
                    yy: 1,
                    zz: -1,
                    xy: 0,
                    xz: 0,
                    yz: 0,
                },
            },
            {
                alpha: 0.8,
                args: ["C0"],
                color: [1, 1, 1],
                labeled: false,
                name: "B",
                pinned: false,
                size: 8,
                type: "PointOnCircle",
                visible: true,
                pos: [0.9213086331205577, 0.38883210070354246, 1],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "C",
                pinned: false,
                size: 5,
                type: "Free",
                visible: false,
                pos: [-0.9484732824427479, 0.8897276260746392, 1],
            },
            {
                name: "D",
                pinned: false,
                type: "Free",
                visible: false,
                pos: [0.8146924027371624, 0.9281276260746393, 1],
            },
            {
                name: "E",
                type: "Free",
                visible: false,
                pos: [-0.948473282442748, -0.9675572519083969, 1],
            },
            {
                name: "F",
                type: "Free",
                visible: false,
                pos: [1, -0.5561272667786816, 0.6997448157198827],
            },
            {
                alpha: 1,
                args: ["B", "A"],
                name: "C1",
                pinned: false,
                type: "CircleMP",
                visible: false,
            },
            {
                args: ["C0", "C1"],
                labeled: true,
                name: "Ps0",
                pinned: false,
                type: "IntersectCirCir",
            },
            {
                args: ["Ps0"],
                name: "G",
                pinned: false,
                type: "SelectP",
                visible: false,
                pos: [0.7973927935764156, -0.603460630656549, 1],
            },
            {
                alpha: 1,
                args: ["G", "B"],
                clip: "none",
                color: [0, 0, 1],
                labeled: true,
                name: "C2",
                overhang: 1,
                pinned: false,
                size: 1,
                type: "CircleMP",
                visible: false,
            },
            {
                alpha: 0,
                args: ["Ps0"],
                color: [1, 0, 0],
                labeled: false,
                name: "H",
                pinned: false,
                size: 4.61,
                type: "SelectP",
                visible: false,
                pos: [0.12391583954414188, 0.9922927313600913, 1],
            },
            {
                alpha: 1,
                args: ["H", "B"],
                clip: "none",
                color: [0, 0, 1],
                labeled: true,
                name: "C3",
                overhang: 1,
                pinned: false,
                size: 1,
                type: "CircleMP",
                visible: false,
            },
            {
                args: ["C0", "C3"],
                labeled: true,
                name: "Ps1",
                pinned: false,
                type: "IntersectCirCir",
            },
            {
                alpha: 0,
                args: ["Ps1"],
                color: [1, 0, 0],
                labeled: false,
                name: "K",
                pinned: false,
                size: 4.61,
                type: "SelectP",
                visible: false,
                pos: [-0.7973927935764156, 0.6034606306565486, 1],
            },
            {
                args: ["C0", "C2"],
                labeled: true,
                name: "Ps2",
                pinned: false,
                type: "IntersectCirCir",
            },
            {
                alpha: 0,
                args: ["Ps2"],
                color: [1, 0, 0],
                labeled: false,
                name: "L",
                pinned: false,
                size: 4.61,
                type: "SelectP",
                visible: false,
                pos: [-0.12391583954414201, -0.9922927313600913, 1],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "M",
                pinned: false,
                size: 5,
                type: "Free",
                visible: false,
                pos: [1, -0.9528153834823596, -0.6903820816864296],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "N",
                pinned: false,
                size: 5,
                type: "Free",
                visible: false,
                pos: [1, 0.985036835099836, 0.7137288005033846],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "O",
                pinned: false,
                size: 5,
                type: "Free",
                visible: false,
                pos: [0.9869960988296488, 1, -0.6814044213263979],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "P",
                pinned: false,
                size: 5,
                type: "Free",
                visible: false,
                pos: [-0.9547105579119286, 1, -0.6814044213263979],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "Q",
                pinned: false,
                size: 5,
                type: "Free",
                pos: [1, -0.9649234829217541, -0.5132223310479922],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "R",
                pinned: false,
                size: 5,
                type: "Free",
                pos: [1, 0.9746177131831282, 0.5183784864743203],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "S",
                pinned: false,
                size: 5,
                type: "Free",
                pos: [0.9903006789524735, 1, -0.5082444228903977],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "T",
                pinned: false,
                size: 5,
                type: "Free",
                pos: [-0.9804504549313998, 1, -0.5082444228903977],
            },
            {
                alpha: 1,
                color: [0.8015385103893122, 0.39087848746973164, 0.13772308377993725],
                labeled: false,
                name: "U",
                pinned: false,
                size: 5,
                type: "Free",
                pos: [0.47716696671629083, 0.14429131220616537, 1],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "V",
                size: 5,
                type: "Free",
                pos: [1, -0.9720864193788861, -0.4084177708495713],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "W",
                size: 5,
                type: "Free",
                pos: [1, 0.9798423573317554, 0.4116763935670684],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "X",
                size: 5,
                type: "Free",
                pos: [0.9922660479505029, 1, -0.40525908739365823],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "Y",
                size: 5,
                type: "Free",
                pos: [-0.984411770328131, 1, -0.40525908739365823],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "Z",
                size: 5,
                type: "Free",
                pos: [1, -0.976819984506868, -0.33915857605177996],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "P0",
                size: 5,
                type: "Free",
                pos: [1, 0.9832832939593279, 0.34140268127612683],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "P1",
                size: 5,
                type: "Free",
                pos: [0.9935691318327976, 1, -0.33697749196141485],
            },
            {
                alpha: 0,
                color: [1, 1, 1],
                labeled: false,
                name: "P2",
                size: 5,
                type: "Free",
                pos: [-0.9870382115976035, 1, -0.33697749196141485],
            },
        ],
        ports: [
            {
                id: "colorwheelCanvas",
                transform: [
                    {
                        visibleRect: [-1.2, -1.2, 1.2, 1.2],
                    },
                ],
                width: "250",
                height: "250",
            },
        ],
        use: ["CindyGL"],
        autoplay: false,
        behavior: [],
    });
};
