CindyJS.registerPlugin(1, "midi", function(api) {

    //var soundfont = CindyJS.getBaseDir() + "soundfont/";
    var soundfont = "http://cindyjs.org/soundfont/";

    var waiting = 2;

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
        REQUESTED: 1,
        LOADING: 2,
        LOADED: 3
    };

    CindyJS.loadScript("MIDI", "midi/MIDI.js", someScriptLoaded);
    CindyJS.loadScript("Base64Binary", "midi/Base64binary.js", someScriptLoaded);

    function someScriptLoaded() {
        if (--waiting === 0) doLoad();
    }

    // Placeholder object while we wait for MIDI.js library to load
    var MIDI = {
        isPlaceholder: true,
        getInstrument: function(ch) {
            return chan2inst[ch];
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

    api.defineFunction("playtone", 1, function(args, modifs) {
        var note = api.evaluate(args[0]);
        if (note.ctype !== "number") return nada;
        note = Math.round(note.value.real);

        var vel = numModif(modifs.velocity, 1) * 127;
        var chan = Math.round(numModif(modifs.channel, 0));

        var inst = MIDI.getInstrument(chan);
        var status = instrumentStatus[inst];
        if (status === STATUS.LOADED) { // can play
	    MIDI.noteOn(chan, note, vel, 0);
	    MIDI.noteOff(chan, note , .9);
        } else if (!status) { // must load
            instrumentStatus[inst] = STATUS.REQUESTED;
            triggerLoad();
        }
        return api.nada;
    });

    var loadTimeout = null;

    function triggerLoad() {
        if (loadTimeout === null) {
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
        }
        if (MIDI.isPlaceholder) {
            if (MIDI.startetLoading) return;
            MIDI.startedLoading = true;
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
            MIDI.loadResource({
                instruments: inst.slice(),
                onsuccess: success
            });
        }
    }

});
