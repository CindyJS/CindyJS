//*******************************************************
// and here are the definitions of the sound operators
//*******************************************************

var sound = {};
sound.lines = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

evaluator.playsin$1 = function(args, modifs) {

    function handleModifs() {
        var erg;
        if (modifs.line !== undefined) {

            erg = evaluate(modifs.line);
            if (erg.ctype === 'number') {
                linenumber = Math.floor(erg.value.real);
                if (linenumber < 0) {
                    linenumber = 0;
                }
                if (linenumber > 10) {
                    linenumber = 10;
                }
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
    var linenumber = 0;
    
    handleModifs();
    var lines = sound.lines;
    var f = v0.value.real;
    

    var arr = [], volume = 0.2, seconds = 0.5, tone = f

    for (var i = 0; i < context.sampleRate * seconds; i++) {
        arr[i] = sineWaveAt(i, tone) * volume
    }

    playSound(arr)

    //if (v0.ctype === 'number') {

        /*
        if (lines[linenumber] === 0) {
            // Was bitte sollte die Funktion T an dieser Stelle sein?
            // lines[linenumber]=T("sin", {freq:f,mul:0.6}).play();


        } else {
            lines[linenumber].set({
                freq: f
            });
        }
        */

    //}
    return nada;

};
