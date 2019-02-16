//*******************************************************
// and here are the definitions of the sound operators
//*******************************************************
var lines = [0];
var linesDict = {0: 0};

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

    if (lines[line] === 0 || lines[line].lineType !== 'sin') { //initialize
        lines[line] = {
            lineType: 'sin',
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
                    lines[line].oscNodes[i].oscNode.frequency.setValueAtTime(partials[i].value.real*(i + 1) * freq, audioCtx.currentTime);
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
      while(stack.length!=0) { //DFS with handwritten stack.
        var v = stack.pop();
        if(v.ctype === "variable" && evaluate(v) === nada){
          if(["x", "y", "t"].indexOf(v.name)!=-1)
            return v.name;
        }
        if(v.args) {
          for(var i in v.args) {
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

    var amp = 0.5;
    var damp = 0;
    var start = 0;
    var duration = 0.7;
    var silent;
    var line = 0;
    var exprt;
    var attack = 0.01;
    var release = 0.01;

    handleModifs();

    var wave = []

    for (var i = 0; i < audioCtx.sampleRate * duration; i++) {
        if (runv !== nada) {
            namespace.setvar(runv, CSNumber.real(i / audioCtx.sampleRate));
        }
        var erg = evaluate(v0);
        wave[i] = erg.value.real * amp * Math.exp( -damp * i / audioCtx.sampleRate);
    }

    if (!silent) {
      if (lines[line] === 0 || lines[line].lineType !== 'function' ) { //initialize
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
      }
      else {
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


    function getBufferNode(arr) {
        var buf = new Float32Array(arr.length)
        for (var i = 0; i < arr.length; i++) {
          if (cdylist){
            buf[i] = arr[i].value.real;
          }
          else {
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
    var amp = 0.5;
    var damp = 0;
    var duration = 0.3;
    var line = 0;
    var attack = 0.01;
    var release = 0.01;
    var cdylist = false;

    handleModifs();

    if (wave.ctype === 'list'){
      wave = wave.value;
      cdylist = true;
    }

    //change output of playfunction to CindyList?

    if (lines[line] === 0 || lines[line].lineType !== 'wave' ) { //initialize
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
    }
    else {
        lines[line].masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + release);
        lines[line].bufferNode.stop(audioCtx.currentTime + release);
        lines[line].bufferNode = getBufferNode(wave);
        lines[line].bufferNode.connect(lines[line].masterGain);
        lines[line].bufferNode.start(start + release);
        lines[line].masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + release + attack);
    }


    return nada;


};
