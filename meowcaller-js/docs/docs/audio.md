# Audio

All audio in meowcaller-js is 16 kHz mono PCM, processed in frames of 960 samples (60 ms per frame).

## Constants

### `SampleRate`

```js
SampleRate // 16000
```

The required sample rate in Hz.

### `FrameSamples`

```js
FrameSamples // 960
```

The number of samples per frame.

## Interfaces

### `AudioSource`

```ts
interface AudioSource {
  readFrame(): Promise<Float32Array | null>;
  close(): Promise<void>;
}
```

A source that the engine polls for outgoing audio. Return `null` from `readFrame()` when the source is exhausted.

### `AudioSink`

```ts
interface AudioSink {
  writeFrame(frame: Float32Array): Promise<void>;
  close(): Promise<void>;
}
```

A sink that receives decoded incoming audio frames.

## Functions

### `SinkFunc(fn)`

Create an `AudioSink` from a simple callback.

```js
import { SinkFunc } from 'meowcaller-js';

call.receive(SinkFunc((frame) => {
  console.log('received', frame.length, 'samples');
}));
```

### `SourceFunc(provider)`

Create an `AudioSource` from an async function that returns `Float32Array | null`.

```js
import { SourceFunc } from 'meowcaller-js';

call.play(SourceFunc(async () => {
  return new Float32Array(960); // silence
}));
```

### `PCMStream(readable)`

Create an `AudioSource` from a Node.js `Readable` stream of raw s16le PCM audio. The stream is automatically converted to float32 and resampled to 16 kHz if needed.

```js
import { createReadStream } from 'node:fs';
import { PCMStream } from 'meowcaller-js';

const src = PCMStream(createReadStream('audio.pcm'));
call.play(src);
```

### `WAVFile(path)`

Create an `AudioSource` from a RIFF/WAV file. Reads the file header to detect sample rate and channel count, then downmixes and resamples to 16 kHz mono.

Returns a `Promise<AudioSource>`.

```js
const src = await WAVFile('greeting.wav');
call.play(src);
```

### `MP3File(path)`

Not yet implemented. Throws an error. Use `PCMStream` with an external decoder (e.g. `lamejs`) as a workaround.

### `OpusFile(path)`

Not yet implemented. Throws an error. Use `PCMStream` with an external decoder as a workaround.
