/* returns [0, 1, ..., n-1] */
let range = n => Array.from(Array(n).keys());

/* How should a vecn be composed, e.g. sizes 7 = [3,4] i.e. struct vec7 {vec3 a0, vec4 a1} */
let sizes = n => n <= 4 ? [n] : n == 5 ? [2, 3] : sizes(n - 4).concat([4]);

let computeidx = (k, n) => {
    let s = sizes(n);
    for (let i in s) {
        if (s[i] <= k) k -= s[i];
        else return {
            first: i,
            second: k
        };
    }
    console.error('Accessing index out of range');
};

//get childs of types that are formed from structs
function genchilds(t) {
    let fp = finalparameter(t);
    let d = depth(t);
    if (fp === type.complex) {
        let rt = replaceCbyR(t);
        return (d === 0 ? ["x", "y"] : ["real", "imag"]).map(name => ({
            type: rt,
            name: name
        }));
    } else if (issubtypeof(fp, type.float)) {
        if (d == 1) {
            return sizes(t.length).map((k, i) => ({
                type: type.vec(k),
                name: `a${i}`
            }));
        } else if (d => 2) {
            return range(t.length).map(i => ({
                type: t.parameters,
                name: `a${i}`
            }));
        }
    }
    return [];
}


function createstruct(t, codebuilder) {
    if (isnativeglsl(t)) return;
    let name = webgltype(t);
    codebuilder.add('structs', name, () => `struct ${name} { ${
    genchilds(t).map(ch => createstruct(ch.type, codebuilder) || `${webgltype(ch.type)} ${ch.name};`).join('')
  }};`);
  
}

function generatematmult(t, modifs, codebuilder) {
  if(isnativeglsl(t)) return;
  let n = t.length;
  let m = t.parameters.length;
    createstruct(type.vec(m), codebuilder);
    createstruct(type.vec(n), codebuilder);
    createstruct(t, codebuilder);
    let name = `mult${n}_${m}`;
    codebuilder.add('functions', name, () =>  `vec${n} mult${n}_${m}(mat${n}_${m} a, vec${m} b){` +
        'return ' + usevec(n)(range(n).map(k => usedot(m)([`a.a${k}`, 'b'], modifs, codebuilder)), modifs, codebuilder) + ';' +
        '}');
}

function generatecmatmult(t, modifs, codebuilder) {
  let n = t.length;
  let m = t.parameters.length;
    createstruct(type.vec(m), codebuilder);
    createstruct(type.vec(n), codebuilder);
    createstruct(t, codebuilder);
    let rt = replaceCbyR(t);
    let name = `cmult${n}_${m}`;
    //(A.real+i*A.imag)*(b.real+i*b.imag) = (A.real*b.real - A.imag*b.imag) + i *(A.real*b.imag+A.imag*b.real)
    // from measurements it turend that this is the fastest for 2x2 matrices (better than component wise complex multiplication or using [[a, -b], [b, a]] submatrices)
    codebuilder.add('functions', name, () =>  `cvec${n} cmult${n}_${m}(cmat${n}_${m} a, cvec${m} b){
      return cvec${n}(${
        usesub(rt.parameters)([
          usemult(rt)(['a.real','b.real'], modifs, codebuilder),
          usemult(rt)(['a.imag','b.imag'], modifs, codebuilder)
        ], modifs, codebuilder)
      },${
        useadd(rt.parameters)([
          usemult(rt)(['a.real','b.imag'], modifs, codebuilder),
          usemult(rt)(['a.imag','b.real'], modifs, codebuilder)
        ], modifs, codebuilder)
      });
    }`);
}

function generatedot(n, codebuilder) {
    if((2 <= n && n<=4)) return;
    createstruct(type.vec(n), codebuilder);
    let name = `dot${n}`;
    codebuilder.add('functions', name, () =>  `float dot${n}(vec${n} a, vec${n} b) {
    return ${ sizes(n).map((size, k) => `dot(a.a${k},b.a${k})`).join('+')}; }`);
}

function generateadd(t, modifs, codebuilder) {
    let name = `add${webgltype(t)}`;
    codebuilder.add('functions', name, () =>  `${webgltype(t)} ${name}(${webgltype(t)} a, ${webgltype(t)} b) {
    return ${webgltype(t)}(${
        genchilds(t).map(ch => `${webgltype(ch.type)}(${
          useadd(ch.type)([`a.${ch.name}`,`b.${ch.name}`], modifs, codebuilder)
        })`).join(',')
      });
    }`);
}

function generatesub(t, modifs, codebuilder) {
    let name = `sub${webgltype(t)}`;
    codebuilder.add('functions', name, () =>  `${webgltype(t)} ${name}(${webgltype(t)} a, ${webgltype(t)} b) {
    return ${webgltype(t)}(${
        genchilds(t).map(ch => `${webgltype(ch.type)}(${
          usesub(ch.type)([`a.${ch.name}`,`b.${ch.name}`], modifs, codebuilder)
        })`).join(',')
      });
    }`);
}

function generatescalarmult(t, modifs, codebuilder) {
    let name = `scalarmult${webgltype(t)}`;
    codebuilder.add('functions', name, () =>  `${webgltype(t)} ${name}(float a, ${webgltype(t)} b) {
    return ${webgltype(t)}(${
          genchilds(t).map(ch => `${webgltype(ch.type)}(${
            usescalarmult(ch.type)([`a`,`b.${ch.name}`], modifs, codebuilder)
          })`).join(',')
        });
    }`);
}

function generatecscalarmult(t, modifs, codebuilder) {
    let name = `cscalarmult${webgltype(t)}`;
    let rt = replaceCbyR(t);

    codebuilder.add('functions', name, () =>  `${webgltype(t)} ${name}(vec2 a, ${webgltype(t)} b) {
    return ${webgltype(t)}(${
      usesub(rt)([
        usescalarmult(rt)(['a.x','b.real'], modifs, codebuilder),
        usescalarmult(rt)(['a.y','b.imag'], modifs, codebuilder)
      ], modifs, codebuilder)
    },${
      useadd(rt)([
        usescalarmult(rt)(['a.x','b.imag'], modifs, codebuilder),
        usescalarmult(rt)(['a.y','b.real'], modifs, codebuilder)
      ], modifs, codebuilder)
    });}`);
}

function usemult(t) {
  if (isnativeglsl(t)) return useinfix('*');
  return (args, modifs, codebuilder) => generatematmult(t, modifs, codebuilder) || `mult${t.length}_${t.parameters.length}(${args.join(',')})`;
}

function usecmult(t) {
return (args, modifs, codebuilder) => generatematmult(t, modifs, codebuilder) || `cmult${t.length}_${t.parameters.length}(${args.join(',')})`;
}

function usedot(n) {
  return (args, modifs, codebuilder) => generatedot(n, codebuilder) || `dot${(2 <= n && n<=4) ? '' : n}(${args.join(',')})`;
}

function useadd(t) {
  if(isnativeglsl(t)) return useinfix('+');
  else return (args, modifs, codebuilder) => generateadd(t, modifs, codebuilder) || `add${webgltype(t)}(${args.join(',')})`;
}

function usesub(t) {
  if(isnativeglsl(t)) return useinfix('-');
  else return (args, modifs, codebuilder) => generatesub(t, modifs, codebuilder) || `sub${webgltype(t)}(${args.join(',')})`;
}
  
function usevec(n) {
    if(2 <= n && n <= 4) return args => `vec${n}(${args.join(',')})`;
    let cum = 0;
    return (args, modifs, codebuilder) => createstruct(type.vec(n), codebuilder) ||
        `vec${n}(${
        sizes(n).map( s =>
          `vec${s}(${range(s).map(l => ++cum && args[cum-1]).join(',')})`
        ).join(',')
      })`;
}

function usemat(n, m) { //create a nxm matrix by given n row-vectors of length m
    if(n == m && 2 <= n && n <= 4) //transpose by hand as it is not supported in WebGL
      return args => `mat${n}(${range(n).map(k => `vec${n}(${ //col k
      range(n).map(i => `${args[i]}[${k}]`).join(',') 
    })`).join(',')}`;
    let cum = 0;
    return (args, modifs, codebuilder) => createstruct(list(n, type.vec(m)), codebuilder) ||
      `cmat${n}_${m}(${
          args.join(',')
      })`;
}

function usecvec(n) {
    return (args, modifs, codebuilder) => createstruct(type.cvec(n), codebuilder) ||
        `cvec${n}(${
          usevec(n)(args.map(a => `(${a}).x`), modifs, codebuilder)
        },${
          usevec(n)(args.map(a => `(${a}).y`), modifs, codebuilder)
        })`;
}


function accessvecbyshifted(n) {
  return (args, modifs, codebuilder) => { //works only for hardcoded glsl
      createstruct(type.vec(n), codebuilder);
      let k = Number(args[1]) - 1;
      if(2 <= n && n <= 4)
          return `(${args[0]})[${k}]`;
      let idx = computeidx(k, n);
      return `(${args[0]}).a${idx.first}[${idx.second}]`;
  };
}

function accesscvecbyshifted(n) {
  return (args, modifs, codebuilder) => { //works only for hardcoded glsl
      return `vec2(${
        accessvecbyshifted(n)([args[0]+'.real', args[1]], modifs, codebuilder)
      },${
        accessvecbyshifted(n)([args[0]+'.imag', args[1]], modifs, codebuilder)
      })`;
  };
}

function usescalarmult(t) { //assume t is a R or C-vectorspace
  if(isnativeglsl(t)) return useinfix('*');
  return (args, modifs, codebuilder) => generatescalarmult(t,modifs, codebuilder) || `scalarmult${webgltype(t)}(${args.join(',')})`;
}

function usecscalarmult(t) { //assume t is a C-vectorspace
  return (args, modifs, codebuilder) => generatecscalarmult(t,modifs, codebuilder) || `cscalarmult${webgltype(t)}(${args.join(',')})`;
}
