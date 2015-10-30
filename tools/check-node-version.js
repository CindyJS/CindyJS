var v = process.version;
v = v.replace(/^v/,"");
v = v.split(".");
v = v.map(function(s){
  return parseInt(s);
});
if (v[0] > 0 || v[1] >= 12)
  process.exit(0);

console.error("Node 0.12 or later required. Version " + process.version + " found");
process.exit(1);
