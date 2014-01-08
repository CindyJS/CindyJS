
//*******************************************************
// This is the main ressource loader for CindyJS
//*******************************************************

var Cindy=Cindy || {};

(function() {
  console.log("Welcome to Cindy");

    function executeCindy(scripts,callback){
        console.log("..executingCindy..");
        console.log(scripts.length);
        console.log(scripts[0]);
        eval(scripts[0]);
        eval(scripts[1]);
        eval(scripts[2]);
        eval(scripts[3]);
        eval(scripts[4]);
        eval(scripts[5]);
        eval(scripts[6]);
        eval(scripts[7]);
        eval(scripts[8]);
        eval(scripts[9]);
        eval(scripts[10]);
        eval(scripts[11]);
        eval(scripts[12]);
        eval(scripts[13]);
        eval(scripts[14]);
        eval(scripts[15]);
        callback();
    
    
    }
    
    function loadRessources(list,callback){
        function reqListener (callback) {

            scripts[scripts.length]=this.responseText;
            console.log("READ "+name);
            console.log(this.responseText);
       //     loadRessources(list2,callback);
        }

        if(list.length==0){
            console.log("..finished loading..");
            executeCindy(scripts,callback);
            return;
        }

        var list2=list.reverse();
        var name=list2.pop();
        list2=list2.reverse();
        console.log("HALLO");

        
        var oReq = new XMLHttpRequest();
        oReq.onload = reqListener(callback);
        console.log("HALLO AFTER");

        console.log("*  "+name);
        oReq.open("get",name , true);
        oReq.send();
        
        
    }

    
    var call=function(){
        console.log(CSNumber.real(5));
    
    };
            scripts=[];

            loadRessources([
            "js/libgeo/GeoState.js",
            "js/libgeo/GeoBasics.js",
            "js/libgeo/GeoOps.js",
            "js/libcs/Namespace.js",
            "js/libcs/Accessors.js",
            "js/libcs/CSNumber.js",
            "js/libcs/List.js",
            "js/libcs/Essentials.js",
            "js/libcs/General.js",
            "js/libcs/Operators.js",
            "js/libcs/OpDrawing.js",
            "js/libcs/OpImageDrawing.js",
            "js/libcs/Parser.js",
            "js/lib/d3.js",
            "js/lib/numeric-1.2.6.js",
            "js/lib/clipper/clipper.js"],call);

          
})();
