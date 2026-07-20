You are building a WhatsApp bot using @whiskeysockets/baileys and meowcaller-js. meowcaller-js is a JavaScript port of meowcaller — a WhatsApp VoIP library. It lets you make and receive WhatsApp voice calls from Node.js.

## Setup

npm init -y
npm install meowcaller-js @whiskeysockets/baileys pino
npm install -D @types/node typescript

package.json must have "type": "module".
Requires Node.js 20+.

## Project Structure

```
bot/
  index.ts          # Entry point — Baileys socket + meowcaller Client
  config.ts         # Env vars, allowed numbers, bot name
  call-handler.ts   # Incoming call logic (answer, reject, play audio, record)
  audio/
    greeting.wav     # Played when a call is answered
    tone.wav         # Example audio asset
  tsconfig.json
```

## Core Imports

```ts
import { makeWASocket, useMultiFileAuthState, DisconnectReason, WASocket } from '@whiskeysockets/baileys';
import {
  Client,
  Call,
  CallPhase,
  NewPlayer, PlayerState,
  WAVFile, PCMStream, SinkFunc, SourceFunc,
  WithLogger, WithDiagnostics,
} from 'meowcaller-js';
import pino from 'pino';
```

## Bot Skeleton

```ts
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Client, WAVFile, SinkFunc, CallPhase } from 'meowcaller-js';
import pino from 'pino';

const logger = pino({ level: 'info' });

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const wa = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: true,
  });

  const client = new Client(wa, { logger });
  client.connect();

  client.onIncomingCall(async (call) => {
    logger.info('incoming call from %s', call.peer());

    call.onStateChange((phase) => logger.info('state: %s', phase));
    call.onEnd((reason) => logger.info('ended: %s', reason));

    // play greeting audio
    const audio = await WAVFile('audio/greeting.wav');
    call.play(audio);

    // record incoming audio
    call.receive(SinkFunc((frame) => {
      logger.debug('received %d samples', frame.length);
    }));

    call.answer();
  });

  wa.ev.on('creds.update', saveCreds);

  wa.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = (lastDisconnect?.error as any)?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        startBot(); // reconnect
      } else {
        logger.error('logged out');
      }
    }
  });
}

startBot();
```

## meowcaller-js API Reference

### Client

```ts
const client = new Client(wa, opts?);  // opts: WithLogger(pino()), WithDiagnostics(recorder)
client.connect();                        // returns this, installs call handlers
await client.call(ctx, target);          // outbound call, ctx = {} (reserved)
client.onIncomingCall(fn);               // fn receives Call object in Ringing phase
client.listCalls();                      // (Call|CallSession)[]
client.getCall(callID);                  // Call|CallSession|null
```

### Call

```ts
call.id();                    // string — 32-char hex
call.peer();                  // string — JID
call.state();                 // symbol — current CallPhase
call.isVideo();               // boolean

await call.answer();          // answer inbound (sends preaccept, starts media)
await call.reject();          // reject inbound
await call.hangup();          // hang up any call

const player = call.play(source);   // play audio, returns Player
call.subscribe(player);             // attach existing Player
call.receive(sink);                 // set incoming audio sink
call.receiveVideo(sink);            // set incoming video sink
call.sendVideo(au);                 // send H.264 Annex B (not yet wired)

call.onReady(fn);              // first RTP decoded
call.onEnd(fn);                // call ended — reason: 'hangup'|'rejected'|'remote_ended'|'server:<error>'
call.onStateChange(fn);        // phase transition
call.onVideoState(fn);         // video state change
```

### Call Phases

```
Idle → Calling → Ringing → Connecting → Active → Ended
```

### Audio (16 kHz mono float32, 960 samples per frame)

```ts
import { WAVFile, PCMStream, SourceFunc, SinkFunc, NewPlayer, PlayerState } from 'meowcaller-js';

// Play a WAV file
const source = await WAVFile('audio.wav');
call.play(source);

// Play raw PCM from a stream
import { createReadStream } from 'fs';
const source = PCMStream(createReadStream('raw.pcm'));
call.play(source);

// Generate audio programmatically (960 samples per frame)
let phase = 0;
const tone = SourceFunc(async () => {
  const frame = new Float32Array(960);
  for (let i = 0; i < 960; i++) {
    frame[i] = Math.sin(phase) * 0.3;
    phase += (2 * Math.PI * 440) / 16000;
  }
  return frame;
});
call.play(tone);

// Receive incoming audio
call.receive(SinkFunc((frame) => {
  // frame: Float32Array of 960 samples at 16 kHz
}));

// Manual player for pause/resume control
const player = NewPlayer();
call.subscribe(player);
player.play(source);
player.pause();
player.resume();
player.stop();
player.onFinish(() => {});
```

### Event Ordering

Inbound: onIncomingCall(call) → call.answer() → onStateChange(Connecting) → onReady() → onStateChange(Active) → onEnd(reason) → onStateChange(Ended)

Outbound: call() → onStateChange(Calling) → onStateChange(Ringing) → onStateChange(Connecting) → onReady() → onStateChange(Active) → onEnd(reason) → onStateChange(Ended)

## Important Notes

- Only one onIncomingCall handler can be active at a time
- The MLow codec is a passthrough stub — raw PCM is sent until a WASM port is available
- Video TX (sendVideo) is not yet wired up and will throw
- DTLS transport is bypassed — communicates directly via STUN + SRTP over UDP
- Signal Protocol encryption is simplified — call key passed in plaintext (TODO)
- Call target accepts +15551234567 format or full JID (15551234567@s.whatsapp.net)

## What to Build

Create a complete WhatsApp bot in TypeScript at bot/ that:
1. Connects to WhatsApp via Baileys (QR code auth)
2. Handles incoming calls — answer, play greeting.wav, record incoming audio
3. Can place outbound calls via a chat command or API
4. Logs all call events (state changes, end reasons)
5. Handles reconnection on disconnect
6. Uses proper TypeScript types throughout
7. Has a config.ts for environment variables (phone numbers, audio paths, log level)
8. Includes proper error handling and cleanup on shutdown