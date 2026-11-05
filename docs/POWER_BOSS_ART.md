# Arte do superfrango e dos chefes — 04/11/2026

Ferramenta: `image_gen` integrada, conforme skill imagegen; sem CLI/API externa. PNGs com alpha real, copiados para o projeto sem alterações de pixels. Os recortes são gerados por `scripts/inspect_sprite_atlases.py` e consumidos pelo catálogo compartilhado. Dimensões efetivas vêm dos PNGs, não de uma promessa do prompt.

## Beethoven com camisa do Vasco

Destino: `public/assets/characters/beethoven/beethoven-vasco-hd.png`, RGBA **1671×941**, 4×3, 12 poses. Referência/edição: `public/assets/characters/beethoven/beethoven-hd.png`, preservado. A roupa é parte do atlas; não há troca de identidade com os rivais. O jogo alterna os dois atlas conforme o temporizador do poder.

Prompt final:

> Use case: identity-preserve. Asset type: high resolution 2D game sprite atlas, transparent background. Edit target: the attached 4-column by 3-row Beethoven dog sprite sheet. Keep the exact same dog identity, brown/white fur, face, ears, tail, facing right, all 12 poses, positions and cell layout. Change only his torso clothing: add the Vasco da Gama football team black dog jersey with an obvious white diagonal sash and small red cross badge on the flank, fitted to each pose. Leave head, paws, legs and tail visible, no hat or cape. Match the established crisp hand-drawn pixel illustration and soft detailed shading, excellent legibility at small size. Every cell has a single complete dog with clear transparent padding, no bleed across cells. Preserve uniform consistent scale and exactly 4 equal columns, 3 equal rows. No text, no labels, no shadows on background. Actual transparent alpha, not a checkerboard. Preserve existing art otherwise. Output a landscape sprite atlas at the highest useful resolution.

## Ratão das galerias

Destino: `public/assets/characters/bosses/rat-hd.png`, RGBA **1254×1254**, 2×2, quatro poses. Pedido de pelo menos 1536×1536; a ferramenta retornou 1254×1254. O jogo usa essa resolução real, sem upscale do arquivo. Os outros quatro chefes reaproveitam atlas HD próprios de gatos e cães rivais, ampliados pelo renderer.

Prompt final:

> Use case: stylized-concept. Asset type: high resolution transparent sprite atlas for a charming 2D side-view dog platform game. Create a giant gray rat boss, humorous and formidable but not horrifying: gray fur with detailed textured pixel shading, large rounded pink ears, long pink tail curving behind, pale belly, pink paws, broad pointed muzzle, whiskers, two little incisors, charcoal outline. Side view facing RIGHT. EXACTLY FOUR animation poses in an evenly divided 2-column by 2-row square atlas: top-left idle on four feet; top-right running with paws stretched; bottom-left attack lunge with front paws lifted; bottom-right stunned sitting with dazed eyes. Same identity and scale in each cell, whole body and long tail fit inside every cell with generous transparent margins. Style: polished detailed hand-drawn pixel illustration, warm family-friendly adventure, expressive eyes. No humans, no equipment, no text, no gridlines, no floor, no background, no drop shadows, actual transparent alpha. At least 1536x1536 overall for crisp HD gameplay sprites.

## Objetos Canvas

Coxa assada com osso claro, folhas que a escondem, brilho de descoberta, vidro com reflexos claros, espinhos verdes, pontas metálicas e nuvens de superpum são desenhos programáticos em `Renderer`. Seguem o DPR/escala 16:9 existente, sem arquivos de imagem adicionais. O áudio do superpum usa osciladores WebAudio; não há download de áudio.
