# Events

meowcaller-js uses callback-based events rather than EventEmitter. You register handlers on `Call` and `Client` objects.

## Client events

### `client.onIncomingCall(fn)`

Fired when a call offer arrives from WhatsApp.

```js
client.onIncomingCall((call) => {
  console.log('call from', call.peer());
  call.answer();
});
```

The callback receives a `Call` object already in the `Ringing` phase. A preaccept is sent automatically before the callback fires.

## Call events

### `call.onEnd(fn)`

Fired when the call ends. The reason string indicates why:

| Reason | Meaning |
|--------|---------|
| `'hangup'` | You or the remote party hung up |
| `'rejected'` | The remote party rejected the call |
| `'remote_ended'` | The remote party ended the call |
| `'server:<error>'` | WhatsApp server rejected the offer |

```js
call.onEnd((reason) => {
  if (reason === 'hangup') console.log('you hung up');
  else if (reason === 'rejected') console.log('call rejected');
  else console.log('ended:', reason);
});
```

### `call.onReady(fn)`

Fired when the first inbound RTP packet is successfully decoded. This means the media pipeline is working and audio is flowing.

```js
call.onReady(() => {
  console.log('call is active — audio flowing');
});
```

### `call.onStateChange(fn)`

Fired on every phase transition. The callback receives the new `CallPhase` symbol.

```js
import { CallPhase } from 'meowcaller-js';

call.onStateChange((phase) => {
  if (phase === CallPhase.Ringing) console.log('ringing...');
  if (phase === CallPhase.Active) console.log('connected');
  if (phase === CallPhase.Ended) console.log('finished');
});
```

### `call.onVideoState(fn)`

Fired when video state changes (e.g., video upgrade requested).

```js
call.onVideoState((vs) => {
  if (vs.Active) console.log('video is active');
  if (vs.Upgrade) console.log('video upgrade requested');
});
```

## Player events

### `player.onFinish(fn)`

Fired when the audio source reaches EOF or encounters an error.

```js
const player = call.play(source);
player.onFinish(() => {
  console.log('audio finished playing');
});
```

## Event ordering

For an outbound call, events fire in this order:

1. `onStateChange(Calling)` — offer sent
2. `onStateChange(Ringing)` — remote phone ringing
3. `onStateChange(Connecting)` — call answered
4. `onReady()` — first RTP decoded
5. `onStateChange(Active)` — same time as onReady
6. `onEnd(reason)` — call finished
7. `onStateChange(Ended)` — same time as onEnd

For an inbound call:

1. `onIncomingCall(call)` — offer received, already in Ringing phase
2. `call.answer()` → `onStateChange(Connecting)`
3. `onReady()` → `onStateChange(Active)`
4. `onEnd(reason)` → `onStateChange(Ended)`
