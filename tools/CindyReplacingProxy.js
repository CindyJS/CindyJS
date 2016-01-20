"use strict";

/**
 * Start this script here, then configure your browser to use
 * host 127.0.0.1 (localhost) port 8080 as its proxy for HTTP connections.
 * Any site you visited will have files Cindy.js and Cindy3D.js
 * replaced by versions from your current build.
 * This won't work for HTTPS sites.
 */

var fs = require("fs");
var urlParse = require("url").parse;
var http = require("http");
var httpProxy = require("http-proxy");

var port = +process.argv[2] || 8080;
var proxy = httpProxy.createProxyServer({});
var intercept = [
    {pattern: /Cindy\.js$/, path: "build/js/Cindy.js"},
    {pattern: /Cindy3D\.js$/, path: "build/js/Cindy3D.js"},
    {pattern: /CindyGL\.js$/, path: "build/js/CindyGL.js"},
];

http.createServer(function(req, res) {
    var urlStr = req.url, url = urlParse(urlStr), i, ic, stream;
    
    for (i = 0; i < intercept.length; ++i) {
        ic = intercept[i];
        if (ic.pattern.test(url.pathname)) {
            if (req.method === "GET" || req.method === "HEAD") {
                console.log("# " + urlStr);
                res.setHeader("Content-Type", ic.type || "text/javascript");
                stream = fs.createReadStream(ic.path);
                stream.on('open', queryLength);
                return;
            }
        }
    }

    function queryLength(fd) {
        fs.fstat(fd, setLength);
    }
    function setLength(err, stats) {
        if (err) throw err;
        res.setHeader("Content-Length", ""+stats.size);
        if (req.method === "HEAD") res.end();
        else stream.pipe(res);
    }

    console.log("  " + urlStr);
    proxy.web(req, res, {target:req.url, prependPath:false});

}).listen(port, "127.0.0.1");
