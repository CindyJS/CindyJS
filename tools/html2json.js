"use strict";

var fs = require("fs"), http = require("http");

if (process.argv.length !== 3) {
    console.error(
        "Usage: " + process.argv[0] + " " + process.argv[1] +
        " INPUT.html\nInput can be a local path or a remote HTTP URL.");
}

var input = process.argv[2];
if (/^https?:\/\//.test(input))
    http.get(input, function(res) {
        res.setEncoding('utf8');
        readStream(res);
    });
else
    readStream(fs.createReadStream(input, {encoding:'utf8'}));

var content = '', params;

function readStream(stream) {
    stream.on('data', addToBuffer);
    stream.on('end', transform);
}

function addToBuffer(data) {
    content += data;
}

function transform() {
    var reScript = /<script([^>]*)>([^]*?)<\/script>/ig;
    var reCindy = /CindyJS/;
    var reId = /\sid\s*=\s*["']([^"']+)["']/;
    var byId = {};
    var cindys = [];
    var match;
    var events=["move","keydown","mousedown","mouseup","mousedrag",
                "init","tick","draw"];
    while ((match = reScript.exec(content)) !== null) {
        var attr = match[1];
        var script = match[2];
        match = reId.exec(attr);
        if (match)
            byId[match[1]] = script;
        if (reCindy.test(script))
            cindys.push(script);
    }
    if (cindys.length === 1) {
        var fun = Function(
            "CindyJS", "defaultAppearance", // passed below
            "require", "module", // undefined for SOME security
            cindys[0]);
        var params = null, defaultAppearance = {};
        fun(function(arg) { params = arg; }, defaultAppearance);
        if (!params) {
            console.error("CindyJS not called");
            process.exit(1);
        }
        if (params.defaultAppearance === null)
            params.defaultAppearance = defaultAppearance;
        var scripts = {}, scriptpat = params.scripts;
        if (typeof scriptpat !== "string")
            scriptpat = null;
        events.forEach(function(s){
            if(params.scripts && params.scripts[s]) {
                scripts[s] = param.scripts[s];
            } else {
                var sname = s+"script", code;
                if(params[sname]){
                    code = byId[params[sname]];
                    delete params[sname];
                } else if (scriptpat) {
                    code = byId[scriptpat.replace(/\*/, s)];
                }
                if (!code)
                    return;
                scripts[s] = condense(code);
            }
        });
        params.scripts = scripts;
        console.log(JSON.stringify(params));
    }
    else {
        console.error(cindys.length + " CindyJS invocations found");
        process.exit(1);
    }
}

// The following is a Copy & Paste from Parser.js.

//*******************************************************
// this function removes all comments spaces and newlines
//*******************************************************

function condense(code) {
	var literalmode = false;
	var commentmode = false;
	var erg = '';
	for (var i = 0; i < code.length; i++) {
		var closetoend = (i === code.length - 1);
		var c = code[i];
		if (c === '\"' && !commentmode)
			literalmode = !literalmode;

		if (c === '/' && (i !== code.length - 1))
			if (code[i + 1] === '/')
				commentmode = true;
		if (c === '\n')
			commentmode = false;
		if (!(c === '\u0020' || c === '\u0009' || c === '\u000A' || c === '\u000C' || c === '\u000D' || commentmode) || literalmode)
			erg = erg + c;
	}
	return erg;
}
