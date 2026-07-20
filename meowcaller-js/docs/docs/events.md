# Events

meowcaller-js uses callback registration rather than EventEmitter. Each `Call` object exposes these event hooks:

## `call.onStateChange(fn)`

Fires whenever the call phase changes. The callback receives the new `CallPhase` symbol.

```js
call.onStateChange((phase) => {
  if (phase === CallPhase.Active) console.log('call is live');
  if (phase === CallPhase.Ended) console.log('call ended');
});
```

Phase transitions follow a strict state machine:

```
Outgoing: Idle -> Calling -> Ringing -> Connecting -> Active -> Ended
Incoming: Ringing -> Connecting -> Active -> Ended
```

Any phase can transition to `Ended`.

## `call.onEnd(fn)`

Fires when the call terminates. The callback receives a reason string.

Possible reasons:

- `'hangup'` — local or remote hangup
- `'rejected'` — call was rejected
- `'remote_ended'` — remote party ended the call

Note: Baileys may also pass other reason strings from the terminate event. Treat `'remote_ended'` as the default fallback.

```js
call.onEnd((reason) => {
  console.log('call ended:', reason);
});
```

## `call.onReady(fn)`

Fires once — when the first inbound RTP packet is successfully decoded. This means audio is flowing in both directions.

```js
call.onReady(() => {
  console.log('media is flowing');
});
```

## `call.onVideoState(fn)`

Fires when video state changes. The callback receives a `VideoState` object with `Active` and `Upgrade` boolean fields.

Note: This callback is wired up on the `Call` class but is not currently invoked by the engine. Video state detection is not yet implemented.

## Baileys socket events

The `Client` internally listens on the Baileys `'call'` event for these event types:

- `offer` — incoming call offer
- `relaylatency` / `transport` — relay server information
- `terminate` — call termination

These are handled automatically by the engine. You do not need to listen for them directly.
