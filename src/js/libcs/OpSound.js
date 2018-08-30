//*******************************************************
// and here are the definitions of the sound operators
//*******************************************************

evaluator.playsin$1 = function(args, modifs) {

    function handleModifs() {
        var erg;
        if (modifs.amp !== undefined) {
            erg = evaluate(modifs.amp);
            if (erg.ctype === 'number') {
                amp = erg.value.real;
            }
        }
        if (modifs.damp !== undefined) {
            erg = evaluate(modifs.damp);
            if (erg.ctype === 'number') {
                damp = erg.value.real;
            }
        }
        if (modifs.duration !== undefined) {
            erg = evaluate(modifs.duration);
            if (erg.ctype === 'number') {
                duration = erg.value.real;
            }
        }
        if (modifs.stop !== undefined) {
            erg = evaluate(modifs.stop);
            if (erg.ctype === 'number') {
                duration = erg.value.real;
            }
        }
        if (modifs.harmonics !== undefined) {
            erg = evaluate(modifs.harmonics);
            if (erg.ctype === 'list') {
                harmonics = erg.value.real;
            }
        }
    }

    function playSound(arr) {
            var buf = new Float32Array(arr.length)
            for (var i = 0; i < arr.length; i++) buf[i] = arr[i]
            var buffer = context.createBuffer(1, buf.length, context.sampleRate)
            buffer.copyToChannel(buf, 0)
            var source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.start(0);
        }


    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    var context = new AudioContext();

    var v0 = evaluateAndVal(args[0]);
    var freq = v0.value.real;
    var amp = 1;
    var damp = 1; //TODO
    var duration = 1;
    var harmonics; //TODO
    var line; //TODO


    handleModifs();


    var arr = [];

    for (var i = 0; i < context.sampleRate * duration; i++) {
        arr[i] = Math.sin(i / (context.sampleRate / freq / (Math.PI*2))) * amp;
    }

    playSound(arr)

    return nada;

};

evaluator.playfunction$1 = function(args, modifs) {

    function handleModifs() {
        var erg;
        if (modifs.amp !== undefined) {
            erg = evaluate(modifs.amp);
            if (erg.ctype === 'number') {
                amp = erg.value.real;
            }
        }
        if (modifs.damp !== undefined) {
            erg = evaluate(modifs.damp);
            if (erg.ctype === 'number') {
                damp = erg.value.real;
            }
        }
        if (modifs.start !== undefined) {
            erg = evaluate(modifs.start);
            if (erg.ctype === 'number') {
                start = erg.value.real;
            }
        }
        if (modifs.duration !== undefined) {
            erg = evaluate(modifs.duration);
            if (erg.ctype === 'number') {
                duration = erg.value.real;
            }
        }
        if (modifs.stop !== undefined) {
            erg = evaluate(modifs.stop);
            if (erg.ctype === 'number') {
                duration = erg.value.real;
            }
        }
        if (modifs.silent !== undefined) {
            erg = evaluate(modifs.silent);
            if (erg.ctype === 'boolean') {
                silent = erg.value.real;
            }
        }
        if (modifs.export !== undefined) {
            erg = evaluate(modifs.export);
            if (erg.ctype === 'boolean') {
                //export = erg.value.real; EXPORT doesnt work as variable
            }
        }
    }

    function playSound(arr) {
            var buf = new Float32Array(arr.length)
            for (var i = 0; i < arr.length; i++) buf[i] = arr[i]
            var buffer = context.createBuffer(1, buf.length, context.sampleRate)
            buffer.copyToChannel(buf, 0)
            var source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.start(start);
        }



    var context = new AudioContext();

    function searchVar(tree) {
      var stack = [];
      var run = 5;
      while(tree.args !== undefined && tree.args.length > 0){
        tree = tree.args[0];
        if(tree.ctype === "variable" && evaluate(tree) === nada){
          stack.push(tree.name);
        }
        if(tree.args !== undefined){
          if(tree.args.length > 0){
            if(tree.args[0].ctype === "variable" && evaluate(tree.args[0]) === nada){
              stack.push(tree.args[0].name);
            }
          }
          if(tree.args.length > 1){
            if(tree.args[1].ctype === "variable" && evaluate(tree.args[1]) === nada){
              stack.push(tree.args[1].name);
            }
          }
        }
      }
      if(stack.includes("x")) return "x";
      if(stack.includes("y")) return "y";
      if(stack.includes("t")) return "t";
      return nada;
    }

    var v0 = args[0];
    var runv = searchVar(v0);
    if(runv !== nada){
      namespace.newvar(runv);
    }

    var amp = 0.2;
    var damp = 1; //TODO
    var start = 0; //TODO
    var duration = 1;
    var silent; //TODO
    var line; //TODO
    var exprt; //TODO

    handleModifs();

    var arr = []



    for (var i = 0; i < context.sampleRate * duration; i++) {
        if(runv !== nada){
          namespace.setvar(runv, CSNumber.real(i/context.sampleRate));
        }
        var erg = evaluate(v0);
        arr[i] = erg.value.real * amp;

    }

    playSound(arr)
    if(runv !== nada){
      namespace.removevar(runv);
    }
    return nada;

};
