var nada;
var myfunctions;


createCindy.registerPlugin(1, "CindyGL", function(api) {

  //////////////////////////////////////////////////////////////////////
  // API bindings

  nada = api.nada;
  myfunctions = api.getMyfunctions();
  
  api.defineFunction("compile",1,function(args, modifs) {
    let expr = args[0];
    let code = generateColorPlotProgram(expr);
    console.log(code);
    return {
      ctype: 'string',
      value: code
    };
    //console.log(myfunctions);
  });
  
  api.defineFunction("colorplot", 4, function(args, modifs) {
    console.log("run function colorplot");
    initGLIfRequired();
    
    var a = api.evaluateAndVal(args[0]);
    var b = api.evaluateAndVal(args[1]);
    var name = api.evaluate(args[2]);
    var prog = args[3];

/*
    var pta = api.eval_helper.extractPoint(a);
    var ptb = api.eval_helper.extractPoint(b);
    if (!pta.ok || !ptb.ok || name.ctype !== 'string') {
        return nada;
    }
    */
    var localcanvas = document.getElementById(name.value);
    if (typeof(localcanvas) === "undefined" || localcanvas === null) {
        return nada;
    }


    var cw = localcanvas.width;
    var ch = localcanvas.height;
    
    console.log(name);
    console.log(a);
    
    

/*
    var diffx = ptb.x - pta.x;
    var diffy = ptb.y - pta.y;

    var ptcx = pta.x - diffy * ch / cw;
    var ptcy = pta.y + diffx * ch / cw;
    var ptdx = ptb.x - diffy * ch / cw;
    var ptdy = ptb.y + diffx * ch / cw;

    var cva = csport.from(pta.x, pta.y, 1);
    var cvc = csport.from(ptcx, ptcy, 1);
    var cvd = csport.from(ptdx, ptdy, 1);


    var x11 = cva[0];
    var x12 = cva[1];
    var x21 = cvc[0];
    var x22 = cvc[1];
    var x31 = cvd[0];
    var x32 = cvd[1];
    var y11 = 0;
    var y12 = ch;
    var y21 = 0;
    var y22 = 0;
    var y31 = cw;
    var y32 = 0;

    var a1 = (cw * (x12 - x22)) / ((x11 - x21) * (x12 - x32) - (x11 - x31) * (x12 - x22));
    var a2 = (cw * (x11 - x21)) / ((x12 - x22) * (x11 - x31) - (x12 - x32) * (x11 - x21));
    var a3 = -a1 * x11 - a2 * x12;
    var a4 = (ch * (x12 - x32) - ch * (x12 - x22)) / ((x11 - x21) * (x12 - x32) - (x11 - x31) * (x12 - x22));
    var a5 = (ch * (x11 - x31) - ch * (x11 - x21)) / ((x12 - x22) * (x11 - x31) - (x12 - x32) * (x11 - x21));
    var a6 = ch - a4 * x11 - a5 * x12;
*/

    var localcontext = localcanvas.getContext('2d');
    localcontext.drawImage(0, 0, glcanvas);
    

/*
    var backupctx = csctx;
    csctx = localcontext;
    csctx.save();

    csctx.transform(a1, a4, a2, a5, a3, a6);

    evaluate(prog);
    csctx.restore();
    csctx = backupctx;
    */
    return nada;
  });
  
});



