/*
 * This file is part of CindyJS.
 *
 * If you modify it, make sure you have emscripten installed, then run
 * “node make em=1” to rebuild the ifs.asm.js file from this.
 */

#include <cmath>
#include <cstdint>

extern "C"
void dbglog(unsigned u, double d);

struct Vec3 {
  double x, y, z;

  Vec3 normalizeMax() const {
    double a = fabs(x), b = fabs(y);
    if (a < b) a = b;
    b = fabs(z);
    if (a < b) a = b;
    b = 1 / a;
    return {b * x, b * y, b * z};
  }

};

inline Vec3 operator*(double a, const Vec3& b) {
  return { a * b.x, a * b.y, a * b.z };
}

inline Vec3 operator+(const Vec3& a, const Vec3& b) {
  return { a.x + b.x, a.y + b.y, a.z + b.z };
}

inline Vec3 cross(const Vec3& a, const Vec3& b) {
  return {
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  };
}

struct RGBA {
  std::uint8_t r, g, b, a;

  void composite(double alpha, Vec3 color) {
    double beta = (1 - alpha) * a * (1/255.);
    double gamma = alpha + beta;
    double delta = 1 / gamma; // undo premultiplication
    r = (beta * r + alpha * color.x) * delta + 0.5;
    g = (beta * g + alpha * color.y) * delta + 0.5;
    b = (beta * b + alpha * color.z) * delta + 0.5;
    a = gamma * 255 + 0.5;
  }

};

struct ProjTrafo {
  double xx, xy, xz, yx, yy, yz, zx, zy, zz;
  Vec3 operator*(const Vec3& p) const {
    return {
      xx * p.x + xy * p.y + xz * p.z,
      yx * p.x + yy * p.y + yz * p.z,
      zx * p.x + zy * p.y + zz * p.z,
    };
  }
};

struct MoebiusTrafo {
  double sign, ar, ai, br, bi, cr, ci, dr, di;
  Vec3 operator*(const Vec3& p) const {
    ProjTrafo mat1 {
      -cr, sign*ci, -dr,
      ci, sign*cr, di,
      ar, -sign*ai, br,
    };
    ProjTrafo mat2 {
      -ci, -sign*cr, -di,
      -cr, sign*ci, -dr,
      ai, sign*ar, bi,
    };
    return cross(mat1 * p, mat2 * p);
  }
};

struct Trafo {
  std::uint32_t cutpoint;
  std::uint32_t kind;
  double prob;
  Vec3 color;
  union {
    ProjTrafo proj;
    MoebiusTrafo moebius;
  };
};

struct XorShift128 {
  std::uint32_t x, y, z, w;
  std::uint32_t operator()() {
    // https://en.wikipedia.org/w/index.php?title=Xorshift&oldid=740540477
    // https://www.jstatsoft.org/article/view/v008i14/xorshift.pdf
    std::uint32_t t = x ^ (x << 11);
    x=y; y=z; z=w;
    return w = (w ^ (w >> 19)) ^ (t ^ (t >> 8));
  }
  void init() {
    // arbitrary seed from sage: hex(floor(-exp(10*I).real()*2^128))
    x = 0xd6cd6448u;
    y = 0x6358f904u;
    z = 0xf7e2a0b9u;
    w = 0x994e4c3bu;
  }
} xorshift128;

double compositeAlpha;
Vec3 pt;
Vec3 color;
unsigned width;
unsigned height;
RGBA *img;
unsigned nTrafos;
Trafo *trafos[1];

extern "C"
void real(unsigned nIter, bool skip) {
  Vec3 p1 = pt;
  Vec3 col = color;
  while (nIter--) {
    unsigned i;
    std::uint32_t r = xorshift128();
    for (i = 0; i < nTrafos; ++i)
      if (r <= trafos[i]->cutpoint)
        break;
    if (i == nTrafos)
      continue;
    const Trafo *tr = trafos[i];
    Vec3 p2;
    if (tr->kind == 0) {
      p2 = tr->proj * p1;
    } else if (tr->kind == 1) {
      p2 = tr->moebius * p1;
    } else {
      continue;
    }
    col = tr->prob * col + (1 - tr->prob) * tr->color;
    p1 = p2.normalizeMax();

    if (skip) continue;
    double x3 = p2.x / p2.z + 0.5;
    if (x3 < 0 || x3 > 0xffffffffu) continue;
    double y3 = -p2.y / p2.z + 0.5; // apparenty flipped by default?
    if (y3 < 0 || y3 > 0xffffffffu) continue;
    unsigned x4 = (unsigned) x3;
    if (x4 >= width) continue;
    unsigned y4 = (unsigned) y3;
    if (y4 >= height) continue;
    img[y4 * width + x4].composite(compositeAlpha, col);
  }
  pt = p1;
  color = col;
}

extern "C"
void* init(unsigned n, unsigned w, unsigned h) {
  xorshift128.init();
  compositeAlpha = 0.5;
  pt = { 0, 0, 1 };
  color = { 1, 1, 1 };
  width = w;
  height = h;
  nTrafos = n;
  std::uintptr_t endTrafos = reinterpret_cast<std::uintptr_t>(&trafos[n]);
  if (endTrafos % 8) endTrafos += 8 - (endTrafos % 8);
  Trafo *trs = reinterpret_cast<Trafo*>(endTrafos);
  for (int i = 0; i < n; ++i)
    trafos[i] = &trs[i];
  img = reinterpret_cast<RGBA*>(&trs[n]);
  return img;
}

extern "C"
void setProj(
    unsigned i,
    double prob,
    double red, double green, double blue,
    double xx, double xy, double xz,
    double yx, double yy, double yz,
    double zx, double zy, double zz) {
  Trafo* tr = trafos[i];
  tr->kind = 0;
  tr->prob = prob;
  tr->color = { red, green, blue };
  double sum = 0;
  for (int j = 0; j <= i; ++j)
    sum += trafos[j]->prob;
  tr->cutpoint = sum * 4294967296.0 - 0.5;
  tr->proj.xx = xx;
  tr->proj.xy = xy;
  tr->proj.xz = xz;
  tr->proj.yx = yx;
  tr->proj.yy = yy;
  tr->proj.yz = yz;
  tr->proj.zx = zx;
  tr->proj.zy = zy;
  tr->proj.zz = zz;
}

extern "C"
void setMoebius(
    unsigned i,
    double prob,
    double red, double green, double blue,
    double sign,
    double ar, double ai, double br, double bi,
    double cr, double ci, double dr, double di) {
  Trafo* tr = trafos[i];
  tr->kind = 1;
  tr->prob = prob;
  tr->color = { red, green, blue };
  double sum = 0;
  for (int j = 0; j <= i; ++j)
    sum += trafos[j]->prob;
  tr->cutpoint = sum * 4294967296.0 - 0.5;
  tr->moebius.sign = sign;
  tr->moebius.ar = ar;
  tr->moebius.ai = ai;
  tr->moebius.br = br;
  tr->moebius.bi = bi;
  tr->moebius.cr = cr;
  tr->moebius.ci = ci;
  tr->moebius.dr = dr;
  tr->moebius.di = di;
}
