/* globals CindyJS */
CindyJS.registerPlugin(1, "midi", function(api) {
    "use strict";

    //var soundfont = CindyJS.getBaseDir() + "soundfont/";
    var soundfont = "http://cindyjs.org/extras/midi-js-soundfonts/MusyngKite/";

    var midijsStatus = -2; // wait for two scripts to load

    // Preset midi channelinstruments like Cinderella does
    var chan2inst = [
        /* 0: */ 0, // Piano
        /* 1: */ 9, // Glockenspiel
        /* 2: */ 11, // Vibraphone
        /* 3: */ 12, // Marimba
        /* 4: */ 13, // Xylophone
        /* 5: */ 115, // Woodblock
        /* 6: */ 45, // Pizzicato Strigs
        /* 7: */ 44, // Tremolo Strings
        /* 8: */ 80, // Syn Square Wave
        /* 9: */ -1, // DRUMSET !!!
        /* 10: */ 98, // Crystal
        /* 11: */ 112, // Tinkle Bell
        /* 12: */ 73, // Flute
        /* 13: */ 32, // Accustic Bass
        /* 14: */ 17, // Perc Organ
        /* 15: */ 65, // Alto Sax
    ];

    var instrumentStatus = [];

    var STATUS = {
        INITIAL: 0,
        REQUESTED: 1,
        LOADING: 2,
        LOADED: 3
    };

    var currentChannel = 0;

    var RESOLUTION = 5 * 3 * 2 * 2 * 2;

    CindyJS.loadScript("MIDI", "midi/MIDI.js", someScriptLoaded);
    CindyJS.loadScript("Base64Binary", "midi/Base64binary.js", someScriptLoaded);

    function someScriptLoaded() {
        console.log("someScriptLoaded, status = " + midijsStatus);
        if (++midijsStatus === STATUS.INITIAL) doLoad();
    }

    // Placeholder object while we wait for MIDI.js library to load
    var MIDI = {
        getInstrument: function(ch) {
            return chan2inst[ch];
        },
        setInstrument: function(ch, inst) {
            chan2inst[ch] = inst;
        },
    };

    function numModif(modif, deflt) {
        if (modif) {
            modif = api.evaluate(modif);
            if (modif.ctype === "number") {
                return modif.value.real;
            }
        }
        return deflt;
    }

    api.defineFunction("loadinstruments", 1, function(args, modifs) {
        var allLoaded = true;
        var insts = api.evaluate(args[0]);
        if (insts.ctype !== "list")
            insts = {
                ctype: "list",
                value: [insts]
            };
        for (var i = 0; i < insts.value.length; ++i) {
            var inst = insts.value[i];
            if (inst.ctype === "number") {
                inst = Math.max(0, Math.min(128, inst.value.real | 0)) - 1;
                var status = instrumentStatus[inst];
                if (status !== STATUS.LOADED) {
                    allLoaded = false;
                    if (!status) {
                        instrumentStatus[inst] = STATUS.REQUESTED;
                        triggerLoad();
                    }
                }
            }
        }
        return {
            ctype: "boolean",
            value: allLoaded,
        };
    });

    api.defineFunction("instrument", 1, function(args, modifs) {
        var inst = api.evaluate(args[0]);
        var ch = Math.round(numModif(modifs.channel, currentChannel));
        if (inst.ctype === "number") {
            MIDI.setInstrument(ch, Math.round(inst.value.real) - 1);
        }
        return api.nada;
    });

    api.defineFunction("playtone", 1, function(args, modifs) {
        var note = api.evaluate(args[0]);
        if (note.ctype !== "number") return api.nada;
        note = Math.round(note.value.real);

        var vel = numModif(modifs.velocity, 1) * 127;
        var chan = Math.round(numModif(modifs.channel, currentChannel));

        var inst = MIDI.getInstrument(chan);
        var status = instrumentStatus[inst];
        if (status === STATUS.LOADED) { // can play
	    MIDI.noteOn(chan, note, vel, 0);
	    MIDI.noteOff(chan, note , 0.9);
        } else if (!status) { // must load
            instrumentStatus[inst] = STATUS.REQUESTED;
            triggerLoad();
        }
        return api.nada;
    });

    api.defineFunction("playmelody", 1, function(args, modifs) {
        var list = api.evaluateAndVal(args[0]);
        if (list.ctype !== "list") {
            return api.nada;
        }
        var staccato = false;
        var accent = false;
        var time = 0;
        var channel = currentChannel;
        var vel = 64;
        var dacapo = null;
        var adcapo = null;
        var melody = [];
        var instruments = [];
        var inst = MIDI.getInstrument(channel);
        var bpm = 60;
        var chan2inst = [];

        if (modifs.channel) {
            channel = Math.round(numModif(modifs.channel, currentChannel));
            inst = MIDI.getInstrument(channel);
        }
        if (modifs.instrument) {
            inst = Math.round(numModif(modifs.instrument, 0)) - 1;
            MIDI.setInstrument(channel, inst);
        }
        if (modifs.speed) {
            bpm = numModif(modifs.speed, 0);
        }
        var timeUnit = 60 / bpm;
        var timeOff = 10 * timeUnit / RESOLUTION;
        chan2inst[channel] = inst;

        for (var i = 0; i < list.value.length; ++i) {
            var data = list.value[i];
            if (data.ctype === "list") {
                if (data.value.length === 1) {
                    if (data.value[0].ctype === "string") {
                        var str = data.value[0].value.toLowerCase();
                        if (str === "staccato" || str === "st") {
                            staccato = true;
                        } else if (str === "legato" || str === "le") {
                            staccato = false;
                        } else if (str === "||:") {
                            dacapo = i;
                        } else if (str === ":||") {
                            if (dacapo !== null) {
                                adcapo = i;
                                i = dacapo;
                                dacapo = null;
                            }
                        } else if (str === "1.") {
                            if (adcapo !== null) {
                                i = adcapo;
                                dacapo = null;
                                adcapo = null;
                            }
                        } else if (str === "ppp") {
                            vel = (0.2 * 127)|0;
                        } else if (str === "pp") {
                            vel = (0.3 * 127)|0;
                        } else if (str === "p") {
                            vel = (0.4 * 127)|0;
                        } else if (str === "mp") {
                            vel = (0.5 * 127)|0;
                        } else if (str === "mf") {
                            vel = (0.6 * 127)|0;
                        } else if (str === "f") {
                            vel = (0.7 * 127)|0;
                        } else if (str === "ff") {
                            vel = (0.85 * 127)|0;
                        } else if (str === "fff") {
                            vel = (1.0 * 127)|0;
                        } else if (str === ">") {
                            accent = true;
                        }
                    } // single string
                } else if (data.value.length === 2) {
                    var keys = data.value[0];
                    var length = data.value[1];
                    if (keys.ctype === "string" && length.ctype === "number") {
                        var cmd = keys.value;
                        var va = length.value.real;
                        if (cmd === "velocity" || cmd === "vel") {
                            if (va > 1.0)
                                vel = va | 0;
                            else
                                vel = (va * 127) | 0;
                            if (vel < 0) vel = 0;
                            if (vel > 127) vel = 127;
                            continue;
                        } else if (cmd === "goto" || cmd === "gt") {
                            time = Math.max(0, va * timeUnit);
                            continue;
                        } else if (cmd === "gorel" || cmd === "gr") {
                            time = Math.max(0, time + va * timeUnit);
                            continue;
                        } else if (cmd === "channel" || cmd === "ch") {
                            channel = Math.max(0, Math.min(15, va | 0));
                            if (!chan2inst.hasOwnProperty(channel)) {
                                inst = MIDI.getInstrument(channel);
                                chan2inst[channel] = inst;
                            } else {
                                inst = chan2inst[channel];
                            }
                            // schedule a program change event as well?
                            continue;
                        } else if (cmd === "instrument" || cmd === "inst") {
                            inst = (va | 0) - 1;
                            melody.push({
                                event: "program",
                                channel: channel,
                                time: time - timeOff,
                                program: inst,
                            });
                            chan2inst[channel] = inst;
                            instruments[inst] = true;
                            continue;
                        }
                    }
                    var duration = null;
                    if (length.ctype === "number") {
                        length = length.value.real * timeUnit;
                        if (!staccato && length !== 0) {
                            duration = Math.max(length - timeOff, timeOff);
                        } else {
                            duration = timeOff;
                        }
                    }
                    if (keys.ctype === "number" || keys.ctype === "string") {
                        keys = {
                            ctype: "list",
                            value: [keys],
                        };
                    }
                    if (keys.ctype === "list" && duration !== null) {
                        for (var j = 0; j < keys.value.length; ++j) {
                            var note = getNote(keys.value[j]);
                            var v = vel;
                            if (accent) v = Math.min(127, (v * 1.5) | 0);
                            if (note >= 0 && note <= 127) {
                                melody.push({
                                    event: "note",
                                    chan: channel,
                                    time: time,
                                    note: note,
                                    vel: v,
                                    duration: duration,
                                });
                                instruments[inst] = true;
                            } // note 0 - 127
                        } // for all notes of this chord
                        time += length;
                        accent = false;
                    } // chord and duration
                } // case distinction bases on length of nested list
            } // item is a nested list
        } // for each list element
        if (melody.length !== 0) {
            melody.sort(function(a, b) {
                return a.time - b.time;
            });
            var allLoaded = true;
            instruments = Object.keys(instruments);
            // console.log("Instruments used in melody:", instruments);
            for (var k = 0; k < instruments.length; ++k) {
                var status = instrumentStatus[instruments[k]];
                if (status !== STATUS.LOADED) {
                    allLoaded = false;
                    if (!status)
                        instrumentStatus[instruments[k]] = STATUS.REQUESTED;
                }
            }
            if (allLoaded) {
                playMelody(MIDI.now(), melody);
            } else {
                triggerLoad();
            }
        }
        return api.nada;
    });

    function playMelody(t0, melody) {
        var maxChunk = 20;
        if (melody.length > maxChunk) {
            var delta = (melody[maxChunk].time + t0 - MIDI.now()) * 1000 - 200;
            if (delta < 0) delta = 0;
            setTimeout(playMelody, delta, t0, melody.slice(maxChunk));
            melody = melody.slice(0, maxChunk);
        }
        for (var i = 0; i < melody.length; ++i) {
            var ev = melody[i];
            if (ev.event === "note") {
                //console.log(ev.note, "at", ev.time, "for", ev.duration);
                MIDI.noteOn(
                    ev.chan, ev.note, ev.vel, t0 + ev.time);
                MIDI.noteOff(
                    ev.chan, ev.note, t0 + ev.time + ev.duration);
            }
        }
    }

    var tonenames = {
        "p": -1,
        "P": -1,
        "C'": 36,
        "Cis'": 37,
        "Des'": 37,
        "D'": 38,
        "Dis'": 39,
        "Es'": 39,
        "E'": 40,
        "F'": 41,
        "Fis'": 42,
        "Ges'": 42,
        "G'": 43,
        "Gis'": 44,
        "As'": 44,
        "A'": 45,
        "Ais'": 46,
        "B'": 46,
        "H'": 47,
        "C": 48,
        "Cis": 49,
        "Des": 49,
        "D": 50,
        "Dis": 51,
        "Es": 51,
        "E": 52,
        "F": 53,
        "Fis": 54,
        "Ges": 54,
        "G": 55,
        "Gis": 56,
        "As": 56,
        "A": 57,
        "Ais": 58,
        "B": 58,
        "H": 59,
        "c": 60,
        "cis": 61,
        "des": 61,
        "d": 62,
        "dis": 63,
        "es": 63,
        "e": 64,
        "f": 65,
        "fis": 66,
        "ges": 66,
        "g": 67,
        "gis": 68,
        "as": 68,
        "a": 69,
        "ais": 70,
        "b": 70,
        "h": 71,
        "c'": 72,
        "cis'": 73,
        "des'": 73,
        "d'": 74,
        "dis'": 75,
        "es'": 75,
        "e'": 76,
        "f'": 77,
        "fis'": 78,
        "ges'": 78,
        "g'": 79,
        "gis'": 80,
        "as'": 80,
        "a'": 81,
        "ais'": 82,
        "b'": 82,
        "h'": 83,
        "c''": 84,
        "cis''": 85,
        "des''": 85,
        "d''": 86,
        "dis''": 87,
        "es''": 87,
        "e''": 88,
        "f''": 89,
        "fis''": 90,
        "ges''": 90,
        "g''": 91,
        "gis''": 92,
        "as''": 92,
        "a''": 93,
        "ais''": 94,
        "b''": 94,
        "h''": 95,
        "c'''": 96,
    };

    function getNote(arg) {
        if (arg.ctype === "number")
            return arg.value.real | 0;
        if (arg.ctype === "string" && tonenames.hasOwnProperty(arg.value))
            return tonenames[arg.value];
        return null;
    }

    var loadTimeout = null;

    function triggerLoad() {
        if (loadTimeout === null &&
            (midijsStatus === STATUS.INITIAL ||
             midijsStatus === STATUS.LOADED)) {
            loadTimeout = setTimeout(doLoad, 0);
        }
    }

    function doLoad() {
        loadTimeout = null;
        var inst = [];
        for (var i = -1; i < instrumentStatus.length; ++i) {
            if (instrumentStatus[i] === STATUS.REQUESTED) {
                instrumentStatus[i] = STATUS.LOADING;
                inst.push(i);
            }
        }
        if (inst.length === 0) return;
        console.log("MIDI instruments requested:", inst);
        function success() {
            for (var i = 0; i < inst.length; ++i) {
                instrumentStatus[inst[i]] = STATUS.LOADED;
            }
            midijsStatus = STATUS.LOADED;
            triggerLoad(); // in case more instruments got requested
            api.instance.evokeCS(""); // trigger repaint
        }
        if (midijsStatus === STATUS.INITIAL) {
            midijsStatus = STATUS.LOADING;
	    window.MIDI.loadPlugin({
	        soundfontUrl: soundfont,
	        instruments: inst.slice(),
	        onsuccess: function() {
                    MIDI = window.MIDI;
                    for (var ch = 0; ch < chan2inst.length; ++ch) {
                        MIDI.setInstrument(ch, chan2inst[ch]);
                    }
                    success();
                    console.log("MIDI ready");
	        }
	    });
        } else {
            midijsStatus = STATUS.LOADING;
            MIDI.loadResource({
                instruments: inst.slice(),
                onsuccess: success
            });
        }
    }

});
