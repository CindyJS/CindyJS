"use strict";

var v = process.version;
v = v.replace(/^v/,"");
v = v.split(".");
v = v.map(function(s){
  return parseInt(s);
});
if (v[0] < 4) {
  console.error("Node 4.0 or later required. Version " +
                process.version + " found");
  process.exit(1);
}
