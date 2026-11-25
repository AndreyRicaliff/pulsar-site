# Decisões — pulsar-site

## 2026-11-25 — [visual] Tema claro: fundo branco com a identidade Pulsar

**Problema.** Ricaliff pediu o site de apresentação branco. O tema era near-black (#0E0E16) com texto claro,
cores chapadas espalhadas em CSS, SVG inline e canvas, header em `mix-blend-mode:difference` e um fundo WebGL
que SOMA luz (estrelas, nebulosa, grade) sobre preto.

**Opções.**
1. Inverter as cores do shader (`1.-col`): rápido, mas a luz roxa invertida vira verde-amarelado.
2. Clarear o preto do shader e baixar as intensidades: somar luz sobre branco satura em branco, a cena some.
3. Modelo de absorção: cada cena devolve quanto absorve e a cor final é `BG*(1-absorção)`, com a absorção
   calibrada para tingir na direção da marca (`1-#7048E8` e `1-#401C7F`).

**Decisão.** Opção 3 no shader; tokens claros no `:root` (texto #16122B, muted #5D4E91, hairline #E4DEF3,
acento de texto #5B21B6); header sem blend, com `currentColor`; overlays em lavanda translúcida; sombras pretas
viram sombras roxas leves; os dois temas dos mockups ("roxo" e "claro") passam a ser claros.

**Por quê.** Absorção é o modelo físico de tinta em papel: o fundo nunca fica mais escuro que o tom da marca e
mantém as mesmas formas (estrelas viram pontos roxos, a grade vira linhas #401C7F). Os pares de cor foram medidos
no contraste WCAG: todo texto passa AA (muted 7,1:1, acento 9,0:1, verde 6,4:1 no branco).

**Consequências.** `mix-blend-mode` saiu, então header e rail dependem das cores do tema; se uma seção escura
voltar, ela precisa de regra própria. As cores ficam todas em token ou `currentColor`, então o próximo ajuste de
tema é no `:root`.

**Em entrevista.** "Para virar o fundo WebGL de escuro para claro, troquei o modelo aditivo (luz sobre preto) por
absorção (tinta sobre papel): a cena devolve quanto cada canal absorve e a cor é branco vezes um menos isso.
Calibrei a absorção como o complemento da cor da marca, então o fundo só tinge de roxo e nunca vira cinza."

## 2026-11-25 — [deploy] Versão na URL do CSS e do JS (`?v=`)

**Problema.** O Cloudflare na frente do domínio manda `Cache-Control: max-age=14400` (4 h) para `style.css` e
`app.js`, enquanto o HTML vem com `max-age=0`. Depois do deploy do tema claro, quem tinha visitado nas 4 h
anteriores recebia o HTML novo com o CSS e o JS velhos do cache do navegador: site escuro e quebrado pela metade.

**Opções.** 1. Baixar o TTL do navegador no painel do Cloudflare (fora do repositório, vale para todo o domínio).
2. Hash no nome do arquivo (exige build, e o site é estático sem build). 3. Query string de versão no `index.html`.

**Decisão.** Opção 3: `style.css?v=<data-assunto>` e `app.js?v=<data-assunto>`.

**Por quê.** O HTML já revalida a cada visita, então a URL nova do asset chega junto; não pede build nem acesso ao
painel do Cloudflare.

**Consequências.** Todo deploy que muda CSS ou JS precisa trocar o `?v=` no `index.html`. Esquecer volta o
problema por até 4 h.

**Em entrevista.** "O HTML revalidava sempre, mas o CDN deixava CSS e JS 4 horas no navegador. Pus a versão na URL
do asset: o HTML novo aponta para uma URL que nenhum cache tem, então HTML e CSS nunca se desencontram."

## 2026-11-25 — [deploy] Comentário fica no fonte, o publicado sai sem nenhum

**Problema.** Protocolo do Ricaliff de 25/11: "mantenha sempre no codigo original comentarios, publicados nao devem
conter". O site era servido cru pela Vercel (o fonte ERA o publicado): a produção entregava 18 comentários no HTML
(inclusive a nota interna "tirar quando os contatos reais entrarem"), 66 blocos `/* */` no CSS e os `//` do JS,
inclusive os de dentro dos shaders GLSL. Comentário servido entrega arquitetura e nota interna a qualquer visitante.

**Opções.** 1. Apagar os comentários do fonte (perde a documentação; o pedido manda manter). 2. Strip por regex no
deploy (quebra fácil: `'// works'` e `https://` em string parecem comentário). 3. Build de minificação com parser:
html-minifier-terser no HTML, esbuild no CSS e no JS, e um passo próprio para o GLSL, que mora dentro de string.

**Decisão.** Opção 3. `npm run build` gera `dist/` a partir do fonte da raiz (que não é reescrito) e a Vercel publica
só `dist/` (`vercel.json`: `installCommand`, `buildCommand`, `outputDirectory`). Os shaders são achados pelo AST do
acorn (template literal com `gl_FragColor`/`gl_Position`/`precision`) e limpos antes do esbuild. O build termina com
`scripts/sem-comentarios.mjs`, que relê `dist/` pelo parser e RECUSA o build se sobrar qualquer comentário (exceção:
licença `/*!`). O CI (`.github/workflows/build.yml`) roda os testes e o build em todo PR.

**Por quê.** Comentário é token para o parser, não texto: só o parser sabe que `'// '+x` é string e que `//` dentro do
shader é comentário de outra linguagem. A conferência é fail-closed e independente do minificador: se uma versão nova do
esbuild passar a manter comentário, o deploy para em vez de vazar. Os nomes dos arquivos não mudam, então o esquema `?v=`
continua; a versão foi trocada para `2026-11-25-min`, senão o Cloudflare serviria o CSS/JS comentado do cache por até 4 h. Prova de que nada mudou na tela: com `?static=1`, fonte e `dist/` deram os
mesmos 958 elementos, o mesmo hash de estilo computado e geometria, o mesmo texto e o fundo WebGL compilando.

**Consequências.** O site passa a ter build (Node, `npm ci`); `trilho.json`, `*.md` e o fonte cru não chegam mais ao
público porque só `dist/` é publicado. Shader com `${}` no meio é recusado pelo build (cortar comentário entre pedaços
de template poderia engolir código): se um dia precisar, tirar os comentários dele à mão. O `?v=` continua manual.

**Em entrevista.** "O site estático era publicado cru, então todo comentário ia para o visitante. Pus um build que
minifica com parser e publica só a saída, e no fim um conferente que relê a saída pelo parser e derruba o deploy se
sobrar comentário. O detalhe foi o GLSL: o shader é uma string para o JavaScript, o minificador não entra nela, então
limpei os templates de shader pelo AST antes de minificar."

## 2026-11-25 — [works/hero/custom] Criativos §8: cenas DOM de produto no lugar dos sketches generativos

**Problema.** Feedback do Ricaliff: "pulsos sem nexo, apenas letras e números — preciso de criativos bem
desenvolvidos". Os thumbs dos diferenciais eram desenhos generativos em canvas (linhas, barras, scatter)
que não contavam história nenhuma de produto. A dobra não dizia o que é a plataforma nem para onde ir, e o
card Custom era um grid 2×2 de texto.

**Opções.** (a) Melhorar os sketches generativos (mais cor, mais forma); (b) imagens/screenshots reais dos
produtos; (c) mini-cenas DOM/SVG reutilizando o sistema `mk-*` que o showcase já tem.

**Decisão.** (c): cada diferencial acende uma cena de produto com chrome real (`Screen__bar` + marca), conteúdo
que conta UMA história concreta ("+R$ 18.400 recebimento conciliado", "3 fontes no mesmo pulso", "Maria C. ·
admissão") e um card flutuante saindo do quadro. Hero ganhou chips dos 3 produtos + CTA (molde 1 do §6);
Custom ganhou destaque largo + split de setores (molde Oracle). Pulso só como assinatura discreta (EKG 26px).

**Por quê.** Generativo "bonito" continua abstrato — a spec §8 pede cena de produto em camadas, e o site JÁ
tinha o vocabulário (`mk-kpi`, `mk-move`, `mk-badge`, `Screen__*`) no showcase: reutilizar o sistema custou
menos que desenhar no canvas e saiu consistente por construção. Screenshot real amarraria o site ao estado da
UI dos apps; DOM rotulado "dados ilustrativos" não. De quebra saiu ~90 linhas de canvas do rAF (menos trabalho
por frame).

**Consequências.** As cenas são markup estático (fácil de editar, entra no build sem asset); o sprite
`#mk-fin`/`#mk-rh` nasceu para as marcas (migração das cópias antigas pendente); `WorksThumb` virou toggle de
classe. O mock mente se os números parecerem reais — por isso toda legenda carrega "dados ilustrativos".

**Em entrevista (30s).** "Os thumbs eram arte generativa em canvas, bonita e vazia. Troquei por cenas DOM que
reusam os mini-componentes do showcase: chrome de produto, um número com história e um card saindo do quadro.
Reuso do design system me deu consistência de graça, tirei 90 linhas de canvas do loop de frame, e rotulei o
mock de 'dados ilustrativos' para não vender número falso."
