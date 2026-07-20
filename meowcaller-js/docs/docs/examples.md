# Examples

## Receive a call and play audio

```js
import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Client, WAVFile, SinkFunc } from 'meowcaller-js';
import pino from 'pino';

const logger = pino({ level: 'info' });
const { state, saveCreds } = await useMultiFileAuthState('auth_info');

const wa = makeWASocket({ auth: state, logger, printQRInTerminal: true });
const client = new Client(wa, { logger });
client.connect();

client.onIncomingCall(async (call) => {
  logger.info('call from %s', call.peer());

  // play a greeting
  const audio = await WAVFile('greeting.wav');
  call.play(audio);

  // record incoming audio
  call.receive(SinkFunc((frame) => {
    logger.debug('audio frame: %d samples', frame.length);
  }));

  call.onEnd((reason) => logger.info('ended: %s', reason));
  call.answer();
});

wa.ev.on('creds.update', saveCreds);
```

## Place an outbound call

```js
const call = await client.call({}, '+15551234567');

call.onStateChange((phase) => logger.info('state: %s', phase));
call.onReady(() => logger.info('connected'));
call.onEnd((reason) => logger.info('ended: %s', reason));

// hang up after 30 seconds
setTimeout(() => call.hangup(), 30000);
```

## Generate a tone

```js
import { SourceFunc } from 'meowcaller-js';

let phase = 0;
const tone = SourceFunc(async () => {
  const frame = new Float32Array(960);
  for (let i = 0; i < 960; i++) {
    frame[i] = Math.sin(phase) * 0.3;
    phase += (2 * Math.PI * 440) / 16000;
  }
  return frame;
});

client.onIncomingCall((call) => {
  call.play(tone);
  call.answer();
});
```

## Record incoming video to file

```js
import { AnnexBRecorder } from 'meowcaller-js';

client.onIncomingCall(async (call) => {
  if (!call.isVideo()) {
    call.answer();
    return;
  }

  const recorder = await AnnexBRecorder('call.h264');
  call.receiveVideo(recorder);

  call.onEnd(async () => {
    await recorder.close();
    logger.info('video saved to call.h264');
  });

  call.answer();
});
```

## Pause and resume playback

```js
import { NewPlayer, SourceFunc } from 'meowcaller-js';

client.onIncomingCall((call) => {
  const player = NewPlayer();
  const source = SourceFunc(async () => new Float32Array(960));

  call.subscribe(player);
  player.play(source);

  // pause after 5 seconds
  setTimeout(() => {
    player.pause();
    logger.info('paused');
  }, 5000);

  // resume after 10 seconds
  setTimeout(() => {
    player.resume();
    logger.info('resumed');
  }, 10000);

  call.answer();
});
```

## Custom logger and diagnostics

```js
import { Client, WithLogger, WithDiagnostics } from 'meowcaller-js';
import { Recorder } from 'meowcaller-js/src/diag.js';
import pino from 'pino';

const logger = pino({ level: 'debug', name: 'voip' });
const recorder = new Recorder('calls.jsonl');

const client = new Client(wa, [
  WithLogger(logger),
  WithDiagnostics(recorder),
]);
```

## List active calls

```js
const calls = client.listCalls();
for (const c of calls) {
  console.log(`${c.id()} — ${c.state()}`);
}
```

## Reject all calls

```js
client.onIncomingCall((call) => {
  call.reject();
});
```
