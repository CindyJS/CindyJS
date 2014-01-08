

//==========================================
//      Namespace and Vars
//==========================================



function Nada(){this.ctype='undefined'};
function Void(){this.ctype='void'};
function Error(msg){this.ctype='error';this.message=msg};
nada= new Nada();

function Namespace(){
    this.vars={
        'pi':{'ctype':'variable','stack':[{'ctype':'number','value':{'real':3.1415926,'imag':0}}],'name':'pi'},
        'i':{'ctype':'variable','stack':[{'ctype':'number','value':{'real':0,'imag':1}}],'name':'i'},
        'true':{'ctype':'variable','stack':[{'ctype':'boolean','value':true}],'name':'true'},
        'false':{'ctype':'variable','stack':[{'ctype':'boolean','value':false}],'name':'false'},
        '#':{'ctype':'variable','stack':[nada],'name':'#'},
    }
    this.isVariable= function(a){
        return this.vars[a]!== undefined;
        
    }
    
    this.isVariableName = function(a){//TODO will man das so? Den ' noch dazu machen
        
        if (a=='#') return true;
        if (a=='#1') return true;
        if (a=='#2') return true;
        
        var b0 =  /^[a-z,A-Z]+$/.test(a[0]);
        var b1 =  /^[0-9,a-z,A-Z]+$/.test(a);
        return b0 && b1;
    }
    
    this.create =function(code){
        this.vars[code]={'ctype':'variable','stack':[],'name':code};
        return this.vars[code];
    }
    
    this.newvar =function(code){
        if(this.vars[code]===undefined){
            return this.create(code);
        }
        this.vars[code].stack.push(nada);
        return this.vars[code];
    }
    
    this.removevar=function(code){
        this.vars[code].stack.pop();
    }
    
    
    this.setvar= function(code,val) {
        var stack=this.vars[code].stack;
        stack[stack.length-1]=val;
    }
    
    this.getvar= function(code) {

        var stack=this.vars[code].stack;
        var erg=stack[stack.length-1];
        if(stack.length==0 && stack[stack.length-1]==nada){//Achtung das erforder das der GeoTeil da ist.
            if(typeof csgeo.csnames[code] !== 'undefined'){
                return {'ctype':'geo','value':gslp[csgeo.csnames[code]]}
            }
        }
        return erg;
    }
    
    this.dump= function(code) {
        var stack=this.vars[code].stack;
        console.log("*** Dump "+code);
        
        for(var i=0;i<stack.length;i++){
            console.log(i+":> "+ niceprint(stack[i]))
            
        }
        
    }
    
    
    
    
}

namespace =new Namespace();
