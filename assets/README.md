# Arquivos de arte de origem e referência

Esta pasta guarda materiais de autoria; o jogo usa somente os nove PNGs em `public/assets/`. O conteúdo de `assets/**` fica fora do contexto Docker e não é copiado para `dist`.

```text
assets/
├── references/beethoven/photos/     foto1.jpeg … foto4.jpeg
├── source/
│   ├── backgrounds/                 Seis cenários originais extraídos do ZIP
│   └── characters/beethoven/         Sprite original de referência
├── archives/                        ZIP original dos seis cenários
└── legacy/characters/beethoven/      Sheet antiga beethoven.png, sem uso no runtime

public/assets/
├── backgrounds/
│   ├── beira-mar-florianopolis/
│   ├── parque-costa-azul/
│   ├── passeio-pedra-branca/
│   ├── caminho-novo/
│   └── terra-nova/
└── characters/
    ├── beethoven/
    ├── rivals/
    ├── cats/
    └── family/
```

Os nomes e pixels dos 22 arquivos existentes foram preservados na reorganização. `src/data/assets.js` e os campos `bg` de `src/data/levels.js` usam caminhos relativos à raiz `public/assets`; esses mesmos caminhos são chaves do manifesto HTML offline e dos recortes em `src/data/spriteFrames.js`.

`python3 scripts/inspect_sprite_atlases.py` lê os quatro atlas de execução e regenera somente os metadados JS. `python3 scripts/prepare_assets.py` mantém o fluxo antigo: lê `assets/source/characters/beethoven/sprite_de_cachorro_beethoven_em_pixel_art.png` e grava `assets/legacy/characters/beethoven/beethoven.png`. Esse fluxo legado não substitui a arte HD nem integra o build.

Dimensões, prompts e limites da arte: [docs/ASSETS.md](../docs/ASSETS.md).
