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

    handlePhaseshiftModif: function(modif, harmonicsLength) {
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
    },

    createMonoOscillator: function(freq, phaseshift) {
        let oscNode = this.getAudioContext().createOscillator();
        if (phaseshift !== 0) {
            let real = new Float32Array(2);
            let imag = new Float32Array(2);
            real[1] = Math.sin(phaseshift);
            imag[1] = Math.cos(phaseshift);

            let wave = this.getAudioContext().createPeriodicWave(real, imag, {
                disableNormalization: true
            });
            oscNode.setPeriodicWave(wave);
        } else {
            oscNode.type = 'sine';
        }
        oscNode.frequency.value = freq;
        return oscNode;
    },

    createWaveOscillator: function(freq, harmonics, phaseshiftarr) {
        let oscNode = this.getAudioContext().createOscillator();
        let real = new Float32Array(harmonics.length + 1);
        let imag = new Float32Array(harmonics.length + 1);
        for (let i = 0; i < harmonics.length; i++) {
            imag[i + 1] = harmonics[i] * Math.cos(phaseshiftarr[i]);
            real[i + 1] = harmonics[i] * Math.sin(phaseshiftarr[i]);
        }
        let wave = this.getAudioContext().createPeriodicWave(real, imag, {
            disableNormalization: true
        });
        oscNode.setPeriodicWave(wave);
        oscNode.frequency.value = freq;
        return oscNode;
    },

    playOscillator: function(oscNode, masterGain, gain, attack, duration) {
        let audioCtx = this.getAudioContext();
        let gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(masterGain);
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
    let phaseshift = OpSound.handlePhaseshiftModif(modifs.phaseshift, harmonics.length);
    let pan = OpSound.handleModif(modifs.pan, 'number', 0);
    let precalculate = OpSound.handleModif(modifs.precalculate, 'boolean', false);

    if (partials.length < harmonics.length) {
        partials = Array(harmonics.length).fill(1);
    }

    if (phaseshift.length < harmonics.length) {
        phaseshift = Array(harmonics.length).fill(0);
    }

    //precalculate is not possible if singal is non-periodic
    precalculate &= partials.every(p => Math.abs(p - 1) < 1e-8);

    let newLine = false;

    if (!OpSound.lines[line] || OpSound.lines[line].lineType !== 'sin') { //initialize
        if (OpSound.lines[line])
            OpSound.lines[line].stop();

        OpSound.lines[line] = {
            lineType: 'sin',
            oscNodes: [],
            masterGain: audioCtx.createGain(),

            dampit: function() {
                if (damp > 0) {
                    this.masterGain.gain.setTargetAtTime(0.0, audioCtx.currentTime + release + attack, (1 / damp));
                    if (precalculate) {
                        this.oscNodes[0].oscNode.stop(audioCtx.currentTime + (6 / damp));
                    } else {
                        for (let i = 0; i < harmonics.length; i++) {
                            this.oscNodes[i].oscNode.stop(audioCtx.currentTime + (6 / damp));
                        }
                    }
                } else if (damp < 0) {
                    this.masterGain.gain.setTargetAtTime(1, audioCtx.currentTime + release + attack, (-damp));
                }
            },

            startOscillators: function() {
                if (precalculate) {
                    this.oscNodes[0] = OpSound.playOscillator(
                        OpSound.createWaveOscillator(freq, harmonics, phaseshift), this.masterGain, 1, attack, duration
                    );
                } else {
                    for (let i = 0; i < harmonics.length; i++) {
                        curline.oscNodes[i] = OpSound.playOscillator(
                            OpSound.createMonoOscillator(partials[i] * (i + 1) * freq, phaseshift[i]), this.masterGain, harmonics[i], attack, duration
                        );
                    }
                }
                this.masterGain.gain.linearRampToValueAtTime(amp, audioCtx.currentTime + release + attack);
                this.dampit();
            },

            stopOscillators: function() {
                this.masterGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + release);
                for (let i = 0; i < this.oscNodes.length; i++) {
                    this.oscNodes[i].oscNode.stop(audioCtx.currentTime + release); //helps
                }
            },

            stop: function() {
                this.stopOscillators();
            },

            updateFrequencyAndGain: function() {
                if (!precalculate & this.oscNodes.length === harmonics.length) {
                    for (let i = 0; i < harmonics.length; i++) {
                        this.oscNodes[i].oscNode.frequency.value = partials[i] * (i + 1) * freq;
                        this.oscNodes[i].gainNode.gain.value = harmonics[i];
                    }
                } else {
                    this.stopOscillators();
                    this.startOscillators();
                }
            }

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

    if (curline.panNode) {
        curline.panNode.pan.value = pan;
    }

    if (duration === 0) { //users can call playsin(...,duration->0) to stop a tone
        curline.stopOscillators();
        delete OpSound.lines[line];
        return nada;
    }


    if (newLine) {
        curline.startOscillators(0, phaseshift);
    } else {
        if (damp === 0) {
            curline.updateFrequencyAndGain();
        } else {
            if (restart) {
                curline.stopOscillators();
                curline.startOscillators();
            } else {
                curline.updateFrequencyAndGain();
                curline.dampit();
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
    let silent = OpSound.handleModif(modifs.silent, 'boolean', false);

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
            if (OpSound.lines[line])
                OpSound.lines[line].stop();
            OpSound.lines[line] = {
                lineType: 'function',
                bufferNode: OpSound.getBufferNode(wave, duration),
                masterGain: audioCtx.createGain(),
                stop: function() {
                    this.bufferNode.stop();
                }
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
        if (OpSound.lines[line])
            OpSound.lines[line].stop();

        OpSound.lines[line] = {
            lineType: 'wave',
            bufferNode: OpSound.getBufferNode(General.unwrap(wave), duration),
            masterGain: audioCtx.createGain(),
            stop: function() {
                this.bufferNode.stop();
            }
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
