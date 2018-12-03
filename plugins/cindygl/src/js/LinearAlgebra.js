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

    if (d == 1 && fp === type.float) {
        return sizes(t.length).map((k, i) => ({
            type: type.vec(k),
            name: `a${i}`
        }));
    } else if (d >= 1) {
        return range(t.length).map(i => ({
            type: t.parameters,
            name: `a${i}`
        }));
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
    if (isnativeglsl(t)) return;
    let n = t.length;
    let m = t.parameters.length;
    let name = `mult${n}_${m}`;
    codebuilder.add('functions', name, () => `${webgltype(type.vec(n))} mult${n}_${m}(${webgltype(t)} a, ${webgltype(type.vec(m))} b){` +
        'return ' + usevec(n)(range(n).map(k => usedot(m)([`a.a${k}`, 'b'], modifs, codebuilder)), modifs, codebuilder) + ';' +
        '}');
}

function generatesum(t, modifs, codebuilder) {
    if (isnativeglsl(t) && depth(t) <= 1) return;
    let n = t.length;
    let name = `sum${webgltype(t)}`;

    codebuilder.add('functions', name, () => `${webgltype(t.parameters)} ${name}(${webgltype(t)} a){` +
        `${webgltype(t.parameters)} res = ${constantreallist(t.parameters, 0)([],modifs,codebuilder)};
      ${
        range(n).map(k =>
          'res = ' + useadd(t.parameters)(['res',
          accesslist(t, k)(['a',k], modifs, codebuilder)
        ],modifs,codebuilder) + ';'
        ).join('\n')
      }
        return res;
    }`);
}

function generatecmatmult(t, modifs, codebuilder) {
    let n = t.length;
    let m = t.parameters.length;
    let name = `multc${n}_${m}`;
    codebuilder.add('functions', name, () => `${webgltype(type.cvec(n))} multc${n}_${m}(${webgltype(t)} a, ${webgltype(type.cvec(m))} b){
        return cvec${n}(${
          range(n).map(k => usecdot(m)([`a.a${k}`, 'b'], modifs, codebuilder))
        });
    }
    `);
}

function generatedot(n, codebuilder) {
    if ((2 <= n && n <= 4)) return;
    let name = `dot${n}`;
    codebuilder.add('functions', name, () => `float dot${n}(vec${n} a, vec${n} b) {
    return ${ sizes(n).map((size, k) => `dot(a.a${k},b.a${k})`).join('+')}; }
    `);
}

function generatecdot(n, modifs, codebuilder) {
    let name = `cdot${n}`; //TODO: do hardware tricks for accelleration
    codebuilder.add('functions', name, () => `vec2 cdot${n}(cvec${n} a, cvec${n} b) {
      return ${
        range(n).map(k => `vec2(dot(a.a${k},vec2(b.a${k}.x,-b.a${k}.y)), dot(a.a${k},b.a${k}.yx))`).join('+\n')
      };
    }
    `);
}

function generateadd(t, modifs, codebuilder) {
    let name = `add${webgltype(t)}`;
    codebuilder.add('functions', name, () => `${webgltype(t)} ${name}(${webgltype(t)} a, ${webgltype(t)} b) {
    return ${webgltype(t)}(${
        genchilds(t).map(ch => `${webgltype(ch.type)}(${
          useadd(ch.type)([`a.${ch.name}`,`b.${ch.name}`], modifs, codebuilder)
        })`).join(',')});
      }`);
}

function generatesub(t, modifs, codebuilder) {
    let name = `sub${webgltype(t)}`;
    codebuilder.add('functions', name, () => `${webgltype(t)} ${name}(${webgltype(t)} a, ${webgltype(t)} b) {
    return ${webgltype(t)}(${
        genchilds(t).map(ch => `${webgltype(ch.type)}(${
          usesub(ch.type)([`a.${ch.name}`,`b.${ch.name}`], modifs, codebuilder)
        })`).join(',')
      });
    }`);
}

function generatescalarmult(t, modifs, codebuilder) {
    let name = `scalarmult${webgltype(t)}`;
    codebuilder.add('functions', name, () => `${webgltype(t)} ${name}(float a, ${webgltype(t)} b) {
    return ${webgltype(t)}(${
          genchilds(t).map(ch => `${webgltype(ch.type)}(${
            usescalarmult(ch.type)([`a`,`b.${ch.name}`], modifs, codebuilder)
          })`).join(',')
        });
    }`);
}

function generatecscalarmult(t, modifs, codebuilder) {
    includefunction('multc', modifs, codebuilder);
    let name = `cscalarmult${webgltype(t)}`;
    codebuilder.add('functions', name, () => `${webgltype(t)} ${name}(vec2 a, ${webgltype(t)} b) {
    return ${webgltype(t)}(${
          genchilds(t).map(ch => `${
            usecscalarmult(ch.type)([`a`,`b.${ch.name}`], modifs, codebuilder)
          }`).join(',')
        });
    }`);
}

function usemult(t) {
    if (t === type.complex) return useincludefunction('multc');
    if (isnativeglsl(t)) return (args, modifs, codebuilder) => useinfix('*')([args[1], args[0]]); //swap multiplication order as matrices are interpreted as list of columns in glsl
    let fp = finalparameter(t);
    if (issubtypeof(fp, type.float))
        return (args, modifs, codebuilder) => generatematmult(t, modifs, codebuilder) || `mult${t.length}_${t.parameters.length}(${args.join(',')})`;
    else if (fp === type.complex)
        return (args, modifs, codebuilder) => generatecmatmult(t, modifs, codebuilder) || `multc${t.length}_${t.parameters.length}(${args.join(',')})`;
}

function usedot(n) {
    return (args, modifs, codebuilder) => generatedot(n, codebuilder) || `dot${(2 <= n && n<=4) ? '' : n}(${args.join(',')})`;
}

function usecdot(n) {
    return (args, modifs, codebuilder) => generatecdot(n, modifs, codebuilder) || `cdot${n}(${args.join(',')})`;
}

function useadd(t) {
    if (isnativeglsl(t)) return useinfix('+');
    else return (args, modifs, codebuilder) => generateadd(t, modifs, codebuilder) || `add${webgltype(t)}(${args.join(',')})`;
}

function usesub(t) {
    if (isnativeglsl(t)) return useinfix('-');
    else return (args, modifs, codebuilder) => generatesub(t, modifs, codebuilder) || `sub${webgltype(t)}(${args.join(',')})`;
}

function usesum(t) {
    if (isrvectorspace(t) && depth(t) == 1) return (args, modifs, codebuilder) => usedot(t.length)(
        [args[0], usevec(t.length)(Array(t.length).fill('1.'), modifs, codebuilder)], modifs, codebuilder);
    else return (args, modifs, codebuilder) => generatesum(t, modifs, codebuilder) || `sum${webgltype(t)}(${args.join(',')})`;
}

function usevec(n) {
    if (2 <= n && n <= 4) return args => `vec${n}(${args.join(',')})`;
    if (n == 1) return args => `float(${args.join(',')})`;
    let cum = 0;
    return (args, modifs, codebuilder) => createstruct(type.vec(n), codebuilder) || `vec${n}(${
        sizes(n).map( s =>
          `vec${s}(${range(s).map(l => ++cum && args[cum-1]).join(',')})`
        ).join(',')
      })`;
}

function uselist(t) {
    let d = depth(t);
    if (isnativeglsl(t)) {
        return (args, modifs, codebuilder) => `${webgltype(t)}(${args.join(',')})`;
    }
    if (d == 1 && t.parameters === type.float) return usevec(t.length);
    return (args, modifs, codebuilder) => createstruct(t, codebuilder) || `${webgltype(t)}(${args.join(',')})`;
}

function accesslist(t, k) {
    let d = depth(t);
    let fp = finalparameter(t);
    if (d == 1 && fp === type.float) {
        return accessvecbyshifted(t.length, k);
    } else if (isnativeglsl(t)) {
        return (args, modifs, codebuilder) => `(${args[0]})[${k}]`;
    }
    return (args, modifs, codebuilder) => `(${args[0]}).a${k}`;
}

/** creates a reallist of type t that has everywhere value val */
function constantreallist(t, val) {
    if (isnativeglsl(t))
        return (args, modifs, codebuilder) => `${webgltype(t)}(float(${val}))`;
    else
        return (args, modifs, codebuilder) => `${uselist(t)}(${
      genchilds(t).map(ch => constantreallist(ch.type, val)(args, modifs, codebuilder)).join(',')
    })`;
}

function accessvecbyshifted(n, k) {
    return (args, modifs, codebuilder) => { //works only for hardcoded glsl
        if (n == 1)
            return args[0];
        if (2 <= n && n <= 4)
            return `(${args[0]})[${k}]`;
        let idx = computeidx(k, n);
        return `(${args[0]}).a${idx.first}[${idx.second}]`;
    };
}

function usescalarmult(t) { //assume t is a R or C-vectorspace, multiply with real number
    if (isnativeglsl(t)) return useinfix('*');
    return (args, modifs, codebuilder) => generatescalarmult(t, modifs, codebuilder) || `scalarmult${webgltype(t)}(${args.join(',')})`;
}

function usecscalarmult(t) { //assume t is a R or C-vectorspace, multiply with complex number
    if (t === type.complex) return useincludefunction('multc');
    return (args, modifs, codebuilder) => generatecscalarmult(t, modifs, codebuilder) || `cscalarmult${webgltype(t)}(${args.join(',')})`;
}


// Build reverse function
function generatereverse(t, modifs, codebuilder) {
    let name = `reverse${webgltype(t)}`;
    codebuilder.add('functions', name, () => `${webgltype(t)} ${name}(${webgltype(t)} a){` +
        `${webgltype(t.parameters)} m;\n` +
        range(Math.floor(t.length / 2)).map(function(i) {
            let a = accesslist(t, i)(['a', i], modifs, codebuilder);
            let b = accesslist(t, t.length - 1 - i)(['a', t.length - 1 - i], modifs, codebuilder);
            //swap a<->b
            return `m = ${a}; ${a} = ${b}; ${b} = m;`;
        }).join('\n') +
        `return a;
      }`);
}


function usereverse(t) {
    return (args, modifs, codebuilder) => generatereverse(t, modifs, codebuilder) || `reverse${webgltype(t)}(${args.join(',')})`;
}


// Build max function
function generatemax(t, modifs, codebuilder) {
    let name = `max${webgltype(t)}`;
    codebuilder.add('functions', name, () => `${webgltype(t.parameters)} ${name}(${webgltype(t)} a){` +
        `${webgltype(t.parameters)} m = ${accesslist(t, t.length-1)(['a', t.length-1], modifs, codebuilder)};\n` +
        range(t.length - 1).map(function(i) {
            let a = accesslist(t, i)(['a', i], modifs, codebuilder);
            //update m to max
            return `m = max(m,${a});`;
        }).join('\n') +
        `return m;
      }`);
}

function usemax(t) {
    return (args, modifs, codebuilder) => generatemax(t, modifs, codebuilder) || `max${webgltype(t)}(${args.join(',')})`;
}


// Build min function
function generatemin(t, modifs, codebuilder) {
    let name = `min${webgltype(t)}`;
    codebuilder.add('functions', name, () => `${webgltype(t.parameters)} ${name}(${webgltype(t)} a){` +
        `${webgltype(t.parameters)} m = ${accesslist(t, t.length-1)(['a', t.length-1], modifs, codebuilder)};\n` +
        range(t.length - 1).map(function(i) {
            let a = accesslist(t, i)(['a', i], modifs, codebuilder);
            //update m to min
            return `m = min(m,${a});`;
        }).join('\n') +
        `return m;
      }`);
}

function usemin(t) {
    return (args, modifs, codebuilder) => generatemin(t, modifs, codebuilder) || `min${webgltype(t)}(${args.join(',')})`;
}


// Build transpose function
function generatetranspose(t, modifs, codebuilder) {
    let name = `transpose${webgltype(t)}`;
    let anst = list(t.parameters.length, list(t.length, t.parameters.parameters));
    codebuilder.add('functions', name, () => `${webgltype(anst)} ${name}(${webgltype(t)} a){` +
        'return ' + uselist(anst)(
            range(anst.length).map(
                i => uselist(anst.parameters)(
                    range(anst.parameters.length).map(
                        j => accesslist(t.parameters, i)(
                            [accesslist(t, j)(['a', j], modifs, codebuilder), i], modifs, codebuilder
                        )
                    ), modifs, codebuilder
                )), modifs, codebuilder
        ) + ';}');
}


function usetranspose(t) {
    return (args, modifs, codebuilder) => generatetranspose(t, modifs, codebuilder) || `transpose${webgltype(t)}(${args.join(',')})`;
}
