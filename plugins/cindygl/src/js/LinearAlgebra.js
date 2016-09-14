/* returns [0, 1, ..., n-1] */
let range = n => Array.from(Array(n).keys());

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


function createvecstruct(n, codebuilder) {
    if (2 <= n && n <= 4) return;
    let name = `vec${n}`;
    codebuilder.add('structs', name, `struct vec${n} { ${
        sizes(n).map((size,k) => `vec${size} a${k};`).join(' ')}};`);
}

function createcvecstruct(n, codebuilder) {
    let name = `cvec${n}`;
    createvecstruct(n, codebuilder);
    codebuilder.add('structs', name, `struct cvec${n} {vec${n} real; vec${n} imag;};`);
}

function createcmatstruct(n, m, codebuilder) {
    let name = `cmat${n}_${m}`;
    let realtype = webgltype(list(n, list(m, type.float)));
    codebuilder.add('structs', name, `struct cmat${n}_${m} {${realtype} real; ${realtype} imag;};`);
}

function creatematstruct(n, m, codebuilder) {
    if(n === m && 2 <= n && n <= 4) return;
    createvecstruct(m, codebuilder);
    let name = `mat${n}_${m}`;
    codebuilder.add('structs', name, `struct mat${n}_${m} {` +
        range(n).map(k => `vec${m} a${k};`).join('') +
        '};');
}

function generatematmult(n, m, modifs, codebuilder) {
    createvecstruct(m, codebuilder);
    createvecstruct(n, codebuilder);
    creatematstruct(n, m, codebuilder);
    let name = `mult${n}_${m}`;
    codebuilder.add('functions', name, `vec${n} mult${n}_${m}(mat${n}_${m} a, vec${m} b){` +
        'return ' + usevec(n)(range(n).map(k => usedot(m)([`a.a${k}`, 'b'], modifs, codebuilder)), modifs, codebuilder) + ';' +
        '}');
}

function generatecmatmult(n, m, modifs, codebuilder) {
  createcvecstruct(m, codebuilder);
  createcvecstruct(n, codebuilder);
  createcmatstruct(n, m, codebuilder);
    let name = `cmult${n}_${m}`;
    //(A.real+i*A.imag)*(b.real+i*b.imag) = (A.real*b.real - A.imag*b.imag) + i *(A.real*b.imag+A.imag*b.real)
    // from measurements it turend that this is the fastest for 2x2 matrices (better than component wise complex multiplication or using [[a, -b], [b, a]] submatrices)
    codebuilder.add('functions', name, `cvec${n} cmult${n}_${m}(cmat${n}_${m} a, cvec${m} b){
      return cvec${n}(${
        usesub(m)([
          usemult(n, m)(['a.real','b.real'], modifs, codebuilder),
          usemult(n, m)(['a.imag','b.imag'], modifs, codebuilder)
        ], modifs, codebuilder)
      },${
        useadd(m)([
          usemult(n, m)(['a.real','b.imag'], modifs, codebuilder),
          usemult(n, m)(['a.imag','b.real'], modifs, codebuilder)
        ], modifs, codebuilder)
      });
    }`);
}

function generatedot(n, codebuilder) {
    if((2 <= n && n<=4)) return;
    let name = `dot${n}`;
    codebuilder.add('functions', name, `float dot${n}(vec${n} a, vec${n} b) {
    return ${ sizes(n).map((size, k) => `dot(a.a${k},b.a${k})`).join('+')}; }`);
}

function generateadd(n, codebuilder) {
    if((2 <= n && n<=4)) return;
    let name = `add${n}`;
    codebuilder.add('functions', name, `vec${n} add${n}(vec${n} a, vec${n} b) {
    return ${ sizes(n).map((size, k) => `vec${n}(a.a${k} + b.a${k})`).join(',')}; }`);
}

function generatesub(n, codebuilder) {
    if((2 <= n && n<=4)) return;
    let name = `sub${n}`;
    codebuilder.sub('functions', name, `vec${n} sub${n}(vec${n} a, vec${n} b) {
    return ${ sizes(n).map((size, k) => `vec${n}(a.a${k} - b.a${k})`).join(',')}; }`);
}

function usemult(n, m) {
  if (n==m && 2 <= n && n<=4) return useinfix('*');
  else return (args, modifs, codebuilder) => generatematmult(n, m, modifs, codebuilder) || `mult${n}_${m}(${args.join(',')})`;
}

function usecmult(n, m) {
  return (args, modifs, codebuilder) => generatecmatmult(n, m, modifs, codebuilder) || `cmult${n}_${m}(${args.join(',')})`;
}

function usedot(n) {
  return (args, modifs, codebuilder) => generatedot(n, codebuilder) || `dot${(2 <= n && n<=4) ? '' : n}(${args.join(',')})`;
}

function useadd(n) {
  if(2 <= n && n<=4) return useinfix('+');
  else return (args, modifs, codebuilder) => generateadd(n, codebuilder) || `add${n}(${args.join(',')})`;
}

function usesub(n) {
  if(2 <= n && n<=4) return useinfix('-');
  else return (args, modifs, codebuilder) => generatesub(n, codebuilder) || `sub${n}(${args.join(',')})`;
}
  
function usevec(n) {
    if(2 <= n && n <= 4) return args => `vec${n}(${args.join(',')})`;
    let cum = 0;
    return (args, modifs, codebuilder) => createvecstruct(n, codebuilder) ||
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
    return (args, modifs, codebuilder) => creatematstruct(n, m, codebuilder) ||
      `cmat${n}_${m}(${
          args.join(',')
      })`;
}

function usecvec(n) {
    return (args, modifs, codebuilder) => createcvecstruct(n, codebuilder) ||
        `cvec${n}(${
          usevec(n)(args.map(a => `(${a}).x`), modifs, codebuilder)
        },${
          usevec(n)(args.map(a => `(${a}).y`), modifs, codebuilder)
        })`;
}


function accessvecbyshifted(n) {
  return (args, modifs, codebuilder) => { //works only for hardcoded glsl
      createvecstruct(n, codebuilder);
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
