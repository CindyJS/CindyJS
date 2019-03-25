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
        oscNode.isplaying = true;
        oscNode.onended = function() {
            this.isplaying = false;
            gainNode.disconnect();
        };

        if (duration >= 0) {
            //can be overwritten by other triggered stop events
            oscNode.stop(audioCtx.currentTime + duration + attack);
        }

        return {
            oscNode: oscNode,
            gainNode: gainNode
        };
    },
};

class SinusLine {
    constructor(audioCtx) {
        this.audioCtx = audioCtx;
        this.lineType = 'sin';
        this.oscNodes = [];
        this.masterGain = audioCtx.createGain();
        this.masterGain.gain.value = 0;
        this.masterGain.connect(audioCtx.destination);
    }

    handleModif(modifs, modifName, modifType, defaultValue) {
        let val = defaultValue;
        if (modifName === "phaseshift") val = this.handlePhaseshiftModif(modifs.phaseshift, this.harmonics.length);
        else if (modifs[modifName] !== undefined) {
            let erg = evaluate(modifs[modifName]);
            if (erg.ctype === modifType) {
                if (erg.ctype === 'number') {
                    val = erg.value.real;
                } else if (erg.ctype === 'list') {
                    let cslist = erg.value;
                    let jslist = [];
                    for (let i = 0; i < cslist.length; i++) {
                        jslist[i] = cslist[i].value.real;
                    }
                    val = jslist;
                } else {
                    val = erg.value;
                }
            }
        }
        this[modifName] = val;
        return val;
    }

    handlePhaseshiftModif(modif, harmonicsLength) {
        this.phaseshift = Array(harmonicsLength).fill(0);
        if (modif !== undefined) {
            let erg = evaluate(modif);
            if (erg.ctype === 'list') {
                let cslist = erg.value;
                for (let i = 0; i < cslist.length; i++) {
                    this.phaseshift[i] = cslist[i].value.real;
                }
            } else if (erg.ctype === 'number') {
                for (let i = 0; i < harmonicsLength; i++) {
                    this.phaseshift[i] = (i + 1) * erg.value.real;
                }
            }
        }
        return this.phaseshift;
    }

    cleanparameters(modifs) {
        if (this.partials.length < this.harmonics.length) {
            this.partials = Array(this.harmonics.length).fill(1);
            if (modifs.partials)
                console.warn("Ignore partials because the given length does not match with the length of harmonics");
        }

        if (this.phaseshift.length < this.harmonics.length) {
            this.phaseshift = Array(this.harmonics.length).fill(0);
            if (modifs.phaseshift)
                console.warn("Ignore phaseshift because the given length does not match with the length of harmonics");
        }
    }

    panit() {
        //insert pannode in between if necessary
        if (this.pan !== 0 & !this.panNode) {
            this.masterGain.disconnect(this.audioCtx.destination);
            this.panNode = this.audioCtx.createStereoPanner();
            this.masterGain.connect(this.panNode);
            this.panNode.connect(this.audioCtx.destination);
        }
        //update pan value
        if (this.panNode)
            this.panNode.pan.value = this.pan;
    }

    dampit() {
        if (this.damp > 0) {
            this.masterGain.gain.setTargetAtTime(0.0, this.audioCtx.currentTime + this.release + this.attack, (1 / this.damp));
            for (let i = 0; i < this.oscNodes[i].length; i++) {
                this.oscNodes[i].oscNode.stop(this.audioCtx.currentTime + (6 / this.damp));
            }
        } else if (this.damp < 0) {
            this.masterGain.gain.setTargetAtTime(1, this.audioCtx.currentTime + this.release + this.attack, (-this.damp));
        }
    }

    startOscillators(precompute) {
        if (precompute) {
            this.oscNodes[0] = OpSound.playOscillator(
                OpSound.createWaveOscillator(this.freq, this.harmonics, this.phaseshift), this.masterGain, 1, this.attack, this.duration
            );
        } else {
            for (let i = 0; i < this.harmonics.length; i++) {
                this.oscNodes[i] = OpSound.playOscillator(
                    OpSound.createMonoOscillator(this.partials[i] * (i + 1) * this.freq, this.phaseshift[i]), this.masterGain, this.harmonics[i], this.attack, this.duration
                );
            }
        }
        this.masterGain.gain.linearRampToValueAtTime(this.amp, this.audioCtx.currentTime + this.release + this.attack);
    }

    stopOscillators() {
        this.masterGain.gain.linearRampToValueAtTime(0.0, this.audioCtx.currentTime + this.release);
        for (let i in this.oscNodes) {
            this.oscNodes[i].oscNode.stop(this.audioCtx.currentTime + this.release); //helps
            delete this.oscNodes[i];
        }
    }

    stop() {
        this.stopOscillators();
    }

    updateFrequencyAndGain(precompute, sameharmonics) {
        if (!precompute) {
            //use all needed oscillators
            for (let i = 0; i < this.harmonics.length; i++)
                if (this.harmonics[i] > 0) {
                    if (this.oscNodes[i] && this.oscNodes[i].oscNode.isplaying && this.oscNodes[i].oscNode.type === 'sine') {
                        this.oscNodes[i].oscNode.frequency.value = this.partials[i] * (i + 1) * this.freq;
                        this.oscNodes[i].gainNode.gain.value = this.harmonics[i];
                        this.oscNodes[i].oscNode.stop(this.audioCtx.currentTime + this.duration); //overwrites other triggered stops
                    } else { //the oscillator has been stopped or has never been created (or is created through createWave)
                        this.oscNodes[i] = OpSound.playOscillator(
                            OpSound.createMonoOscillator(this.partials[i] * (i + 1) * this.freq, this.phaseshift[i]), this.masterGain, this.harmonics[i], this.attack, this.duration
                        );
                    }
                }
            //stop all unneeded oscillators from  this.oscNodes \ this.harmonics
            for (let i in this.oscNodes) {
                if (!this.harmonics[i]) { //!this.harmonics[i] also includes this.harmonics[i]===0
                    //there is no harmonics for this oscillator => stop the corresponding oscillator
                    this.oscNodes[i].gainNode.gain.linearRampToValueAtTime(0.0, this.audioCtx.currentTime + this.release);
                    this.oscNodes[i].oscNode.stop(this.audioCtx.currentTime + this.release); //overwrites other triggered stops
                    delete this.oscNodes[i];
                }
            }
        } else {
            if (sameharmonics && this.oscNodes[0] && this.oscNodes[0].oscNode.isplaying && this.oscNodes[0].oscNode.type === "custom") {
                this.oscNodes[0].oscNode.frequency.value = this.freq;
                this.oscNodes[0].oscNode.stop(this.audioCtx.currentTime + this.duration);
            } else {
                this.stopOscillators();
                this.startOscillators(precompute);
            }
        }
    }
}

evaluator.stopsound$0 = function() {
    if (OpSound.audioCtx) {
        for (let line in OpSound.lines) {
            OpSound.lines[line].stop();
            delete OpSound.lines[line];
        }
        OpSound.audioCtx.close();
        OpSound.audioCtx = null;
    }
};

evaluator.playsin$1 = function(args, modifs) {
    let audioCtx = OpSound.getAudioContext();


    let line = OpSound.handleLineModif(modifs.line, "0");

    let newLine = false;

    if (!OpSound.lines[line] || OpSound.lines[line].lineType !== 'sin') { //initialize
        if (OpSound.lines[line])
            OpSound.lines[line].stop();
        OpSound.lines[line] = new SinusLine(audioCtx);
        newLine = true;
    }
    let curline = OpSound.lines[line];

    curline.freq = evaluate(args[0]).value.real;
    curline.handleModif(modifs, "amp", 'number', 0.5);
    curline.handleModif(modifs, "damp", 'number', 0);
    curline.handleModif(modifs, "duration", 'number', OpSound.handleModif(modifs.stop, 'number', 1));
    curline.handleModif(modifs, "harmonics", 'list', [1]);
    curline.handleModif(modifs, "partials", 'list', [1]);
    curline.handleModif(modifs, "attack", 'number', 0.01);
    curline.handleModif(modifs, "release", 'number', 0.01);
    curline.handleModif(modifs, "pan", 'number', 0);
    curline.handleModif(modifs, "phaseshift", 'phaseshift', Array(curline.harmonics.length).fill(0));

    curline.cleanparameters(modifs);


    let restart = OpSound.handleModif(modifs.restart, 'boolean', true);
    let precompute = OpSound.handleModif(modifs.precompute, 'boolean', false);

    let sameharmonics = true;
    if (!curline.lastharmonics) {
        sameharmonics = false;
    } else {
        sameharmonics &= (curline.lastharmonics.length === curline.harmonics.length);
        for (let i in curline.harmonics)
            if (sameharmonics)
                sameharmonics &= (curline.harmonics[i] === curline.lastharmonics[i]);
    }
    curline.lastharmonics = curline.harmonics;

    if (curline.duration === 0) { //users can call playsin(...,duration->0) to stop a tone
        curline.stop();
        delete OpSound.lines[line];
        return nada;
    }

    //precompute is not possible if singal is non-periodic
    precompute &= curline.partials.every(p => Math.abs(p - 1) < 1e-8);

    curline.panit();

    if (newLine) {
        curline.startOscillators(precompute);
        curline.dampit();
    } else {
        if (curline.damp === 0) {
            curline.updateFrequencyAndGain(precompute, sameharmonics);
        } else {
            if (restart) {
                curline.stopOscillators();
                curline.startOscillators(precompute);
                curline.dampit();
            } else {
                curline.updateFrequencyAndGain(precompute, sameharmonics);
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
