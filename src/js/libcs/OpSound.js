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
        oscNode.mono = true;
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

    cleanup: function() {
        for (let id in this.lines) {
            if (this.lines[id].lineType === 'sin') {
                if (this.lines[id].oscNodes.every(oscGainPair => !oscGainPair.oscNode.isplaying)) {
                    delete this.lines[id];
                } else {
                    for (let i = 0; i < this.lines[id].oscNodes.length; i++) {
                        if (this.lines[id].oscNodes[i] && !this.lines[id].oscNodes[i].oscNode.isplaying)
                            delete this.lines[id].oscNodes[i];
                    }
                }
            }
        }
    },

    registerInput: function(audioNode) {
        if (!audioNode.cnt)
            audioNode.cnt = 1;
        else
            audioNode.cnt++;
    },

    deregisterInput: function(audioNode) {
        if (audioNode.cnt)
            audioNode.cnt--;
    },

    hasRegisteredInput: function(audioNode) {
        return (audioNode.cnt && audioNode.cnt !== 0);
    },

    playOscillator: function(oscNode, masterGain, gain, attack, duration, release) {
        let audioCtx = this.getAudioContext();
        let gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;
        oscNode.connect(gainNode).connect(masterGain);
        OpSound.registerInput(masterGain);
        oscNode.start(0);
        oscNode.isplaying = true;
        oscNode.onended = function() {
            this.isplaying = false;
            gainNode.disconnect();
            OpSound.deregisterInput(masterGain);
            if (!OpSound.hasRegisteredInput(masterGain)) {
                masterGain.disconnect();
                if (masterGain.panNode) {
                    masterGain.panNode.disconnect();
                }
            }
            OpSound.cleanup();
        };
        gainNode.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + attack);
        if (duration >= 0) {
            //the folloing can be overwritten by softStop or extendDuration
            gainNode.gain.setValueAtTime(gain, audioCtx.currentTime + attack + duration); //constant gain until given time
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + attack + duration + release);
            //oscNode.stop(audioCtx.currentTime + duration + attack + release);
            this.triggerStop(oscNode, duration + attack + release);
        }

        return {
            oscNode: oscNode,
            gainNode: gainNode
        };
    },

    softStop: function(oscGainPair, release) {
        let audioCtx = this.getAudioContext();
        oscGainPair.gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        oscGainPair.gainNode.gain.setValueAtTime(oscGainPair.gainNode.gain.value, audioCtx.currentTime);
        oscGainPair.gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + release);
        //oscGainPair.oscNode.stop(audioCtx.currentTime + release); //overwrite does not work for Safari
        this.triggerStop(oscGainPair.oscNode, release);
    },

    extendDuration: function(oscGainPair, duration, release) {
        let audioCtx = this.getAudioContext();
        oscGainPair.gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        oscGainPair.gainNode.gain.setValueAtTime(oscGainPair.gainNode.gain.value, audioCtx.currentTime);
        oscGainPair.gainNode.gain.setValueAtTime(oscGainPair.gainNode.gain.value, audioCtx.currentTime + duration); //constant gain until given time
        oscGainPair.gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration + release);
        //oscGainPair.oscNode.stop(audioCtx.currentTime + duration + release); //overwrite does not work for Safari
        this.triggerStop(oscGainPair.oscNode, duration + release);
    },

    triggerStop: function(oscNode, time) {
        //this method overwrites also other triggered stops
        //According to https://webaudio.github.io/web-audio-api/#dom-audioscheduledsourcenode-stop this should also be done by oscNode.stop(audioCtx.currentTime + time)
        //However, in March 2019, Safari apperantly did not support this behaviour.
        if (oscNode.timeoutId) {
            clearTimeout(oscNode.timeoutId);
        }
        oscNode.timeoutId = setTimeout(function() {
            oscNode.stop(0);
        }, 1000 * time + 10);
    }
};

class OscillatorLine {
    constructor(audioCtx) {
        this.audioCtx = audioCtx;
        this.lineType = 'sin';
        this.oscNodes = [];
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
        this.precompute &= this.partials.every(p => Math.abs(p - 1) < 1e-8);

        if (this.damp > 0) {
            this.duration = Math.min(this.duration, 6 / this.damp); //exp(-6)<0.003, thus unhearable
        }
    }

    panit() {
        //insert pannode in between if necessary
        if (this.pan !== 0 && !this.masterGain.panNode) {
            this.masterGain.disconnect(this.audioCtx.destination);
            this.masterGain.panNode = this.audioCtx.createStereoPanner();
            this.masterGain.connect(this.masterGain.panNode);
            this.masterGain.panNode.connect(this.audioCtx.destination);
        }
        //update pan value
        if (this.masterGain.panNode)
            this.masterGain.panNode.pan.value = this.pan;
    }

    dampit() {
        this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.audioCtx.currentTime);
        if (this.damp > 0) {
            this.masterGain.gain.setTargetAtTime(0, this.audioCtx.currentTime + this.attack, (1 / this.damp));
        } else if (this.damp < 0) {
            this.masterGain.gain.setTargetAtTime(1, this.audioCtx.currentTime + this.attack, (-this.damp));
        }
    }

    startOscillators() {
        if (this.precompute) {
            this.oscNodes[0] = OpSound.playOscillator(
                OpSound.createWaveOscillator(this.freq, this.harmonics, this.phaseshift),
                this.masterGain, 1, this.attack, this.duration, this.release
            );
        } else {
            for (let i = 0; i < this.harmonics.length; i++) {
                this.oscNodes[i] = OpSound.playOscillator(
                    OpSound.createMonoOscillator(this.partials[i] * (i + 1) * this.freq, this.phaseshift[i]),
                    this.masterGain, this.harmonics[i], this.attack, this.duration, this.release
                );
            }
        }
    }

    stopOscillators() {
        for (let i in this.oscNodes) {
            OpSound.softStop(this.oscNodes[i], this.release);
            delete this.oscNodes[i];
        }
    }

    stop() {
        this.stopOscillators();
    }

    updateFrequencyAndGain() {
        if (!this.precompute) {
            //use all needed oscillators
            for (let i = 0; i < this.harmonics.length; i++)
                if (this.harmonics[i] > 0) {
                    if (this.oscNodes[i] && this.oscNodes[i].oscNode.isplaying && this.oscNodes[i].oscNode.mono) {
                        this.oscNodes[i].oscNode.frequency.value = this.partials[i] * (i + 1) * this.freq;
                        this.oscNodes[i].gainNode.gain.value = this.harmonics[i];
                        OpSound.extendDuration(this.oscNodes[i], this.duration, this.release);
                    } else { //the oscillator has been stopped or has never been created (or is created through createWaveOscillator)
                        if (this.oscNodes[i] && this.oscNodes[i].oscNode.isplaying && !this.oscNodes[i].oscNode.mono)
                            OpSound.softStop(this.oscNodes[i], this.release);
                        this.oscNodes[i] = OpSound.playOscillator(
                            OpSound.createMonoOscillator(this.partials[i] * (i + 1) * this.freq, this.phaseshift[i]), this.masterGain, this.harmonics[i], this.attack, this.duration, this.release
                        );
                    }
                }
            //stop all unneeded oscillators from  this.oscNodes \ this.harmonics
            for (let i in this.oscNodes) {
                if (!this.harmonics[i]) { //!this.harmonics[i] also includes this.harmonics[i]===0
                    //there is no harmonics for this oscillator => stop the corresponding oscillator
                    OpSound.softStop(this.oscNodes[i], this.release);
                    delete this.oscNodes[i];
                }
            }
        } else {
            if (this.harmonicsdidnotchange() && this.oscNodes[0] && this.oscNodes[0].oscNode.isplaying && !this.oscNodes[0].oscNode.mono) {
                this.oscNodes[0].oscNode.frequency.value = this.freq;
                OpSound.extendDuration(this.oscNodes[0], this.duration, this.release);
            } else {
                this.stopOscillators();
                this.startOscillators();
            }
        }
    }

    generateNewMasterGain(amp) {
        //replace masterGain with a new one (the old one is still needed for smooth fading)
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.audioCtx.destination);
        this.masterGain.gain.value = amp;
    }

    harmonicsdidnotchange() {
        let sameharmonics = true;
        if (!this.lastharmonics) {
            sameharmonics = false;
        } else {
            sameharmonics &= (this.lastharmonics.length === this.harmonics.length);
            for (let i in this.harmonics)
                if (sameharmonics)
                    sameharmonics &= (this.harmonics[i] === this.lastharmonics[i]);
        }
        return sameharmonics;
    }

    evokeplaysin(newLine, restart, modifs) {
        this.cleanparameters(modifs);
        if (this.duration === 0) { //users can call playsin(...,duration->0) to stop a tone
            this.stop();
            return nada;
        }

        if (newLine || (restart && this.damp !== 0)) {
            if (restart && !newLine) {
                this.stopOscillators();
            }
            this.generateNewMasterGain(this.amp);
            this.startOscillators();
        } else {
            this.updateFrequencyAndGain();
        }
        this.panit();
        this.dampit();
        this.lastharmonics = this.harmonics;
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
        OpSound.lines[line] = new OscillatorLine(audioCtx);
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
    curline.handleModif(modifs, "precompute", 'boolean', false);
    curline.handleModif(modifs, "phaseshift", 'phaseshift', Array(curline.harmonics.length).fill(0));
    let restart = OpSound.handleModif(modifs.restart, 'boolean', true);

    curline.evokeplaysin(newLine, restart, modifs);
    return nada;
};


evaluator.playsin$0 = function(args, modifs) {
    let erg;
    if (modifs.line !== undefined) {
        let line = OpSound.handleLineModif(modifs.line, "0");
        let curline = OpSound.lines[line];
        //evaluator.playsin$1([CSNumber.real(OpSound.lines[line].oscNodes[0].oscNode.frequency.value)], modifs);
        if (curline) {
            //overwrite parameters if given
            curline.handleModif(modifs, "freq", 'number', curline.freq);
            curline.handleModif(modifs, "amp", 'number', curline.amp);
            curline.handleModif(modifs, "damp", 'number', curline.damp);
            curline.handleModif(modifs, "duration", 'number', OpSound.handleModif(modifs.stop, 'number', curline.duration));
            curline.handleModif(modifs, "harmonics", 'list', curline.harmonics);
            curline.handleModif(modifs, "partials", 'list', curline.partials);
            curline.handleModif(modifs, "attack", 'number', curline.attack);
            curline.handleModif(modifs, "release", 'number', curline.release);
            curline.handleModif(modifs, "pan", 'number', curline.pan);
            curline.handleModif(modifs, "precompute", 'boolean', curline.precompute);
            curline.handleModif(modifs, "phaseshift", 'phaseshift', curline.phaseshift);

            let restart = OpSound.handleModif(modifs.restart, 'boolean', false);

            curline.evokeplaysin(false, restart, modifs);
        }
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
