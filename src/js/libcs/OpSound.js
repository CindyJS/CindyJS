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


    var v0 = evaluateAndVal(args[0]);
    var linenumber = 0;
    if (v0.ctype === 'number') {
        handleModifs();
        var lines = sound.lines;
        var f = v0.value.real;
        if (lines[linenumber] === 0) {
            // Was bitte sollte die Funktion T an dieser Stelle sein?
            // lines[linenumber]=T("sin", {freq:f,mul:0.6}).play();


        } else {
            lines[linenumber].set({
                freq: f
            });
        }

    }
    return nada;

};
