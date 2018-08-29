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

    function sineWaveAt(sampleNumber, tone) {
        var sampleFreq = context.sampleRate / tone
        return Math.sin(sampleNumber / (sampleFreq / (Math.PI*2)))
    }

    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    var context = new AudioContext();

    var v0 = evaluateAndVal(args[0]);
    var freq = v0.value.real;
    var amp = 1;
    var damp = 1;
    var duration = 1;


    handleModifs();


    var arr = [];

    for (var i = 0; i < context.sampleRate * duration; i++) {
        arr[i] = sineWaveAt(i, freq) * amp;
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

    /*function searchVar(tree,name) {
      while(true){
        for(var i = 0; i < 2; i++) {
          if tree.args[0].name == name){
            return
          }
        }
      }
    }*/

    var v0 = args[0];
    //var runv = args[0].args[0].args[0].args[0].args[1].name;
    var runv = "x";
    namespace.newvar(runv);

    var amp = 1;
    var length = 1;
    var freq = 330;
    handleModifs();

    var arr = [], amp = 0.2, seconds = 1



    for (var i = 0; i < context.sampleRate * seconds; i++) {
        namespace.setvar(runv, CSNumber.real(i/context.sampleRate));
        var erg = evaluate(v0);
        arr[i] = erg.value.real * amp;

    }

    playSound(arr)
    namespace.removevar(runv);
    return nada;

};
