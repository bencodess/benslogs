# API Reference

All exports are from the package root:

```js
import {
  Client, Call, CallSession, CallPhase, CallDirection,
  NewPlayer, PlayerState,
  PCMStream, WAVFile, MP3File, OpusFile, SinkFunc, SourceFunc,
  SampleRate, FrameSamples,
  AnnexBRecorder, VideoSinkFunc,
  CallRegistry, AudioCodec, selectAudioCodec,
  WithLogger, WithDiagnostics, Recorder,
} from 'meowcaller-js';
```

---

## `Client`

| Method | Signature | Description |
|--------|-----------|-------------|
| constructor | `new Client(wa, opts?)` | Wrap a Baileys socket |
| `connect()` | `() => this` | Install call event handlers |
| `call()` | `(ctx, target) => Promise<Call>` | Place an outbound call |
| `onIncomingCall()` | `(fn: (Call) => void) => void` | Register incoming call handler |
| `listCalls()` | `() => Array<Call \| CallSession>` | List all active calls |
| `getCall()` | `(callID: string) => Call \| CallSession \| null` | Look up a call by ID |

---

## `Call`

| Method | Signature | Description |
|--------|-----------|-------------|
| `id()` | `() => string` | Call ID |
| `peer()` | `() => string` | Peer JID or phone number |
| `state()` | `() => symbol` | Current `CallPhase` |
| `isVideo()` | `() => boolean` | Whether this is a video call |
| `answer()` | `() => Promise<void>` | Accept incoming call |
| `reject()` | `() => Promise<void>` | Reject incoming call |
| `hangup()` | `() => Promise<void>` | End the call |
| `subscribe()` | `(player: Player) => void` | Attach a player for outgoing audio |
| `play()` | `(src: AudioSource) => Player` | Create player and start playing |
| `receive()` | `(sink: AudioSink) => void` | Set incoming audio sink |
| `receiveVideo()` | `(sink: VideoSink) => void` | Set incoming video sink |
| `sendVideo()` | `(au: Uint8Array) => void` | Send H.264 access unit |
| `onReady()` | `(fn: () => void) => void` | Callback: media is active |
| `onEnd()` | `(fn: (reason: string) => void) => void` | Callback: call ended |
| `onStateChange()` | `(fn: (phase: symbol) => void) => void` | Callback: phase changed |
| `onVideoState()` | `(fn: (state: VideoState) => void) => void` | Callback: video state changed |

---

## `CallSession`

| Property / Method | Type | Description |
|-------------------|------|-------------|
| `callID` | `string` | Call ID |
| `peerJID` | `string` | Peer JID |
| `callCreator` | `string` | Call creator JID |
| `direction` | `symbol` | `CallDirection.Incoming` or `Outgoing` |
| `isVideo` | `boolean` | Video call flag |
| `phase_()` | `() => symbol` | Current phase (internal) |
| `isActive()` | `() => boolean` | True if phase is `Active` |
| `isEnded()` | `() => boolean` | True if phase is `Ended` |
| `description()` | `() => string` | Human-readable description |
| `transitionTo()` | `(next: symbol) => boolean` | Attempt phase transition |

---

## `CallPhase`

| Symbol | Description |
|--------|-------------|
| `CallPhase.Idle` | Not yet started |
| `CallPhase.Calling` | Outbound, waiting for answer |
| `CallPhase.Ringing` | Inbound, waiting for answer |
| `CallPhase.Connecting` | Accepted, media establishing |
| `CallPhase.Active` | Call is live |
| `CallPhase.Ended` | Call has ended |

## `CallDirection`

| Symbol | Description |
|--------|-------------|
| `CallDirection.Incoming` | Inbound call |
| `CallDirection.Outgoing` | Outbound call |

---

## Player

### `NewPlayer()`

Returns a `Player` object.

| Method | Description |
|--------|-------------|
| `play(source)` | Start playing an audio source |
| `pause()` | Pause playback |
| `resume()` | Resume playback |
| `stop()` | Stop and release the source |
| `state()` | Current `PlayerState` symbol |
| `onFinish(fn)` | Register finish callback |
| `nextFrame()` | `Promise<Float32Array \| null>` — poll for next frame |

### `PlayerState`

| Symbol | Description |
|--------|-------------|
| `PlayerState.Idle` | Not playing |
| `PlayerState.Playing` | Actively playing |
| `PlayerState.Paused` | Paused |

---

## Audio

| Export | Signature | Description |
|--------|-----------|-------------|
| `SampleRate` | `16000` | Required sample rate |
| `FrameSamples` | `960` | Samples per frame |
| `SinkFunc` | `(fn) => AudioSink` | Callback-based sink |
| `SourceFunc` | `(provider) => AudioSource` | Callback-based source |
| `PCMStream` | `(readable) => AudioSource` | s16le PCM stream adapter |
| `WAVFile` | `(path) => Promise<AudioSource>` | WAV file source |
| `MP3File` | `(path) => Promise<AudioSource>` | Not yet implemented |
| `OpusFile` | `(path) => Promise<AudioSource>` | Not yet implemented |

---

## Video

| Export | Signature | Description |
|--------|-----------|-------------|
| `VideoSinkFunc` | `(fn) => VideoSink` | Callback-based video sink |
| `AnnexBRecorder` | `(path) => Promise<VideoSink>` | Record H.264 to file |

---

## Codec

### `AudioCodec`

| Symbol | Description |
|--------|-------------|
| `AudioCodec.Mlow` | MLow codec (stub) |
| `AudioCodec.Opus` | Opus codec (planned) |

### `selectAudioCodec(vs)`

Selects the audio codec based on capability negotiation. Returns `AudioCodec.Mlow` by default.

---

## Registry

### `CallRegistry`

| Method | Description |
|--------|-------------|
| `insert(session, call?)` | Register a new call |
| `has(callID)` | Check if call exists |
| `get(callID)` | Get call entry |
| `list()` | List all calls |
| `phase(callID)` | Get current phase |
| `transition(callID, next)` | Attempt phase transition |
| `snapshot(callID)` | Get session snapshot |
| `activeCount()` | Number of active calls |
| `remove(callID)` | Remove a call |
| `abortAll()` | Remove all calls, return count |

---

## Configuration

### `WithLogger(logger)`

Returns a `ConfigOption` that attaches a pino-compatible logger.

### `WithDiagnostics(rec)`

Returns a `ConfigOption` that attaches a `Recorder` for diagnostic events.

### `Recorder`

| Method | Description |
|--------|-------------|
| `new Recorder(path?)` | Create a recorder (writes JSONL) |
| `emit(category, data)` | Write a diagnostic event |
| `close()` | Flush and close the stream |
