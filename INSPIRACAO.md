# Inspiração — dissecação de 5 sites e adaptação ao Pulsar

> Análise de 25/11/2026 (Bling, Oracle BR, Microsoft BR, Xbox BR, PlayStation BR), feita no
> navegador, página a página. Objetivo do pedido: tirar o site do "espaço cheio de letras típico
> de IA" e preencher com visual — interações de mouse, mescla imagem+texto, formas criativas de
> encorpar texto, equilíbrio visual. Tudo aqui já está TRADUZIDO para o padrão Pulsar
> (`PULSAR-FINANCE/PADRAO-VISUAL.md` v8 + skill `corporativo`): porta SEMPRE clara, índigo como
> ação, Source Serif 4 display / Public Sans UI, anti-"cara de IA" §4.
>
> **Pré-condição de aplicação:** o restyle de tema claro (branch `claude/tema-branco-7d60a4`)
> aterrissar primeiro. Este documento é o insumo da aplicação, não a aplicação.

## 1. O diagnóstico que os 5 confirmam

O site de empresa boa não EXPLICA em parágrafo — ele MOSTRA e legenda. Nos 5 sites o texto nunca
aparece em bloco: vem quebrado em kicker + headline com ênfase + 1 linha + link, ou em
micro-rótulos em negrito com 2 linhas cada. O "visual" não é decoração ao lado do texto; o
conteúdo real (produto, jogo, operação do cliente) É o visual. É exatamente o antídoto para o
nosso sintoma.

## 2. Por site — o que levar e o que recusar

### Bling (o espelho mais próximo: ERP brasileiro, porta clara)

| Técnica observada | Adaptação Pulsar |
|---|---|
| Headline com o trecho-chave em cor dentro da frase ("quando tudo se conecta, **tudo flui**" em verde) | Trecho-ênfase do h1 em índigo `--c-secondary` — ênfase única da tela (disciplina de acento) |
| Foto REAL de operação (pessoa embalando pedido) com cards de UI do produto FLUTUANDO por cima (nota fiscal, pedidos por canal) | Assinatura "produto dentro da vida": foto de operação + mini-cards Finance/RH sobrepostos, cada um com `dados ilustrativos` no rótulo (§5 honestidade) |
| Chips de recurso sob o headline (✓ Sistema de gestão · ✓ HUB de vendas) | Chips Public Sans com os 3 produtos; raio 8, não pílula (chip estático = badge, §4) |
| E-mail inline + CTA sólido + microcopy "Sem cartão de crédito" | CTA sólido índigo + microcopy de atrito zero; gradiente em botão continua vetado |
| Número grande colorido no título ("até **60%**", "**250** plataformas") | Número em destaque entra em IBM Plex Mono `tabular-nums`, cor de acento — e só com fato real |
| Seção escura de respiro entre seções claras | Compatível com "preto só na moldura": UMA seção `.bloco-escuro` como moldura de respiro |
| Blobs orgânicos verdes/roxos como textura | **Recusar** — é identidade do Bling. Nossa textura de marca é o pulso: EKG, anéis, halo |
| Pílula gigante "Assista ▶" | Vira o gatilho do tour narrado que o site já tem — pílula é permitida aqui por ser INTERATIVA |

### Oracle BR (como encorpar texto sem parágrafo)

| Técnica | Adaptação |
|---|---|
| Texto longo quebrado em MICRO-RÓTULOS: sub-título bold curto + 2 linhas, 3× por card | Padrão novo de copy da porta: nenhum parágrafo > 2 linhas; o que passar vira micro-rótulo |
| Split card: texto à esquerda, foto grande da operação REAL do cliente à direita, com card-legenda sobreposto no canto da foto ("A DHL moderniza…") | Seção de caso: foto + card-legenda sobreposto. Cliente real só com autorização; senão "Empresa Exemplo" rotulada |
| Lista de setores como grade de links em 2 colunas | Grade de setores atendidos na seção "sob medida" |
| CTA escuro sólido, idêntico em todo card | Consistência de CTA: primário índigo, secundário fantasma com borda `--c-bd-forte` |

### Microsoft BR (equilíbrio e ritmo)

| Técnica | Adaptação |
|---|---|
| Carrossel de hero com PAUSA visível, setas, nunca anda sozinho sem controle | Já é lei nossa (WCAG 2.2.2); confirma: navegação é do usuário |
| Fileira de atalhos ícone+rótulo logo sob o hero | Atalhos para Finance / RH / sob medida — ícone SEM rótulo derrubaria findability ~50% |
| Card 4-col com ARTE ABSTRATA própria (gradiente suave 3D) no topo, cor por card | Nossas artes de card: variações do pulso (EKG, anéis, halo) em índigo/lavanda sobre `--c-surface2` — foto não é obrigatória para preencher com visual |
| Copy de card: 1 benefício em 2–3 linhas, botão único | Orçamento de palavras por card; nada de lista de features dentro de card |
| Seção agrupadora com fundo levemente tintado ("Para negócios" azul-claro) | Agrupar por tom da rampa (`--c-bg` → `--c-surface3`), nunca por salto preto/branco |

### Xbox BR (conteúdo como cenário)

| Técnica | Adaptação |
|---|---|
| Hero = MOSAICO de capas de jogos (o catálogo é o papel de parede) | Fundo da seção "por dentro": mosaico de telas REAIS dos produtos (réplicas com chrome real, rasura no não-demonstrado — assinatura já nossa) |
| Kicker-pill de oferta acima do headline | Kicker tipográfico na régua da casa (11px, 0.12em) — sem pílula amarela |
| Seção full-bleed com UMA ideia: kicker + headline + 1 linha + link-CTA | Molde das seções missão/visão: uma ideia por dobra, link-CTA em texto |
| Objeto-herói gigante (controle translúcido sobre cenário) | O celular flutuando do Pulsar (loop já licenciado) como objeto-herói da tela mobile |

### PlayStation BR (assinatura gráfica e grid vivo)

| Técnica | Adaptação |
|---|---|
| Separador DIAGONAL azul entre hero e conteúdo (slash de marca) | Nosso divisor de seção: linha de EKG que se DESENHA 1× (stroke-dash) — mesma função, assinatura própria |
| Grid assimétrico: cards de alturas/larguras diferentes na mesma faixa | Bate com nossa régua anti-grid-perfeito (§4): variar larguras e comprimentos de propósito |
| Título de seção GIGANTE uppercase como peça gráfica ("PERIFÉRICOS…") | `SecTitle` permanece no claro, em Source Serif 4 — título como visual, não como rótulo |
| Hover de card: zoom sutil da imagem dentro do clip + título ganha cor | Micro-interação canônica de card (catálogo abaixo) |
| Carrossel com setas sempre visíveis, card = kicker + título + 2 linhas + link | Molde dos cards do ecossistema |

## 3. Catálogo de interações de mouse (o que cada elemento FAZ)

Regras-mãe: só `transform`/`opacity` · entrada ease-out `cubic-bezier(0.22,1,0.36,1)` ·
micro 100–150ms, UI 150–250ms · `?static=1` colapsa ao estado final.

- **Card:** lift `translateY(-2px)` + `--sombra-2` + borda `--c-bd-forte` + imagem interna
  `scale(1.03)` dentro de clip (PlayStation). Título NÃO muda de cor sozinho — dois sinais já
  estão na borda+sombra.
- **CTA primário:** hover ESCURECE (`--c-secondary-hover`), nunca clareia nem vira gradiente.
- **CTA fantasma:** borda sobe de `--c-bd` para `--c-bd-forte`.
- **Link-CTA de texto:** seta desliza 2–4px para a direita (Xbox/PS), sublinhado não some.
- **Pílula-demo "Assista/Explorar":** única pílula interativa; expande levemente no hover
  (scale 1.02) e abre o tour — o play é o affordance (Bling).
- **Mosaico/mock de fundo:** reage ao mouse com parallax ≤ 8px no MÁXIMO (profundidade), nunca
  tilt 3D nem reflexo — legado neutralizado não volta.
- **Recusados:** cursor custom, magnetic button, glow perseguindo o mouse, autoplay de qualquer
  coisa, hover que esconde conteúdo.

## 4. Mescla imagem+texto — os 4 moldes que saem da análise

1. **Foto + cards flutuantes** (Bling): a vida real embaixo, o produto por cima. Hero.
2. **Split com legenda sobreposta** (Oracle): texto esquerda, imagem direita, card-legenda
   invadindo a foto. Seção de caso/prova.
3. **Conteúdo-cenário** (Xbox): mosaico de telas reais como fundo, texto em faixa sólida por
   cima. Seção "por dentro".
4. **Arte própria por card** (Microsoft): quando não há foto, a arte de pulso preenche. Grades
   de produto/benefício.

Regra de equilíbrio comum aos 4: toda dobra tem UMA âncora visual e o texto orbita ela — nunca
duas âncoras competindo, nunca dobra só de texto.

## 5. Formas de encorpar texto (sem virar parede)

- Micro-rótulo bold + 2 linhas (Oracle) no lugar de parágrafo.
- Ênfase de cor no trecho-chave do headline (Bling) — 1 por tela.
- Número como personagem: grande, mono, tabular, colorido — só fato real (Bling).
- Kicker + headline + 1 linha + link (Xbox/PS) para seção de ideia única.
- Chips para enumerações curtas (Bling) em vez de vírgulas.
- Orçamento da 1ª dobra (herdado do padrão): ≤ 90 palavras, ≤ 2 rótulos CAPS.

## 6. Aplicação por seção do site atual (ordem sugerida pós-tema-branco)

| Seção (id) | Mudança |
|---|---|
| `top` (hero) | Molde 1: headline com ênfase índigo + chips dos 3 produtos + foto com cards flutuantes; CTA sólido + microcopy de atrito |
| `works` (diferenciais) | Micro-rótulos Oracle na lista; divisor EKG desenhado entre itens |
| `showcase` (por dentro) | Molde 3: mosaico de telas reais ao fundo; pílula-demo abre o tour narrado existente |
| `mission`/`vision` | Molde Xbox de ideia única; candidatas à única seção `.bloco-escuro` de respiro |
| `service` (ecossistema) | Cards PS: kicker+título+2 linhas+link, grid assimétrico, hover canônico |
| `custom` (sob medida) | Split Oracle + grade de setores em 2 colunas |
| `contact` (fecho) | Mantém PULSAR letra a letra (assinatura); CTA único sólido |

## 7. Recusas em bloco (para não regredir)

Blobs alheios · texto em gradiente · glassmorphism · tilt/reflexo · carrossel automático ·
grid 2×2 perfeito · eyebrow CAPS repetido em toda seção · métrica fabricada · emoji como ícone ·
moldura mac. Fonte: PADRAO-VISUAL §4 — a análise dos 5 sites não trouxe NENHUM deles, o que
confirma a régua.
