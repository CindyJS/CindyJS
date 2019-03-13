//*******************************************************
// and here are the definitions of the sound operators
//*******************************************************

var lines = {};

var audioCtx = null;

var getAudioContext = function() {
    var ac = null;
    if (!window.AudioContext && !window.webkitAudioContext) {
        console.warn('Web Audio API not supported in this browser');
    } else {
        ac = new window.AudioContext() || new window.webkitAudioContext();
    }
    return ac;
};

function handleModifs(modif, modifType, defaultValue) {
    if (modif !== undefined) {
        var erg = evaluate(modif);
        if (erg.ctype === modifType) {
            if (erg.ctype === 'number') {
                return erg.value.real;
            } else if (erg.ctype === 'list') {
                var cslist = erg.value;
                var jslist = [];
                for (var i = 0; i < cslist.length; i++) {
                    jslist[i] = cslist[i].value.real;
                }
                return jslist;
            } else {
                return erg.value;
            }
        }
    } else {
        return defaultValue;
    }
}

function handleLineModif(modif, defaultValue) {
    if (modif !== undefined) {
        var erg = evaluate(modif);
        return niceprint(erg);
    }
    return defaultValue;
}


evaluator.stopsound$0 = function() {
    audioCtx.close();
    audioCtx = null;
};

evaluator.playsin$1 = function(args, modifs) {
    if (!audioCtx) {
        audioCtx = getAudioContext();
    }


    var freq = evaluate(args[0]).value.real;
    var line = handleLineModif(modifs.line, "0");
    var amp = handleModifs(modifs.amp, 'number', 0.5);
    var damp = handleModifs(modifs.damp, 'number', 0);
    var duration = handleModifs(modifs.duration, 'number', 1);
    var harmonics = handleModifs(modifs.harmonics, 'list', [1]);
    var partials = handleModifs(modifs.partials, 'list', [1]);
    var attack = handleModifs(modifs.attack, 'number', 0.01);
    var release = handleModifs(modifs.release, 'number', 0.01);
    var restart = handleModifs(modifs.restart, 'boolean', true);


    if (harmonics.length > partials.length) {
        partials = Array(harmonics.length).fill(1);
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

    if (!lines[line] || lines[line].lineType !== 'sin') { //initialize
        lines[line] = {
            lineType: 'sin',
            oscNodes: [],
            masterGain: 0
        };
        lines[line].masterGain = audioCtx.createGain();
        lines[line].masterGain.gain.value = 0;
        for (var i = 0; i < harmonics.length; i++) {
            lines[line].oscNodes.push(playOscillator(line, partials[i] * (i + 1) * freq, harmonics[i]));
        }
        lines[line].masterGain.connect(audioCtx.destination);
        lines[line].masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + attack);
        if (damp > 0) {
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
                    lines[line].oscNodes[i].oscNode.frequency.setValueAtTime(partials[i] * (i + 1) * freq, audioCtx.currentTime);
                    lines[line].oscNodes[i].gainNode.gain.setValueAtTime(harmonics[i], audioCtx.currentTime);
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
                        lines[line].oscNodes[i] = playOscillator(line, partials[i] * (i + 1) * freq, harmonics[i]);
                    } else {
                        lines[line].oscNodes.push(playOscillator(line, partials[i] * (i + 1) * freq, harmonics[i]));
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
                    lines[line].oscNodes[i].oscNode.frequency.value = partials[i] * (i + 1) * freq;
                    lines[line].oscNodes[i].gainNode.gain.value = harmonics[i];
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
        var line = handleLineModif(modifs.line, "0");
        evaluator.playsin$1([CSNumber.real(lines[line].oscNodes[0].oscNode.frequency.value)], modifs);
    }
    return nada;
};


evaluator.playfunction$1 = function(args, modifs) {
    if (!audioCtx) {
        audioCtx = getAudioContext();
    }

    function getBufferNode(arr) {
        var buf = new Float32Array(arr.length)
        for (var i = 0; i < arr.length; i++) {
            buf[i] = arr[i];
        }
        var buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate);
        buffer.copyToChannel(buf, 0);
        var bufferNode = audioCtx.createBufferSource();
        bufferNode.buffer = buffer;
        return bufferNode;
    }

    function searchVar(tree) {
        var stack = [];
        stack.push(tree);
        while (stack.length != 0) { //DFS with handwritten stack.
            var v = stack.pop();
            if (v.ctype === "variable" && evaluate(v) === nada) {
                if (["x", "y", "t"].indexOf(v.name) != -1)
                    return v.name;
            }
            if (v.args) {
                for (var i in v.args) {
                    stack.push(v.args[i]);
                }
            }
        }
        return nada;
    }

    var v0 = args[0];

    var runv = searchVar(v0);
    if (runv !== nada) {
        namespace.newvar(runv);
    }

    var freq = evaluate(args[0]).value.real;
    var line = handleLineModif(modifs.line, "0");
    var start = handleModifs(modifs.start, 'number', 0);
    var amp = handleModifs(modifs.amp, 'number', 0.5);
    var damp = handleModifs(modifs.damp, 'number', 0);
    var duration = handleModifs(modifs.duration, 'number', 1);
    var attack = handleModifs(modifs.attack, 'number', 0.01);
    var release = handleModifs(modifs.release, 'number', 0.01);
    var exprt = handleModifs(modifs.export, 'boolean', false);
    var silent;

    var wave = []

    for (var i = 0; i < audioCtx.sampleRate * duration; i++) {
        if (runv !== nada) {
            namespace.setvar(runv, CSNumber.real(i / audioCtx.sampleRate));
        }
        var erg = evaluate(v0);
        wave[i] = erg.value.real * amp * Math.exp(-damp * i / audioCtx.sampleRate);
    }

    if (!silent) {
        if (!lines[line] || lines[line].lineType !== 'function') { //initialize
            lines[line] = {
                lineType: 'function',
                bufferNode: getBufferNode(wave),
                masterGain: audioCtx.createGain()
            };
            lines[line].masterGain.gain.value = 0;
            lines[line].masterGain.connect(audioCtx.destination);
            lines[line].bufferNode.connect(lines[line].masterGain);
            lines[line].bufferNode.start(start);
            lines[line].masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + attack);
        } else {
            lines[line].masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + release);
            lines[line].bufferNode.stop(audioCtx.currentTime + release);
            lines[line].bufferNode = getBufferNode(wave);
            lines[line].bufferNode.connect(lines[line].masterGain);
            lines[line].bufferNode.start(start + release);
            lines[line].masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + release + attack);
        }
    }

    if (runv !== nada) {
        namespace.removevar(runv);
    }
    if (exprt) {
        return wave;
    }
    return nada;
};


evaluator.playwave$1 = function(args, modifs) {
    if (!audioCtx) {
        audioCtx = getAudioContext();
    }

    function getBufferNode(arr) {
        var buf = new Float32Array(arr.length)
        for (var i = 0; i < arr.length; i++) {
            if (cdylist) {
                buf[i] = arr[i].value.real;
            } else {
                buf[i] = arr[i];
            }
        }
        var buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate);
        buffer.copyToChannel(buf, 0);
        var bufferNode = audioCtx.createBufferSource();
        bufferNode.buffer = buffer;
        return bufferNode;
    }

    var wave = evaluate(args[0]);
    var line = handleLineModif(modifs.line, "0");
    var amp = handleModifs(modifs.amp, 'number', 0.5);
    var damp = handleModifs(modifs.damp, 'number', 0);
    var duration = handleModifs(modifs.duration, 'number', 1);
    var attack = handleModifs(modifs.attack, 'number', 0.01);
    var release = handleModifs(modifs.release, 'number', 0.01);
    var cdylist = false;

    if (wave.ctype === 'list') {
        wave = wave.value;
        cdylist = true;
    }

    //change output of playfunction to CindyList?

    if (!lines[line] || lines[line].lineType !== 'wave') { //initialize
        lines[line] = {
            lineType: 'wave',
            bufferNode: getBufferNode(wave),
            masterGain: audioCtx.createGain()
        };
        lines[line].masterGain.gain.value = 0;
        lines[line].masterGain.connect(audioCtx.destination);
        lines[line].bufferNode.connect(lines[line].masterGain);
        lines[line].bufferNode.start(0);
        lines[line].masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + attack);
    } else {
        lines[line].masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + release);
        lines[line].bufferNode.stop(audioCtx.currentTime + release);
        lines[line].bufferNode = getBufferNode(wave);
        lines[line].bufferNode.connect(lines[line].masterGain);
        lines[line].bufferNode.start(start + release);
        lines[line].masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + release + attack);
    }

    return nada;
};
