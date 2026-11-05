# Beethoven: O Caminho de Casa

Antes de alterar o projeto, consulte o [mapeamento técnico e operacional](project_mapping.md) e mantenha-o atualizado conforme [AGENTS.md](AGENTS.md).

Aventura de plataforma para teclado e toque, com cinco fases na Grande Florianópolis, introdução, checkpoints, save e reencontro final.

Os assets de execução ficam em `public/assets/backgrounds/<localidade>/` e `public/assets/characters/{beethoven,rivals,cats,family,bosses}/`. Materiais de origem, fotos, ZIP e legado ficam separados em `assets/`, fora da distribuição. Veja a [organização dos assets](assets/README.md) e o [catálogo de arte](docs/ASSETS.md).

Agora também funciona com controles de toque no navegador do celular. A área do jogo mantém **16:9** em retrato ou paisagem; a resolução de desenho acompanha a tela e sua densidade de pixels, até **3840×2160**, preservando a física original. Beethoven tem atlas exclusivo; os outros cães são pitbulls, pastores-alemães, pinschers e rottweilers. Gatos neutros passeiam pelos cenários, observam Beethoven e reagem ao latido.

## Superfrango, voo e chefes

Duas coxas de frango ficam escondidas entre as folhas de plataformas em cada fase. Um brilho indica o esconderijo; ao chegar perto, o frango aparece. Encoste nele para Beethoven comer e vestir a **camisa do Vasco por 20 segundos**. Ele dá um superpum com impulso inicial; segure **Espaço / W / ↑** ou **Voar** no celular para continuar subindo. Solte para descer e combine com as direções ou **Correr** para passar sobre os animais e obstáculos. O tempo restante aparece no HUD. A camisa não protege contra dano e o poder não é salvo ao sair.

Os perigos são **cacos de vidro, espinhos e pontas metálicas**, inclusive em Terra Nova. Cada fase tem **dois checkpoints**: um pelo meio do percurso e outro antes do chefe. Saves antigos retomam na bandeira anterior mais próxima.

Cinco chefes guardam as saídas: **Mingau** (gato da orla), **Brutus** (pitbull do parque), **Ratão** (rato gigante da Pedra Branca), **Sombra** (gato do Caminho Novo) e **Titã** (rottweiler do portão). Observe o aviso da investida, pule para desviar e use **E / Latir** de frente para o chefe na recuperação. Saltar sobre ele também causa dano; o superpum e os ataques com a camisa são mais fortes. É possível vencer sem encontrar frango. A saída só abre após a vitória, inclusive no último portão.

Ao tentar novamente, a luta invicta recomeça e os frangos reaparecem. Chefes já vencidos ficam registrados no save. Reiniciar o jogo limpa esse progresso. Sprites e prompts novos: [POWER_BOSS_ART.md](docs/POWER_BOSS_ART.md). `npm run test:combat` verifica os poderes e as cinco lutas no Chromium; inclui uma fixture que escolhe posições para QA, sem adicionar comandos de teletransporte ao jogo publicado.

## Publicar no GitHub Pages

O jogo roda inteiramente no navegador. A publicação usa somente `dist/`, incluindo os onze PNGs de execução e a edição offline; Docker e Node não são necessários para jogar no site.

1. No repositório do GitHub, abra **Settings → Pages → Build and deployment → Source** e selecione **GitHub Actions**.
2. Envie estas alterações para a branch `main`. O workflow [pages.yml](.github/workflows/pages.yml) instala as ferramentas, gera o build, executa testes de lógica, combate e navegador no caminho `/beethoven/` e publica a distribuição. Também pode ser iniciado em **Actions → Publicar jogo no GitHub Pages → Run workflow** depois que o arquivo estiver no GitHub.
3. Aguarde o job `deploy` concluir. Para `elomir21/beethoven`, o endereço padrão esperado é **https://elomir21.github.io/beethoven/**. A URL efetiva aparece no ambiente `github-pages` e em Settings → Pages.

Vite e carregamento das imagens usam caminhos relativos, compatíveis com o subdiretório do repositório e a raiz de um domínio. `npm run test:pages` valida o build em um servidor temporário que rejeita URLs fora de `/beethoven/`, incluindo imagens, navegação inicial, toque/rotação e HTML autocontido. Execute `npm run build` antes dele; requer Chromium como os demais testes de browser. O workflow usa Node 24 e instala o Chromium pelo Playwright.

No GitHub Free, Pages está disponível para repositórios públicos; repositórios privados exigem um plano compatível. A publicação depende de Pages/Actions habilitados e das regras do ambiente `github-pages`. Referências: [workflows do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) e [base relativa do Vite](https://vite.dev/guide/build.html#relative-base).

A configuração e os testes locais não significam que o site já foi publicado; o primeiro deploy precisa concluir no GitHub. O save é local ao navegador/origem e não é transferido do endereço local para o Pages.

## Jogar no celular pela mesma rede Wi-Fi

No computador que hospeda o jogo:

```sh
docker compose --env-file docker/mobile.env up -d --build --wait beethoven
```

No celular conectado ao mesmo Wi-Fi, abra `http://<IP-Wi-Fi-do-computador>:5173`. `localhost` no celular se refere ao próprio celular. O preset publica a porta 5173 na rede local; sem ele, o padrão continua limitado a localhost.

Use as setas para andar; segure **Correr** sozinho para correr na direção para a qual Beethoven está virado. Uma seta junto com Correr muda o sentido. **Pular** aceita toque longo para saltar mais alto; **Latir** acalma os cães e chama a família. Você pode combinar Correr e Pular. Pausa, menus e avanço/skip da história funcionam por toque. O save fica no navegador de cada aparelho/origem.

A abertura tem sprites próprios de Júlia (branca, cabelo castanho escuro) e Elomir (cabelo preto), com altura equivalente. Os dois caminham com Beethoven pela orla, segurando a guia; depois o cachorro se solta e começa a jornada. O parallax usa repetição contínua com transição suave entre extremidades, sem corte seco nem texto espelhado. O conteúdo dos cenários continua sendo reutilizado ao longo das fases.

Ao girar para a horizontal, o jogo ocupa o maior retângulo **16:9** disponível e os controles ficam sobre a imagem. O layout acompanha a área realmente visível quando as barras do navegador aparecem/desaparecem; a partida continua na mesma fase. Em retrato, os controles ficam abaixo da imagem.

Toque em **Tela cheia** para expandir o jogo com seus controles; use **Sair** para retornar. Se o navegador não permitir tela cheia nativa, o jogo ativa o modo ampliado e informa que as barras do navegador permanecem. Não é necessário travar a orientação do aparelho.

Os atlas e cenários HD são carregados localmente, sem CDN. Arte, dimensões reais e prompts: [ASSETS.md](docs/ASSETS.md) e [ART_PROMPTS.md](docs/ART_PROMPTS.md).

## Jogar sem instalar ferramentas
Abra `dist/Beethoven.html` no navegador e clique em **Jogar**. Esse arquivo incorpora imagens, código e estilos; não requer servidor. Foi regenerado em 03/11/2026 pelo build de produção e passou pelo teste de execução em VM. A validação Chromium usa a versão HTTP.

## Docker: instalação, testes e jogo
Na máquina basta ter Docker Engine com Compose, acesso ao daemon e internet para baixar a imagem, os pacotes npm e Chromium. Não precisa instalar Node/npm no host.

Na pasta do projeto:

```sh
./docker/run.sh
```

O comando monta a imagem de testes, executa typecheck, build Vite, Vitest, testes de simulação e Playwright (incluindo as cinco fases pelo teclado). Somente se tudo passar ele sobe o jogo e aguarda o healthcheck. O teste integral de navegador pode levar vários minutos.

Endereço após execução bem-sucedida: **http://localhost:5173**.

Comandos separados:

```sh
# Instalar e executar toda a validação dentro do container:
docker compose --profile test build tests
docker compose --profile test run --rm tests

# Subir somente a versão do jogo:
docker compose up -d --build --wait beethoven

# Desenvolvimento com Vite e atualização ao editar src/:
docker compose --profile dev up --build dev
# http://localhost:5174

# Logs e encerramento:
docker compose logs -f beethoven
docker compose down
```

As portas são publicadas somente em localhost. Resultados de navegador ficam em `test-results/`. O serviço de testes usa usuário 0 dentro do container para gravar o volume também no Docker rootless; se necessário, defina `DOCKER_TEST_USER` para o UID:GID apropriado ao seu daemon. Desenvolvimento e execução do jogo usam o usuário `node`.

### O que o Dockerfile instala

| Estágio | Conteúdo |
|---|---|
| `development` | Node 24, npm, Phaser 3, TypeScript, Vite, Vitest, Playwright e fontes do jogo |
| `test` | Tudo acima, Chromium Debian e fontes de sistema para os testes |
| `build` | Typecheck, build Vite e geração do HTML offline |
| `production` | Node e artefatos compilados; não instala ferramentas de desenvolvimento |

As dependências estão declaradas em `package.json`. O primeiro build usa `npm install` e gera um lockfile dentro da imagem; não foi possível gerar/validar um `package-lock.json` no host nesta sessão. Se houver lockfile no projeto, o Dockerfile passa a usar `npm ci`.

**Validação:** typecheck, build Vite/offline, dois testes Vitest e 24 testes Node. Chromium cobre controles, save, reinício e corrida com um botão; a suíte visual tem nove checks de desktop/celular/fullscreen e `test:story` tem três checks de sprites, pixels de emenda do parallax e abertura. Resultados atuais e evidências do serviço publicado estão em [TEST_REPORT.md](docs/TEST_REPORT.md); a travessia integral em navegador da versão HD permanece registrada no histórico. Node/npm não precisam estar no PATH do host.

### Chromium
`/etc/chromium` contém configurações, não o executável. O estágio de testes instala seu próprio navegador em **`/usr/bin/chromium`** e define `CHROMIUM_EXECUTABLE_PATH`. Não depende do Chromium do host ou do Flatpak.

Fora do Docker, é possível indicar outro binário:

```sh
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Sem essa variável, Playwright utiliza o navegador baixado por `npx playwright install chromium`. Se `E2E_BASE_URL` não for informado, o teste serve a versão de produção em uma porta local temporária (5175 por padrão). `E2E_FULL=1` habilita a travessia completa pelo teclado; no Compose de testes já está habilitada.

## Desenvolvimento sem Docker
Requer Node 22.12+ (recomendado 24) e npm:

```sh
npm install
npm run dev
npm run build
npm test
npm run test:e2e
```

`npm run dev` e `npm run preview` usam Vite em 5173. `npm run build` valida a entrada TypeScript, gera o build Vite e o HTML autocontido. `npm test` executa dois casos Vitest e 15 testes Node. O teste de produção pressupõe um build prévio. `npm run test:visual` valida desktop/4K e controles multitoque em celulares emulados; `npm run test:story` verifica sprites humanos, continuidade dos cinco fundos e capturas da abertura. Ambos integram verify e geram relatórios/capturas em test-results.

Alternativa sem dependências npm, preservada para ambientes restritos:

```sh
node --experimental-vm-modules scripts/build.mjs
node --experimental-vm-modules --test --test-isolation=none tests/*.test.mjs
node scripts/serve.mjs dist
```

## Escopo da stack
Vite e uma entrada TypeScript estrita estão configurados para executar o jogo existente; Vitest recebe casos compartilhados de persistência. **O motor de gameplay continua em JavaScript/Canvas e física própria.** Phaser 3 está declarado como dependência para a futura migração, mas ainda não é o motor utilizado. Instalar a stack não equivale a concluir essa migração, nem torna todo o código estritamente tipado.

## Controles

| Tecla | Ação |
|---|---|
| A/D ou ←/→ | Andar |
| Shift | Correr |
| Espaço/W/↑ | Pular; segurar aumenta a altura |
| E | Latir, acalmar cães e chamar os donos no portão |
| Esc | Pausar/retomar; pular cutscene |
| Enter | Avançar cenas e transições |
| M | Silenciar |
| R na pausa | Retornar ao checkpoint |
| F2 | Mostrar colisores |

Clique no jogo para devolver o foco. Ossinhos são opcionais. Checkpoints restauram vida. No Terra Nova, pressione E perto do portão para iniciar o reencontro.

## Qualidade e pendências
Dois testes Vitest e 15 testes Node verificam progressão integral, dano, pausa, latido, checkpoint, persistência, gatos neutros, multitoque, corrida direta, timeline da abertura e contratos de atlas/offline. Testes Chromium verificam desktop, celular, fullscreen, emendas do parallax e sprites/animação da família. Capturas e relatórios atuais ficam em test-results; renders Canvas anteriores em docs/screenshots são históricos.

Ainda não há teste em aparelho físico/Safari, medição de FPS/memória, audição da trilha ou playtest humano atual. A simulação eficiente leva cerca de 5 minutos mais narrativa; a meta de 15–25 minutos não foi demonstrada. Primitivas e variedade adicional das fases continuam passíveis de refinamento. Veja [ASSETS.md](docs/ASSETS.md) e [TEST_REPORT.md](docs/TEST_REPORT.md) para os limites e evidências.
