import { describe, expect, it } from 'vitest';
import { createDeviceSound } from './deviceSound';

describe('Spec playback-sound › Grund der Nichtverfügbarkeit', () => {
  it('Browser kann gar nicht dekodieren: Der Grund nennt das', async () => {
    const { loader } = createDeviceSound({});
    await loader.load();
    expect(loader.state()).toBe('unavailable');
    expect(loader.failures()).toEqual(['Dekodieren: in diesem Browser nicht möglich']);
    expect(loader.reloadMayHelp()).toBe(false);
  });
});
