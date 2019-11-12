"use strict";
var should = require("chai").should();
var rewire = require("rewire");

global.navigator = {};
var CindyJS = require("../build/js/Cindy.plain.js");

var cdy = CindyJS({
            isNode: true,
            csconsole: null,
            geometry: [
                {name:"A", type:"Free", pos:[0,0]},
                {name:"B", type:"Free", pos:[1,1]},
                {name:"C", type:"Free", pos:[1,2]},
            ],
        });

function itCmd(command, expected) {
    it(command, function() {
        String(cdy.niceprint(cdy.evalcs(command))).should.equal(expected);
    });
}

function getJSONStr() {
return "{\"age\":30, \"bool\":false, \"cars\":[{\n \"models\": [\n  \"Fiesta\",\n  \"Focus\",\n  \"Mustang\"\n ],\n \"name\": \"Ford\"\n}, {\n \"models\": [\n  \"320\",\n  \"X3\",\n  \"X5\"\n ],\n \"name\": \"BMW\"\n}, {\n \"models\": [\n  \"500\",\n  \"Panda\"\n ],\n \"name\": \"Fiat\"\n}], \"name\":\"Joe\"}"
}

function getJSONprettyStr() {
    return '{age:30, bool:false, cars:[{models:[Fiesta, Focus, Mustang], name:Ford}, {models:[320, X3, X5], name:BMW}, {models:[500, Panda], name:Fiat}], name:Joe, test:circle, undef:___}';
}

describe("JSON basic getter / setter", function(){
    before(function(){
        cdy.evalcs('circ = circle(A,1);');
        cdy.evalcs('json = ' + getJSONStr());
        cdy.evalcs('json.test = circ;');
        cdy.evalcs('json.undef = undef;');
        }
    );

    itCmd('json.name', 'Joe');
    itCmd('json.bool', 'false');
    itCmd('json.undef', '___');
    itCmd('json.age', '30');
    itCmd('((json.cars)_1).models_2', 'Focus');
    itCmd('json.test', 'circle');

    // pretty print
    itCmd('json', getJSONprettyStr());

    // keys
    itCmd('keys(json)', '[age, bool, cars, name, test, undef]');

    // values  
    itCmd('values({"a" : 5, "b" : 2})', '[5, 2]');

    // dynamic access
    itCmd('myvar = "name"; json_myvar = "Bob"; json.name', 'Bob');
    itCmd('json_undef', '___');
    itCmd('json1 = {"1":2}; json1_1', '2');
    itCmd('json1 = {"1":2}; json1_"1"', '2');

    // copy by reference
    itCmd('json1 = {"a":1}; json2=json1; json2.a=2; json1.a', '2');
    itCmd('json1 = {"a":1}; json2=json1; myvar = "a"; json2_myvar=2; json1.a', '2');
});

describe("JSON geo objects", function(){
    before(function(){
        cdy.evalcs('geojson = {"pt1": A, "pt2": B, "pt3" : C};');
        }
    );

    itCmd('(geojson.pt1).xy', '[0, 0]');
    itCmd('geojson.pt1 = C; (geojson.pt1).xy', '[1, 2]');
});

describe("JSON operations", function(){
    before(function(){
        cdy.evalcs('json3 = {"a": 1, "b": 2, "c": 10, "d" : "string" };');
        }
    );

    itCmd('apply(json3, #^2)', '{a:1, b:4, c:100, d:___}');
    itCmd('select(json3, isOdd(#))', '{a:1}');

    itCmd('li = []; forall(json3,v, li = li++[[v.key, v.value]], iterator->"pair"); li', '[[a, 1], [b, 2], [c, 10], [d, string]]');

    itCmd('li = []; forall(json3,v, li = li++[v], iterator->"key"); li', '[a, b, c, d]');

    itCmd('v=123;apply(json3,v, v^2); v', '123');


    // 4ary apply
    itCmd('apply(json3, v, k, v+k)', '{a:1a, b:2b, c:10c, d:stringd}');
    // check that keys are by value and not by reference
    itCmd('apply(json3, v, k, k=k+1; v=v+2);', '{a:3, b:4, c:12, d:string2}');

    function cycleString(){
        return '{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:13, sister:{age:15, brother:{age:..., sister:...}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}'
    }
    // cycles 
    itCmd('Jason = {"age":13};Jasonica = {"age":15};Jason.sister = Jasonica; Jasonica.brother = Jason; Jason;', cycleString());

});


