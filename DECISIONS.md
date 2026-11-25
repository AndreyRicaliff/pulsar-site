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
