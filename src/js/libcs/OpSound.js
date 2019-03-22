//*******************************************************
// and here are the definitions of the sound operators
//*******************************************************
var OpSound = {
    lines: {},
    audioCtx: null,
    getAudioContext: function() {
        if (this.audioCtx) return this.audioCtx;
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.warn('Web Audio API not supported in this browser');
        } else {
            //this.audioCtx = new window.AudioContext() || new window.webkitAudioContext();
            let a = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new a();
        }
        return this.audioCtx;
    },
    handleModif: function(modif, modifType, defaultValue) {
        if (modif !== undefined) {
            let erg = evaluate(modif);
            if (erg.ctype === modifType) {
                if (erg.ctype === 'number') {
                    return erg.value.real;
                } else if (erg.ctype === 'list') {
                    let cslist = erg.value;
                    let jslist = [];
                    for (let i = 0; i < cslist.length; i++) {
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
    },
    handlePhaseshiftModif: function(modif, modifType, harmonicsLength) {
        if (modif !== undefined) {
            let erg = evaluate(modif);
            let jslist = [];
            if (erg.ctype === 'list') {
                let cslist = erg.value;
                for (let i = 0; i < cslist.length; i++) {
                    jslist[i] = cslist[i].value.real;
                }
                return jslist;
            } else if (erg.ctype === 'number') {
                for (let i = 0; i < harmonicsLength; i++) {
                    jslist[i] = (i + 1) * erg.value.real;
                }
                return jslist;
            }
        } else {
            return Array(harmonicsLength).fill(0);
        }
    },
    handleLineModif: function(modif, defaultValue) {
        if (modif !== undefined) {
            let erg = evaluate(modif);
            return niceprint(erg);
        }
        return defaultValue;
    },
    getBufferNode: function(wave, duration) {
        let audioCtx = this.getAudioContext();
        if (duration * audioCtx.sampleRate > wave.length) {
            let newwave = [];
            for (let i = 0, j = 0; i < audioCtx.sampleRate * duration; i++, j++) {
                if (j > wave.length) j = 0;
                newwave[i] = wave[j];
            }
            wave = newwave;
        }
        let buf = new Float32Array(wave);
        let buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate);
        buffer.copyToChannel(buf, 0);
        let bufferNode = audioCtx.createBufferSource();
        bufferNode.buffer = buffer;
        return bufferNode;
    }
};

evaluator.stopsound$0 = function() {
    if (OpSound.audioCtx) {
        OpSound.audioCtx.close();
        OpSound.audioCtx = null;
        for (let line in OpSound.lines) {
            delete OpSound.lines[line];
        }
    }
};

evaluator.playsin$1 = function(args, modifs) {
    let audioCtx = OpSound.getAudioContext();
    let freq = evaluate(args[0]).value.real;
    let line = OpSound.handleLineModif(modifs.line, "0");
    let amp = OpSound.handleModif(modifs.amp, 'number', 0.5);
    let damp = OpSound.handleModif(modifs.damp, 'number', 0);
    let stop = OpSound.handleModif(modifs.stop, 'number', 1);
    let duration = OpSound.handleModif(modifs.duration, 'number', stop);
    let harmonics = OpSound.handleModif(modifs.harmonics, 'list', [1]);
    let partials = OpSound.handleModif(modifs.partials, 'list', [1]);
    let attack = OpSound.handleModif(modifs.attack, 'number', 0.01);
    let release = OpSound.handleModif(modifs.release, 'number', 0.01);
    let restart = OpSound.handleModif(modifs.restart, 'boolean', true);
    let phaseshift = OpSound.handlePhaseshiftModif(modifs.phaseshift, 'list', harmonics.length);
    let pan = OpSound.handleModif(modifs.pan, 'number', 0);
    let noPartialsGiven = harmonics.length > partials.length;


    if (!noPartialsGiven) {
        for (let i = 0, j = 0; i < harmonics.length; i++) {
            if (Math.abs(partials[i] - 1) < 1e-10) j++;
            noPartialsGiven = i === j;
        }
    }

    if (harmonics.length > partials.length) {
        partials = Array(harmonics.length).fill(1);
    }

    if (phaseshift.length !== harmonics.length) {
        phaseshift = Array(harmonics.length).fill(0);
    }

    function dampening(curline) {
        if (damp > 0) {
            curline.masterGain.gain.setTargetAtTime(0.0, audioCtx.currentTime + release + attack, (1 / damp));
            if (noPartialsGiven) {
                curline.oscNodes[0].oscNode.stop(audioCtx.currentTime + (6 / damp));
            } else {
                for (let i = 0; i < harmonics.length; i++) {
                    curline.oscNodes[i].oscNode.stop(audioCtx.currentTime + (6 / damp));
                }
            }
        } else if (damp < 0) {
            curline.masterGain.gain.setTargetAtTime(1, audioCtx.currentTime + release + attack, (-damp));
        }
    }

    function startOscillators(curline) {
        if (noPartialsGiven) {
            curline.oscNodes[0] = playOscillator(curline, freq, 1, phaseshift[0]);
        } else {
            for (let i = 0; i < harmonics.length; i++) {
                curline.oscNodes[i] = playOscillator(curline, partials[i] * (i + 1) * freq, harmonics[i], phaseshift[i]);
            }
        }
        if (curline.panNode) {
            curline.panNode.pan.value = pan;
        }
        curline.masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + release + attack);
        dampening(curline);
    }

    function stopOscillators(curline) {
        curline.masterGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + release);
        for (let i = 0; i < curline.oscNodes.length; i++) {
            curline.oscNodes[i].oscNode.stop(audioCtx.currentTime + release); //helps
        }
    }

    function updateFrequencyAndGain(curline) {
        for (let i = 0; i < harmonics.length; i++) {
            curline.oscNodes[i].oscNode.frequency.value = partials[i] * (i + 1) * freq;
            curline.oscNodes[i].gainNode.gain.value = harmonics[i];
        }
    }

    function setPhaseShift(oscNode, curphaseshift) {
        //set coefficients of the fourier transform
        let real, imag;
        if (noPartialsGiven) {
            real = new Float32Array(harmonics.length + 1);
            imag = new Float32Array(harmonics.length + 1);
            imag[1] = harmonics[0] * Math.cos(phaseshift[0]);
            real[1] = harmonics[0] * Math.sin(phaseshift[0]);
            for (let i = 1; i < harmonics.length; i++) {
                imag[i + 1] = harmonics[i] * Math.cos(phaseshift[i]);
                real[i + 1] = harmonics[i] * Math.sin(phaseshift[i]);
            }
        } else {
            real = new Float32Array(2);
            imag = new Float32Array(2);
            real[1] = Math.sin(curphaseshift);
            imag[1] = Math.cos(curphaseshift);
        }

        let wave = audioCtx.createPeriodicWave(real, imag, {
            disableNormalization: true
        });
        oscNode.setPeriodicWave(wave);
    }

    function playOscillator(curline, freq, gain, curphaseshift) {
        let oscNode = audioCtx.createOscillator();
        if (phaseshift[0] === 0 && !noPartialsGiven) {
            oscNode.type = 'sine';
        } else {
            setPhaseShift(oscNode, curphaseshift);
        }
        oscNode.frequency.value = freq;
        let gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(curline.masterGain);
        oscNode.connect(gainNode);
        gainNode.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + attack);
        oscNode.start(0);
        oscNode.onended = function() {
            gainNode.disconnect();
        };
        if (duration >= 0) {
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime + duration + attack);
            oscNode.stop(audioCtx.currentTime + duration + attack);
        }
        return {
            oscNode: oscNode,
            gainNode: gainNode
        };
    }

    let newLine = false;

    if (!OpSound.lines[line] || OpSound.lines[line].lineType !== 'sin') { //initialize
        OpSound.lines[line] = {
            lineType: 'sin',
            oscNodes: [],
            masterGain: audioCtx.createGain()
        };
        OpSound.lines[line].masterGain.gain.value = 0;
        if (pan === 0) {
            OpSound.lines[line].masterGain.connect(audioCtx.destination);
        } else {
            OpSound.lines[line].panNode = audioCtx.createStereoPanner();
            OpSound.lines[line].masterGain.connect(OpSound.lines[line].panNode);
            OpSound.lines[line].panNode.connect(audioCtx.destination);
        }
        newLine = true;
    }
    let curline = OpSound.lines[line];

    if (duration === 0) { //users can call playsin(...,duration->0) to stop a tone
        stopOscillators(curline);
        delete OpSound.lines[line];
        return nada;
    }


    if (newLine) {
        startOscillators(curline, 0, phaseshift);
    } else {
        if (damp === 0) {
            if (curline.oscNodes.length !== harmonics.length) {
                stopOscillators(curline);
                startOscillators(curline);
            } else {
                updateFrequencyAndGain(curline);
            }
        } else {
            if (restart) {
                stopOscillators(curline);
                startOscillators(curline);
            } else {
                updateFrequencyAndGain(curline);
                dampening(curline);
            }
        }
    }
    return nada;
};


evaluator.playsin$0 = function(args, modifs) {
    let erg;
    if (modifs.line !== undefined) {
        let line = OpSound.handleLineModif(modifs.line, "0");
        evaluator.playsin$1([CSNumber.real(OpSound.lines[line].oscNodes[0].oscNode.frequency.value)], modifs);
    }
    return nada;
};


evaluator.playfunction$1 = function(args, modifs) {
    let audioCtx = OpSound.getAudioContext();

    function searchVar(tree) {
        let stack = [];
        stack.push(tree);
        while (stack.length !== 0) { //DFS with handwritten stack.
            let v = stack.pop();
            if (v.ctype === "variable" && evaluate(v) === nada) {
                if (["x", "y", "t"].includes(v.name))
                    return v.name;
            }
            if (v.args) {
                for (let i in v.args) {
                    stack.push(v.args[i]);
                }
            }
        }
        return nada;
    }

    let v0 = args[0];

    let runv = searchVar(v0);
    if (runv !== nada) {
        namespace.newvar(runv);
    }

    let line = OpSound.handleLineModif(modifs.line, "0");
    let start = OpSound.handleModif(modifs.start, 'number', 0);
    let amp = OpSound.handleModif(modifs.amp, 'number', 0.5);
    let damp = OpSound.handleModif(modifs.damp, 'number', 0);
    let stop = OpSound.handleModif(modifs.stop, 'number', 1);
    let duration = OpSound.handleModif(modifs.duration, 'number', 1);
    let attack = OpSound.handleModif(modifs.attack, 'number', 0.01);
    let release = OpSound.handleModif(modifs.release, 'number', 0.01);
    let exprt = OpSound.handleModif(modifs.export, 'boolean', false);
    let silent;

    let wave = [];

    for (let i = 0; i < audioCtx.sampleRate * duration; i++) {
        if (runv !== nada) {
            namespace.setvar(runv, CSNumber.real(i / audioCtx.sampleRate));
        }
        let erg = evaluate(v0);
        wave[i] = erg.value.real * amp * Math.exp(-damp * i / audioCtx.sampleRate);
    }

    if (!silent) {
        if (!OpSound.lines[line] || OpSound.lines[line].lineType !== 'function') { //initialize
            OpSound.lines[line] = {
                lineType: 'function',
                bufferNode: OpSound.getBufferNode(wave, duration),
                masterGain: audioCtx.createGain()
            };
            let curline = OpSound.lines[line];
            curline.masterGain.gain.value = 0;
            curline.masterGain.connect(audioCtx.destination);
            curline.bufferNode.connect(curline.masterGain);
            curline.bufferNode.start(start);
            curline.masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + attack);
        } else {
            let curline = OpSound.lines[line];
            curline.masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + release);
            curline.bufferNode.stop(audioCtx.currentTime + release);
            curline.bufferNode = OpSound.getBufferNode(wave, duration);
            curline.bufferNode.connect(curline.masterGain);
            curline.bufferNode.start(start + release);
            curline.masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + release + attack);
        }
    }

    if (runv !== nada) namespace.removevar(runv);
    if (exprt) return wave;

    return nada;
};


evaluator.playwave$1 = function(args, modifs) {
    let audioCtx = OpSound.getAudioContext();

    let wave = evaluate(args[0]);
    let line = OpSound.handleLineModif(modifs.line, "0");
    let amp = OpSound.handleModif(modifs.amp, 'number', 0.5);
    let damp = OpSound.handleModif(modifs.damp, 'number', 0);
    let duration = OpSound.handleModif(modifs.duration, 'number', 1);
    let attack = OpSound.handleModif(modifs.attack, 'number', 0.01);
    let release = OpSound.handleModif(modifs.release, 'number', 0.01);
    let start = OpSound.handleModif(modifs.start, 'number', 0);

    if (wave.ctype !== 'list') {
        return nada;
    }

    if (!OpSound.lines[line] || OpSound.lines[line].lineType !== 'wave') {
        OpSound.lines[line] = {
            lineType: 'wave',
            bufferNode: OpSound.getBufferNode(General.unwrap(wave), duration),
            masterGain: audioCtx.createGain()
        };
        let curline = OpSound.lines[line];
        curline.masterGain.gain.value = 0;
        curline.masterGain.connect(audioCtx.destination);
        curline.bufferNode.connect(curline.masterGain);
        curline.bufferNode.start(0);
        curline.masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + attack);
    } else {
        let curline = OpSound.lines[line];
        curline.masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + release);
        curline.bufferNode.stop(audioCtx.currentTime + release);
        curline.bufferNode = OpSound.getBufferNode(General.unwrap(wave), duration);
        curline.bufferNode.connect(curline.masterGain);
        curline.bufferNode.start(start + release);
        curline.masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + release + attack);
    }

    return nada;
};
