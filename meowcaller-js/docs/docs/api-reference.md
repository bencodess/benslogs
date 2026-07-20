# API Reference

## Exports

```js
import {
  Client,
  Call,
  CallSession, CallDirection, CallPhase,
  NewPlayer, PlayerState,
  PCMStream, WAVFile, SinkFunc, SourceFunc,
  AnnexBRecorder, VideoSinkFunc,
  CallRegistry,
  AudioCodec,
  WithLogger, WithDiagnostics,
} from 'meowcaller-js';
```

---

## Client

```js
new Client(wa, opts?)
```

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `this` | Install event handlers on the Baileys socket |
| `call(ctx, target)` | `Promise<Call>` | Place an outbound call |
| `onIncomingCall(fn)` | `void` | Register incoming call handler |
| `listCalls()` | `(Call\|CallSession)[]` | List all active calls |
| `getCall(callID)` | `Call\|CallSession\|null` | Look up a call by ID |

---

## Call

| Method | Returns | Description |
|--------|---------|-------------|
| `id()` | `string` | Call identifier |
| `peer()` | `string` | Peer JID |
| `state()` | `symbol` | Current `CallPhase` |
| `isVideo()` | `boolean` | Whether the call has video |
| `answer()` | `Promise<void>` | Answer an incoming call |
| `reject()` | `Promise<void>` | Reject an incoming call |
| `hangup()` | `Promise<void>` | Hang up the call |
| `play(source)` | `Player` | Play audio into the call |
| `subscribe(player)` | `void` | Attach a player to the call |
| `receive(sink)` | `void` | Set the incoming audio sink |
| `receiveVideo(sink)` | `void` | Set the incoming video sink |
| `sendVideo(au)` | `void` | Send H.264 Annex B data |
| `onReady(fn)` | `void` | First RTP decoded callback |
| `onEnd(fn)` | `void` | Call ended callback |
| `onStateChange(fn)` | `void` | Phase transition callback |
| `onVideoState(fn)` | `void` | Video state change callback |

---

## CallSession

Internal session object tracking call state.

| Property | Type | Description |
|----------|------|-------------|
| `callID` | `string` | Call identifier |
| `peerJID` | `string` | Peer JID |
| `callCreator` | `string` | Creator JID |
| `direction` | `symbol` | `CallDirection.Incoming` or `Outgoing` |
| `isVideo` | `boolean` | Whether video is present |
| `phase_()` | `symbol` | Current phase (note the underscore — avoids conflict with `phase` property) |
| `isActive()` | `boolean` | `true` if phase is Active |
| `isEnded()` | `boolean` | `true` if phase is Ended |
| `description()` | `string` | Human-readable description |
| `transitionTo(next)` | `boolean` | Attempt a phase transition |

---

## CallPhase

```js
CallPhase.Idle      // Outbound call created
CallPhase.Calling   // Offer sent
CallPhase.Ringing   // Remote ringing (inbound starts here)
CallPhase.Connecting // Call accepted
CallPhase.Active    // Media flowing
CallPhase.Ended     // Call finished
```

## CallDirection

```js
CallDirection.Outgoing
CallDirection.Incoming
```

---

## Player

```js
NewPlayer()
```

| Method | Description |
|--------|-------------|
| `play(source)` | Start playing a source |
| `pause()` | Pause playback |
| `resume()` | Resume playback |
| `stop()` | Stop and close source |
| `state()` | Current `PlayerState` |
| `onFinish(fn)` | Register finish callback |
| `nextFrame()` | Get next frame (internal) |

## PlayerState

```js
PlayerState.Idle
PlayerState.Playing
PlayerState.Paused
```

---

## Audio

### Constants

| Name | Value | Description |
|------|-------|-------------|
| `SampleRate` | `16000` | Audio sample rate in Hz |
| `FrameSamples` | `960` | Samples per frame (60 ms) |

### Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `WAVFile(path)` | `Promise<AudioSource>` | Read a WAV file |
| `PCMStream(r)` | `AudioSource` | Read raw PCM from a stream |
| `SourceFunc(provider)` | `AudioSource` | Create source from callback |
| `SinkFunc(fn)` | `AudioSink` | Create sink from callback |

---

## Video

| Function | Returns | Description |
|----------|---------|-------------|
| `AnnexBRecorder(path)` | `Promise<VideoSink>` | Record H.264 to file |
| `VideoSinkFunc(fn)` | `VideoSink` | Create video sink from callback |

---

## CallRegistry

| Method | Returns | Description |
|--------|---------|-------------|
| `insert(session, call?)` | `boolean` | Register a call |
| `get(callID)` | `entry\|null` | Look up an entry |
| `has(callID)` | `boolean` | Check if call exists |
| `list()` | `(Call\|CallSession)[]` | List all calls |
| `remove(callID)` | `boolean` | Remove and abort a call |
| `abortAll()` | `number` | Remove all calls, returns count |
| `activeCount()` | `number` | Number of active calls |
| `phase(callID)` | `[symbol, boolean]` | Get call phase |
| `transition(callID, next)` | `boolean` | Transition a call |
| `snapshot(callID)` | `[obj, boolean]` | Get session snapshot |
| `setMediaTask(callID, cancel)` | `void` | Set media abort function |

---

## Configuration

| Function | Description |
|----------|-------------|
| `WithLogger(logger)` | Set a pino-compatible logger |
| `WithDiagnostics(rec)` | Set a `Recorder` for call diagnostics |

---

## Codec

```js
AudioCodec.Mlow  // WhatsApp's MLow codec (default)
AudioCodec.Opus  // Opus codec (alternative)
```

```js
selectAudioCodec(vs) // Returns AudioCodec.Mlow or AudioCodec.Opus
```
