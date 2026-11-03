# Plano de implementação
1. Inspecionar fotos, alpha e cenários; normalizar sprites sem deformar.
2. Núcleo modular Canvas 2D, física em passos fixos, input e cenas.
3. Validar movimento e primeira fase antes de expandir os dados das fases.
4. Cinco níveis, narrativa, áudio sintetizado, save e interface.
5. Testes de lógica e navegador; build estático e revisão visual.

Dependências: movimento → fases; assets → render; save → continuar; progressão → final.
A rede npm está indisponível e Phaser/Vite/TypeScript não estão no cache. A alternativa adotada é JavaScript ES modules sem dependências, Canvas 2D e servidor/build Node nativo. O runtime Node 24 foi localizado no cache do Codex. A escolha permite executar e testar o jogo offline; migração à stack sugerida fica fora desta entrega.

## Resultado desta sessão
Fundação, movimento, cinco fases, narrativa, persistência e build offline implementados. Sete testes aprovados e renderização de QA gerada. A travessia automatizada chegou ao final sem game overs. E2E de navegador foi preparado e tentado, mas não executou por Chromium ausente; servidores também foram bloqueados pelo sandbox. Próxima etapa de aceitação: abrir o HTML em navegador real, testar áudio/foco/FPS, realizar playtest humano e refinar arte e variedade dos níveis. A especificação completa ainda não está integralmente atendida.

## Atualização Docker
Configuração da stack e serviços de instalação/teste/produção criada, com Chromium próprio do container e entrada TypeScript/Vite. Compose e shell validados. Nove testes Node passaram; HTML offline regenerado. Build Docker, instalação npm e validação Vite/TS/Vitest/Playwright ainda pendem de execução fora da sessão restrita. `./docker/run.sh` é o ponto de entrada preparado para concluir a instalação, testar e disponibilizar o jogo.
