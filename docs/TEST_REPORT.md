# Relatório de testes

## Patadas, mordidas e rivais — 08/11/2026

- **Build:** typecheck, Vite e HTML autocontido aprovados, sem novas dependências ou imagens.
- **Lógica:** dois Vitest e 32 Node aprovados. Oito novos casos em melee.test.mjs verificam preparação/alcance/direção/altura, acerto único, recarga, dano/rendição, IA dos rivais, os cinco chefes, pausa/retry/save e camisa. Travessia integral por física/inputs: 337 s lógicos, 72 ossos e zero retries.
- **Browser:** sete E2E curtos, nove checks visuais/móveis/fullscreen, cinco checks de combate e três Pages aprovados; nenhum pageerror. Controles móveis incluem Patada/Morder sem reduzir alvos de 56 px ou espaços de 16 px, inclusive em 320×568 e 568×320. Fixture de combate usa J/K reais para vencer rival e ferir os cinco chefes; testa Run+Patada por multitoque/cancelamento e Morder por toque. Regressão venceu todos os chefes sem poder e sem retries (8/8/10/10/12 s).
- **Evidências:** relatórios e2e-report.json, visual-mobile-report.json, combat-report.json e pages-report.json em test-results. Capturas paw-rival.png, bite-boss.png, mobile-melee.png e retrato/paisagem inspecionadas. Após revisão visual, o contraste de foco dos botões coloridos foi corrigido; build e nove checks visuais móveis passaram novamente. Dist local atualizado com o build final.
- **Limites:** sem deploy, teste físico/Safari, benchmark/audição, nova execução de família/parallax ou travessia integral em navegador. Animações reutilizam atlas com efeitos Canvas; lutas comuns reiniciam no retry/reload, vitórias de chefes permanecem salvas.

## Superfrango, perigos e chefes — 04/11/2026

- **Build final aprovado:** typecheck, Vite web e HTML autocontido. Onze PNGs de execução (cinco fundos e seis atlas); recortes alpha dos dois atlas novos conferidos. Originais preservados.
- **Lógica:** dois casos Vitest e 24 testes Node aprovados. Nove casos novos cobrem distribuição dos frangos/perigos/checkpoints, coleta/poder/voo/pausa/expiração, dano, ciclo e cooldown do chefe, latido/pisão/superpum, bloqueio de saída, retry e save compatível. Travessia das cinco fases por física/inputs, sem teletransporte: **337 s lógicos, 73 ossos e zero retries**, com todos os chefes vencidos.
- **Browser:** sete E2E curtos aprovados diretamente no serviço final (`http://beethoven:5173`), incluindo menu, imagens, narrativa, movimento, pulo, áudio/mute/pausa, save/reload e nova partida. Durante a tarefa passaram também nove checks visuais/móveis/fullscreen e três de família/parallax; não houve alteração da geometria do estágio ou controles de orientação.
- **Poder/combate:** três checks de `test:combat` aprovados no build final. Fixture interceptada do HTML offline escolhe posições usando exports existentes; não adiciona API mutável à produção. Coleta por salto real ativa camisa, impulso, voo e timer; pausa/expiração conferidas. Cinco chefes vencidos por teclas sem poder nem edição de HP: 8/8/10/10/13 s e zero retries na última execução. O piloto permite até três tentativas pelo botão real do checkpoint, registrando o resultado. Voo móvel validado por multitoque CDP. Barra do chefe desenhada abaixo da toolbar sobreposta, comparada geometricamente aos botões DOM.
- **Pages:** três checks aprovados novamente no último build em `/beethoven/`, com raiz retornando 404: onze imagens, início/movimento/link inicial, toque/rotação e HTML offline. Workflow também executa combate antes da publicação. Nenhum push ou deploy remoto nesta tarefa.
- **Produção local:** container final saudável em `0.0.0.0:5173`; Wi-Fi `192.168.2.181:5173` respondeu HTTP 200. Os **16 arquivos servidos** têm os mesmos SHA-256 do `dist` testado, incluindo os onze PNGs e as edições web/offline; referências/origem e src retornam 404. Evidência: `served-artifacts-report.json`.
- **Evidências:** `combat-report.json`, `e2e-report.json`, `pages-report.json` e `served-artifacts-report.json` em `test-results/`. Capturas `vasco-flight.png`, `rat-boss.png`, `mobile-superpum.png` e `mobile-boss-hud.png` inspecionadas: uniforme legível, voo/gás, rato e barra do chefe visível junto aos controles.
- **Limites:** Chromium com emulação móvel; sem aparelho físico/Safari, benchmark de desempenho ou audição. Travessia integral de vários minutos em navegador não repetida; o percurso integral foi simulado e os cinco combates foram executados no browser.

## Preparação para GitHub Pages — 03/11/2026

- Vite com base relativa `./`, imagens relativas ao documento e link inicial mantendo o diretório do projeto. Build web e edição offline gerados no Docker com typecheck aprovado.
- Dois Vitest, 15 testes Node (incluindo travessia integral simulada), sete E2E curtos, nove checks visuais/móveis/fullscreen e três de família/parallax aprovados no mesmo build.
- `tests/pages.mjs`: três checks Chromium aprovados em servidor que monta `dist` somente em `/beethoven/`, retornando 404 fora desse prefixo. Confirma nove PNGs HD, menu, início/movimento, link inicial, corrida por toque/rotação e edição offline; nenhum pageerror. A busca automática do Chromium por `/favicon.ico` é desconsiderada. Evidência: `test-results/pages-report.json`.
- Workflow `.github/workflows/pages.yml`: YAML, gatilho main, artefato exclusivo `dist` e permissões conferidos localmente. A execução no GitHub, ativação de Pages e acesso público não foram realizados. Nenhum push ou novo deploy Docker local nesta tarefa; o serviço local existente continua independente do build preparado para Pages.
- Sem teste físico/Safari, medição de desempenho ou repetição da travessia integral em navegador.

## Organização dos assets — 03/11/2026

- 22 arquivos movidos com SHA-256 preservado. Runtime: nove PNGs em public/assets/backgrounds/<localidade> e characters/{beethoven,rivals,cats,family}. Fotos, originais, ZIP e legado em assets/, fora da distribuição e do contexto Docker.
- Catálogo, factory, Renderer, scripts de build/QA/atlas e testes usam caminhos relativos à raiz public/assets. Manifesto offline e recortes usam as mesmas chaves. prepare_assets.py atualizado para origem/legado; só a sintaxe Python foi verificada, sem reprocessar imagens.
- **Verify curto aprovado:** typecheck, build Vite/offline, dois casos Vitest e 15 testes Node; sete E2E curtos, nove checks de desktop/móvel/fullscreen e três de família/parallax. Nenhum pageerror nos relatórios. Simulação Node integral aprovada; E2E de vários minutos em navegador não repetido.
- Dist recomposto pelo build, sem arquivos gerados antigos. Conjunto de PNGs de dist/assets coincide exatamente com os nove de public/assets. No serviço real, nove PNGs e HTMLs index/Beethoven responderam com os mesmos bytes do build testado; fotos/originais/ZIP/legado consultados retornaram 404.
- Produção reconstruída e saudável em 0.0.0.0:5173. Caminhos de documentação conferidos. Sem nova execução em aparelho físico/Safari, benchmark de FPS/memória ou audição.

## Histórico: corrida direta, parallax e família — 03/11/2026

- Botão Correr usa Run: desloca/corre sozinho na direção atual; seta muda sentido, soltar/cancelar remove a ação. Shift do teclado preservado. Teste móvel verifica Run sozinho e Run+Pular simultâneos.
- Parallax mantém cinco PNGs originais HD, mas usa faixa nativa em Canvas com blend de 6% nas extremidades e padrão repeat-x; sem espelhar letreiros. Conteúdo continua periódico; o corte seco de fim/início foi removido.
- Atlas family-hd.png (1774×887, 6×2) gerado com image_gen conforme a descrição de Júlia/Elomir; seis poses por pessoa, altura lógica 68. Abertura com guia e passeio conjunto; cenas de soltura/fuga/busca mantêm roteiro/duração. Sprites também aplicados ao reencontro/final.
- Build/typecheck, dois Vitest e **15 testes Node aprovados**, incluindo corrida direta, timeline/guia e fase periódica. Simulação integral: 305 s lógicos, 110 ossos, zero game overs. Sete E2E curtos e nove checks visual/móvel aprovados. Percurso integral de vários minutos em navegador não repetido.
- Três checks Chromium de família/parallax aprovados: quarto atlas/altura equivalente; pixels de emenda nos cinco fundos com erro de borda 0 e diferença temporal média <0,07/255; capturas da guia, passeio e soltura. Fixture offline de teste escolhe tempos de cena usando exports existentes; não há nova API mutável na produção e essas capturas não são travessia de gameplay.
- Inspeção visual reduziu blend de 20% para 6%, evitando mistura extensa dos prédios. Guia ajustada à mão por pose e ao pescoço do cachorro. Reteste final de build e história aprovado.
- **Confirmação final na produção:** nove checks visual/móvel e três checks de família/parallax aprovados diretamente em http://beethoven:5173, sem pageerror. Fixture de história carrega o HTML offline efetivamente servido. Relatórios visual-mobile-report.json e story-assets-report.json, com cópias production-visual-report.json/production-story-report.json; capturas finais intro-leash.png, intro-walk.png e intro-release.png inspecionadas, com guia alinhada e blend de 6%.
- Produção reconstruída/saudável, dist local sincronizado e IP Wi-Fi com HTTP 200. Recarregar o jogo carrega a corrida direta e os novos sprites; Jogar inicia a abertura atualizada.
- Prompts e arte: FAMILY_PROMPT.md, ASSETS.md. Sem playtest físico/Safari, benchmark de FPS ou audição atual.

## Histórico: rotação e tela cheia — 03/11/2026

- Correção: removida a reserva inferior de 130 px em paisagem. Display acompanha a área visível por visualViewport, resize/orientação e eventos de fullscreen; controles/toolbar ficam sobrepostos e o estágio usa o maior retângulo 16:9 com safe areas.
- Botão Tela cheia/Sair usa Fullscreen API sobre o contêiner que inclui jogo, narrativa e controles. API ausente/recusada recebe fallback ampliado com aviso; não promete ocultar as barras do navegador nesse caso.
- Primeira verificação: typecheck/build Vite/offline, dois Vitest, 12 Node, sete E2E curtos e nove checks visuais aprovados, sem pageerror. Mecânicas preservadas; simulação das cinco fases aprovada (305 s, 110 ossos, zero game overs). E2E integral de vários minutos não foi repetido nesta correção de exibição.
- Teste visual agora exige ocupação >95% do maior retângulo 16:9 em paisagem, exercita Fullscreen API nativa real em desktop/móvel emulado, saída externa, rotação/CDP, mudança de barras e fallback rejeitado numa fixture. Não confundir o fallback simulado com prova de fullscreen nativo.
- Inspeção de capturas identificou contraste de hover/foco no modo ampliado; corrigido. Teste de rotação aguarda as dimensões do visualViewport sincronizadas antes de medir os controles, evitando leitura de um quadro transitório. Critérios de ocupação/limites mantidos.
- **Produção final aprovada:** nove checks visuais diretamente em http://beethoven:5173, sem pageerror. Fullscreen nativo real desktop/móvel emulado, rotação dentro dele, controles preservados, saída e fallback recusado verificados. Capturas finais de retrato, paisagem e mobile-fullscreen.png inspecionadas; contraste e maior ocupação confirmados. Relatórios visual-mobile-report.json e production-visual-report.json em test-results, status passed.
- Serviço reconstruído e saudável em 0.0.0.0:5173; endereço Wi-Fi respondeu HTTP 200. dist local sincronizado com a versão servida. Recarregar a página no celular carrega a correção e o botão Tela cheia.
- Referências de implementação: [Fullscreen API Standard](https://fullscreen.spec.whatwg.org/) e [VisualViewport, Chrome for Developers](https://developer.chrome.com/blog/visual-viewport-api/). Sem validação em aparelho físico/Safari nesta tarefa.

## Histórico: atualização HD e celular — 03/11/2026

- Atlas próprios HD para Beethoven, quatro raças de cães e duas pelagens de gato; cinco fundos remasterizados de 2172×724. Originais preservados, catálogo e recortes alpha versionados. Canvas lógico 480×270 com backing store até 3840×2160, estágio 16:9.
- Multitoque por Pointer Events com origens independentes, captura/cancelamento e limpeza de input. Menus, pausa, narrativa e save operam por toque; retrato e paisagem sem distorção.
- Typecheck, build Vite/HTML offline, dois testes Vitest e 12 testes Node aprovados. Simulação: 305 segundos lógicos, 110 ossos, zero game overs.
- Verify curto já aprovou sete checks E2E e cinco checks visual/mobile. Chromium validou multitoque via CDP (correr e pular simultaneamente), soltura/cancelamento, latido, mute, pausa, reload/save, backing store 4K e orientação em 390×844, 844×390, 640×360 e 360×640. Capturas inspecionadas; setas de fonte substituídas por chevrons CSS.
- E2E agora aguarda o rótulo de mute após KeyM, evitando leitura antes do próximo passo da simulação. Sem alteração da mecânica do mute.
- Produção reconstruída e saudável com `docker compose --env-file docker/mobile.env up -d --build --wait beethoven`. Publicação em 0.0.0.0:5173 para acesso pelo celular na mesma rede; localhost e endereço Wi-Fi do computador responderam HTTP 200. dist local sincronizado com o build servido.
- Teste visual direto da produção final: cinco checks aprovados, sem pageerror; cinco cenários HD decodificados, atlas carregados, Canvas 4K e controles móveis verificados. Capturas desktop/retrato/paisagem inspecionadas, com chevrons e hints de toque visíveis. `test-results/production-visual-report.json` copiado do diretório exclusivo dessa execução.
- **Verify integral final aprovado com os cinco fundos HD:** oito checks E2E (incluindo cinco fases/reencontro e nova partida), seguidos dos cinco checks visuais/móveis. `test-results/e2e-report.json` e `test-results/visual-mobile-report.json` têm status passed e errors vazio. As capturas finais ficam em menu.png, pause.png, ending.png, level.png, desktop-hd.png, mobile-portrait.png e mobile-landscape.png.
- Limites: emulação Chromium não equivale a execução em aparelho físico, Safari ou validação de desempenho/áudio humano.

## Histórico: disponibilização local anterior à arte HD — 03/11/2026

- Docker Engine 29.9.2 / Compose v5.7.0 acessados com autorização. Imagens de testes e produção reconstruídas; produção saudável em http://localhost:5173, HTTP 200, restart unless-stopped e publicação em 127.0.0.1.
- Ambiente container: Node 24.22.2, npm 11.19.1, TypeScript 5.9.3, Vite 7.3.7, Vitest 4.1.12, Playwright 1.64.1, Chromium 156.0.8078.79.
- Typecheck e build Vite/offline aprovados; `dist/` local sincronizado com a produção.
- Dois testes Vitest e nove testes Node aprovados. Simulação integral: 305 segundos lógicos, 108 ossos, zero game overs.
- `tests/e2e.mjs`: asserção final de nova partida agora aguarda intro e play, pois Escape é consumido no loop de simulação. Gameplay preservado. O erro histórico `4 !== 0` não ocorreu após essa correção.
- `docker compose --profile test run --rm --volume "$PWD/tests:/game/tests:ro" tests`: **verify aprovado**, incluindo oito checks E2E no Chromium: menu/assets, intro/skip, movimento/corrida, pulo/gravidade/chão, latido/mute/pausa, save/reload/continuar, cinco fases/reencontro pelo teclado e nova partida após o final. Relatório atual em `test-results/e2e-report.json`: status passed, errors vazio, URL http://127.0.0.1:5175. O volume usa o teste corrigido com a imagem de ferramentas já reconstruída.
- E2E curto diretamente no serviço de produção: sete checks aprovados (menu/assets, intro, movimento/corrida, pulo/chão, latido/mute/pausa, save/reload/continuar e nova partida), nenhum pageerror. `test-results/production-report.json` registra `http://beethoven:5173`, endereço interno do mesmo serviço publicado em localhost:5173. Captura da primeira fase inspecionada; JS/CSS, sprite e HTML offline retornam HTTP 200.
- Tentativa direta com USER node falhou ao escrever no bind de resultados (EACCES); usar 0:0, padrão já definido no Compose tests. Outra tentativa isolada excedeu a espera de 10 s pelo servidor; a execução Compose posterior concluiu com sucesso. Esses incidentes não bloqueiam o serviço nem a validação atual.
- Sem aprovação cross-browser, medição de FPS/memória, audição ou playtest humano.

## Histórico — 02/11/2026

## Executado
Runtime: Node 24.22.1 localizado no cache do Codex; Pillow disponível em Python 3.10. npm não está no PATH.

`node --experimental-vm-modules scripts/build.mjs`: aprovado. Todos os módulos analisados pelo parser ECMAScript; build estático e HTML autocontido gerados. Não é compilação TypeScript.

`node --experimental-vm-modules --test --test-isolation=none tests/*.test.mjs`: **7 aprovados, 0 falhas**.
1. Intro/skip, pause/retomar, congelamento da posição, dano até game over, recuperação, latido e reação de NPC, checkpoint salvo e reset.
2. Travessia integral das cinco fases com física real, teclas simuladas e sem teletransporte. Tempos simulados: 57, 65, 77, 66 e 40 segundos. Zero game overs; aproximadamente 107–108 ossos (trajetórias variam com o tempo global). Portão acionado por E, final e save de conclusão verificados.
3. Save inválido, versão incompatível, deduplicação e limites.
4. Movimento bidirecional, corrida, chão e pulo variável.
5. Coyote time e jump buffer.
6. Dados das cinco fases: checkpoints sobre solo, plataformas alcançáveis e conteúdo.
7. Bundle offline executado em VM com adaptador DOM: menu inicial e imagens incorporadas verificados.

Esses testes usam um adaptador DOM, não um navegador. Os testes de casos individuais posicionam o jogador para isolar cada sistema; a travessia integral não altera posições.

Seis imagens geradas pelo renderizador real com `@napi-rs/canvas`, usando os PNGs do jogo. Inspeção visual da fase 1, fase 3 e final realizada. Corrigidos o alinhamento do cenário ao chão, corações sem dependência de fonte e a presença indevida de humanos na última cena da introdução. Frames recortados e alpha inspecionados. Demais renders gerados, sem afirmar inspeção manual completa.

## Bloqueado / não aprovado por ausência de execução
- `node scripts/serve.mjs` e servidor HTTP Python: `EPERM` ao abrir socket. A versão HTTP não foi aberta neste ambiente.
- Playwright: tentativa executada, interrompida por ausência de `chromium_headless_shell-1234`. DNS indisponível impede instalação. Não há resultado E2E aprovado.
- Browser integrado: host indisponível, nenhum navegador acessível.
- Sem medição de FPS, perfil de memória, audição da trilha, playtest humano ou testes entre Chrome/Firefox/Edge.
- Docker não executado.

## Aceitação
Núcleo e progressão estão implementados e aprovados na simulação. A aceitação completa do produto permanece pendente de teste em navegador, revisão artística e avaliação de duração/variedade. Não declarar esta versão como cumprindo todos os critérios da especificação.

## Atualização: preparação da stack em Docker

### Alterações
- Dockerfile com estágios development/test/build/production. Stack declarada: Node 24, Phaser 3, TypeScript, Vite, Vitest e Playwright. Testes instalam Chromium pelo apt no container.
- Compose com produção em localhost:5173, desenvolvimento em localhost:5174, serviço de testes e healthcheck.
- `docker/run.sh` instala a imagem de testes, valida o projeto e somente então sobe a produção.
- Entrada `src/bootstrap.ts` com configuração TypeScript estrita. O motor JavaScript/Canvas foi preservado; não foi migrado para Phaser.
- Casos compartilhados de persistência executáveis tanto por Node test quanto por Vitest. E2E ampliado com HTTP de produção, caminho de Chromium configurável e travessia opcional das cinco fases.

### Executado e aprovado nesta atualização
- `docker compose --profile test --profile dev config --quiet`: aprovado.
- `sh -n docker/run.sh`: aprovado.
- Verificação sintática Node dos arquivos E2E, Vite, Vitest e servidor: aprovada.
- Build offline pelo Node nativo: aprovado e `dist/Beethoven.html` regenerado.
- **9 testes Node aprovados, 0 falhas**, incluindo os dois novos casos de persistência. Travessia: 305 segundos simulados, 108 ossos e zero game overs.

### Tentativas bloqueadas / falhas de ambiente
- `docker version`: cliente 29.9.2, contexto rootless; acesso ao daemon em `/run/user/1000/docker.sock` negado.
- `./docker/run.sh`: interrompido no preflight pelo mesmo acesso negado.
- `docker compose --profile test build tests`: falhou antes do build porque `/home/elomir/.docker/buildx/activity` está em filesystem somente leitura nesta sessão.
- Consulta HTTP ao registry npm: falhou por DNS (`Could not resolve host`).
- `/etc/chromium` inspecionado: apenas configuração/native-messaging-hosts. O binário real foi encontrado no pacote Flatpak do usuário.
- Playwright foi executado apontando para esse binário real. O processo iniciou, mas encerrou antes de abrir uma página: faltam `GLIBC_2.38` e `GLIBC_2.42` no runtime desta sessão. Relatório estruturado em `test-results/e2e-report.json`.

**Não executados/aprovados:** instalação de dependências dentro do Docker, typecheck TypeScript, build Vite, runner Vitest, navegador E2E e healthcheck HTTP. A configuração foi entregue, mas a instalação efetiva e a disponibilização de um container continuam bloqueadas. O HTML offline continua disponível localmente.

Nova tentativa com metadados do Buildx direcionados para `/tmp/beethoven-buildx` eliminou o erro de filesystem somente leitura, mas confirmou o bloqueio principal: acesso negado ao socket do daemon. Nenhuma imagem foi montada.
