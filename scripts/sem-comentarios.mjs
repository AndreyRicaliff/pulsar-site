// Conferência fail-closed do que vai ser publicado: nenhum comentário em HTML, CSS ou JS.
// Comentário só pode existir no fonte (protocolo de 25/11/2026). Única exceção: licença
// (`/*!`, `//!`, @license, @preserve), que a lei manda manter quando houver código de terceiro.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const LICENCA = /^[!]|@license|@preserve/;
const MARCA_GLSL = /gl_FragColor|gl_Position|precision\s+(highp|mediump|lowp)/;

export function comentariosHtml(html) {
  const achados = [];
  let i = html.indexOf('<!--');
  while (i !== -1) {
    achados.push(`HTML: comentário na posição ${i}: ${html.slice(i, i + 60)}`);
    i = html.indexOf('<!--', i + 4);
  }
  return achados;
}

// Varre o CSS pulando strings: `/*` dentro de "..." ou '...' não é comentário.
export function comentariosCss(css) {
  const achados = [];
  let aspas = null;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (aspas) {
      if (c === '\\') i++;
      else if (c === aspas) aspas = null;
      continue;
    }
    if (c === '"' || c === "'") { aspas = c; continue; }
    if (c === '/' && css[i + 1] === '*') {
      const fim = css.indexOf('*/', i + 2);
      const corpo = css.slice(i + 2, fim === -1 ? css.length : fim);
      if (!LICENCA.test(corpo)) achados.push(`CSS: comentário na posição ${i}: /*${corpo.slice(0, 60)}`);
      i = fim === -1 ? css.length : fim + 1;
    }
  }
  return achados;
}

// JS pelo parser (não por regex): `'// '+x` e URLs em string não são comentário.
// Shader GLSL mora dentro de string, então o parser não vê o comentário dele: confere à parte.
export function comentariosJs(js) {
  const achados = [];
  const comentarios = [];
  const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script', onComment: comentarios });
  for (const c of comentarios) {
    if (!LICENCA.test(c.value)) achados.push(`JS: comentário na posição ${c.start}: ${c.value.slice(0, 60)}`);
  }
  const conferirGlsl = (texto, pos) => {
    if (MARCA_GLSL.test(texto) && /\/\/|\/\*/.test(texto)) {
      achados.push(`JS: comentário dentro de shader GLSL na posição ${pos}`);
    }
  };
  walk.full(ast, (no) => {
    if (no.type === 'Literal' && typeof no.value === 'string') conferirGlsl(no.value, no.start);
    if (no.type === 'TemplateLiteral') conferirGlsl(no.quasis.map((q) => q.value.cooked ?? '').join(''), no.start);
  });
  return achados;
}

export function conferirPasta(pasta) {
  const ler = (nome) => readFileSync(join(pasta, nome), 'utf8');
  return [
    ...comentariosHtml(ler('index.html')),
    ...comentariosCss(ler('style.css')),
    ...comentariosJs(ler('app.js')),
  ];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pasta = process.argv[2] ?? 'dist';
  const achados = conferirPasta(pasta);
  if (achados.length) {
    console.error(`${achados.length} comentário(s) no que seria publicado (${pasta}):`);
    for (const a of achados) console.error(`  ${a}`);
    process.exit(1);
  }
  console.log(`${pasta}: zero comentários em index.html, style.css e app.js`);
}
