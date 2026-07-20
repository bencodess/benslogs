# Call

A `Call` represents an active voice or video call. You get one from `client.call()` (outbound) or from the `onIncomingCall` callback (inbound).

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `call.id` | `string` | Unique call identifier (32-char hex) |
| `call.peer` | `string` | Peer's JID or phone number |

## Methods

### Identity

#### `call.id()`

Returns the call's unique ID.

#### `call.peer()`

Returns the peer's identifier (JID).

#### `call.state()`

Returns the current `CallPhase` symbol.

```js
if (call.state() === CallPhase.Active) {
  console.log('call is active');
}
```

#### `call.isVideo()`

Returns `true` if the call has video.

### Lifecycle

#### `call.answer()`

Answer an incoming call. Sends a preaccept and starts the media pipeline.

```js
client.onIncomingCall((call) => {
  call.answer();
});
```

#### `call.reject()`

Reject an incoming call. Sends a reject stanza and cleans up.

```js
client.onIncomingCall((call) => {
  call.reject();
});
```

#### `call.hangup()`

Hang up any active call (inbound or outbound). Sends a terminate stanza and cleans up.

```js
call.hangup();
```

### Audio

#### `call.play(source)`

Play audio into the call. Creates a new `Player`, subscribes it, and starts playback.

| Parameter | Type | Description |
|-----------|------|-------------|
| `source` | `AudioSource` | Audio source (WAVFile, PCMStream, SourceFunc) |

Returns the `Player` instance.

```js
import { WAVFile } from 'meowcaller-js';

const player = call.play(await WAVFile('music.wav'));
player.onFinish(() => console.log('done playing'));
```

#### `call.subscribe(player)`

Attach an existing `Player` to the call.

```js
import { NewPlayer, SourceFunc } from 'meowcaller-js';

const player = NewPlayer();
player.play(SourceFunc(async () => new Float32Array(960)));
call.subscribe(player);
```

#### `call.receive(sink)`

Set the audio sink for incoming audio. The sink's `writeFrame` is called with each decoded audio frame.

```js
import { SinkFunc } from 'meowcaller-js';

call.receive(SinkFunc((frame) => {
  // frame: Float32Array of 960 samples at 16 kHz
  processAudio(frame);
}));
```

### Video

#### `call.receiveVideo(sink)`

Set the video sink for incoming video.

```js
import { VideoSinkFunc } from 'meowcaller-js';

call.receiveVideo(VideoSinkFunc((au) => {
  // au: Uint8Array containing H.264 Annex B data
  processVideo(au);
}));
```

#### `call.sendVideo(accessUnit)`

Send a video frame (H.264 Annex B access unit).

| Parameter | Type | Description |
|-----------|------|-------------|
| `accessUnit` | `Uint8Array` | H.264 Annex B data |

```js
call.sendVideo(h264Frame);
```

**Note:** Video TX is not yet wired up in the media pipeline. This will throw until the video send path is implemented.

### Events

#### `call.onReady(fn)`

Fired when the first inbound RTP packet is decoded — the call is active and media is flowing.

```js
call.onReady(() => {
  console.log('media flowing');
});
```

#### `call.onEnd(fn)`

Fired when the call ends for any reason.

| Callback arg | Type | Description |
|--------------|------|-------------|
| `reason` | `string` | `'hangup'`, `'rejected'`, `'remote_ended'`, or `'server:<error>'` |

```js
call.onEnd((reason) => {
  console.log('call ended:', reason);
});
```

#### `call.onStateChange(fn)`

Fired on every phase transition.

| Callback arg | Type | Description |
|--------------|------|-------------|
| `phase` | `symbol` | The new `CallPhase` |

```js
import { CallPhase } from 'meowcaller-js';

call.onStateChange((phase) => {
  if (phase === CallPhase.Active) console.log('connected');
  if (phase === CallPhase.Ended) console.log('done');
});
```

#### `call.onVideoState(fn)`

Fired when video state changes.

```js
call.onVideoState((vs) => {
  console.log('video active:', vs.Active);
});
```

## Call phases

A call progresses through these states:

```
Idle → Calling → Ringing → Connecting → Active → Ended
```

| Phase | Description |
|-------|-------------|
| `CallPhase.Idle` | Outbound call created, not yet sent |
| `CallPhase.Calling` | Offer sent, waiting for response |
| `CallPhase.Ringing` | Remote phone ringing (inbound calls start here) |
| `CallPhase.Connecting` | Call accepted, media starting |
| `CallPhase.Active` | First RTP decoded, media flowing |
| `CallPhase.Ended` | Call finished (any reason) |

Invalid transitions are silently ignored and return `false`.
