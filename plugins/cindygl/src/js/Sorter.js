// Generation of a bitonic sorting network
// adapted from http://www.iti.fh-flensburg.de/lang/algorithmen/sortieren/bitonic/oddn.htm

function generatePairs(n) {
    let ans = [];

    function bitonicSort(lo, n, dir) {
        if (n > 1) {
            let m = (n / 2) | 0;
            bitonicSort(lo, m, !dir);
            bitonicSort(lo + m, n - m, dir);
            bitonicMerge(lo, n, dir);
        }
    }

    function bitonicMerge(lo, n, dir) {
        if (n > 1) {
            let m = greatestPowerOfTwoLessThan(n);
            for (let i = lo; i < lo + n - m; i++) compare(i, i + m, dir);
            bitonicMerge(lo, m, dir);
            bitonicMerge(lo + m, n - m, dir);
        }
    }

    function compare(i, j, dir) {
        if (dir) ans.push([i, j]);
        else ans.push([j, i]);
    }

    function greatestPowerOfTwoLessThan(n) {
        let k = 1;
        while (k < n) k = k << 1;
        return k >> 1;
    }

    bitonicSort(0, n, true);
    return ans;
}

/*
//Testing environment

for (var i = 0; i < 15; i++) {
    console.log(`${i}: ${generatePairs(i).length}`);
}

function sort(l, pairs) {
    for (let i in pairs) {
        let p = pairs[i];
        if (l[p[0]] > l[p[1]]) {
            let tmp = l[p[0]];
            l[p[0]] = l[p[1]];
            l[p[1]] = tmp;
        }
    }
    return l;
};

let n = 20;
l = [];
for (let i = 0; i < n; i++) l.push(Math.exp(Math.random() * 5));

console.log(l);
console.log(sort(l, generatePairs(n)));
*/

// Build sort function using sorting network
function generatesort(t, modifs, codebuilder) {
    let name = `sort${webgltype(t)}`;
    codebuilder.add(
        "functions",
        name,
        () =>
            `${webgltype(t)} ${name}(${webgltype(t)} a){` +
            `${webgltype(t.parameters)} m;\n` +
            generatePairs(t.length)
                .map(function (p) {
                    let a = accesslist(t, p[0])(["a", p[0]], modifs, codebuilder);
                    let b = accesslist(t, p[1])(["a", p[1]], modifs, codebuilder);
                    //swap a<->b if b>a
                    return `m = min(${a},${b}); ${b} = max(${a},${b}); ${a} = m;`;
                })
                .join("\n") +
            `return a;
      }`
    );
}

function usesort(t) {
    return (args, modifs, codebuilder) =>
        generatesort(t, modifs, codebuilder) || `sort${webgltype(t)}(${args.join(",")})`;
}
