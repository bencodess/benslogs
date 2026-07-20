# Quick Start

## Receiving a call

```js
import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Client } from 'meowcaller-js';
import pino from 'pino';

const logger = pino({ level: 'info' });
const { state, saveCreds } = await useMultiFileAuthState('auth_info');

const wa = makeWASocket({
  auth: state,
  logger,
  printQRInTerminal: true,
});

const client = new Client(wa, { logger });
client.connect();

client.onIncomingCall((call) => {
  console.log('call from', call.peer());

  call.onStateChange((phase) => console.log('state:', phase));
  call.onEnd((reason) => console.log('ended:', reason));

  call.answer();
});

wa.ev.on('creds.update', saveCreds);
```

## Placing an outbound call

```js
const call = await client.call({}, '+15551234567');

call.onReady(() => console.log('call connected'));
call.onEnd((reason) => console.log('ended:', reason));
```

## Playing audio into a call

```js
import { WAVFile } from 'meowcaller-js';

client.onIncomingCall(async (call) => {
  const audio = await WAVFile('greeting.wav');
  call.play(audio);
  call.answer();
});
```

## Receiving audio from a call

```js
import { SinkFunc } from 'meowcaller-js';

client.onIncomingCall((call) => {
  call.receive(SinkFunc((frame) => {
    // frame is a Float32Array of 960 samples at 16 kHz
    console.log('received', frame.length, 'samples');
  }));
  call.answer();
});
```

## Listing active calls

```js
const calls = client.listCalls();
console.log('active calls:', calls.length);
```

## Full example

See `example.js` in the repo root for a complete working example with reconnection logic.
