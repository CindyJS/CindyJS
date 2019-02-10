//*******************************************************
// and here are the definitions of the sound operators
//*******************************************************
var lines = [];
var linesDict = {};
var linesCounter = 0;

var getAudioContext = function() {
    var ac = null;
    if (!window.AudioContext && !window.webkitAudioContext) {
        console.warn('Web Audio API not supported in this browser');
    } else {
        ac = new(window.AudioContext || window.webkitAudioContext)();
    }
    return function() {
        return ac;
    };
}();

var audioCtx = null;


evaluator.stopsound$0 = function() {
    audioCtx.close();
    audioCtx = null;
};

evaluator.playsin$1 = function(args, modifs) {
    if (!audioCtx) {
        audioCtx = getAudioContext();
    }

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
                var val = erg.value.real;
            } else if (erg.ctype === 'string') {
                var val = erg.value;
            } else {
                var val = 0;
            }
            if (!linesDict.hasOwnProperty(val)) {
                line = Object.keys(linesDict).length;
                linesDict[val] = line;
                lines.push(0);
            } else {
                line = linesDict[val];
            }
        }
        if (modifs.partials !== undefined) {
            erg = evaluate(modifs.partials);
            if (erg.ctype === 'list') {
                partials = erg.value;
            }
        }
        if (modifs.restart !== undefined) {
            erg = evaluate(modifs.restart);
            if (erg.ctype === 'boolean') {
                restart = erg.value;
            }
        }
        if (modifs.attack !== undefined) {
            erg = evaluate(modifs.attack);
            if (erg.ctype === 'number') {
                attack = erg.value.real;
            }
        }
        if (modifs.release !== undefined) {
            erg = evaluate(modifs.release);
            if (erg.ctype === 'number') {
                release = erg.value.real;
            }
        }
    }

    var freq = evaluate(args[0]).value.real;
    var amp = 0.5;
    var damp = 0;
    var duration = 1;
    var harmonics = [CSNumber.real(1)];
    var line = 0;
    var partials = Array(harmonics.length).fill(CSNumber.real(1));
    var attack = 0.01;
    var release = 0.01;
    var restart = true;

    handleModifs();
    if (harmonics.length > partials.length) {
        partials = Array(harmonics.length).fill(CSNumber.real(1));
        console.log("Ignoring modifier partials, because the length of partials does not match the length of harmonics");
    }

    function playOscillator(line, freq, gain) {
        var oscNode = audioCtx.createOscillator();
        oscNode.type = 'sine';
        oscNode.frequency.value = freq;
        var gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(lines[line].masterGain);
        oscNode.connect(gainNode);
        gainNode.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + attack);
        oscNode.start(0);
        oscNode.onended = function() {
            gainNode.disconnect();
        }
        if (duration >= 0) {
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime + duration + attack);
        }
        return {
            oscNode: oscNode,
            gainNode: gainNode
        };
    }

    if (lines[line] === 0) { //initialize
        lines[line] = {
            oscNodes: [],
            masterGain: 0
        };
        lines[line].masterGain = audioCtx.createGain();
        lines[line].masterGain.gain.value = 0;
        for (var i = 0; i < harmonics.length; i++) {
            lines[line].oscNodes.push(playOscillator(line, partials[i].value.real * (i + 1) * freq, harmonics[i].value.real));
        }
        lines[line].masterGain.connect(audioCtx.destination);
        lines[line].masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + attack);
        if (damp > 0) { //not properly mathematically but does the job
            lines[line].masterGain.gain.setTargetAtTime(0.0, audioCtx.currentTime + attack, (1 / damp));
            for (var i = 0; i < harmonics.length; i++) {
                lines[line].oscNodes[i].oscNode.stop(audioCtx.currentTime + (6 / damp));
            }
        } else if (damp < 0) {
            lines[line].masterGain.gain.setTargetAtTime(1, audioCtx.currentTime + attack, (-damp));
        }
    } else { //update
        if (damp === 0) {
            if (duration === 0) { //users can call playsin(...,duration->0) to stop a tone
                lines[line].masterGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + release);
                for (var i = 0; i < lines[line].oscNodes.length; i++) {
                    lines[line].oscNodes[i].oscNode.stop(audioCtx.currentTime + release); //helps
                }
                lines[line] = 0;
            } else {
                for (var i = 0; i < harmonics.length; i++) {
                    lines[line].oscNodes[i].oscNode.frequency.setValueAtTime(partials[i]*(i + 1) * freq, audioCtx.currentTime);
                    lines[line].oscNodes[i].gainNode.gain.setValueAtTime(harmonics[i].value.real, audioCtx.currentTime);
                }
            }
        } else { //damp != 0
            if (restart) {
                lines[line].masterGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + release);
                for (var i = 0; i < lines[line].oscNodes.length; i++) {
                    lines[line].oscNodes[i].oscNode.stop(audioCtx.currentTime + release); //helps & gain gets auto disconnected!
                }
                for (var i = 0; i < harmonics.length; i++) {
                    if (i < lines[line].oscNodes.length) {
                        lines[line].oscNodes[i] = playOscillator(line, partials[i].value.real * (i + 1) * freq, harmonics[i].value.real);
                    } else {
                        lines[line].oscNodes.push(playOscillator(line, partials[i].value.real * (i + 1) * freq, harmonics[i].value.real));
                    }
                }
                lines[line].masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + release + attack);

                if (damp > 0) {
                    lines[line].masterGain.gain.setTargetAtTime(0.0, audioCtx.currentTime + release + attack, (1 / damp));
                } else if (damp < 0) {
                    lines[line].masterGain.gain.setTargetAtTime(1, audioCtx.currentTime + release + attack, (-damp));
                }
            } else { //restart -> false so just change damp & timbre
                for (var i = 0; i < harmonics.length; i++) {
                    lines[line].oscNodes[i].oscNode.frequency.value = partials[i].value.real * (i + 1) * freq;
                    lines[line].oscNodes[i].gainNode.gain.value = harmonics[i].value.real;
                }
                if (damp > 0) {
                    lines[line].masterGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, (1 / damp));
                } else if (damp < 0) {
                    lines[line].masterGain.gain.setTargetAtTime(1, audioCtx.currentTime, (-damp));
                }
            }
        }
    }
    return nada;
};


evaluator.playsin$0 = function(args, modifs) {
    var erg;
    if (modifs.line !== undefined) {
        erg = evaluate(modifs.line);
        if (erg.ctype === 'number') {
            var val = erg.value.real;
        } else if (erg.ctype === 'string') {
            var val = erg.value;
        } else {
            var val = 0;
        }
        if (val === 0) {
            var line = 0;
        } else if (!linesDict[val]) {
            return nada;
        } else {
            var line = linesDict[val];
        }
        evaluator.playsin$1([CSNumber.real(lines[line].oscNodes[0].oscNode.frequency.value)], modifs);

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
        while (tree.args !== undefined && tree.args.length > 0) {
            tree = tree.args[0];
            if (tree.ctype === "variable" && evaluate(tree) === nada) {
                stack.push(tree.name);
            }
            if (tree.args !== undefined) {
                if (tree.args.length > 0) {
                    if (tree.args[0].ctype === "variable" && evaluate(tree.args[0]) === nada) {
                        stack.push(tree.args[0].name);
                    }
                }
                if (tree.args.length > 1) {
                    if (tree.args[1].ctype === "variable" && evaluate(tree.args[1]) === nada) {
                        stack.push(tree.args[1].name);
                    }
                }
            }
        }
        if (stack.includes("x")) return "x";
        if (stack.includes("y")) return "y";
        if (stack.includes("t")) return "t";
        return nada;
    }

    var v0 = args[0];
    var runv = searchVar(v0);
    if (runv !== nada) {
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
        if (runv !== nada) {
            namespace.setvar(runv, CSNumber.real(i / context.sampleRate));
        }
        var erg = evaluate(v0);
        wave[i] = erg.value.real * amp * Math.exp(-damp * i / context.sampleRate);
    }
    if (!silent) {
        playSound(wave);
    }

    if (runv !== nada) {
        namespace.removevar(runv);
    }

    if (exprt === true) {
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
    if (lines[0] === 0) {
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

    } else {
        var HEIGHT = window.innerHeight;
        var maxFreq = 6000;
        var y = evaluate(args[0]).value.real;
        var CurY = y;
        lines[0].frequency.value = (CurY / HEIGHT * 5) * maxFreq;

    }
};
