// Typed browser entry. The existing gameplay engine remains in JavaScript modules.
const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('Não foi possível encontrar a tela do jogo.');
const resolution: Readonly<{ width: number; height: number }> = {
  width: 480,
  height: 270,
};
canvas.width = resolution.width;
canvas.height = resolution.height;
await import('./main.js');
export {};
