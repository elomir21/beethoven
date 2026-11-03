import { Save, KEY, fresh } from '../../src/systems/Save.js';
export function registerSaveCases(test, assert) {
  test('restaura checkpoint e configurações após reconstruir o sistema', () => {
    const previous = globalThis.localStorage;
    const storage = new Map();
    globalThis.localStorage = {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)};
    try {
      const save = new Save();
      save.data = {...fresh(), started: true, level: 2, checkpoint: 1500, bones: ['0-1'], muted: true};
      save.write();
      assert.deepEqual(new Save().data, {...fresh(), started: true, level: 2, checkpoint: 1500, bones: ['0-1'], muted: true});
      save.reset();
      assert.deepEqual(new Save().data, {...fresh(), muted: true});
      storage.set(KEY, '{quebrado');
      assert.deepEqual(new Save().data, fresh());
    } finally { globalThis.localStorage = previous; }
  });
  test('continua jogável quando o navegador recusa armazenamento', () => {
    const previous = globalThis.localStorage;
    globalThis.localStorage = {getItem() { throw Error('acesso negado'); }, setItem() { throw Error('quota excedida'); }};
    try {
      const save = new Save();
      assert.deepEqual(save.data, fresh());
      assert.doesNotThrow(() => save.write());
    } finally { globalThis.localStorage = previous; }
  });
}
