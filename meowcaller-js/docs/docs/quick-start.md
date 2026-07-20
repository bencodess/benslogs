# Quick Start

## Receiving a call

```js
import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Client, SinkFunc, SourceFunc } from 'meowcaller-js';

const { state, saveCreds } = await useMultiFileAuthState('auth_info');
const wa = makeWASocket({ auth: state, printQRInTerminal: true });

const client = new Client(wa);
client.connect();

client.onIncomingCall((call) => {
  console.log('Incoming call from', call.peer());

  call.onStateChange((phase) => console.log('state:', phase));
  call.onEnd((reason) => console.log('ended:', reason));

  // Receive incoming audio frames
  call.receive(SinkFunc((frame) => {
    console.log('audio frame:', frame.length, 'samples');
  }));

  // Play silence (or pipe a real source)
  call.play(SourceFunc(async () => null));

  // Accept the call
  call.answer();
});
```

## Placing an outbound call

```js
const call = await client.call({}, '+15551234567');

call.onReady(() => console.log('call is active'));
call.onEnd((reason) => console.log('call ended:', reason));

// Play audio from a WAV file
const { WAVFile } = await import('meowcaller-js');
const source = await WAVFile('greeting.wav');
call.play(source);
```

## Listing active calls

```js
const calls = client.listCalls();
console.log('active calls:', calls.length);

const one = client.getCall(someCallID);
if (one) console.log('state:', one.state());
```

## Using a logger

```js
import { Client, WithLogger } from 'meowcaller-js';
import pino from 'pino';

const log = pino({ level: 'debug' });
const client = new Client(wa, WithLogger(log));
```

## Using diagnostics recording

```js
import { Client, WithDiagnostics, Recorder } from 'meowcaller-js';

const rec = new Recorder('calls.jsonl');
const client = new Client(wa, WithDiagnostics(rec));
```
