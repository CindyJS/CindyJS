function useimagergba(args, codebuilder) {
  let name = args[2];
  if(!codebuilder.texturereaders.hasOwnProperty(name)) {
    codebuilder.texturereaders[name] = [
    'uniform sampler2D _sampler_', name,';',
    'uniform float _ratio_', name,';',
    'uniform vec2 _cropfact_', name,';',
    'vec4 _imagergba_', name, '(vec2 A, vec2 B, vec2 p) {',
      'p -= A; B -= A;',
      //'B.y *= _ratio_', name,';',
      //'p.y *= _ratio_', name,';',
      'float b = dot(B,B);',
      'p = vec2(dot(p,B),_ratio_', name,'*dot(p,vec2(-B.y,B.x)))/b;',
      'if(0. <= p.x && p.x <= 1. && 0. <= p.y && p.y <= 1.)',
        'return texture2D(_sampler_', name, ', p*_cropfact_', name, ');',
      'else return vec4(0.);',
    '}',
    'vec3 _imagergb_', name, '(vec2 A, vec2 B, vec2 p) {',
      'return _imagergba_', name, '(A, B, p).rgb;',
    '}'
    ].join('');
  }
  return ['_imagergba_', name, '(', args[0], ',', args[1], ',', args[3], ')'].join('');
}


function useimagergb(args, codebuilder) {
  let name = args[2];
  useimagergba(args, codebuilder);
  return ['_imagergb_', name, '(', args[0], ',', args[1], ',', args[3], ')'].join('');
}


function generateHeaderOfTextureReaders(codebuilder) {
  let ans = '';
  for(let t in codebuilder.texturereaders) {
    ans += codebuilder.texturereaders[t] + '\n';
  }
  return ans;
};
