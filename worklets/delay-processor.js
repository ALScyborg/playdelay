/* eslint-disable */
/**
 * PlayDelay ring-buffer delay processor (AudioWorklet).
 *
 * Buffers incoming audio in a large circular buffer and reads it back N
 * seconds later. Supports delays from 0 up to MAX_DELAY_SECONDS and changes
 * the delay smoothly at runtime by ramping the effective delay toward the
 * target a few samples at a time (a tiny, mostly-inaudible varispeed during
 * the transition) instead of jumping the read pointer and clicking.
 *
 * Messages from the main thread:
 *   { type: "setDelay", seconds: number }   -> set target delay
 *   { type: "reset" }                        -> clear buffer, delay -> 0
 *
 * Messages to the main thread:
 *   { type: "delay", current: number }       -> ~10x/sec, the live delay value
 */

const MAX_DELAY_SECONDS = 120;

class DelayProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.capacity = Math.ceil(MAX_DELAY_SECONDS * sampleRate) + sampleRate;
    this.channelCount = 2;
    this.buffers = [
      new Float32Array(this.capacity),
      new Float32Array(this.capacity),
    ];

    this.writePos = 0;
    this.targetDelaySamples = 0;
    this.currentDelaySamples = 0;

    // Fine-adjust ramp (~15% varispeed). Big preset jumps snap (see setDelay)
    // so 8s/10s feels instant instead of crawling for minutes at 2%.
    this.maxRampRate = 0.15;

    this._reportCounter = 0;

    this.port.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === "setDelay") {
        const seconds = Math.max(0, Math.min(MAX_DELAY_SECONDS, data.seconds));
        const next = seconds * sampleRate;
        const jump = Math.abs(next - this.currentDelaySamples);
        this.targetDelaySamples = next;
        // Snap when jump > ~1.5s so presets aren't glacial
        if (jump > sampleRate * 1.5) {
          this.currentDelaySamples = next;
        }
      } else if (data.type === "reset") {
        this.targetDelaySamples = 0;
        this.currentDelaySamples = 0;
        this.writePos = 0;
        for (const buf of this.buffers) buf.fill(0);
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!output || output.length === 0) return true;

    const frames = output[0].length;
    const channels = output.length;

    for (let i = 0; i < frames; i++) {
      // Ramp the effective delay toward the target smoothly.
      const diff = this.targetDelaySamples - this.currentDelaySamples;
      if (Math.abs(diff) > 1e-3) {
        const step = Math.max(
          -this.maxRampRate,
          Math.min(this.maxRampRate, diff)
        );
        this.currentDelaySamples += step;
      } else {
        this.currentDelaySamples = this.targetDelaySamples;
      }

      const readPosF =
        (this.writePos - this.currentDelaySamples + this.capacity) %
        this.capacity;
      const readIdx = Math.floor(readPosF);
      const frac = readPosF - readIdx;
      const nextIdx = (readIdx + 1) % this.capacity;

      for (let ch = 0; ch < channels; ch++) {
        const buf = this.buffers[ch] || this.buffers[0];

        // Write current input sample into the ring buffer.
        const inChannel =
          input && input[ch]
            ? input[ch]
            : input && input[0]
            ? input[0]
            : null;
        const sample = inChannel ? inChannel[i] : 0;
        buf[this.writePos] = sample;

        // Read the delayed sample with linear interpolation.
        const delayed = buf[readIdx] * (1 - frac) + buf[nextIdx] * frac;
        output[ch][i] = delayed;
      }

      this.writePos = (this.writePos + 1) % this.capacity;
    }

    // Report the live delay back to the UI ~10 times per second.
    this._reportCounter += frames;
    if (this._reportCounter >= sampleRate / 10) {
      this._reportCounter = 0;
      this.port.postMessage({
        type: "delay",
        current: this.currentDelaySamples / sampleRate,
      });
    }

    return true;
  }
}

registerProcessor("delay-processor", DelayProcessor);
