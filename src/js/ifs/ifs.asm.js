Module["asm"] = ((global, env, buffer) => {
 "use asm";
 const a = new global.Int8Array(buffer);
 const c = new global.Int32Array(buffer);
 const d = new global.Uint8Array(buffer);
 const h = new global.Float64Array(buffer);
 const M = global.Math.abs;
 const Z = global.Math.imul;
 function da(b, e) {
  b = b | 0;
  e = e | 0;
  let f = 0;
  let g = 0;
  let i = 0;
  let j = 0.0;
  let k = 0.0;
  let l = 0;
  let m = 0;
  let n = 0.0;
  let o = 0.0;
  let p = 0.0;
  let q = 0.0;
  let r = 0;
  let s = 0.0;
  let t = 0.0;
  let u = 0.0;
  let v = 0.0;
  let w = 0.0;
  let x = 0.0;
  let y = 0;
  let z = 0;
  if (!b) return;
  f = c[11] | 0;
  do {
   b = b + -1 | 0;
   if (!f) f = 0; else {
    r = 0;
    do {
     m = 56 + (r * 56 | 0) | 0;
     l = c[2] | 0;
     l = l << 11 ^ l;
     c[2] = c[3];
     c[3] = c[4];
     g = c[5] | 0;
     c[4] = g;
     g = l >>> 8 ^ l ^ g ^ g >>> 19;
     c[5] = g;
     l = c[56 + (r * 56 | 0) + 48 >> 2] | 0;
     a : do if (!l) f = 0; else {
      i = c[56 + (r * 56 | 0) + 52 >> 2] | 0;
      f = 0;
      do {
       if (g >>> 0 <= (c[c[i + (f << 2) >> 2] >> 2] | 0) >>> 0) break a;
       f = f + 1 | 0;
      } while (f >>> 0 < l >>> 0);
     } while (0);
     b : do if ((f | 0) != (l | 0)) {
      i = c[(c[56 + (r * 56 | 0) + 52 >> 2] | 0) + (f << 2) >> 2] | 0;
      switch (c[i + 4 >> 2] | 0) {
      case 0:
       {
        p = +h[m >> 3];
        f = 56 + (r * 56 | 0) + 8 | 0;
        q = +h[f >> 3];
        g = 56 + (r * 56 | 0) + 16 | 0;
        n = +h[g >> 3];
        j = +h[i + 40 >> 3] * p + +h[i + 48 >> 3] * q + +h[i + 56 >> 3] * n;
        k = p * +h[i + 88 >> 3] + q * +h[i + 96 >> 3] + n * +h[i + 104 >> 3];
        n = p * +h[i + 64 >> 3] + q * +h[i + 72 >> 3] + n * +h[i + 80 >> 3];
        break;
       }
      case 1:
       {
        x = +h[i + 80 >> 3];
        t = +h[i + 40 >> 3];
        w = +h[i + 88 >> 3];
        s = +h[i + 48 >> 3];
        v = +h[i + 56 >> 3];
        u = +h[m >> 3];
        f = 56 + (r * 56 | 0) + 8 | 0;
        j = +h[f >> 3];
        g = 56 + (r * 56 | 0) + 16 | 0;
        n = +h[g >> 3];
        q = t * w * j - x * u - +h[i + 96 >> 3] * n;
        w = w * u;
        x = x * t * j;
        p = +h[i + 104 >> 3] * n;
        k = w + x + p;
        o = s * u - t * v * j + +h[i + 64 >> 3] * n;
        p = -x - w - p;
        n = v * u + t * s * j + +h[i + 72 >> 3] * n;
        j = k * n - o * q;
        k = q * q - k * p;
        n = o * p - q * n;
        break;
       }
      default:
       break b;
      }
      x = +h[i + 8 >> 3];
      z = 56 + (r * 56 | 0) + 24 | 0;
      y = 56 + (r * 56 | 0) + 32 | 0;
      l = 56 + (r * 56 | 0) + 40 | 0;
      o = 1.0 - x;
      p = x * +h[z >> 3] + o * +h[i + 16 >> 3];
      q = x * +h[y >> 3] + o * +h[i + 24 >> 3];
      o = x * +h[l >> 3] + o * +h[i + 32 >> 3];
      h[z >> 3] = p;
      h[y >> 3] = q;
      h[l >> 3] = o;
      x = +M(+j);
      w = +M(+n);
      x = x < w ? w : x;
      w = +M(+k);
      x = 1.0 / (x < w ? w : x);
      h[m >> 3] = j * x;
      h[f >> 3] = n * x;
      h[g >> 3] = k * x;
      if (!e) {
       j = j / k + .5;
       if (!(j < 0.0 | j > 4294967295.0)) {
        k = n / k + .5;
        if (!(k < 0.0 | k > 4294967295.0)) {
         g = ~~j >>> 0;
         i = c[8] | 0;
         if (g >>> 0 < i >>> 0) {
          f = ~~k >>> 0;
          if (f >>> 0 < (c[9] | 0) >>> 0) {
           y = (Z(i, f) | 0) + g | 0;
           m = c[10] | 0;
           v = +h[3];
           z = m + (y << 2) + 3 | 0;
           w = (1.0 - v) * +(d[z >> 0] | 0) * .00392156862745098;
           x = v + w;
           u = 1.0 / x;
           l = m + (y << 2) | 0;
           a[l >> 0] = ~~((p * v + +(d[l >> 0] | 0) * w) * u + .5);
           l = m + (y << 2) + 1 | 0;
           a[l >> 0] = ~~(u * (q * v + w * +(d[l >> 0] | 0)) + .5);
           y = m + (y << 2) + 2 | 0;
           a[y >> 0] = ~~(u * (o * v + w * +(d[y >> 0] | 0)) + .5);
           a[z >> 0] = ~~(x * 255.0 + .5);
          }
         }
        }
       }
      }
     } while (0);
     r = r + 1 | 0;
     f = c[11] | 0;
    } while (r >>> 0 < f >>> 0);
   }
  } while ((b | 0) != 0);
  return;
 }
 function ha(a, b, d, e, f, g, i, j, k, l, m, n, o, p, q) {
  a = a | 0;
  b = b | 0;
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
  q = +q;
  let r = 0;
  let s = 0;
  a = 56 + (a * 56 | 0) + 52 | 0;
  s = c[(c[a >> 2] | 0) + (b << 2) >> 2] | 0;
  c[s + 4 >> 2] = 1;
  h[s + 8 >> 3] = d;
  h[s + 16 >> 3] = e;
  h[s + 24 >> 3] = f;
  h[s + 32 >> 3] = g;
  a = c[a >> 2] | 0;
  r = 0;
  g = 0.0;
  while (1) {
   g = g + +h[(c[a + (r << 2) >> 2] | 0) + 8 >> 3];
   if ((r | 0) == (b | 0)) break; else r = r + 1 | 0;
  }
  c[s >> 2] = ~~(g * 4294967296.0 + -.5) >>> 0;
  h[s + 40 >> 3] = i;
  h[s + 48 >> 3] = j;
  h[s + 56 >> 3] = k;
  h[s + 64 >> 3] = l;
  h[s + 72 >> 3] = m;
  h[s + 80 >> 3] = n;
  h[s + 88 >> 3] = o;
  h[s + 96 >> 3] = p;
  h[s + 104 >> 3] = q;
  return;
 }
 function ga(a, b, d, e, f, g, i, j, k, l, m, n, o, p, q) {
  a = a | 0;
  b = b | 0;
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
  q = +q;
  let r = 0;
  let s = 0;
  a = 56 + (a * 56 | 0) + 52 | 0;
  s = c[(c[a >> 2] | 0) + (b << 2) >> 2] | 0;
  c[s + 4 >> 2] = 0;
  h[s + 8 >> 3] = d;
  h[s + 16 >> 3] = e;
  h[s + 24 >> 3] = f;
  h[s + 32 >> 3] = g;
  a = c[a >> 2] | 0;
  r = 0;
  g = 0.0;
  while (1) {
   g = g + +h[(c[a + (r << 2) >> 2] | 0) + 8 >> 3];
   if ((r | 0) == (b | 0)) break; else r = r + 1 | 0;
  }
  c[s >> 2] = ~~(g * 4294967296.0 + -.5) >>> 0;
  h[s + 40 >> 3] = i;
  h[s + 48 >> 3] = j;
  h[s + 56 >> 3] = k;
  h[s + 64 >> 3] = l;
  h[s + 72 >> 3] = m;
  h[s + 80 >> 3] = n;
  h[s + 88 >> 3] = o;
  h[s + 96 >> 3] = p;
  h[s + 104 >> 3] = q;
  return;
 }
 function ea(a, b, d, e) {
  a = a | 0;
  b = b | 0;
  d = d | 0;
  e = e | 0;
  c[2] = -691182520;
  c[3] = 1666775300;
  c[4] = -136142663;
  c[5] = -1722921925;
  h[3] = .5;
  c[11] = a;
  c[8] = d;
  c[9] = e;
  e = 56 + (a * 56 | 0) | 0;
  c[12] = e;
  a = e + (b << 2) | 0;
  d = a & 4;
  a = ((d | 0) == 0 ? 0 : 8 - d | 0) + a | 0;
  if (b | 0) {
   c[e >> 2] = a;
   if ((b | 0) != 1) {
    e = 1;
    do {
     c[(c[12] | 0) + (e << 2) >> 2] = a + (e * 112 | 0);
     e = e + 1 | 0;
    } while ((e | 0) != (b | 0));
   }
  }
  b = a + (b * 112 | 0) | 0;
  c[10] = b;
  return b | 0;
 }
 function fa(a, b) {
  a = a | 0;
  b = b | 0;
  let d = 0;
  d = 56 + (a * 56 | 0) | 0;
  c[d >> 2] = 0;
  c[d + 4 >> 2] = 0;
  c[d + 8 >> 2] = 0;
  c[d + 12 >> 2] = 0;
  h[56 + (a * 56 | 0) + 16 >> 3] = 1.0;
  h[56 + (a * 56 | 0) + 24 >> 3] = 1.0;
  h[56 + (a * 56 | 0) + 32 >> 3] = 1.0;
  h[56 + (a * 56 | 0) + 40 >> 3] = 1.0;
  c[56 + (a * 56 | 0) + 48 >> 2] = b;
  d = c[12] | 0;
  c[56 + (a * 56 | 0) + 52 >> 2] = d;
  c[12] = d + (b << 2);
  return;
 }
 return {
  _setProj: ga,
  _setIFS: fa,
  _real: da,
  _init: ea,
  _setMoebius: ha
 };
});



