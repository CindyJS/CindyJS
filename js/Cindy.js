
//*******************************************************
// This is the main ressource loader for CindyJS
//*******************************************************

var Cindy=Cindy || {};

(function() {
  console.log("Welcome to Cindy");
  var scripts={};
  var scount=0;
  var snames=[];
    
    function compileCindy(){
        sc="";
        for(var i=0;i<snames.length;i++){
            var sc=sc+scripts[snames[i]]+";\n\n\n";
        }
       // eval(sc);
       sc="(function(){"+sc+"})();"
        
     //   console.log(sc);
        
            script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.onload = function(){
        // remote script has loaded
    };
    script.innerHTML = sc;
    document.getElementsByTagName('head')[0].appendChild(script);

        
    }
    
    
    function loadRessource(name){
        snames[snames.length]=name;
        
        function reqListener () {
            console.log("..loaded: "+name);
            scripts[name]=this.responseText;
            scount++;
            if(scount==snames.length){
            console.log("..finished loading.. ");
            compileCindy();
            }
        }
        
        var oReq = new XMLHttpRequest();
        oReq.onload = reqListener;
        oReq.open("get",name , true);
        oReq.send();
        
    }

    
    
    
            loadRessource("js/libgeo/GeoState.js");
            loadRessource("js/libgeo/GeoBasics.js");
            loadRessource("js/libgeo/GeoOps.js");

            loadRessource("js/libcs/Namespace.js");
            loadRessource("js/libcs/Accessors.js");
            loadRessource("js/libcs/CSNumber.js");
            loadRessource("js/libcs/List.js");
            loadRessource("js/libcs/Essentials.js");
            loadRessource("js/libcs/General.js");
            loadRessource("js/libcs/Operators.js");
            loadRessource("js/libcs/OpDrawing.js");
            loadRessource("js/libcs/OpImageDrawing.js");
            loadRessource("js/libcs/Parser.js");
             loadRessource("js/lib/d3.js");
            loadRessource("js/lib/numeric-1.2.6.js");
            loadRessource("js/lib/clipper/clipper.js");

            loadRessource("js/rest.js");
            
            console.log(snames);

          
})();
