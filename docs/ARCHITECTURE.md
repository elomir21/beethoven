# Arquitetura
Sem backend ou dependências de runtime. ES modules nativos.
- engine: loop fixo 120 Hz e física AABB.
- entities: jogador e estados de animação.
- systems: input, áudio WebAudio, save validado.
- data: níveis e narrativa declarativos.
- render: composição Canvas pixel-perfect, parallax, clima e HUD.
- main: ciclo de cenas e DOM acessível para menus.
O desenho fica separado dos colisores. Mundo em pixels lógicos; posição do jogador representa pés. Simulação pausa fora do gameplay e ao perder foco. Partículas e chuva têm limites fixos. Assets carregam uma vez com fallback desenhado e mensagem explícita.

## Ferramentas e container
Vite e TypeScript têm configuração própria; a entrada `bootstrap.ts` valida o canvas e carrega o motor existente. A tipagem estrita se aplica à entrada TS, não ao motor JS. Phaser está declarado, mas não integra o loop nesta versão. Testes Node foram preservados e Vitest usa casos compartilhados de persistência. E2E serve o build por HTTP e pode percorrer as cinco fases com o teclado. Os estágios Docker separam ferramentas, Chromium de testes e artefatos de execução. Não foi possível montar a imagem nesta sessão restrita.
