# Arte e qualidade de imagem

Atualização HD de 03/11/2026. A ferramenta integrada image_gen criou os atlas e remasterizou os cenários a partir das referências locais. Os originais foram preservados. Prompts finais: [ART_PROMPTS.md](ART_PROMPTS.md) e [BACKGROUND_PROMPTS.md](BACKGROUND_PROMPTS.md).

Organização: `public/assets/` contém somente os nove PNGs carregados no runtime. Cada cenário tem diretório por localidade; os atlas ficam em characters/beethoven, rivals, cats e family. Fotos, arquivos de origem, ZIP e legado ficam em `assets/`, fora de public/dist e do contexto Docker. Estrutura completa: [assets/README.md](../assets/README.md). A reorganização preservou os bytes dos 22 assets, conferidos por SHA-256.

## Arquivos usados no jogo

| Arquivo em public/assets/ | Dimensão real | Conteúdo |
|---|---|---|
| characters/beethoven/beethoven-hd.png | 1672×941 RGBA | 12 poses, grade 4×3; único personagem branco/caramelo com orelhas assimétricas |
| characters/rivals/rivals-hd.png | 1448×1086 RGBA | 16 poses, grade 4×4; pitbull, pastor-alemão, pinscher e rottweiler |
| characters/cats/cats-hd.png | 1774×887 RGBA | 8 poses, grade 4×2; tabby cinza e tuxedo preto/branco |
| characters/family/family-hd.png | 1774×887 RGBA | 12 poses, grade 6×2; Júlia e Elomir, seis poses por pessoa |
| backgrounds/beira-mar-florianopolis/03_beira_mar_florianopolis-hd.png | 2172×724 RGB | Ponte, orla, palmeiras e prédios |
| backgrounds/parque-costa-azul/04_parque_costa_azul-hd.png | 2172×724 RGB | Parque, vegetação, escorregador e balanços |
| backgrounds/passeio-pedra-branca/01_passeio_pedra_branca_palhoca-hd.png | 2172×724 RGB | Passeio, cafés, montanha e placa Pedra Branca |
| backgrounds/caminho-novo/06_caminho_novo_palhoca-hd.png | 2172×724 RGB | Comércio, casas, jardins e placa Caminho Novo |
| backgrounds/terra-nova/05_terra_nova_palhoca-hd.png | 2172×724 RGB | Casas, portões, jardins e carro azul |

Os rivais usam desenhos próprios em todas as fases e na introdução; não há recoloração do sprite de Beethoven. As quatro poses de cada rival são repouso, duas passadas e latido. Os gatos têm repouso, duas passadas e pose sentada; são neutros e reagem à proximidade/latido sem causar dano.

Júlia é branca e tem cabelo castanho escuro; Elomir tem cabelo preto. Os dois têm altura lógica de 68 e poses de repouso, quatro passos e inclinação para a guia. Os sprites aparecem na abertura, no reencontro e no final. A timeline familyScene.js anima passeio conjunto, guia na mão de Elomir, fuga de Beethoven e busca. Prompt e procedência: [FAMILY_PROMPT.md](FAMILY_PROMPT.md).

## Integração e nitidez

`src/data/assets.js` define o catálogo; `src/data/spriteFrames.js` guarda recortes reais por alpha. Para atualizar esses metadados após trocar um atlas, execute `python3 scripts/inspect_sprite_atlases.py` com Pillow disponível. O script lê os PNGs sem alterar os pixels e gera somente o arquivo JS. Os pés ficam alinhados e a escala permanece comum entre as poses de cada personagem.

O jogo mantém coordenadas de física 480×270 e um estágio **16:9** em retrato ou paisagem. O backing store do Canvas acompanha o tamanho CSS e o devicePixelRatio até **3840×2160**, com suavização de imagens de alta qualidade. Essa é a resolução máxima de desenho, não a resolução de todos os arquivos. Texturas HD são desenhadas diretamente; não são primeiro reduzidas para 480×270 nem para células de 64×48.

Os cenários têm altura lógica fixa de 272 para preservar o enquadramento; resolução de origem não altera câmera/colisões. parallax.js prepara uma faixa em Canvas na resolução nativa, misturando 6% das extremidades, e a repete como padrão contínuo. PNGs originais e letreiros são preservados, sem espelhamento. A faixa é armazenada em cache por cenário; há reutilização de conteúdo e uma transição curta, não geração ilimitada de paisagens inéditas. O HTML autocontido incorpora os cinco cenários usados e quatro atlas (nove imagens). Build web copia somente os PNGs de execução de public/assets, mantendo os diretórios; materiais de assets/ não entram na distribuição.

## Referências e limites

- `assets/references/beethoven/photos/foto1.jpeg` a `assets/references/beethoven/photos/foto4.jpeg`: 720×1280, referências locais de Beethoven, fora do build. Os donos foram desenhados pela descrição fornecida, sem fotografias e sem promessa de semelhança fotográfica.
- `assets/source/characters/beethoven/sprite_de_cachorro_beethoven_em_pixel_art.png`: 1448×1086 RGBA, referência de identidade. `assets/legacy/characters/beethoven/beethoven.png` (768×48) e `prepare_assets.py` permanecem como fluxo legado, sem uso no runtime HD.
- Os seis cenários originais de 1670×512/514 ficam em assets/source/backgrounds; ZIP em assets/archives. São José continua sem fase no percurso.
- Beethoven tem 12 poses HD reutilizadas nos estados existentes; não há promessa de 36+ desenhos exclusivos. Solo, plataformas, ossos, chuva, portão e HUD continuam programáticos; humanos usam atlas ilustrado. Áudio continua sintetizado por WebAudio.
- Cenários compostos se repetem continuamente com emenda suavizada; não há camadas originais separadas nem paisagens únicas infinitas. Testes medem continuidade nos pixels de limite, mas não substituem playtest artístico.
- Procedência externa/licença das referências fornecidas não foi demonstrada no repositório. Os prompts e a geração atual estão registrados; isso não comprova direitos sobre as referências originais.

Validação: testes verificam dimensões/recortes dos atlas e carregamento dos cenários HD. Capturas desktop, celular em retrato e paisagem ficam em test-results e são inspecionadas visualmente. Os testes móveis usam Chromium com emulação, sem afirmar execução física em Android/iPhone ou Safari. Consulte [TEST_REPORT.md](TEST_REPORT.md) para os resultados da execução atual.
