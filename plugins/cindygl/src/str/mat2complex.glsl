mat4 mat2complex(mat2 a) //inclusion function R^2 -> C^2 which is isomorphic to R^4
{
    return mat4(
					vec4(a[0][0], 0, a[0][1], 0),
					vec4(0, a[0][0], 0, a[0][1]),
					vec4(a[1][0], 0, a[1][1], 0),
					vec4(0, a[1][0], 0, a[1][1])
    );
}
