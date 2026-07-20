# Client

The `Client` wraps a Baileys socket and provides the high-level call API.

```js
import { Client } from 'meowcaller-js';
```

## Constructor

```js
new Client(wa, opts?)
```

- `wa` — A connected `WASocket` from `@whiskeysockets/baileys`
- `opts` — A `ConfigOption` function, or an array of them. See [logging](#logging-options).

## Methods

### `client.connect()`

Installs call event handlers on the Baileys socket. Call this before the socket connects. Returns the client for chaining.

```js
const client = new Client(wa);
client.connect();
```

### `client.call(ctx, target)`

Place an outbound call.

- `ctx` — Context object (currently unused, pass `{}`)
- `target` — Phone number (e.g. `'+15551234567'`) or JID (e.g. `'15551234567@s.whatsapp.net'`)

Returns a `Promise<Call>`.

```js
const call = await client.call({}, '+15551234567');
```

### `client.onIncomingCall(fn)`

Register a callback for incoming calls. The callback receives a `Call` object.

```js
client.onIncomingCall((call) => {
  console.log('call from', call.peer());
  call.answer();
});
```

### `client.listCalls()`

Returns an array of all active `Call` or `CallSession` objects from the registry.

### `client.getCall(callID)`

Look up a specific call by its ID. Returns the `Call` or `CallSession`, or `null` if not found.

## Logging options

Pass configuration functions to the constructor:

```js
import { Client, WithLogger, WithDiagnostics } from 'meowcaller-js';

const client = new Client(wa, [
  WithLogger(myLogger),
  WithDiagnostics(myRecorder),
]);
```

- `WithLogger(logger)` — Attach a [pino](https://github.com/pinojs/pino)-compatible logger
- `WithDiagnostics(rec)` — Attach a `Recorder` for diagnostic event logging
