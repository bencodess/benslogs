# Examples

## Basic call receiving

```js
import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Client, SinkFunc, SourceFunc } from 'meowcaller-js';

const { state } = await useMultiFileAuthState('auth');
const wa = makeWASocket({ auth: state, printQRInTerminal: true });

const client = new Client(wa);
client.connect();

client.onIncomingCall(async (call) => {
  console.log('Incoming:', call.peer());

  call.receive(SinkFunc((frame) => {
    // frame is a Float32Array of 960 samples at 16kHz
  }));

  // Play silence so the other side hears something
  call.play(SourceFunc(async () => new Float32Array(960)));

  await call.answer();
});
```

## Placing a call and playing a WAV file

```js
import { Client, WAVFile } from 'meowcaller-js';

const client = new Client(wa);
client.connect();

const call = await client.call({}, '+15551234567');

call.onReady(async () => {
  console.log('Call is active');
  const audio = await WAVFile('greeting.wav');
  call.play(audio);
});

call.onEnd((reason) => {
  console.log('Call ended:', reason);
});
```

## Recording incoming audio to WAV

This example pipes incoming frames into a custom sink. Since `SinkFunc` only provides a callback, you would accumulate frames and write them out manually:

```js
import { SinkFunc } from 'meowcaller-js';
import { writeFileSync } from 'node:fs';

const frames = [];

call.receive(SinkFunc((frame) => {
  frames.push(new Int16Array(frame.map((s) => Math.round(s * 32767))));
}));

call.onEnd(() => {
  // Write raw s16le PCM
  const total = frames.reduce((n, f) => n + f.length, 0);
  const buf = Buffer.alloc(total * 2);
  let offset = 0;
  for (const f of frames) {
    for (let i = 0; i < f.length; i++) {
      buf.writeInt16LE(f[i], offset);
      offset += 2;
    }
  }
  writeFileSync('recording.pcm', buf);
});
```

## Recording incoming video

```js
import { AnnexBRecorder } from 'meowcaller-js';

const recorder = await AnnexBRecorder('call.h264');
call.receiveVideo(recorder);

call.onEnd(async () => {
  await recorder.close();
  console.log('Video saved to call.h264');
});
```

## Logging with pino

```js
import pino from 'pino';
import { Client, WithLogger, WithDiagnostics, Recorder } from 'meowcaller-js';

const log = pino({ level: 'debug' });
const diag = new Recorder('diagnostics.jsonl');

const client = new Client(wa, [
  WithLogger(log),
  WithDiagnostics(diag),
]);
```

## Listing and managing calls

```js
const calls = client.listCalls();
console.log(`${calls.length} active call(s)`);

for (const c of calls) {
  // Call objects have .id() and .state() methods
  if (typeof c.id === 'function') console.log(c.id(), c.state());
}

// Look up by ID
const specific = client.getCall('ABCDEF0123456789');
if (specific) {
  console.log('Phase:', specific.state());
}
```
