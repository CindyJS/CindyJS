float det3(mat3 a) {
  return dot(cross(a[0],a[1]), a[2]);
}
