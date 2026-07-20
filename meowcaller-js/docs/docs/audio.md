# Audio

meowcaller-js works with 16 kHz mono float32 PCM audio. Each frame is 960 samples (60 ms).

## Constants

```js
import { SampleRate, FrameSamples } from 'meowcaller-js';

console.log(SampleRate);   // 16000
console.log(FrameSamples); // 960
```

## Sources

A source provides audio frames to the player. It implements:

```ts
interface AudioSource {
  readFrame(): Promise<Float32Array | null>;
  close(): Promise<void>;
}
```

Return `null` from `readFrame()` to signal end-of-stream.

### `WAVFile(path)`

Read and play a WAV file. Handles resampling to 16 kHz and mono downmix automatically.

```js
import { WAVFile } from 'meowcaller-js';

const source = await WAVFile('audio.wav');
call.play(source);
```

Supports:
- 16-bit PCM WAV files
- Any sample rate (auto-resampled to 16 kHz)
- Mono or stereo (downmixed to mono)

### `PCMStream(readable)`

Read raw signed 16-bit little-endian PCM from a Node.js readable stream.

```js
import { createReadStream } from 'fs';
import { PCMStream } from 'meowcaller-js';

const stream = createReadStream('raw_audio.pcm');
const source = PCMStream(stream);
call.play(source);
```

### `SourceFunc(provider)`

Create a source from a simple async function. The function is called once per frame and should return a `Float32Array` of 960 samples, or `null` for EOF.

```js
import { SourceFunc } from 'meowcaller-js';

// Generate silence
const silence = SourceFunc(async () => new Float32Array(960));

// Generate a sine wave
let phase = 0;
const tone = SourceFunc(async () => {
  const frame = new Float32Array(960);
  for (let i = 0; i < 960; i++) {
    frame[i] = Math.sin(phase) * 0.3;
    phase += (2 * Math.PI * 440) / 16000;
  }
  return frame;
});

call.play(tone);
```

### `MP3File(path)` / `OpusFile(path)`

Not yet implemented. These throw an error directing you to use `PCMStream` with an external decoder.

```js
// Use a decoder like @breezystack/lamejs or opus-recorder
// to decode to PCM, then pipe through PCMStream
```

## Sinks

A sink receives audio frames from incoming calls. It implements:

```ts
interface AudioSink {
  writeFrame(frame: Float32Array): Promise<void>;
  close(): Promise<void>;
}
```

### `SinkFunc(fn)`

Create a sink from a callback function.

```js
import { SinkFunc } from 'meowcaller-js';

call.receive(SinkFunc((frame) => {
  // frame: Float32Array of 960 samples at 16 kHz
  // do something with the audio data
}));
```

## Player

The `Player` manages audio playback state.

```js
import { NewPlayer, PlayerState } from 'meowcaller-js';

const player = NewPlayer();
player.play(source);
```

### `NewPlayer()`

Creates a new player instance.

### Player methods

| Method | Description |
|--------|-------------|
| `player.play(source)` | Start playing from a source. Closes any previous source. |
| `player.pause()` | Pause playback (state → Paused) |
| `player.resume()` | Resume playback (state → Playing) |
| `player.stop()` | Stop playback and close the source (state → Idle) |
| `player.state()` | Returns current `PlayerState` |
| `player.onFinish(fn)` | Register a callback for when playback ends |
| `player.nextFrame()` | Get the next frame (used internally by the engine) |

### Player states

| State | Description |
|-------|-------------|
| `PlayerState.Idle` | No source or source ended |
| `PlayerState.Playing` | Actively reading frames |
| `PlayerState.Paused` | Paused, will not read frames |

### Using `call.play()` vs manual player

`call.play()` is a convenience that creates a player, subscribes it, and starts playback:

```js
// This:
call.play(source);

// Is equivalent to:
const player = NewPlayer();
call.subscribe(player);
player.play(source);
```

Use the manual approach when you need to control playback (pause, resume, stop) later:

```js
const player = NewPlayer();
call.subscribe(player);
player.play(source);

// Later:
player.pause();
// ...
player.resume();
```

## Audio format

All audio in meowcaller-js is:

- **Sample rate:** 16,000 Hz
- **Channels:** Mono
- **Bit depth:** 32-bit float
- **Frame size:** 960 samples (60 ms at 16 kHz)
- **Encoding:** Float32Array where 1.0 = maximum amplitude

The MLow codec (WhatsApp's default) operates on this format. The encoder/decoder is currently a passthrough stub — the raw PCM bytes are sent as-is until a WASM port of the Go MLow codec is available.
