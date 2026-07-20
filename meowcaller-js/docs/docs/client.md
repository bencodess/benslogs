# Client

The `Client` is the main entry point. It wraps a Baileys socket and manages call lifecycle.

```js
import { Client } from 'meowcaller-js';

const client = new Client(wa, { logger });
client.connect();
```

## Constructor

```js
new Client(wa, opts?)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `wa` | `WASocket` | A connected Baileys socket |
| `opts` | `ConfigOption \| ConfigOption[]` | Optional configuration (logger, diagnostics) |

The `opts` parameter accepts configuration functions:

```js
import { Client, WithLogger, WithDiagnostics } from 'meowcaller-js';
import { Recorder } from 'meowcaller-js/src/diag.js';

const client = new Client(wa, [
  WithLogger(pino({ level: 'debug' })),
  WithDiagnostics(new Recorder('calls.jsonl')),
]);
```

## Methods

### `client.connect()`

Installs call event handlers on the Baileys socket. Call this after the socket is created but before or after it connects — the handlers will fire when WhatsApp sends call events.

Returns `this` for chaining.

```js
client.connect();
// or
const self = client.connect();
```

### `client.call(ctx, target)`

Place an outbound voice call.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `any` | Context (reserved for future use, pass `{}`) |
| `target` | `string` | Phone number with `+` prefix or full JID |

Returns `Promise<Call>`.

```js
const call = await client.call({}, '+15551234567');
call.onEnd((reason) => console.log(reason));
```

The target is resolved to a WhatsApp JID internally:
- `+15551234567` → `15551234567@s.whatsapp.net`
- `15551234567@s.whatsapp.net` → used as-is

### `client.onIncomingCall(fn)`

Register a callback for incoming call offers.

```js
client.onIncomingCall((call) => {
  console.log('incoming call from', call.peer());
  call.answer();
});
```

Only one handler can be active at a time. Calling this again replaces the previous handler.

### `client.listCalls()`

Returns an array of all active `Call` or `CallSession` objects in the registry.

```js
const calls = client.listCalls();
for (const c of calls) {
  console.log(c.id(), c.state());
}
```

### `client.getCall(callID)`

Look up a specific call by its ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `callID` | `string` | The call ID |

Returns `Call`, `CallSession`, or `null`.

```js
const call = client.getCall('ABCDEF1234567890');
if (call) {
  console.log(call.state());
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `client.wa` | `WASocket` | The underlying Baileys socket |
| `client.log` | `Logger \| null` | Logger instance if configured |
| `client.registry` | `CallRegistry` | The call registry |
