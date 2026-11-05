# Mapeamento operacional do projeto Beethoven

Documento principal de navegação e manutenção da codebase. Descreve o estado encontrado nos arquivos, não a especificação desejada. Leia este mapa **antes de qualquer implementação ou alteração** e confirme os detalhes nos módulos afetados. Atualize-o na mesma alteração quando mudar estrutura, comportamento, dependências, configuração ou validação.

## Visão Geral do Projeto

- **Produto:** Beethoven: O Caminho de Casa; jogo de plataforma 2D em português brasileiro sobre um cachorro que volta para Elomir e Júlia.
- **Natureza:** frontend para navegador desktop e celular (teclado e multitoque), distribuído como arquivos estáticos ou HTML autocontido. Um único pacote npm, sem monorepo, backend de negócio, contas, API de dados ou banco externo.
- **Implementação efetiva:** JavaScript moderno com ES modules, classes, estado mutável e Canvas 2D. TypeScript somente na entrada do navegador; Phaser consta nas dependências, mas não há importação nem uso dele pelo jogo.
- **Domínio:** movimento e colisões, coleta opcional, vida, checkpoints, narrativa, clima, progressão linear por cinco localidades catarinenses e persistência local.
- **Operação:** navegador executa toda a simulação. Node serve arquivos e executa ferramentas/testes; não participa da física em produção. Docker configura ferramentas e distribuição, sem serviços de dados.
- **Fontes de apoio:** [README.md](README.md), [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md), [docs/ASSETS.md](docs/ASSETS.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md), [docs/TEST_REPORT.md](docs/TEST_REPORT.md).
- **Precedência:** o código e os artefatos de execução verificáveis fundamentam este mapa. Os documentos de apoio incluem registros históricos e algumas afirmações desatualizadas; divergências estão registradas abaixo.

### Como manter este mapa

1. Consultar o mapa e localizar responsabilidades/fluxos antes da mudança.
2. Ler os arquivos reais relacionados e reutilizar entidades, física, save e dados existentes.
3. Implementar sem duplicar mecanismos já disponíveis.
4. Atualizar imediatamente as seções impactadas e **Última Atualização**, incluindo limitações e evidências de testes.
5. Validar caminhos, scripts npm, variáveis e relações descritas. Não confundir dependência declarada, instalação disponível e execução aprovada.

[AGENTS.md](AGENTS.md) torna essa consulta/atualização obrigatória para agentes que atuem no repositório. O [README.md](README.md) aponta para este documento. Não existe gerador automático ou job que mantenha o mapa sincronizado: a manutenção integra cada tarefa.

## Arquitetura Geral

### Estilo e camadas

Aplicação cliente única, modularizada por responsabilidade, com máquina de estados manual. Predominam OOP simples (`Game`, `Beethoven`, `Renderer`, `Input`, `Save`, `AudioSystem`), funções utilitárias para física, uma factory de níveis e eventos DOM. Não há MVC, ECS, DDD formal, contêiner de DI, barramento de eventos ou cenas Phaser.

| Camada | Implementação | Limites reais |
|---|---|---|
| Shell/apresentação | [index.html](index.html), [src/style.css](src/style.css), `Game.panel()`, [src/render/Renderer.js](src/render/Renderer.js) | Menus em DOM; mundo, HUD, clima e cutscenes no Canvas |
| Aplicação/orquestração | [src/main.js](src/main.js), classe `Game`, loop `frame()` | Concentra cenas, NPCs, dano, coleta, câmera, checkpoint e progressão |
| Entidade/física | [src/entities/Beethoven.js](src/entities/Beethoven.js), [src/engine/physics.js](src/engine/physics.js) | Física AABB própria; não usa Arcade Physics |
| Dados declarativos | [src/data/levels.js](src/data/levels.js), [src/data/story.js](src/data/story.js) | Níveis gerados por padrões; roteiro em arrays |
| Adaptadores de navegador | Input.js, Display.js, Audio.js, Save.js em src/systems | Teclado/multitoque, viewport/rotação/fullscreen, WebAudio e LocalStorage |
| Ferramentas/infraestrutura | `scripts/`, `tests/`, [Dockerfile](Dockerfile), [docker-compose.yml](docker-compose.yml) | Build, assets, simulação, browser e servidor estático |

### Pontos de entrada e dependências

```text
index.html → src/bootstrap.ts → import dinâmico de src/main.js
                                  ├─ Input / Save / AudioSystem
                                  ├─ Display → visualViewport / fullscreen / Renderer.resize
                                  ├─ Beethoven → clamp / move / overlap
                                  ├─ Renderer → levels
                                  ├─ makeLevel(index)
                                  └─ intro / ending

main.js: await Renderer.load() → Game.menu() → requestAnimationFrame(frame)
```

- [src/bootstrap.ts](src/bootstrap.ts) verifica `#game`, define inicialmente 480×270 e carrega `main.js`. Renderer mantém essas coordenadas lógicas e adapta o backing store ao tamanho CSS/DPR em passos de 16×9, até 3840×2160, usando ResizeObserver/resize. Não recebe configurações do servidor.
- [src/main.js](src/main.js) instancia os sistemas **no carregamento do módulo**, consulta DOM, registra listeners e inicia o loop. Importá-lo exige APIs de navegador ou o adaptador de testes.
- `frame()` acumula tempo com delta limitado a 0,05 s; simula passos de `1/120` s, limitados a seis por frame; chama `input.end()` a cada passo e desenha por `requestAnimationFrame`. 120 Hz é o passo da simulação, não FPS medido.
- `Game` não é exportada; são exportadas as instâncias `game`, `input`, `save`, `audio`, `render`, utilizadas pelo harness e QA.
- Dependências de `Beethoven.update()` são recebidas por parâmetros (`dt`, input, sólidos, áudio, piso escorregadio); o orquestrador usa singletons de módulo em vez de DI.

### Máquina de estados

Estados concretos de `Game.mode`: `loading`, `menu`, `controls`, `intro`, `play`, `pause`, `over`, `transition`, `ending`, `finish`.

```text
menu → intro → play → transition → play … → ending → finish
  ├─ controls → menu                       finish → menu / intro
  └─ continuar → play
play ↔ pause → menu / retry
play → over → retry / menu
```

`start(index, resume)` recria os dados do nível e a entidade; `retry()` recria apenas o jogador no checkpoint e restaura seus três corações. Temporizadores de NPCs, fase global e ossos já coletados não são zerados por `retry()`. O chefe invicto reinicia com vida cheia, os frangos reaparecem e o poder é removido; chefes vencidos continuam vencidos.

## Stack Tecnológica

| Tecnologia/versão declarada | Finalidade | Onde é utilizada / estado |
|---|---|---|
| JavaScript ES modules | Motor e ferramentas | Todos os `.js` de `src/` e `.mjs` de `scripts/`/`tests/`; versão ECMAScript não fixada no pacote, alvo ES2022 no Vite |
| TypeScript `^5.9.3` | Entrada tipada | [src/bootstrap.ts](src/bootstrap.ts), [tsconfig.json](tsconfig.json); `strict: true`, `allowJs: true`, `checkJs: false`, `noEmit: true`; somente bootstrap consta em `include` |
| Canvas 2D / DOM / WebAudio / LocalStorage | Runtime cliente | `Renderer`, `Game.panel`, `AudioSystem`, `Save`; APIs nativas do navegador |
| Phaser `3.90.0` | Dependência declarada para futura adoção | [package.json](package.json); **não utilizado pelo motor** |
| Vite `^7.2.2` | Dev server, build e preview | [vite.config.js](vite.config.js); host `0.0.0.0`, porta 5173 estrita, target ES2022, base relativa `./` para hospedagem em subdiretórios |
| Node `>=22.12.0` | Ferramentas e servidor | `engines` em `package.json`; Docker usa `node:24-bookworm-slim`; validação atual em container com Node 24.22.2; Node/npm ausentes do PATH do host |
| npm | Dependências e scripts | `package.json`; não há `package-lock.json` nem `node_modules/` no workspace auditado |
| Node test / assert / vm | Lógica, integração e build offline | `tests/*.test.mjs`, `scripts/build.mjs`; precisa de `--experimental-vm-modules` |
| Vitest `^4.0.8` | Runner de casos de persistência | [vitest.config.js](vitest.config.js), `tests/unit/save.test.js`; ambiente Node |
| Playwright `^1.56.1` | Testes reais de browser | [tests/e2e.mjs](tests/e2e.mjs); script próprio, sem `playwright.config.*` nem runner `@playwright/test` |
| Chromium | Browser de E2E | Instalado por apt no estágio Docker `test`; versão do pacote não fixada |
| Python / Pillow | Tratamento legado e leitura de atlas | scripts/prepare_assets.py gera a sheet antiga; scripts/inspect_sprite_atlases.py gera metadados HD sem alterar imagens; versões não declaradas em manifesto Python; build usa JS de metadados já presente |
| `@napi-rs/canvas` | Renderização opcional de QA | [scripts/render-qa.mjs](scripts/render-qa.mjs), importado pelo caminho em `NATIVE_CANVAS_MODULE`; não declarado no npm do projeto |
| Docker / Compose | Instalação, teste e serviço local | `Dockerfile`, `docker-compose.yml`, `docker/run.sh`; cliente local previamente identificado como 29.9.2, não requisito fixado pelo projeto |

Não há ORM, framework de UI, banco, cache remoto, SDK cloud ou dependência de serviços de negócio.

## Estrutura de Diretórios

```text
/
├── project_mapping.md              Mapa principal e protocolo de manutenção
├── AGENTS.md                       Instruções para consultar/atualizar o mapa
├── README.md                       Execução, controles e limitações
├── index.html                      Shell DOM e entrada bootstrap.ts
├── package.json                    Pacote único, dependências e comandos
├── tsconfig.json                   Tipagem limitada à entrada TS
├── vite.config.js                  Build/dev/preview
├── vitest.config.js                Descoberta de testes unitários
├── Dockerfile                      Estágios development/test/build/production
├── docker-compose.yml              Serviços beethoven/dev/tests
├── .dockerignore / .gitignore      Exclusões de contexto e artefatos
├── .github/workflows/pages.yml     Build, testes e deploy do dist no GitHub Pages
├── src/
│   ├── bootstrap.ts                Entrada usada pelo Vite
│   ├── main.js                     Game, cenas, regras e loop
│   ├── style.css                   Layout e menus responsivos
│   ├── data/levels.js              Factory das cinco fases
│   ├── data/assets.js              Catálogo de atlas HD, raças e pelagens
│   ├── data/spriteFrames.js        Recortes alpha gerados, sem alterar imagens
│   ├── data/story.js               Introdução e encerramento
│   ├── data/familyScene.js         Timeline pura do passeio/guia/fuga
│   ├── engine/physics.js           clamp, overlap, move
│   ├── entities/Beethoven.js       Jogador, física, superfrango e voo
│   ├── entities/Boss.js            Cinco chefes, arena e ciclo de ataques
│   ├── render/Renderer.js          Mundo, clima, sprites, HUD e narrativa
│   ├── render/parallax.js          Faixa de cenário contínua e fase cíclica
│   └── systems/
│       ├── Input.js                Teclas e foco
│       ├── Display.js              Viewport visível, rotação e tela cheia
│       ├── Audio.js                Síntese de trilha e efeitos
│       └── Save.js                 Schema v1 e LocalStorage
├── assets/                        Materiais fora da distribuição (ver assets/README.md)
│   ├── references/beethoven/photos/ Quatro fotos de referência
│   ├── source/backgrounds/        Seis fundos originais
│   ├── source/characters/beethoven/ Sprite original fornecido
│   ├── archives/                  ZIP original dos cenários
│   └── legacy/characters/beethoven/ Sheet antiga processada
├── public/assets/                 Onze PNGs de execução
│   ├── backgrounds/               Um diretório por localidade
│   │   ├── beira-mar-florianopolis/
│   │   ├── parque-costa-azul/
│   │   ├── passeio-pedra-branca/
│   │   ├── caminho-novo/
│   │   └── terra-nova/
│   └── characters/                Atlas em beethoven/, rivals/, cats/, family/ e bosses/
├── scripts/
│   ├── serve.mjs                   Servidor HTTP estático
│   ├── build.mjs                   Build alternativo e HTML autocontido
│   ├── prepare_assets.py           Processamento do sprite original
│   ├── inspect_sprite_atlases.py   Lê PNGs e gera os recortes do catálogo
│   └── render-qa.mjs               Geração de renders Canvas
├── tests/
│   ├── harness.mjs                 Adaptador DOM/input/storage para Node
│   ├── logic.test.mjs              Física, save e geometria dos níveis
│   ├── flow.test.mjs               Sistemas e travessia integral simulada
│   ├── production.test.mjs         Bundle offline em VM
│   ├── save.test.mjs               Casos de persistência no runner Node
│   ├── cases/saveCases.mjs         Casos compartilhados por dois runners
│   ├── unit/save.test.js           Adaptador dos casos para Vitest
│   ├── e2e.mjs                     Fluxo de navegador e relatório JSON
│   ├── animals-input.test.mjs      Raças, gatos neutros, input e contratos dos atlas
│   ├── story-render.test.mjs       Corrida direta, timeline e fase infinita
│   ├── parallax-family.mjs         Pixels de emenda e abertura em Chromium
│   ├── visual-mobile.mjs           Qualidade 4K, layout e multitoque em browser
│   ├── pages.mjs                   Build em /beethoven/, assets, toque/rotação e HTML offline
│   ├── power-boss.test.mjs          Poder, dano, arenas, combate, retry e save
│   └── combat-browser.mjs          Voo/pausa/expiração, cinco lutas e multitoque
├── docker/mobile.env              Preset opcional para acesso pela rede local
├── docker/run.sh                   Preflight → teste → produção saudável
├── docs/
│   ├── GAME_DESIGN.md              Design e narrativa
│   ├── ARCHITECTURE.md             Arquitetura resumida
│   ├── IMPLEMENTATION_PLAN.md      Plano e evolução histórica
│   ├── ASSETS.md                   Auditoria de arte e pendências
│   ├── ART_PROMPTS.md              Prompts e procedência da geração de arte
│   ├── FAMILY_PROMPT.md            Prompt do atlas de Júlia e Elomir
│   ├── POWER_BOSS_ART.md           Prompts/dimensões dos atlas Vasco e rato
│   ├── BACKGROUND_PROMPTS.md       Prompts dos cinco cenários remasterizados
│   ├── TEST_REPORT.md              Evidências históricas de testes
│   └── screenshots/               Renders level-1…5.png e ending.png
├── dist/                          Artefatos gerados; ignorado pelo Git
└── test-results/                  Artefatos E2E locais; ignorado pelo Git
```

Fotos, sprite original, seis fundos originais, ZIP e sheet legada ficam em assets/, conforme [assets/README.md](assets/README.md). Não são código/arte carregada pelo jogo. Public/assets contém somente onze PNGs HD usados; não há script persistido de extração do ZIP.

As pastas protegidas `.git/`, `.agents/`, `.codex/` e `.aws/` não são módulos do jogo e não devem ser usadas como fonte de configuração de negócio. Nenhum valor de credencial dessas áreas faz parte deste mapa.

## Mapa de Módulos e Funcionalidades

Criticidade: **alta** impede iniciar, controlar, salvar ou concluir a aventura; **média** afeta apresentação, qualidade ou ferramentas opcionais.

| Módulo | Localização / componentes | Responsabilidade e relações | Criticidade |
|---|---|---|---|
| Entrada | `index.html`, `src/bootstrap.ts` | Canvas lógico 480×270, estágio 16:9; #game-shell contém estágio/narrativa/toque/toolbar; #fullscreen alterna exibição e #display-status anuncia fallback; importa main.js | Alta |
| Orquestrador | `src/main.js` / `Game` | `menu`, `controls`, `story`, `nextPart`, `start`, `hint`, `pause`, `resume`, `retry`, `hurt`, `transition`, `finish`, `update`, `draw`, `panel`; coordena todos os demais módulos | Alta |
| Jogador | `src/entities/Beethoven.js` / `Beethoven` | `update` altera corpo/estado; `frame(t)` seleciona pose; recebe input, sólidos e áudio; depende de `physics.js` | Alta |
| Física | `src/engine/physics.js` | `clamp`, `overlap`, `move`; colisão horizontal e vertical separadas, chão e plataformas de sentido único | Alta |
| Input | `src/systems/Input.js` / `Input` | `down`/`pressed`, origens de teclado/ponteiros em `sources`, `press`, `release`, `has`, `hit`, `end`, `clear`; captura/cancelamento multitoque, foco do canvas | Alta |
| Exibição | src/systems/Display.js / Display | Observa visualViewport/resize/orientation/fullscreen, publica variáveis CSS da área visível, atualiza Renderer.resize; tela cheia inclui controles; fallback ampliado quando API ausente/recusada | Alta |
| Persistência | `src/systems/Save.js` / `KEY`, `fresh`, `validate`, `Save` | Carrega/valida JSON, escreve progresso, reseta preservando mute; API LocalStorage | Alta |
| Áudio | `src/systems/Audio.js` / `AudioSystem` | `unlock`, `tone`, `sfx`, `update`; cinco sequências de notas, efeitos e chuva sintetizados | Média; jogo não depende dele |
| Níveis | `src/data/levels.js` / `makeLevel`, `levels` | Gera mapas novos por índice, com raças nos cães e gatos neutros; catálogo de assets fornece raças/pelagens; Game.start recria a factory | Alta |
| Narrativa | `src/data/story.js` / `intro`, `ending` | Arrays de cenas `{place,title,text,duration}`; Game controla avanço e Renderer compõe a cena | Alta para narrativa/progressão |
| Renderização | `src/render/Renderer.js` / `Renderer` | `resize`, `load`, `animal`, `dog`, cenário/HUD/cutscenes; HiDPI até 4K, catálogo de atlas e recortes alpha; Beethoven exclusivo, raças e gatos com poses próprias | Alta |
| Catálogo de arte | src/data/assets.js, src/data/spriteFrames.js | Contratos de arquivo/grade/tamanho lógico, raças/pelagens e recortes gerados a partir dos PNGs; compartilhados entre Renderer, build, testes e QA | Alta |
| Família e parallax | src/data/familyScene.js, src/render/parallax.js | Timeline determinística por cena/tempo; faixa cíclica com blend nativo de 6% e fase fracionária. Renderer desenha humanos/animais pelo mesmo método sprite | Média |
| Shell visual | src/style.css, Game.panel/syncUI, index.html | Estágio 16:9; paisagem de toque/fullscreen usa maior retângulo possível com controles/toolbar sobrepostos; retrato normal usa controles abaixo; menus roláveis e safe areas | Média |
| Chefes | src/entities/Boss.js, Game.hitBoss/update | Cinco perfis com aviso/investida/recuperação, hit cooldown e arena; Game coordena pisão, latido, superpum, dano e bloqueio de saída | Alta |
| Build/distribuição | `scripts/build.mjs`, Vite, `.github/workflows/pages.yml` | Dois caminhos de build produzem `dist`; Vite com base relativa; workflow valida e publica dist no Pages; geração offline usa sintaxe ES modules restrita | Alta para entrega |
| Servidor | `scripts/serve.mjs` | HTTP nativo Node sem middleware/backend; serve raiz informada e aplica MIME/404 | Alta para HTTP; dispensável no HTML offline |
| Assets/QA | `scripts/prepare_assets.py`, `scripts/render-qa.mjs` | Pillow normaliza frames; QA troca o contexto Canvas usando harness e grava PNGs | Média |
| Validação | `tests/` | Node test, dois casos Vitest compartilhados, script E2E Playwright; sem testes enviados ao jogo | Alta para confiança na entrega |
| Containers | `Dockerfile`, `docker-compose.yml`, `docker/run.sh` | Dependências/build/testes isolados; produção recebe apenas artefatos e servidor | Alta para fluxo Docker |

### Onde implementar mudanças comuns

| Mudança | Arquivos a consultar primeiro | Impactos relacionados |
|---|---|---|
| Movimento, pulo ou colisão | `Beethoven.js`, `physics.js` | `levels.js`, `logic.test.mjs`, solver de `flow.test.mjs` e `e2e.mjs` |
| Novo objeto/NPC/interação | `levels.js`, `Game.update()` em `main.js` | `Renderer.level()`, áudio, save se persistente; não há classe DogNPC separada |
| Nova fase ou alteração da ordem | `levels.js` | Índices e limites em `Save.js`, textos/condições em `main.js`, `story.js`, Renderer, testes e bundle offline |
| Interface/pause/menu | `Game.panel()` e métodos de cena, `style.css`, `index.html` | Nomes de botões são contratos dos seletores E2E; teclado em Input |
| Alteração de save | `Save.js` | Pontos de escrita em `main.js`, casos compartilhados, migração/versionamento |
| Arte/animação/clima | `Renderer.js`, `Beethoven.frame()`, `prepare_assets.py` | Assets, `ASSETS.md`, manifesto offline e renders QA |
| Publicação/instalação | `package.json`, Vite, `build.mjs`, `serve.mjs`, Docker | `production.test.mjs`, E2E e exclusões de contexto |

## Mapa de Fluxos

| Fluxo | Gatilho/origem | Etapas | Resultado / frequência | Criticidade |
|---|---|---|---|---|
| Inicialização | Abertura de `index.html` | Bootstrap → instancia sistemas → Save lê storage → Renderer carrega imagens em paralelo → remove loading → menu → RAF | Uma vez por carga da página | Alta |
| Nova partida | Botão Jogar ou Enter no menu | `save.reset()` → limpa `collected` → `story('intro')` → avanço/skip → `start(0)` | Progresso novo, mute preservado | Alta |
| Continuar | Botão exibido se `started && !completed` | `start(save.data.level, true)` → recria nível → aceita checkpoint apenas se existe no mapa → spawn → write | Retomada no checkpoint ou início | Alta |
| Input/física | `keydown`/`keyup` + passos do loop | Input mantém conjuntos → Game atualiza plataformas → Beethoven.update → move com ground/platforms → clamp do mundo → estado de animação | Até 120 passos/s lógico | Alta |
| Corrida direta móvel | Pointer no botão Correr, ação Run | Usa direção explícita se houver seta; caso contrário usa player.face; acelera até 145; soltar/cancelar remove a ação | Um botão basta para deslocar e correr; Shift de teclado continua modificador | Alta |
| NPCs/dano | Proximidade ou overlap durante play | NPC patrulha/alerta/late/retorna → colisão não acalmada ou hazard chama hurt → reduz HP, aplica impulso/invulnerabilidade | `over` ao zerar; retry por ação do usuário | Alta |
| Gatos neutros | Factory + passos de play | Passeiam em trecho seguro → observam jogador próximo → afastam-se ao latido, dentro do intervalo de origem | Não causam dano, não são coletáveis e não alteram save | Média |
| Queda | `player.y > 290` | `hurt(true)` → perde vida mesmo se invulnerável → recoloca no checkpoint se ainda vivo | Recuperação local; game over se HP zerar | Alta |
| Latido/portão | E, se bark não ativo | Bark 0,4 s → NPCs próximos acalmam; ataque frontal atinge chefe a menos de 110 px fora da investida → no último portão inicia ending se chefe vencido | Latido serve ao combate e à interação final | Alta |
| Coleta | Proximidade entre corpo e osso | ID não coletado → adiciona ao Set → salva lista → efeito sonoro → seis partículas | Ossos persistem entre tentativas e fases | Média; itens opcionais |
| Checkpoint | Jogador no chão a menos de 27 px da bandeira e posição maior que checkpoint | Atualiza checkpoint em memória/storage → HP=3 → sfx + hint | Não regride checkpoint na mesma fase | Alta |
| Troca de fase | `player.x > end-40`, índices 0…3, chefe vencido | `transition()` salva próximo índice e checkpoint=0 → painel → Enter/botão chama `start` | Progressão linear; ossos independentes da saída | Alta |
| Encerramento | Interação no Terra Nova | `story('ending')` → cenas → `finish()` → completed=true + write → painel replay/menu | Final com save; Esc também conclui a narrativa | Alta |
| Pausa/foco | Esc em play, blur da janela ou documento oculto | `pause()` apenas quando play → update não simula gameplay → resume/retry/menu | Posição e tempo global congelados em pause; desenho continua | Alta |
| Rotação/área visível | Resize/orientação/visualViewport | Display publica largura/altura/offsets → shell ocupa viewport em paisagem → Renderer adapta backing store após layout; input limpo ao girar | Sem reiniciar jogador, fase ou save | Alta |
| Tela cheia | Botão Tela cheia/Sair | API padrão/WebKit sobre game-shell → acompanha fullscreenchange; API ausente/recusada ativa modo ampliado com aviso → Sair/Esc retorna | Inclui canvas, narrativa e controles; barras só são ocultadas pelo browser no fullscreen nativo | Média |
| Áudio/mute | Clique em botão, Enter no menu ou toggle M/DOM | Desbloqueia AudioContext → sequências/efeitos só se contexto e não muted → mute salvo | Áudio falha sem impedir gameplay | Média |
| Build Vite | `npm run build` | tsc → vite build → build.mjs --offline-only | Build web + Beethoven.html; sem execução de testes automática nesse comando | Alta |
| Publicação Pages | Push em main ou workflow_dispatch | Node 24 → instalação → build → npm test → Chromium/test:pages/test:combat → configurar Pages → upload dist → deploy protegido pelo ambiente github-pages | Depende de habilitar GitHub Actions como Source em Settings/Pages; configuração local não comprova deploy remoto | Alta |
| Passeio da família | Intro, cenas 0…3 | introFamily(part,time) → prender guia → caminhada conjunta → rival → queda da guia → fuga/busca; sprites da família também no reencontro/final | Timeline apenas visual, sem alterar física, save ou duração das cenas | Média |
| Build alternativo | `npm run build:legacy` ou Node direto | Parse JS por VM → apaga/recria dist → copia arquivos → troca entrada TS por JS → empacota HTML | Não executa TS/Vite nem browser | Alta |
| QA visual | `render-qa.mjs` | Importa harness → troca contexto por canvas nativo → carrega PNGs → posiciona jogador → renderiza cinco níveis/final | Execução manual; não é screenshot de browser | Média |
| Instalação/validação Docker | `docker/run.sh` | preflight docker version → build tests → run verify → up production --wait | Falha em qualquer etapa interrompe o script | Alta |
| Superfrango/voo | Contato com coxa escondida | Revela na proximidade → come → power=20/impulso inicial/camisa Vasco; segurar salto ativa propulsão e gás a cada 0,45 s; soltar desce | Pausa congela; expiração/retry removem poder; sem imunidade | Alta |
| Arena/combate | X atinge Boss.trigger, mesmo voando | Ativa arena com chão contínuo → aproxima/avisa/investe/recupera → latido frontal fora da investida, pisão com quique ou superpum tiram HP → vitória salva índice e libera saída | Chefe invicto bloqueia transição e último portão; retry reinicia luta | Alta |

### Regras físicas e de execução

- Corpo do jogador: `w=27`, `h=23`. A propriedade `y` é o **topo** da hitbox. O argumento `y` do construtor representa a altura dos pés e é convertido por `y-23`; o chão padrão fica em 222.
- Velocidades horizontais máximas: 95 andando, 145 correndo e 180 correndo com poder; voo limita o topo do corpo a y=35, usa propulsão/gravidade próprias enquanto o salto está segurado; gravidade 850; impulso de pulo -335; velocidade vertical limitada em 480. Coyote e buffer: 0,1 s. Soltar pulo cedo reduz a subida.
- Plataformas `oneWay` não bloqueiam o eixo horizontal e só recebem aterrissagem de cima; `dx` transporta o corpo em plataforma móvel. Cenários não são colisores.
- Piso escorregadio é selecionado por intervalo em X, sem checagem da altura do jogador. Não há rampas físicas nem colisão jogador/NPC como sólido; NPC é fonte de dano.
- NPCs são objetos de dados com estados `patrol`, `alert`, `bark`, `return`; a lógica fica em Game. Invulnerabilidade após dano dura 1,8 s.
- Câmera usa posição X, antecipação de 28 px na direção e interpolação; limites do mundo usam viewport 480. Partículas mantidas em até 60; chuva desenha até 65 traços por frame.
- M e F2 são processados antes dos retornos de cena. Pausa interrompe gameplay e emissão musical; sons já iniciados não têm um sistema específico de pause.
- Não há jobs agendados, filas ou processos de negócio em background. RAF, síntese de áudio, promises de imagens e esperas do E2E são as operações assíncronas existentes.

## Interfaces Expostas

### HTTP estático

[scripts/serve.mjs](scripts/serve.mjs) usa `node:http`, escuta em `0.0.0.0` e remove a query string para localizar arquivos. Compose publica somente localhost por padrão; `docker/mobile.env` habilita a porta na rede local. **Não há autenticação nem validação do método HTTP**; as rotas abaixo descrevem o uso normal por GET, não endpoints REST.

| Caminho | Comportamento |
|---|---|
| `/` | Mapeia para `/index.html` dentro da raiz servida |
| `/assets/<arquivo>` | Sem argumento de raiz, mapeia para `public/assets/`; com `dist`, usa `dist/assets/` |
| `/<caminho existente>` | Resolve abaixo da raiz, lê arquivo e devolve MIME por extensão; no índice de desenvolvimento troca bootstrap.ts por main.js |
| `/Beethoven.html` | Disponível quando a raiz é `dist` e o HTML offline foi gerado |
| Caminho fora da raiz/arquivo inacessível | 404 com mensagem em português; erros internos também caem em 404 |

Tipos explícitos: HTML, JS, CSS, PNG e JSON; demais extensões recebem `application/octet-stream`. Respostas de sucesso usam `Cache-Control: no-cache`. Não existe `/health` específico; healthcheck Docker faz GET `/`.

Vite possui seus servidores de desenvolvimento/preview configurados em `vite.config.js`; o servidor Node acima é um caminho independente.

### API de diagnóstico do navegador

`window.beethoven.snapshot()` em [src/main.js](src/main.js) devolve mode, level, posição/velocidade, HP, chão, animação, bark, ossos, checkpoint, falhas de assets, resolução física do canvas, resumo dos **três primeiros** cães (inclui breed) e gatos (coat/estado/posição). Inclui power/flying, frangos, face e estado/vida/tempo/posição do chefe. É somente leitura, usado pelo E2E; não oferece teletransporte e não é API remota.

`window.BEETHOVEN_ASSETS` é um manifesto opcional de imagens data URI gerado pelo build offline e consultado por Renderer. Os exports de instâncias de `main.js` são interfaces internas de harness/QA, não contratos de biblioteca versionados.

### Comandos npm

| Comando | Encadeamento / finalidade |
|---|---|
| `npm run dev` | Vite, porta 5173 estrita, host 0.0.0.0 |
| `npm run build` | typecheck → Vite → build:offline |
| `npm run build:offline` | Node VM, `scripts/build.mjs --offline-only`; preserva o build web existente |
| `npm run build:legacy` | Node VM, build alternativo completo sem dependências npm |
| `npm run preview` | Preview Vite do build, porta 5173 |
| `npm start` | `node scripts/serve.mjs dist` |
| `npm run dev:offline` | Servidor Node na raiz do projeto, com entrada JS |
| `npm run typecheck` | tsc --noEmit, escopo limitado ao bootstrap TS |
| `npm test` | test:unit → test:logic; precisa de dist para production.test |
| `npm run test:unit` | Vitest; dois casos compartilhados |
| `npm run test:logic` | 24 casos Node com isolamento de arquivos desativado e VM experimental |
| `npm run test:e2e` | Script Playwright independente |
| `npm run test:visual` | Chromium desktop/4K, layout de celular, multitoque, cancelamento, save/pausa e orientação; relatório visual-mobile-report.json |
| `npm run test:story` | Chromium: atlas humanos, alturas equivalentes, pixels de emenda/limite nos cinco cenários e capturas de cenas da abertura; story-assets-report.json |
| `npm run test:pages` | Chromium em servidor temporário exclusivo /beethoven/: nove imagens, movimento, link inicial, corrida por toque, rotação e HTML offline; pages-report.json |
| `npm run test:combat` | Fixture Chromium com exports somente para QA: descoberta por salto, camisa/voo/pausa/expiração, cinco lutas sem poder e multitoque; combat-report.json |
| `npm run verify` | build → test → test:e2e → test:visual → test:story → test:combat → test:pages |

Outras interfaces: `python3 scripts/prepare_assets.py`, `node scripts/render-qa.mjs`, `node scripts/serve.mjs [raiz]`, `./docker/run.sh` e comandos Compose descritos em Deploy. Não há CLI publicada, eventos de domínio externos, webhooks ou API pública de biblioteca.

## Componentes Reutilizáveis

| Componente | Reutilização prevista pelo código |
|---|---|
| `clamp`, `overlap`, `move` em `physics.js` | Limites, testes AABB e resolução de movimento; usar os mesmos contratos geométricos em objetos novos |
| `makeLevel(index)` em `levels.js` | Obter arrays mutáveis novos por partida; não reutilizar a instância global `levels` como estado de gameplay |
| `fresh()`, `validate()` e `Save` | Único schema e política de persistência; não criar outra chave/schema sem coordenar versão |
| `Input.has/hit` | Diferenciar tecla segurada de acionamento único; consumir pressed com `end()` |
| `AudioSystem.sfx/tone` | Efeitos e notas sem assets externos; efeitos reconhecidos: jump, bone, bark, hurt, checkpoint, land, step, interact, chicken, fart, bossHit, victory |
| `Renderer.sprite/animal/dog/human` | Recortes e escala compartilhados por animais e donos; humanos seguem descrição, sem referência fotográfica |
| `Renderer.rect/text/bone/gate` | Primitivas compartilhadas por fases e cutscenes |
| `Game.panel/hint` | Painéis DOM e mensagens temporárias; labels dos botões também utilizados nos testes |
| `registerSaveCases(test, assert)` em `tests/cases/saveCases.mjs` | Mesmas verificações de persistência executadas por Node test e Vitest |
| `tests/harness.mjs` / `tick`, `draw` | Rodar simulação com input programático e DOM mínimo; QA visual também importa esse módulo |

## Modelo de Dados

### Save persistido

LocalStorage, chave **`beethoven.save.v1`** em [src/systems/Save.js](src/systems/Save.js). Um documento JSON por origem do navegador; sem sincronização remota, repositories, ORM ou migrations.

| Campo | Tipo / inicial | Validação ou uso |
|---|---|---|
| `version` | number / 1 | Qualquer versão diferente de 1 descarta o save e retorna fresh |
| `level` | inteiro / 0 | Somente 0…4; inválido descarta documento inteiro |
| `checkpoint` | number / 0 | Finito, limitado a 0…20000; Game.start retoma na bandeira anterior mais próxima, ou zero, para aceitar mapas anteriores |
| `bones` | string[] / [] | IDs `índice-ordinal`, regex numérica; deduplica e limita a 2000; total mostrado vem do tamanho do Set |
| `bosses` | number[] / [] | Inteiros únicos 0…4 de chefes vencidos; campo ausente em saves v1 antigos recebe []; reset limpa |
| `completed` | boolean / false | Coerção por igualdade a true; controla término e remoção de Continuar |
| `started` | boolean / false | Habilita Continuar quando não completed |
| `muted` | boolean / false | Persistido; único valor preservado em reset |
| `unlocked` | number[] / [0] | Filtra inteiros de 0…4; não há seletor de fases nem deduplicação na função validate |

`Save` captura falhas de JSON/leitura e volta ao estado inicial; falha de escrita é ignorada, mantendo a sessão jogável em memória. Escreve ao iniciar fase, coletar cada osso, ativar checkpoint, vencer chefe, trocar fase, concluir e mudar mute/reset. Não salva HP, poder/frangos, posição exata, tempo global ou estado dos NPCs/chefe invicto. `unlocked` registra entradas/avanços, não um histórico detalhado de conclusão por fase.

### Nível e entidades em memória

| Estrutura | Campos principais / relacionamento |
|---|---|
| Level | `{index,name,subtitle,bg,width,weather,story,platforms,hazards,dogs,cats,bones,chickens,boss,checkpoints,slippery,ground,gaps,start,end}` retornado por `makeLevel` |
| Corpo/plataforma | `x,y,w,h`, opcionais `oneWay`, `moving`, `origin`, `phase`, `dx`; move usa coordenadas do topo esquerdo |
| Jogador | posição/velocidade, w/h, face, grounded, hp, inv, coyote, buffer, bark, land, state, time, step; power (20 s), launch, flying, burst e boostCooldown |
| NPC | corpo, breed (pitbull/shepherd/pinscher/rottweiler), origin, range, vx, state, calm; atualizados em Game.update, colisão original preservada |
| Gato | coat (tabby/tuxedo), x, y nos pés, origin, range, vx, state (stroll/watch/startled), flee; sem hitbox/dano/save |
| Hazard | corpo, type (`glass`, `thorns`, `spikes`), estático; colisão AABB tira um coração respeitando invulnerabilidade |
| Frango | id, x/y/w/h, eaten/revealed; dois por fase, escondidos entre folhas em plataformas; comer ativa power, retry repõe |
| Chefe | Boss(index,end): name/kind, hp/maxHp, x/y/w/h/vy, face, left/right/trigger, active/defeated/state/timer/inv; HP 5/6/7/7/9 |
| Osso | `{id,x,y}`; id liga dados da fase ao Set `Game.collected` e save.bones |
| Checkpoint / gap / slippery | Respectivamente `{x,y}`, `{x,w}`, `{x,w}`; fase identifica a qual mapa pertencem |
| Cena narrativa | `{place,title,text,duration}`; `place` é índice da fase usada como cenário |
| Partícula | `{x,y,vx,vy,life,color,gas?,size?}`; criada em coleta/superpum e descartada ao expirar |

Não existem tabelas, coleções de servidor, schemas de API, migrations SQL ou arquivos de seed.

### Conteúdo dos cinco níveis

Dados extraídos da factory atual; índices são zero-based e fazem parte de vários contratos.

| Índice / nome | Largura | Clima | Plataformas / NPCs / hazards / ossos | Checkpoints X |
|---|---:|---|---|---|
| 0 — Beira-Mar de Florianópolis | 8500 | sun | 30 / 9 / 4 / 68 | 4140, 7825 |
| 1 — Parque Costa Azul | 9500 | cloud | 34 / 10 / 5 / 77 | 4420, 8825 |
| 2 — Passeio Pedra Branca | 11000 | rain | 40 / 11 / 6 / 90 | 5160, 10325 |
| 3 — Caminho Novo | 9500 | drizzle | 34 / 10 / 5 / 77 | 4420, 8825 |
| 4 — Terra Nova | 6000 | sunset | 20 / 6 / 3 / 45 | 2760, 5325 |

A factory repete padrões a cada 340 px, usa `n % 5`, cria chão com lacunas e marca a saída em `width-120`. Só o parque cria plataformas móveis; só índices 2/3 criam pisos escorregadios. Todas as fases têm perigos estáticos e dois frangos; o trecho final tem chão contínuo para a arena e dois checkpoints por fase. Não existe validação do argumento `index` na factory.

### Dados visuais

- beethoven-vasco-hd.png: RGBA 1671×941, 4×3, 12 poses com camisa preta/faixa branca/cruz vermelha. rat-hd.png: RGBA 1254×1254, 2×2, quatro poses exclusivas do rato gigante. Prompts/dimensões em docs/POWER_BOSS_ART.md; gerados por image_gen, pixels preservados. Coxas/perigos/gás usam Canvas nativo.

- `public/assets/characters/beethoven/beethoven-hd.png`: RGBA 1672×941, 12 poses exclusivas, grade 4×3. Mantém branco/caramelo e orelhas assimétricas da referência; Beethoven.frame reutiliza as poses entre estados existentes.
- `rivals-hd.png`: RGBA 1448×1086, grade 4×4; linhas pitbull, pastor-alemão, pinscher e rottweiler; colunas idle, duas passadas e latido. Nenhum rival reutiliza a imagem de Beethoven, inclusive na introdução.
- `cats-hd.png`: RGBA 1774×887, grade 4×2; tabby cinza e tuxedo preto/branco, com idle, duas passadas e sentado. NPCs de gato são neutros.
- `family-hd.png`: RGBA 1774×887, grade 6×2; Júlia (branca, cabelo castanho escuro) e Elomir (cabelo preto), seis poses cada, altura lógica 68. humanSprites compartilha o recorte/escala de sprite; prompt em docs/FAMILY_PROMPT.md. Reutilizado na abertura/reencontro/final.
- `src/data/assets.js` define arquivos, raças e dimensões lógicas; `spriteFrames.js` registra recortes alpha reais. `inspect_sprite_atlases.py` lê os PNGs e gera esses metadados, preservando as imagens. Renderer mantém escala comum por personagem e alinha os pés, sem reduzir os PNGs para células de 64×48.
- Cinco fundos RGB de **2172×724**, com nomes originais acrescidos de `-hd.png`, em `public/assets/backgrounds/`; reconstruídos por image_gen a partir das referências. Renderer usa altura lógica de 272 e preserva a proporção, independente dos pixels de origem.
- Originais de cenários em assets/source/backgrounds; fotos em assets/references/beethoven/photos; sprite original em assets/source/characters/beethoven; ZIP em assets/archives e sheet antiga em assets/legacy/characters/beethoven. Runtime usa onze PNGs HD (cinco fundos + seis atlas) em public/assets. Build web preserva essas subpastas; HTML offline embute os mesmos onze arquivos. São José continua sem fase.
- `prepare_assets.py` mantém o fluxo legado de redução/alpha para o antigo beethoven.png; não gera os HD. Geração atual usa a ferramenta integrada image_gen, prompts em docs/ART_PROMPTS.md e docs/BACKGROUND_PROMPTS.md, seguida de metadados por leitura alpha.
- `Renderer.load` prefere data URI de window.BEETHOVEN_ASSETS; fora do offline carrega PNGs locais. Falhas vão para render.errors com aviso no footer; cenário tem cor substituta e personagem ausente não é desenhado. Não há retry de imagens.
- Canvas adapta resolução ao tamanho CSS e DPR até 3840×2160, com suavização de imagens de alta qualidade; isso não transforma todos os PNGs em 4K. Primitivas/HUD permanecem programáticos; humanos usam atlas ilustrado.
- parallax.js mistura 6% das extremidades em faixa nativa armazenada em cache; padrão repeat-x e fase fracionária evitam salto de fim/início, sem espelhar letreiros. O cenário continua reutilizando conteúdo periodicamente; não são paisagens inéditas ilimitadas.

## Convenções de Código

- Nomes de classes em PascalCase; variáveis/métodos em camelCase; arquivos de classes com nome da classe. Texto de produto em pt-BR e identificadores técnicos em inglês.
- ES modules com extensões explícitas `.js` em imports locais e top-level await. Ferramentas Node usam `.mjs`; entrada tipada `.ts`.
- Código JS/CSS majoritariamente condensado em linhas longas; não há Prettier, ESLint, EditorConfig ou regra de lint declarada.
- Arrays e objetos de dados são mutáveis; jogador e NPCs são atualizados in-place. `Game.mode`/`state` são strings, sem enum central.
- Configuração de nível não equivale a tilemap: retângulos próprios de colisão ficam separados da pintura.
- Não há framework de DI: entidades recebem argumentos; orquestrador fecha sobre instâncias globais do módulo.
- Tratamento de erros é localizado: save/áudio toleram falhas, imagens têm fallback, servidor retorna 404, E2E registra exceção e sai com código 1. Não há formato universal de erro.
- Não há política explícita de remoção de listeners/destruição do Game. Instâncias do aplicativo e RAF são criadas uma vez por carga; mudanças de modo reaproveitam os sistemas.
- Novos imports/exports devem considerar o empacotador offline baseado em regex: ele reconhece imports nomeados estáticos, export class/function/const e listas export; sintaxes default, reexports, ciclos e dynamic import no grafo de gameplay exigem adaptação/validação do bundler.

## Integrações Externas

**Runtime do jogo:** não há APIs de terceiros, serviços internos, banco remoto, buckets, mensageria, autenticação, pagamentos, e-mail/SMS, webhooks ou telemetria. Arte e código são locais; áudio é sintetizado.

| Integração de ferramenta | Origem/destino | Autenticação/configuração |
|---|---|---|
| npm registry | Instalação das dependências declaradas em package.json | Nenhum token ou credencial exigido pelo projeto; rede necessária |
| Registro de imagens Docker | Bases Node e frontend Dockerfile | Nenhuma credencial definida nos arquivos do projeto; Docker usa seu contexto externo |
| Repositórios apt Debian | Estágio test instala chromium/fonts-liberation | Sem credenciais no projeto |
| Daemon Docker local | docker CLI/Compose → daemon selecionado pelo usuário | Acesso ao contexto/socket do host; não há montagem do socket nos containers da aplicação |
| Playwright → Chromium | Lançamento headless e controle de página | Caminho de executável configurável; perfil de teste, sem login de usuário |
| Canvas nativo opcional | Módulo local em caminho absoluto | NATIVE_CANVAS_MODULE; não é serviço externo |

Perfis/permissões do Codex, instalação de Docker no host e permissões do socket são configuração externa ao projeto. Não são gerenciados por scripts deste repositório.

## Variáveis de Ambiente e Configuração

| Nome / parâmetro | Consumidor | Padrão / efeito |
|---|---|---|
| `PORT` | `scripts/serve.mjs` | 5173; conversão Number, sem validação adicional |
| `BEETHOVEN_BIND_ADDRESS` | Publicação de porta no Compose | 127.0.0.1; preset docker/mobile.env define 0.0.0.0 para celulares na mesma rede |
| `CHROMIUM_EXECUTABLE_PATH` | `tests/e2e.mjs` | Sem valor: Playwright escolhe seu Chromium; se definido, exige arquivo executável; Docker test define `/usr/bin/chromium` |
| `PLAYWRIGHT_MODULE` | `tests/e2e.mjs` | Caminho opcional do módulo local; sem valor importa pacote `playwright` |
| `E2E_BASE_URL` | `tests/e2e.mjs` | Sem valor inicia servidor sobre `dist`; definido usa servidor já existente |
| `E2E_PORT` | `tests/e2e.mjs` | 5175 para o servidor criado pelo teste, passado como PORT ao subprocesso |
| `E2E_FULL` | `tests/e2e.mjs`, Compose tests | Somente string `1` habilita percurso integral; Compose define `1` |
| `NATIVE_CANVAS_MODULE` | `scripts/render-qa.mjs` | Obrigatório para importar o módulo `@napi-rs/canvas` por caminho |
| `DOCKER_TEST_USER` | Interpolação em docker-compose.yml | `0:0`; usuário do serviço tests, não variável de negócio do browser |
| `CHOKIDAR_USEPOLLING` | Ambiente do serviço dev | `true`; solicitado para observação em volume; código do jogo não lê essa variável |
| `NODE_ENV` | Estágio production | `production`; servidor não muda explicitamente o comportamento com ela |
| `process.argv[2]` | `scripts/serve.mjs` | Raiz estática, padrão diretório atual; produção/E2E passam `dist` |
| `--offline-only` | `scripts/build.mjs` | Preserva dist existente, não troca índice web, gera HTML offline e copia assets |
| `window.BEETHOVEN_ASSETS` | Renderer / HTML gerado | Manifesto em memória, não env var de processo |

`docker/mobile.env` contém apenas o endereço de publicação da porta; não há chaves de API ou secrets exigidos pelo jogo. Não registrar credenciais do Docker/npm/host no mapa. package.json, tsconfig, Vite/Vitest, Compose e o catálogo de arte são fontes de configuração versionável; não existe config central de gameplay.

## Observabilidade

- Servidor imprime URL quando começa a escutar; não possui log de requisições, health detalhado ou log de cada erro (todos caem em 404).
- Build imprime geração dos artefatos; script Pillow imprime frames/alpha; render QA imprime conclusão.
- Node test produz resultados e a travessia imprime JSON com tempos simulados, checkpoints, ossos e retries.
- E2E imprime cada check aprovado e fase, captura `pageerror`, escreve `test-results/e2e-report.json` com status/browser/url/checks/errors/failure e capturas conforme o avanço. Não coleta explicitamente todo console, falhas de rede ou trace Playwright.
- F2 alterna contornos de colisores; `window.beethoven.snapshot()` oferece diagnóstico somente leitura.
- Docker production tem healthcheck GET `/` a cada 10 s, timeout 3 s, start-period 10 s. Isso verifica resposta HTTP, não jogabilidade ou conclusão.
- Não há monitoramento remoto, métricas de FPS/memória, tracing distribuído, alertas, dashboards, circuit breakers ou dead-letter queues.
- Resiliência real: save/áudio degradam sem quebrar o jogo, assets têm fallback; servidor E2E faz até 100 tentativas a intervalos de 100 ms e percurso tem deadline de 12 min / limite de menos de 25 retries. Não existe retry de carregamento de imagens ou de requisições de negócio.

## Testes

| Arquivo | Runner / cobertura efetiva |
|---|---|
| [tests/logic.test.mjs](tests/logic.test.mjs) | 4 casos Node: save/versionamento/deduplicação, movimento e altura variável, coyote/buffer, geometria/checkpoints das cinco fases |
| [tests/animals-input.test.mjs](tests/animals-input.test.mjs) | 3 casos Node: origens de input independentes, quatro raças/gatos neutros seguros e dimensões/recortes dos PNGs entregues |
| [tests/flow.test.mjs](tests/flow.test.mjs) | 2 casos Node: interação dos sistemas e travessia integral por física/input; casos isolados reposicionam jogador; travessia não teletransporta |
| [tests/production.test.mjs](tests/production.test.mjs) | 1 caso Node/VM: executa dist/Beethoven.html com harness; verifica menu, cinco cenários + seis atlas do catálogo no manifesto e arquivos presentes; não testa bundle Vite |
| [tests/save.test.mjs](tests/save.test.mjs) | 2 casos Node registrados por `registerSaveCases` |
| [tests/unit/save.test.js](tests/unit/save.test.js) | Mesmos 2 casos em Vitest, não uma cobertura independente adicional |
| [tests/cases/saveCases.mjs](tests/cases/saveCases.mjs) | Escrita/leitura de checkpoint/configurações, reset, JSON inválido e storage recusado |
| [tests/harness.mjs](tests/harness.mjs) | DOM/Image/Canvas/RAF e LocalStorage substitutos; importa main.js, exporta instâncias e tick/draw; não simula browser completo |
| [tests/e2e.mjs](tests/e2e.mjs) | Chromium real: menu/assets, intro/skip, movimento/corrida, pulo/chão, mute/pause, reload/continuar, reset; E2E_FULL inclui cinco fases/final. Reinício aguarda intro/play; mute aguarda o rótulo após KeyM, sincronizando leituras com o loop de simulação |
| [tests/power-boss.test.mjs](tests/power-boss.test.mjs) | 9 casos Node: distribuição, poder/pausa/expiração, hazards, ciclo do chefe, dano, saída bloqueada e retry/save |
| [tests/combat-browser.mjs](tests/combat-browser.mjs) | Fixture interceptada do HTML offline: coleta por salto, voo/pausa/expiração, cinco chefes por teclas sem poder e multitoque. Posições escolhidas na fixture; sem API mutável em produção |
| [tests/pages.mjs](tests/pages.mjs) | Chromium desktop/móvel em /beethoven/ com raiz retornando 404; nove imagens HD, início/movimento, link inicial, corrida por toque/rotação e HTML offline. Requer dist e Chromium; gera pages-report.json |
| [scripts/render-qa.mjs](scripts/render-qa.mjs) | QA visual manual em Canvas nativo; não é runner de testes, não mede FPS nem verifica browser |
| [tests/visual-mobile.mjs](tests/visual-mobile.mjs) | 9 checks Chromium: qualidade 4K; fullscreen nativo desktop/saída externa; menus/toque/cancelamento/save; paisagem ocupa >95% do maior 16:9; orientação CDP/barras 390→320→390; fullscreen móvel com rotação; fallback recusado em fixture. Capturas incluem mobile-fullscreen.png; sem execução física/Safari |
| [tests/story-render.test.mjs](tests/story-render.test.mjs) | 3 casos Node: Run sozinho/sentido/soltura, timeline de passeio/guia/fuga e fase periódica para câmera negativa/distante |
| [tests/parallax-family.mjs](tests/parallax-family.mjs) | 3 checks Chromium: quarto atlas/alturas humanas, comparação de pixels de emenda e limite temporal em cinco fundos, capturas da abertura em fixture offline temporal. E2E_BASE_URL usa o HTML offline do serviço, não dist antigo do container |

### Estado atual — superfrango, perigos e chefes, 2026-11-04

- Typecheck/build web/offline, dois Vitest e 24 Node aprovados. Travessia simulada completa com combate por inputs: 337 s lógicos, 73 ossos e zero retries.
- Sete E2E curtos, nove checks móveis/visuais/fullscreen e três de família/parallax aprovados no build atual. Três checks de combate Chromium aprovados: poderes, cinco chefes sem frango, multitoque/barra móvel sem sobreposição. Três checks Pages aprovados; sem resultado remoto de CI/Pages declarado.
- Arte: onze PNGs, dois atlas novos com alpha/recortes verificados. Não houve nova validação física/Safari. Documentação de controles/arte/design atualizada.

### Histórico — organização de assets, 2026-11-03

- Runtime em public/assets/backgrounds/<localidade> e characters/{beethoven,rivals,cats,family}, nove PNGs. Materiais de autoria em assets/{references,source,archives,legacy}, fora de public/dist e do contexto Docker. Estrutura em assets/README.md.
- Caminhos relativos à raiz public/assets são compartilhados entre catálogo/factory, Renderer, recortes e manifesto offline. HTTP /assets/<caminho>; não há prefixos ../characters. Scripts, testes e docs foram atualizados.
- Verify curto aprovado: typecheck/build, dois Vitest, 15 Node, sete E2E, nove checks móveis/visuais e três de família/parallax. Todos os nove PNGs e os HTMLs efetivamente servidos são idênticos ao build testado; origem/referências/ZIP/legado retornaram 404. 22 hashes originais preservados.
- Dist foi recomposto para remover arquivos gerados antigos; serviço de produção saudável em 0.0.0.0:5173. Sem teste em aparelho físico/Safari ou E2E integral de vários minutos nesta tarefa de organização.

### Histórico — corrida direta, parallax contínuo e família, 2026-11-03

- Run sozinho move e corre no sentido atual; seta explícita muda direção; soltar/cancelar desacelera conforme física existente. Shift de teclado preservado como modificador. Testes móveis verificam um toque em Run e dois toques em Run+Pular.
- Parallax usa faixa nativa com blend de 6% armazenada em cache e padrão repeat-x. Os PNGs e letreiros não são espelhados. Há repetição de conteúdo, com limite contínuo e sem corte seco; não são paisagens únicas ilimitadas.
- Novo atlas family-hd.png (1774×887 RGBA, 6×2) traz Júlia/Elomir com altura equivalente; seis poses por dono. Timeline pura anima prender guia, caminhar juntos, soltar e buscar; nova arte também no reencontro/final.
- Build/typecheck, dois Vitest e 15 Node aprovados; sete E2E curtos aprovados. **Nove checks visuais/móveis e três de família/parallax aprovados diretamente no serviço publicado**, sem pageerror; comparação de bordas zero e diferença temporal média <0,07/255 nos cinco fundos. Capturas finais do passeio/soltura inspecionadas; guia e menor faixa de mistura confirmadas. Relatórios visual-mobile-report.json, story-assets-report.json e cópias production-visual-report.json/production-story-report.json em test-results.
- E2E de vários minutos não repetido nesta tarefa; travessia simulada Node passou (305 s, 110 ossos, zero game overs). Sem teste físico/Safari ou medição de FPS/memória.

### Histórico — rotação e tela cheia, 2026-11-03

- Display adapta o shell à área visível em rotação e mudanças das barras do navegador. Paisagem de toque usa o maior retângulo 16:9, com controles e toolbar sobrepostos; não reserva a antiga faixa inferior de 130 px. Retrato normal mantém controles abaixo.
- Tela cheia é solicitada por clique/toque em #fullscreen sobre #game-shell, incluindo canvas, narrativa e controles. Eventos padrão/WebKit sincronizam entrada/saída, inclusive externa. Falha/ausência da API ativa modo ampliado com status acessível; não oculta barras por CSS.
- Build/typecheck, dois Vitest, 12 Node e sete E2E curtos aprovados. **Nove checks visuais aprovados diretamente na produção final**, sem pageerror, incluindo API fullscreen nativa real desktop/móvel emulado, rotação/barras, maior ocupação 16:9 e fallback recusado em fixture separada. Captura mobile-fullscreen.png em paisagem inspecionada com controles legíveis. Relatórios visual-mobile-report.json e production-visual-report.json registram http://beethoven:5173, o mesmo serviço publicado na rede local.
- Não houve mudança em física, mapas, assets ou save. Não foi repetida a travessia E2E de vários minutos; simulação integral Node passou. Sem execução em aparelho físico/Safari nesta tarefa.

### Histórico — arte HD e celular, 2026-11-03

- Typecheck, build web/offline, dois testes Vitest e 12 Node aprovados. Simulação integral: 305 s lógicos, 110 ossos, zero game overs.
- Verify curto aprovou sete checks E2E e cinco visual/móvel. O teste visual direto da produção final aprovou novamente cinco checks, sem pageerror: 4K/atlas/cenários HD, menus/narrativa por toque, multitoque simultâneo e cancelamento, pausa/som/save, rotação e quatro dimensões móveis. Capturas finais inspecionadas.
- Produção final publicada em 0.0.0.0:5173, saudável; HTTP 200 por localhost e IP Wi-Fi. Usar `docker compose --env-file docker/mobile.env up -d --build --wait beethoven` para manter essa publicação; sem preset, default localhost.
- **Verify integral final aprovado:** oito checks E2E, incluindo cinco fases/reencontro pelo teclado e nova partida, seguidos de cinco checks visuais/móveis; errors vazio nos dois relatórios. `test-results/e2e-report.json` e `test-results/visual-mobile-report.json` são os resultados finais com a arte HD. `production-visual-report.json` registra os cinco checks diretamente no serviço publicado. Relatórios são sobrescritos por novas execuções. Não há teste em aparelho físico/Safari ou benchmark de FPS/memória.

### Histórico de execução em 2026-11-03 — disponibilização anterior à arte HD

- Docker Engine 29.9.2 / Compose v5.7.0 acessíveis após autorização de acesso ao daemon rootless. Não foi necessário instalar Node/npm no host nem adicionar serviços ao projeto.
- `docker compose --profile test build tests`: aprovado; ferramentas disponíveis em container: Node 24.22.2, npm 11.19.1, TypeScript 5.9.3, Vite 7.3.7, Vitest 4.1.12, Playwright 1.64.1 e Chromium 156.0.8078.79. Phaser 3.90.0 instalado, mas continua sem uso no motor.
- Typecheck, build Vite e HTML offline aprovados. Dois testes Vitest e nove testes Node aprovados; travessia simulada de 305 s, 108 ossos, zero game overs. Artefatos de produção copiados do container para `dist/` local.
- `docker compose up -d --build --wait beethoven`: aprovado; `beethoven-beethoven-1` saudável, porta publicada somente em `127.0.0.1:5173`, GET `/` com HTTP 200. Serviço permanece ativo com restart unless-stopped; parar com `docker compose stop beethoven`, retomar com `docker compose up -d --wait beethoven`.
- `docker compose --profile test run --rm --volume "$PWD/tests:/game/tests:ro" tests`: verify aprovado com o teste de reinício atual montado; **oito checks E2E aprovados**, incluindo cinco fases/reencontro pelo teclado e nova partida após concluir. `test-results/e2e-report.json`: status passed, errors vazio, Chromium `/usr/bin/chromium`, servidor de teste `http://127.0.0.1:5175`. Nenhuma alteração de gameplay foi necessária.
- Execução usa serviço Compose tests com usuário 0:0 para escrever no bind rootless. Tentativa direta como USER node falhou por EACCES nos artefatos; outra tentativa isolada excedeu 10 s de espera pelo servidor. A execução Compose posterior concluiu toda a validação.
- E2E curto diretamente no serviço de produção (`E2E_BASE_URL=http://beethoven:5173`, `E2E_FULL=0`): sete checks aprovados e nenhum pageerror; evidência em `test-results/production-report.json`, copiada do diretório temporário exclusivo dessa execução. Captura da primeira fase inspecionada visualmente. HTTP confirmou JS/CSS, sprite e HTML offline com status 200.
- Não há métricas de cobertura de linhas/branches, FPS/memória, audição da trilha, lint/formatter, CI ou aprovação cross-browser.

### Histórico da auditoria de mapeamento, anterior à disponibilização

- Executado nesta tarefa: `node --experimental-vm-modules --test --test-isolation=none tests/*.test.mjs` com runtime local Node 24.22.1: **9 testes aprovados, 0 falhas**. A simulação percorreu as cinco fases em 305 s lógicos, coletou 108 ossos e teve zero game overs. Não é duração humana medida.
- `dist/Beethoven.html` já existia e foi exercitado pelo teste de VM; **não houve rebuild nesta tarefa**. Não interpretar o teste como garantia de sincronização de cada arquivo gerado com o source.
- Na auditoria inicial, o artefato local de 2026-11-02 às 22:59:01 -03 tinha status failed, sete checks concluídos incluindo cinco fases/reencontro e falha final de nova partida (`4 !== 0`). A execução de disponibilização acima sobrescreveu esse relatório com o resultado aprovado.
- Investigação posterior identificou leitura do snapshot logo após Escape, antes de o loop consumir o input; aguardar intro/play no teste eliminou a falha, com gameplay preservado e percurso integral revalidado.
- `README.md` e `docs/TEST_REPORT.md` relatam bloqueios históricos de Docker/Chromium e não incorporam esse artefato E2E posterior. Esses registros não equivalem ao status atual comprovado de todos os ambientes.
- Nesta tarefa não foram executados install npm, TypeScript, Vite, Vitest, Docker ou E2E. Não há métricas de cobertura de linhas/branches, lint/formatter, CI ou aprovação cross-browser registradas no projeto.

Com npm e dependências disponíveis, fluxo esperado: `npm run build` → `npm test` → `npm run test:e2e`. Sem dependências, o comando Node acima exige um dist prévio; `node --experimental-vm-modules scripts/build.mjs` pode regenerar o build alternativo quando necessário. Rodar E2E sobrescreve o relatório local existente.

## Deploy e Infraestrutura

### Caminhos de distribuição

1. **Vite:** `index.html` → bootstrap TS → build web em `dist`; em seguida `build:offline` acrescenta o HTML autocontido. `--offline-only` evita apagar o índice/assets produzidos pelo Vite.
2. **Alternativo Node:** `scripts/build.mjs` valida sintaxe de `src/**/*.js` por SourceTextModule, apaga/recria `dist`, copia src/assets e transforma a entrada HTML de TS em JS. Não transpila nem verifica TypeScript.
3. **HTML offline:** percorre imports nomeados desde src/main.js, cria factories async/cache e incorpora CSS, cinco fundos de levels.map(bg) e seis atlas de characterFiles em base64; grava dist/Beethoven.html. Bootstrap TS não executa nesse caminho; Renderer adapta resolução, sprites e parallax nos dois builds.
4. **Servidor de produção:** serve apenas `dist` por `scripts/serve.mjs`; não necessita de node_modules para o motor atual.

### Dockerfile

| Estágio | Operações e uso |
|---|---|
| `development` | Node 24 Debian slim; COPY package*.json; npm ci se houver lock, senão install; copia projeto e ajusta ownership; USER node; CMD dev |
| `test` | Deriva de development; instala Chromium/fonts via apt como root; define caminho do browser; prepara diretório de resultados; USER node no Dockerfile; CMD verify |
| `build` | Deriva de development e executa npm run build; não executa a suite de testes |
| `production` | Nova imagem Node 24 slim, copia somente dist e scripts/serve.mjs; USER node; healthcheck HTTP; CMD servidor |

A .dockerignore exclui Git/configurações protegidas, node_modules, dist/resultados, assets/** (referências/originais/ZIP/legado) e renders QA. Somente os assets de execução de public/ entram no contexto. Reprocessar sprites ou renderizar QA nativo não faz parte do build Docker; scripts que precisam de origem devem rodar no host com esses materiais.

### Compose e operação

| Serviço | Target/perfil | Portas / volumes / comportamento |
|---|---|---|
| `beethoven` | production, padrão | Host `${BEETHOVEN_BIND_ADDRESS:-127.0.0.1}:5173` → container 5173; preset mobile publica 0.0.0.0; init; restart unless-stopped; sem volume persistente |
| `dev` | development, perfil dev | Host 127.0.0.1:5174 → container 5173; volumes src, public read-only e index read-only; init; polling solicitado |
| `tests` | test, perfil test | Sem porta publicada; E2E_FULL=1; shm 1 GB; usuário DOCKER_TEST_USER ou 0:0 sobrescreve USER node; bind de test-results |

- `./docker/run.sh`: valida daemon, cria test-results, builda/roda tests, só então `docker compose up -d --build --wait beethoven`.
- `docker compose --profile dev up --build dev`: desenvolvimento em 5174.
- `docker compose --profile test run --rm tests`: validação após construir a imagem apropriada.
- `docker compose up -d --build --wait beethoven` pode ser executado sem passar pelo helper; **não** implica testes aprovados.
- Código montado em dev não inclui alterações de configs/package.json em tempo real; mudanças dessas configurações requerem rebuild/cópia apropriada.
- `.github/workflows/pages.yml` prepara publicação no GitHub Pages a cada push em main ou execução manual: Node 24, build, npm test, Chromium/test:pages/test:combat, configure-pages v5, upload-pages-artifact v4 somente dist e deploy-pages v4. Checkout e setup-node usam v6; deploy tem pages:write/id-token:write e ambiente github-pages. Jobs têm timeout; publicações são serializadas.
- É necessário habilitar Source=GitHub Actions em Settings → Pages. O remote origin local é https://github.com/elomir21/beethoven.git; URL padrão esperada https://elomir21.github.io/beethoven/. Não houve push, ativação de Pages nem execução remota comprovada nesta preparação. README contém o procedimento; GitHub Free exige repositório público para Pages.
- Vite usa base relativa ./; Renderer usa ./assets/<caminho> relativo ao documento e Página inicial aponta para ./, preservando o prefixo do repositório. O build offline segue usando o manifesto embutido. O servidor Node local não monta subdiretórios de projeto; tests/pages.mjs fornece esse servidor apenas para QA.
- Não há ambiente staging separado, domínio personalizado, registry de publicação, Kubernetes, Helm ou Terraform. Docker permanece o caminho de operação local; o Pages recebe arquivos estáticos e dispensa Node/Docker em produção.
- Permissões do daemon e downloads são pré-requisitos externos; a existência dos arquivos Docker não prova que imagens/containers estejam construídos ou ativos.

## Débitos Técnicos e Observações

| Prioridade | Evidência / impacto | Local para investigar |
|---|---|---|
| Alta | Phaser declarado mas não usado; strict TypeScript não cobre motor JS; não apresentar o projeto como migrado para Phaser/Arcade Physics | package.json, tsconfig, bootstrap.ts, main.js, physics.js |
| Alta | Acoplamento: main.js concentra sistema de cenas, NPCs, dano, checkpoints, save e UI; importá-lo altera globais/listeners/RAF | main.js, harness.mjs |
| Alta | Limites fixos de cinco fases em Save.validate, textos/condições de Game, Renderer e testes; adicionar fase não é apenas acrescentar dados | Save.js, main.js, levels.js, Renderer.js, production.test.mjs |
| Média | Sem lockfile no workspace; dependências com ranges, Chromium apt e tag Docker base não travados por digest; instalação não totalmente reproduzível | package.json, Dockerfile |
| Média | Bundler offline artesanal por regex, assume grafo e sintaxes específicas; troca do HTML depende de string exata | scripts/build.mjs; testar os dois caminhos após mudar imports/entrada |
| Média | Testes Node alteram globais e compartilham instâncias/tempo; isolamento entre arquivos foi desativado; harness não reproduz eventos/Canvas/browser completos | package.json, tests/harness.mjs, flow/production/save tests |
| Média | Save grava sincronamente a cada osso; falha é silenciosa; não migra versões anteriores e não persiste HP/tempo/posição exata | Save.js e pontos de write em main.js |
| Média | `retry()` restaura jogador/chefe invicto/frangos, mas preserva outros NPCs/tempo de fase; não há rotina explícita de teardown dos sistemas/listeners nem tratamento central de erros de loop | Game.retry, Input.constructor, frame |
| Média | Corpo usa y no topo, enquanto docs/ARCHITECTURE.md descreve posição como pés; seguir a implementação para não deslocar colisores | Beethoven.constructor, physics.move, Renderer.level |
| Média | Beethoven reaproveita 12 poses HD; raça rival/gato tem quatro e dono tem seis poses. Primitivas ainda simplificadas; duração humana de 15–25 min não demonstrada | Beethoven.frame, Renderer, levels, docs/ASSETS.md |
| Média | Cenários compostos repetidos, padrões de fase semelhantes; nuvens/mobiliário fornecem camadas, não fundos originais separados | Renderer.background/level, levels.js |
| Média | Servidor alternativo em modo dev serve arquivos de toda a raiz do projeto, sem autenticação/filtro de métodos; escuta 0.0.0.0. Produção deve passar dist e limitar publicação como no Compose | scripts/serve.mjs, docker-compose.yml |
| Média | Arquivos dist e test-results são ignorados pelo Git e podem estar ausentes/desatualizados; presença local não significa entrega versionada ou teste reproduzido | .gitignore, build/test scripts |
| Média | Pillow/canvas nativo opcionais sem versões em manifesto. Arte HD gerada com prompts registrados a partir das referências fornecidas; procedência externa das referências não demonstrada | inspect_sprite_atlases.py, prepare_assets.py, render-qa.mjs, docs/ASSETS.md |
| Baixa | Alguns campos não são fonte efetiva de comportamento: Level.start não é usado por Game.start (spawn usa 50/222), unlocked não gera seleção de fases | levels.js, main.js, Save.js |
| Baixa | Não há música atualizada no menu pelo Game.update; osciladores de áudio e algumas falhas de contexto são tratados sem logging | main.js, Audio.js |
| Baixa | Documentação histórica diverge do artefato browser posterior e do limite real de tipagem; atualizar evidências ao concluir validações futuras | README.md, docs/TEST_REPORT.md, docs/ARCHITECTURE.md |

Os débitos de arquitetura/arte continuam documentados; a tarefa de disponibilização corrigiu a sincronização do teste de reinício e iniciou o serviço local. Nenhum valor de secret/credencial foi copiado para o documento.

## Última Atualização

### Superfrango, perigos e chefes concluídos — 2026-11-04, America/Sao_Paulo

- **Poder:** duas coxas escondidas entre folhas de plataformas por fase, brilho e revelação por proximidade. Comer ativa camisa do Vasco por 20 s, impulso inicial e superpum; segurar salto sustenta o voo, soltar desce. Timer congela na pausa, teto mantém o jogador na tela, não há imunidade. Gás acalma cães e causa dois danos no chefe próximo.
- **Perigos/checkpoints:** bike/swing/puddle substituídos por vidro, espinhos e pontas metálicas estáticos nas cinco fases. Exatamente duas bandeiras por fase: meio seguro e pré-arena. Último trecho tem chão contínuo para a luta. Tabela de conteúdos extraída da factory atual.
- **Combate:** novo src/entities/Boss.js com Mingau/tabby (5 HP), Brutus/pitbull (6), Ratão/rat (7), Sombra/tuxedo (7) e Titã/rottweiler (9). Aproximação, aviso, investida e recuperação; latido frontal fora da investida, pisão com quique e superpum causam dano com cooldown. Avisos não são cancelados por spam de latido; pisão/gás interrompem investida. Arena bloqueia recuo/saída mesmo em voo; transições e último portão exigem vitória.
- **Persistência/retomada:** Save v1 aceita bosses ausente em saves antigos, filtra índices únicos 0–4 e persiste vitórias. Retry reinicia chefe invicto, repõe frangos e remove poder; vitória permanece. Checkpoint antigo migra para a bandeira anterior mais próxima. Snapshot continua somente leitura e inclui face, poder/frangos e estado/vida/tempo do chefe.
- **Arte/UI:** dois atlas novos (Vasco 1671×941 RGBA 4×3; rato 1254×1254 RGBA 2×2), seis atlas e cinco fundos no catálogo/build offline. Originais preservados, recortes regenerados sem editar PNGs. Frango, perigos e gás são Canvas nativo. Renderer.bossBar evita a toolbar sobreposta em paisagem/fullscreen; botão Pular muda para Voar. Novos sons sintetizados de frango/superpum/combate/vitória. Prompts completos em docs/POWER_BOSS_ART.md; README, ASSETS, assets/README e GAME_DESIGN atualizados.
- **Testes:** nove casos novos em tests/power-boss.test.mjs, total de 24 Node e dois Vitest aprovados; typecheck/build web/offline aprovados. Travessia integral por física/inputs: 337 s lógicos, 73 ossos, cinco chefes e zero retries. Sete E2E curtos aprovados diretamente no serviço final e três Pages aprovados no último build; durante esta tarefa passaram também nove checks visuais/móveis/fullscreen e três de família/parallax. Relatório atual em docs/TEST_REPORT.md.
- **Browser de combate:** tests/combat-browser.mjs intercepta HTML offline só para QA e escolhe posições via exports existentes; usa teclas reais nas lutas, sem editar HP/poder. Última execução venceu os cinco chefes sem retries (8/8/10/10/13 s), confirmou descoberta por salto, camisa/voo/pausa/expiração e multitoque móvel. Verifica geometricamente a barra do chefe abaixo da toolbar; capturas desktop/móvel inspecionadas. Piloto pode usar até três tentativas pelo botão real; resultados registram HP/retries. test:combat integra verify e workflow Pages; E2E_FULL atualizado para combate, mas travessia integral em browser não repetida.
- **Operação:** produção Docker final saudável em 0.0.0.0:5173, Wi-Fi 192.168.2.181 respondeu HTTP 200. Os 16 arquivos servidos (11 PNGs, JS/CSS e HTMLs web/offline) têm SHA-256 idêntico ao dist testado; referência/origem/src retornam 404. Evidências em combat-report.json e served-artifacts-report.json. Sem push/deploy Pages remoto, teste físico/Safari, benchmark de desempenho ou audição nesta tarefa.

### Preparação para GitHub Pages concluída localmente — 2026-11-03, America/Sao_Paulo

- **Configuração:** .github/workflows/pages.yml dispara em main/manual; Node 24, build, npm test e Chromium/test:pages antes de upload exclusivo de dist e deploy. Permissões de escrita Pages/OIDC limitadas ao job deploy; ambiente github-pages e concorrência serial. Instalação mantém padrão existente npm ci com lockfile, npm install sem ele.
- **Contratos:** Vite usa base ./; Renderer resolve ./assets/<caminho> a partir do documento e preserva precedência do manifesto offline; link Página inicial usa ./, mantendo o diretório do repositório.
- **Teste novo:** tests/pages.mjs serve dist apenas em /beethoven/, rejeitando caminhos na raiz. Cobre build Vite, nove PNGs, movimento, link inicial, toque/rotação e edição autocontida; relatório pages-report.json. Integra npm run verify. A consulta automática do Chromium a /favicon.ico é desconsiderada; todos os recursos do jogo devem carregar dentro do prefixo.
- **Documentação:** README registra ativação de Source=GitHub Actions, push main/execução manual e URL esperada https://elomir21.github.io/beethoven/. Repositório origin confirmado localmente; não houve push nem configuração remota de Pages nesta tarefa.
- **Validação:** typecheck/build Vite e offline, dois Vitest, 15 Node (travessia simulada integral), sete E2E curtos, nove checks visuais/móveis/fullscreen e três de sprites/parallax aprovados no mesmo build. Três checks novos Pages aprovados após ajustar a fixture para ignorar a consulta automática a favicon. YAML, gatilho main, upload exclusivo dist e permissões conferidos; git diff --check limpo. pages-report.json registra a URL temporária local em /beethoven/ e nenhum pageerror. Workflow remoto, Pages e domínio não verificados; não houve novo deploy local Docker nem push. Sem teste físico/Safari ou travessia integral em navegador nesta tarefa.

### Organização dos assets concluída — 2026-11-03, America/Sao_Paulo

- **Estrutura:** public/assets contém nove PNGs de execução: backgrounds por localidade e characters/{beethoven,rivals,cats,family}. assets/{references,source,archives,legacy} guarda fotos, artes originais, ZIP e sheet antiga; catálogo em assets/README.md.
- **Integridade:** 22 arquivos movidos com SHA-256 preservado. Não houve reprocessamento das imagens. Metadados JS de atlas regenerados com novas chaves, mantendo recortes.
- **Contratos:** characterFiles, specs.file e Level.bg são caminhos relativos a public/assets; mesmos caminhos nas chaves de Renderer.images, spriteFrames e window.BEETHOVEN_ASSETS. Carregamento HTTP usa /assets/<caminho>, sem ../characters. Build web/offline, QA e testes atualizados; prepare_assets.py usa os novos locais de origem/legado.
- **Distribuição:** Docker exclui assets/**. Dist reconstruído sem artefatos antigos; contém exatamente os nove PNGs do runtime. Fotos/originais/ZIP/legado não são publicados. README, ASSETS, prompts e seções correspondentes deste mapa atualizados.
- **Validação:** typecheck/build web/offline, dois Vitest, 15 Node, sete E2E curtos, nove checks visuais/móveis e três de família/parallax aprovados. Nove PNGs e HTMLs index/Beethoven servidos com bytes idênticos ao build testado; materiais não públicos retornaram 404. Caminhos de documentação e sintaxe Python conferidos; fluxo legado de reprocessamento não foi executado.
- **Operação:** produção reconstruída e saudável na porta 5173 com preset mobile. Sem nova dependência ou mudança de mecânicas. E2E integral em navegador e testes físicos/Safari não repetidos nesta organização.

### Corrida direta, parallax contínuo e família concluídos — 2026-11-03, America/Sao_Paulo

- Botão móvel usa a ação Run: segurar corre e move na direção atual sem outra tecla; seta explícita muda o sentido. Shift do teclado mantém o modificador de velocidade existente. Soltar/cancelar continuam pelo Input com fontes independentes.
- Novo src/render/parallax.js cria uma faixa contínua em Canvas, com transição alpha entre as extremidades na resolução nativa e cache por cenário. Renderer usa padrão repeat-x e fase fracionária, sem corte de reinício, sem espelhar letreiros e sem alterar PNGs/colisões. O conteúdo artístico é reutilizado periodicamente com emenda suavizada.
- Hints/menu/README descrevem corrida direta, no sentido atual. Novo familyScene.js anima prender guia, caminhar juntos, rival, guia caindo e busca, sem mudar duração/estado de gameplay.
- Renderer.sprite compartilha recortes/escala entre humanos e animais. family-hd.png (1774×887, 6×2), gerado pela ferramenta integrada, traz seis poses por dono e altura lógica 68; aplicado também no reencontro/final. Metadados regenerados; prompt em docs/FAMILY_PROMPT.md.
- Catálogo/build offline agora incorporam quatro atlas + cinco fundos. QA nativo prepara a mesma faixa de parallax. Novos testes story-render.test.mjs e parallax-family.mjs; test:story integra verify, sem nova dependência npm e sem API mutável de debug em produção.
- Guia ligada à mão de Elomir por pose e ao pescoço de Beethoven, com queda após soltar. Blend reduzido a 6% após inspeção, evitando sobreposição extensa; PNGs e letreiros preservados. Conteúdo ainda periódico, com continuidade em vez de corte seco.
- **Validação final:** typecheck/build web/offline; dois Vitest e 15 Node (simulação integral 305 s, 110 ossos, zero game overs); sete E2E curtos. Diretamente em produção: nove checks móveis/visuais e três de sprites/parallax, sem erros; emendas com erro de borda zero/diferença temporal média <0,07/255. Capturas finais inspecionadas.
- **Operação:** produção saudável em 0.0.0.0:5173, IP Wi-Fi HTTP 200; dist sincronizado. README, ASSETS, TEST_REPORT, prompts e seções correspondentes deste mapa atualizados. Limites: sem execução física/Safari, E2E integral em browser não repetido e sem benchmark de FPS/áudio.

### Rotação e tela cheia concluídas — 2026-11-03, America/Sao_Paulo

- Causa identificada: CSS em paisagem reservava 130 px para controles/footer, mantendo o estágio pequeno; testes anteriores verificavam proporção/limites, sem exigir aproveitamento da área disponível.
- Novo src/systems/Display.js acompanha visualViewport, resize/orientationchange, screen.orientation e fullscreenchange; comunica dimensões visíveis ao CSS e sincroniza Renderer.resize sem recriar partida. Limpa input ao girar/alternar exibição.
- index.html agrupa canvas, narrativa e controles em #game-shell, alvo da Fullscreen API, com botão entrar/sair e status acessível. Prefixo WebKit é aceito; API ausente/recusada ativa modo ampliado com aviso, sem prometer ocultar barras do navegador.
- CSS em paisagem de toque/tela cheia usa o maior retângulo 16:9 na área visível com safe areas; controles de jogo e toolbar sobrepostos, sem faixa inferior reservada. Retrato normal mantém controles abaixo.
- tests/visual-mobile.mjs exige ocupação de mais de 95% do maior retângulo 16:9 em paisagem; cobre Fullscreen API real desktop/móvel, saída externa, rotação/CDP com mudança de barras e fallback recusado em fixture separada. Captura mobile-fullscreen.png adicionada e inspecionada em paisagem.
- Build/typecheck, dois Vitest, 12 Node e sete E2E aprovados; nove checks visuais aprovados diretamente no serviço final, sem pageerror. Contraste de hover/foco e botões pressionados conferido em captura final. E2E de várias fases em navegador não repetido; simulação Node integral passou.
- README e seções de arquitetura/módulos/estrutura/fluxos/testes atualizados com Display, maior ocupação em paisagem e fullscreen incluindo controles. Mecânicas, assets, save e dependências preservados.
- Teste aguarda as dimensões visíveis sincronizadas antes de medir controles após rotação, mantendo todos os critérios de área/limites e incluindo coordenadas em falhas.
- Produção reconstruída e saudável, dist local sincronizado, endereço Wi-Fi com HTTP 200. README e TEST_REPORT registram operação e limites: nenhuma execução física/Safari declarada.

### Melhoria visual e suporte móvel concluídos — 2026-11-03, America/Sao_Paulo

- **Escopo implementado:** cinco cenários remasterizados de 2172×724; atlas HD exclusivos de Beethoven, quatro raças rivais e dois gatos; coordenadas lógicas preservadas, Canvas adaptativo até 3840×2160 e estágio 16:9 em retrato/paisagem.
- **Arquivos novos:** src/data/assets.js, src/data/spriteFrames.js, scripts/inspect_sprite_atlases.py, tests/animals-input.test.mjs, tests/visual-mobile.mjs, docker/mobile.env, docs/ART_PROMPTS.md e docs/BACKGROUND_PROMPTS.md, além de oito PNGs HD em public/assets. Imagens originais preservadas.
- **Fluxos:** Pointer Events multitoque com origens independentes, captura/cancelamento/blur; narrativa, menus, pausa, latido e save por toque; gatos neutros observam/reagem sem dano; raças próprias também na introdução. Hints distinguem toque/teclado.
- **Build/configuração:** catálogo e recortes comuns ao Renderer/QA/offline; manifesto tem cinco fundos usados + três atlas. npm run test:visual integra verify. BEETHOVEN_BIND_ADDRESS mantém localhost como padrão e docker/mobile.env habilita rede local sem secrets.
- **Documentação:** README, ASSETS, TEST_REPORT e seções correspondentes deste mapa atualizados; prompts finais registram geração integrada image_gen e dimensões solicitadas versus efetivas.
- **Resultados finais:** typecheck, build Vite/offline, dois casos Vitest e 12 Node aprovados; simulação de 305 s, 110 ossos, zero game overs. Verify integral aprovou oito E2E (cinco fases, reencontro e reinício) e cinco visual/móvel. Teste visual direto da produção final também aprovou os cinco checks, sem pageerror. Capturas finais desktop/retrato/paisagem inspecionadas, chevrons e hints de toque confirmados.
- **Operação:** produção final saudável em 0.0.0.0:5173 usando o preset mobile; localhost e IP Wi-Fi responderam HTTP 200. dist local sincronizado com o build servido. test-results/production-visual-report.json registra o teste direto do serviço publicado.
- **Limites:** sem teste em aparelho físico/Safari, benchmark de FPS/memória ou audição atual. Imagens têm suas dimensões reais documentadas; backing store 4K não significa todos os PNGs em 4K.

### Histórico — disponibilização local anterior à arte HD — 2026-11-03, America/Sao_Paulo

- **Contexto:** análise dos pré-requisitos reais, uso do Docker para suprir Node/npm ausentes do PATH do host, reconstrução das imagens e inicialização de produção em http://localhost:5173.
- **Alteração:** `tests/e2e.mjs` aguarda intro e play antes de validar o reset; resolve a leitura prematura da fase anterior. Nenhum módulo de gameplay ou dependência alterado.
- **Documentação:** `project_mapping.md`, `README.md` e `docs/TEST_REPORT.md` atualizados com operação, evidências atuais e limites. `dist/` local sincronizado com o build servido; relatórios/capturas gerados em test-results, diretório ignorado pelo Git.
- **Validação:** typecheck e build Vite/offline; dois testes Vitest e nove testes Node; oito checks Chromium incluindo as cinco fases, reencontro e nova partida após concluir; sete checks adicionais diretamente no serviço de produção, sem pageerror. Captura da primeira fase inspecionada. Container saudável e HTTP 200 para índice/JS/CSS/sprite/HTML offline.
- **Operação:** serviço beethoven permanece ativo, publicado em 127.0.0.1:5173, restart unless-stopped. Sem necessidade de backend, banco ou secrets. Limitações de arte, stack e validação cross-browser permanecem nas seções correspondentes.

### Histórico — criação do mapa

- **Data:** 2026-11-03, America/Sao_Paulo.
- **Contexto:** criação do mapa após inspeção de toda a base de código, configurações, scripts, testes, assets e documentação; distinção entre arquitetura real e stack apenas declarada; identificação de relatório E2E local posterior às notas históricas.
- **Arquivos de documentação afetados:** `project_mapping.md` (novo), `AGENTS.md` (novo protocolo de consulta/manutenção), `README.md` (link de navegação). Nenhum módulo de gameplay, ferramenta ou teste foi alterado.
- **Validação executada:** nove testes Node aprovados; dados dos cinco níveis extraídos da factory; metadados PNGs/ZIP conferidos; artefato E2E existente lido sem sobrescrita. Verificação final dos caminhos e do protocolo de documentação realizada nesta tarefa.
- **Manutenção futura obrigatória:** após alterações funcionais/estruturais, atualizar imediatamente os módulos/fluxos/modelos/configurações/testes afetados e este registro, sem tratar logs históricos como execução atual.
