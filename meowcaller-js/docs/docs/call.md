# Call

The `Call` object represents an active voice or video call.

## Properties (accessor methods)

### `call.id()`

Returns the call ID string.

### `call.peer()`

Returns the peer's JID or phone number.

### `call.state()`

Returns the current `CallPhase` symbol:

| Symbol | Meaning |
|--------|---------|
| `CallPhase.Idle` | Not yet started |
| `CallPhase.Calling` | Outbound call sent, waiting for answer |
| `CallPhase.Ringing` | Incoming call, waiting for answer |
| `CallPhase.Connecting` | Call accepted, media establishing |
| `CallPhase.Active` | Call is live (first RTP decoded) |
| `CallPhase.Ended` | Call has ended |

### `call.isVideo()`

Returns `true` if this is a video call.

## Call control

### `call.answer()`

Accept an incoming call. Returns a `Promise`.

### `call.reject()`

Reject an incoming call. Returns a `Promise`.

### `call.hangup()`

End the call (either direction). Returns a `Promise`.

## Audio

### `call.subscribe(player)`

Attach a `Player` to the call. Each audio frame the player produces is sent to the remote peer.

### `call.play(source)`

Convenience method — creates a `NewPlayer`, subscribes it, and starts playing the given `AudioSource`. Returns the `Player`.

```js
const player = call.play(await WAVFile('music.wav'));
```

### `call.receive(sink)`

Set an `AudioSink` to receive incoming audio frames. Each frame is a `Float32Array` of 960 samples at 16 kHz.

```js
call.receive(SinkFunc((frame) => {
  // process PCM frame
}));
```

## Video

### `call.receiveVideo(sink)`

Set a `VideoSink` to receive incoming H.264 Annex B access units.

### `call.sendVideo(annexB)`

Send an H.264 Annex B access unit to the remote peer. The argument should be a `Uint8Array`.

## Event callbacks

### `call.onReady(fn)`

Called when the first inbound RTP packet is decoded — the call is fully active.

### `call.onEnd(fn)`

Called when the call ends. The callback receives a reason string (e.g. `'hangup'`, `'rejected'`, `'remote_ended'`).

### `call.onStateChange(fn)`

Called on every phase transition. The callback receives the new `CallPhase` symbol.

### `call.onVideoState(fn)`

Called when video state changes. The callback receives a `VideoState` object.
