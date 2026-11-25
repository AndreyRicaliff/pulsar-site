// Gera dist/ (o que a Vercel publica) a partir do fonte comentado da raiz.
// O fonte NÃO é reescrito: comentário vive no código original e nunca no que é servido.
// Os nomes (index.html, style.css, app.js) ficam iguais para o `?v=` do index.html continuar valendo.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { transform } from 'esbuild';
import { minify as minificarHtml } from 'html-minifier-terser';
import { MARCA_GLSL, conferirPasta } from './sem-comentarios.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, 'dist');

// GLSL não tem string, então `//` e `/* */` ali são sempre comentário. As quebras de linha
// ficam: diretiva de pré-processador (#define, #ifdef) precisa terminar em linha própria.
export function limparGlsl(fonte) {
  return fonte
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean)
    .join('\n');
}

// O minificador de JS não entra em string; o shader é string. Limpa os template literals
// de GLSL pelo AST antes de minificar. Template com `${}` no meio do shader é recusado:
// cortar comentário entre pedaços de template poderia engolir código.
export function limparShaders(js) {
  const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script' });
  const trocas = [];
  walk.full(ast, (no) => {
    if (no.type !== 'TemplateLiteral') return;
    const texto = no.quasis.map((q) => q.value.raw).join('');
    if (!MARCA_GLSL.test(texto)) return;
    if (no.expressions.length) {
      throw new Error(`shader com \${} na posição ${no.start}: limpe os comentários dele à mão ou tire a interpolação`);
    }
    const q = no.quasis[0];
    trocas.push({ ini: q.start, fim: q.end, novo: limparGlsl(q.value.raw) });
  });
  let saida = js;
  for (const t of trocas.sort((a, b) => b.ini - a.ini)) saida = saida.slice(0, t.ini) + t.novo + saida.slice(t.fim);
  return saida;
}

export async function construir() {
  const ler = (nome) => readFileSync(join(RAIZ, nome), 'utf8');
  const [js, css, html] = await Promise.all([
    transform(limparShaders(ler('app.js')), { loader: 'js', minify: true, legalComments: 'eof' }),
    transform(ler('style.css'), { loader: 'css', minify: true, legalComments: 'eof' }),
    minificarHtml(ler('index.html'), {
      removeComments: true,
      // conservativeCollapse mantém um espaço onde havia espaço: o layout inline não muda.
      collapseWhitespace: true,
      conservativeCollapse: true,
      keepClosingSlash: true,
    }),
  ]);
  rmSync(SAIDA, { recursive: true, force: true });
  mkdirSync(SAIDA);
  writeFileSync(join(SAIDA, 'app.js'), js.code);
  writeFileSync(join(SAIDA, 'style.css'), css.code);
  writeFileSync(join(SAIDA, 'index.html'), html);
  return conferirPasta(SAIDA);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const achados = await construir();
  if (achados.length) {
    console.error(`build recusado: ${achados.length} comentário(s) sobraram em dist/`);
    for (const a of achados) console.error(`  ${a}`);
    process.exit(1);
  }
  console.log('dist/ gerado: zero comentários em index.html, style.css e app.js');
}
