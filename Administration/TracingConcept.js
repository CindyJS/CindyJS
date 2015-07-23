var stateIn;
var stateOut;
var stateIdx = 0;

function sqrt(x) {
    var lastArg = CSNumber.complex(stateIn[stateIdx],
                                   stateIn[stateIdx + 1]);
    var lastRes = CSNumber.complex(stateIn[stateIdx + 2],
                                   stateIn[stateIdx + 3]);
    stateOut[stateIdx] = x.value.real;
    stateOut[stateIdx + 1] = x.value.imag;
    var res = …;
    stateOut[stateIdx + 2] = res.value.real;
    stateOut[stateIdx + 3] = res.value.imag;
    stateIdx += 4;
    return res;
}


GeoOps.PointOnCircle = {
  computeParameters = function(el) {
    …
  }
};


stateIdx = el.stateIdx;
GeoOps[el.type].computeParameters(el);
assert(stateIdx == el.stateIdx + GeoOps[el.type].stateSize)


/*
P is Point on Circle C

|................PPPPPPPPPP.....|
                 ^-- P.stateIdx
*/
