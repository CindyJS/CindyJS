//*******************************************************
// and here are the definitions of the sound operators
//*******************************************************
var sound = {};
var lines = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var getAudioContext = function() {
  var ac = null;
  if ( !window.AudioContext && !window.webkitAudioContext ) {
    console.warn('Web Audio API not supported in this browser');
  } else {
    ac = new ( window.AudioContext || window.webkitAudioContext )();
  }
  return function() {
    return ac;
  };
}();

var audioCtx = getAudioContext();

evaluator.stopsound$0 = function(){ // not clean
    audioCtx.close();
};

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
                harmonics = erg.value;
            }
        }
        if (modifs.line !== undefined) {
            erg = evaluate(modifs.line);
            if (erg.ctype === 'number') {
                line = erg.value.real;
            }
        }
    }

    var freq = evaluate(args[0]).value.real;
    var amp = 0.5;
    var damp = 0;
    var duration = 1;
    var harmonics = List.asList(CSNumber.real(1)).value;
    var line = 0;

    handleModifs();

    function playOscillator(line, freq, gain) {
      const oscNode = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      gainNode.connect(lines[line].masterGain);
      oscNode.type = 'sine';
      oscNode.frequency.setValueAtTime(freq, audioCtx.currentTime);
      oscNode.start(0);
      oscNode.connect(gainNode);
      gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
      if(duration >= 0){
        gainNode.gain.setValueAtTime(0,audioCtx.currentTime + duration);
        oscNode.onended = function (){
          lines[line] = 0;
        };
      }
      return {oscNode: oscNode, gainNode: gainNode};
    }

    if(lines[line] === 0){ //initialize
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(amp, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
      lines[line] = {oscNodes: [], masterGain: masterGain};
      for(var i=0; i < harmonics.length; i++){
        lines[line].oscNodes.push(playOscillator(line, (i+1)*freq, harmonics[i].value.real));
      }
      if(damp > 0){ //not properly mathematically but does the job
        masterGain.gain.setTargetAtTime(0, audioCtx.currentTime,(1/damp));
      }
      else if(damp < 0){
        masterGain.gain.setTargetAtTime(1, audioCtx.currentTime,(-damp));
      }
    }
    else{ //update
      if(damp === 0){
        if(duration === 0){
          for(var i=0; i<lines[line].oscNodes.length; i++){
            lines[line].oscNodes[i].oscNode.stop(); //helps
          }
        }
        for(var i=0; i<harmonics.length; i++){
          lines[line].oscNodes[i].oscNode.frequency.setValueAtTime((i+1)*freq, audioCtx.currentTime);
          lines[line].oscNodes[i].gainNode.gain.setValueAtTime(harmonics[i].value.real, audioCtx.currentTime);
        }
      }
      else{
        for(var i=0; i<lines[line].oscNodes.length; i++){
          lines[line].oscNodes[i].oscNode.stop(); //helps
        }
        for(var i=0; i<harmonics.length; i++){
          if(i<lines[line].oscNodes.length){
            lines[line].oscNodes[i] = playOscillator(line, (i+1)*freq, harmonics[i].value.real);
          }
        else {
          lines[line].oscNodes.push(playOscillator(line, (i+1)*freq, harmonics[i].value.real));
        }
        }
        lines[line].masterGain.gain.setValueAtTime(amp, audioCtx.currentTime);
        if(damp > 0){
          lines[line].masterGain.gain.setTargetAtTime(0, audioCtx.currentTime,(1/damp));
        }
        else if(damp < 0){
          lines[line].masterGain.gain.setTargetAtTime(1, audioCtx.currentTime,(-damp));
        }
      }
    }
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
                silent = erg.value;
            }
        }
        if (modifs.export !== undefined) {
            erg = evaluate(modifs.export);
            if (erg.ctype === 'boolean') {
                exprt = erg.value;
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

    var amp = 0.5;
    var damp = 0;
    var start = 0;
    var duration = 0.3;
    var silent;
    var line; //TODO
    var exprt;

    handleModifs();

    var wave = []

    for (var i = 0; i < context.sampleRate * duration; i++) {
        if(runv !== nada){
          namespace.setvar(runv, CSNumber.real(i/context.sampleRate));
        }
        var erg = evaluate(v0);
        wave[i] = erg.value.real * amp * Math.exp(-damp * i/context.sampleRate);
    }
    if(!silent){
      playSound(wave);
    }

    if(runv !== nada){
      namespace.removevar(runv);
    }

    if(exprt === true){
      return wave;
    }
    return nada;


};


evaluator.playwave$1 = function(args, modifs) {

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

    var context = new AudioContext();

    var v0 = args[0];

    var amp = 0.5;
    var damp = 0;
    var duration = 0.3;

    handleModifs();
    var wave = evaluate(args[0]);
    //change to CindyList?

      playSound(wave);


    return nada;


};

evaluator.playosc$1 = function(args, modifs) {
  if(lines[0] === 0){
    var oscNode = audioCtx.createOscillator();
    lines[0] = oscNode;
    oscNode.type = 'sine';
    var gainNode = audioCtx.createGain();
    oscNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 0.2;
    oscNode.detune.value = 0;
    oscNode.start(0);
    oscNode.stop(10);

  }
  else {
    var HEIGHT = window.innerHeight;
    var maxFreq = 6000;
    var y = evaluate(args[0]).value.real;
    var CurY = y;
    lines[0].frequency.value = (CurY/HEIGHT*5) * maxFreq;

  }
};
