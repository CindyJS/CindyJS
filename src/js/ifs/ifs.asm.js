Module["asm"] = (function(global, env, buffer) {
 "use asm";
 var a = new global.Int8Array(buffer);
 var c = new global.Int32Array(buffer);
 var d = new global.Uint8Array(buffer);
 var h = new global.Float64Array(buffer);
 var M = global.Math.abs;
 var Z = global.Math.imul;
 function da(b, e) {
  b = b | 0;
  e = e | 0;
  var f = 0.0, g = 0.0, i = 0.0, j = 0.0, k = 0.0, l = 0.0, m = 0, n = 0, o = 0, p = 0.0, q = 0, r = 0.0, s = 0.0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0.0, B = 0.0, C = 0.0, D = 0.0, E = 0.0, F = 0.0, G = 0;
  i = +h[2];
  f = +h[3];
  g = +h[4];
  l = +h[5];
  k = +h[6];
  j = +h[7];
  if (!b) {
   p = l;
   r = k;
   s = j;
   j = i;
   l = g;
   k = f;
   h[2] = j;
   h[3] = k;
   h[4] = l;
   h[5] = p;
   h[6] = r;
   h[7] = s;
   return;
  }
  x = c[23] | 0;
  y = (x | 0) == 0;
  z = c[20] | 0;
  v = c[21] | 0;
  w = c[22] | 0;
  o = c[16] | 0;
  u = c[19] | 0;
  n = c[18] | 0;
  m = c[17] | 0;
  while (1) {
   b = b + -1 | 0;
   t = o << 11 ^ o;
   t = t >>> 8 ^ t ^ u ^ u >>> 19;
   a : do if (y) o = 0; else {
    o = 0;
    do {
     if (t >>> 0 <= (c[c[96 + (o << 2) >> 2] >> 2] | 0) >>> 0) break a;
     o = o + 1 | 0;
    } while (o >>> 0 < x >>> 0);
   } while (0);
   b : do if ((o | 0) != (x | 0)) {
    o = c[96 + (o << 2) >> 2] | 0;
    switch (c[o + 4 >> 2] | 0) {
    case 0:
     {
      r = i * +h[o + 40 >> 3] + f * +h[o + 48 >> 3] + g * +h[o + 56 >> 3];
      s = i * +h[o + 88 >> 3] + f * +h[o + 96 >> 3] + g * +h[o + 104 >> 3];
      p = i * +h[o + 64 >> 3] + f * +h[o + 72 >> 3] + g * +h[o + 80 >> 3];
      break;
     }
    case 1:
     {
      F = +h[o + 80 >> 3];
      r = +h[o + 40 >> 3];
      E = +h[o + 88 >> 3];
      p = +h[o + 48 >> 3];
      D = +h[o + 56 >> 3];
      A = f * r * E - i * F - g * +h[o + 96 >> 3];
      E = i * E;
      F = f * F * r;
      C = g * +h[o + 104 >> 3];
      s = E + F + C;
      B = g * +h[o + 64 >> 3] + (i * p - f * r * D);
      C = -F - E - C;
      p = i * D + f * r * p + g * +h[o + 72 >> 3];
      r = s * p - A * B;
      s = A * A - s * C;
      p = C * B - A * p;
      break;
     }
    default:
     break b;
    }
    i = +h[o + 8 >> 3];
    g = 1.0 - i;
    l = l * i + +h[o + 16 >> 3] * g;
    k = k * i + g * +h[o + 24 >> 3];
    j = j * i + g * +h[o + 32 >> 3];
    g = +M(+r);
    i = +M(+p);
    g = g < i ? i : g;
    i = +M(+s);
    g = 1.0 / (g < i ? i : g);
    i = r * g;
    f = p * g;
    g = s * g;
    if (!e) {
     r = r / s + .5;
     if (!(r < 0.0 | r > 4294967295.0)) {
      p = -p / s + .5;
      if (!(p < 0.0 | p > 4294967295.0)) {
       q = ~~r >>> 0;
       if (q >>> 0 < z >>> 0) {
        o = ~~p >>> 0;
        if (o >>> 0 < v >>> 0) {
         o = (Z(z, o) | 0) + q | 0;
         E = +h[1];
         q = w + (o << 2) + 3 | 0;
         F = (1.0 - E) * (+(d[q >> 0] | 0) / 255.0);
         G = w + (o << 2) | 0;
         a[G >> 0] = ~~(l * E + +(d[G >> 0] | 0) * F + .5);
         G = w + (o << 2) + 1 | 0;
         a[G >> 0] = ~~(k * E + F * +(d[G >> 0] | 0) + .5);
         o = w + (o << 2) + 2 | 0;
         a[o >> 0] = ~~(j * E + F * +(d[o >> 0] | 0) + .5);
         a[q >> 0] = ~~((E + F) * 255.0 + .5);
        }
       }
      }
     }
    }
   } while (0);
   if (!b) {
    o = u;
    b = t;
    break;
   } else {
    G = u;
    o = m;
    u = t;
    m = n;
    n = G;
   }
  }
  c[16] = m;
  c[17] = n;
  c[18] = o;
  c[19] = b;
  D = l;
  E = k;
  F = j;
  A = i;
  C = g;
  B = f;
  h[2] = A;
  h[3] = B;
  h[4] = C;
  h[5] = D;
  h[6] = E;
  h[7] = F;
  return;
 }
 function ga(a, b, d, e, f, g, i, j, k, l, m, n, o, p) {
  a = a | 0;
  b = +b;
  d = +d;
  e = +e;
  f = +f;
  g = +g;
  i = +i;
  j = +j;
  k = +k;
  l = +l;
  m = +m;
  n = +n;
  o = +o;
  p = +p;
  var q = 0, r = 0;
  r = c[96 + (a << 2) >> 2] | 0;
  c[r + 4 >> 2] = 1;
  h[r + 8 >> 3] = b;
  h[r + 16 >> 3] = d;
  h[r + 24 >> 3] = e;
  h[r + 32 >> 3] = f;
  q = 0;
  f = 0.0;
  while (1) {
   f = f + +h[(c[96 + (q << 2) >> 2] | 0) + 8 >> 3];
   if ((q | 0) == (a | 0)) break; else q = q + 1 | 0;
  }
  c[r >> 2] = ~~(f * 4294967296.0 + -.5) >>> 0;
  h[r + 40 >> 3] = g;
  h[r + 48 >> 3] = i;
  h[r + 56 >> 3] = j;
  h[r + 64 >> 3] = k;
  h[r + 72 >> 3] = l;
  h[r + 80 >> 3] = m;
  h[r + 88 >> 3] = n;
  h[r + 96 >> 3] = o;
  h[r + 104 >> 3] = p;
  return;
 }
 function fa(a, b, d, e, f, g, i, j, k, l, m, n, o, p) {
  a = a | 0;
  b = +b;
  d = +d;
  e = +e;
  f = +f;
  g = +g;
  i = +i;
  j = +j;
  k = +k;
  l = +l;
  m = +m;
  n = +n;
  o = +o;
  p = +p;
  var q = 0, r = 0;
  r = c[96 + (a << 2) >> 2] | 0;
  c[r + 4 >> 2] = 0;
  h[r + 8 >> 3] = b;
  h[r + 16 >> 3] = d;
  h[r + 24 >> 3] = e;
  h[r + 32 >> 3] = f;
  q = 0;
  f = 0.0;
  while (1) {
   f = f + +h[(c[96 + (q << 2) >> 2] | 0) + 8 >> 3];
   if ((q | 0) == (a | 0)) break; else q = q + 1 | 0;
  }
  c[r >> 2] = ~~(f * 4294967296.0 + -.5) >>> 0;
  h[r + 40 >> 3] = g;
  h[r + 48 >> 3] = i;
  h[r + 56 >> 3] = j;
  h[r + 64 >> 3] = k;
  h[r + 72 >> 3] = l;
  h[r + 80 >> 3] = m;
  h[r + 88 >> 3] = n;
  h[r + 96 >> 3] = o;
  h[r + 104 >> 3] = p;
  return;
 }
 function ea(a, b, d) {
  a = a | 0;
  b = b | 0;
  d = d | 0;
  c[16] = -691182520;
  c[17] = 1666775300;
  c[18] = -136142663;
  c[19] = -1722921925;
  h[1] = .5;
  c[4] = 0;
  c[5] = 0;
  c[6] = 0;
  c[7] = 0;
  h[4] = 1.0;
  h[5] = 1.0;
  h[6] = 1.0;
  h[7] = 1.0;
  c[20] = b;
  c[21] = d;
  c[23] = a;
  d = 96 + (a << 2) | 0;
  b = d & 4;
  d = ((b | 0) == 0 ? 0 : 8 - b | 0) + d | 0;
  if (!a) {
   a = d + (a * 112 | 0) | 0;
   c[22] = a;
   return a | 0;
  } else b = 0;
  do {
   c[96 + (b << 2) >> 2] = d + (b * 112 | 0);
   b = b + 1 | 0;
  } while ((b | 0) != (a | 0));
  a = d + (a * 112 | 0) | 0;
  c[22] = a;
  return a | 0;
 }
 return {
  _setProj: fa,
  _real: da,
  _init: ea,
  _setMoebius: ga
 };
});



