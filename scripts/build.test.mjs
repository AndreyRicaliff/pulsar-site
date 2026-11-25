import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limparGlsl, limparShaders } from './build.mjs';
import { comentariosCss, comentariosHtml, comentariosJs } from './sem-comentarios.mjs';

test('limparGlsl tira // e /* */ e mantém diretiva em linha própria', () => {
  const saida = limparGlsl('#define PI 3.14 // pi\nfloat a=1.; /* bloco\nlongo */ float b=2.;\n  // só comentário\n');
  assert.equal(saida, '#define PI 3.14\nfloat a=1.;  float b=2.;');
});

test('limparShaders só mexe no template de GLSL e deixa string comum intacta', () => {
  const js = "const F=`precision highp float; // cor\nvoid main(){gl_FragColor=vec4(1.);}`;const L='// works';";
  const saida = limparShaders(js);
  assert.ok(!saida.includes('// cor'));
  assert.ok(saida.includes("'// works'"));
});

test('limparShaders recusa shader com interpolação', () => {
  assert.throws(() => limparShaders('const F=`precision highp float; ${x} // c`;'), /shader com/);
});

test('conferência acusa comentário de HTML, CSS e JS', () => {
  assert.equal(comentariosHtml('<p>a</p><!-- nota interna -->').length, 1);
  assert.equal(comentariosCss('a{color:red}/* nota */').length, 1);
  assert.equal(comentariosJs('let a=1; // nota').length, 1);
  assert.equal(comentariosJs('const s=`precision highp float; // nota\nvoid main(){}`;').length, 1);
});

test('conferência não confunde string, URL e licença com comentário', () => {
  assert.equal(comentariosCss('a{content:"/* não */";background:url(https://x.y/z.png)}/*! licença */').length, 0);
  assert.equal(comentariosJs("const u='https://x.y';const l='// works';/*! licença */").length, 0);
  assert.equal(comentariosHtml('<p>// works</p>').length, 0);
});

test('trecho GLSL sem main nem precision também é limpo e conferido', () => {
  const js = 'const N=`uniform float uT; // tempo\nfloat h(float x){return x;}`;';
  assert.ok(!limparShaders(js).includes('// tempo'));
  assert.equal(comentariosJs(js).length, 1);
});
