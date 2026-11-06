/** Testhilfe: aufzeichnender Nachbau der benötigten Web-Audio-Knoten (jsdom kennt kein AudioContext). */

export interface ParamEvent {
  type: 'set' | 'exp' | 'linear' | 'target' | 'cancel';
  value?: number;
  time: number;
  timeConstant?: number;
}

export class FakeParam {
  events: ParamEvent[] = [];
  constructor(public value = 0) {}
  setValueAtTime(value: number, time: number) {
    this.events.push({ type: 'set', value, time });
    return this;
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    this.events.push({ type: 'exp', value, time });
    return this;
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({ type: 'linear', value, time });
    return this;
  }
  setTargetAtTime(value: number, time: number, timeConstant: number) {
    this.events.push({ type: 'target', value, time, timeConstant });
    return this;
  }
  cancelScheduledValues(time: number) {
    this.events.push({ type: 'cancel', time });
    return this;
  }
}

export class FakeNode {
  outputs: unknown[] = [];
  disconnected = false;
  constructor(public kind: string) {}
  connect<T>(destination: T): T {
    this.outputs.push(destination);
    return destination;
  }
  disconnect() {
    this.disconnected = true;
    this.outputs = [];
  }
}

export class FakeSource extends FakeNode {
  startedAt?: number;
  stoppedAt?: number;
  type = '';
  loop = false;
  buffer: unknown = null;
  frequency = new FakeParam(440);
  start(time = 0) {
    this.startedAt = time;
  }
  stop(time = 0) {
    this.stoppedAt = time;
  }
}

export class FakeAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  state = 'suspended';
  destination = new FakeNode('destination');
  nodes: FakeNode[] = [];

  private track<T extends FakeNode>(node: T): T {
    this.nodes.push(node);
    return node;
  }
  createOscillator() {
    return this.track(new FakeSource('oscillator'));
  }
  createBufferSource() {
    return this.track(new FakeSource('bufferSource'));
  }
  createGain() {
    return this.track(Object.assign(new FakeNode('gain'), { gain: new FakeParam(1) }));
  }
  createBiquadFilter() {
    return this.track(Object.assign(new FakeNode('biquad'), { type: 'lowpass', frequency: new FakeParam(350), Q: new FakeParam(1) }));
  }
  createDynamicsCompressor() {
    const params = { threshold: new FakeParam(), knee: new FakeParam(), ratio: new FakeParam(), attack: new FakeParam(), release: new FakeParam() };
    return this.track(Object.assign(new FakeNode('compressor'), params));
  }
  createBuffer(channels: number, length: number, sampleRate: number) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { length, sampleRate, numberOfChannels: channels, getChannelData: (c: number) => data[c]! };
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  /** Quellen (Oszillatoren, Rauschen), die zur Zeit `time` starten. */
  sourcesAt(time: number) {
    return this.nodes.filter((n): n is FakeSource => n instanceof FakeSource && n.startedAt === time);
  }
}

export type FakeGain = FakeNode & { gain: FakeParam };
