# Introduction

meowcaller-js is a JavaScript port of [meowcaller](https://github.com/purpshell/meowcaller) — a WhatsApp VoIP library built on top of [Baileys](https://github.com/WhiskeySockets/Baileys).

It lets you place and receive WhatsApp voice and video calls from Node.js using the WhatsApp Web protocol. No native bindings, no CGO, no WebRTC dependency — pure JavaScript.

## What it does

- **Call signaling** — offer, accept, reject, terminate, preaccept
- **Call lifecycle** — state machine tracking idle → calling → ringing → connecting → active → ended
- **Media pipeline** — STUN allocation, SRTP key derivation, RTP packetization
- **Audio adapters** — play PCM streams, WAV files, or custom frame generators into calls; receive audio via sinks
- **Video adapters** — send H.264 Annex B access units; record incoming video
- **Call registry** — track active calls, clean up media tasks on hangup

## What it doesn't do (yet)

- **MLow codec** — the encoder/decoder is a passthrough stub. Needs a WASM port from the Go original.
- **DTLS transport** — the relay layer currently communicates directly via STUN + SRTP over UDP. A proper DTLS layer needs a native addon or WebRTC bridge.
- **Signal Protocol encryption** — call key encryption is simplified. Production use requires encrypting via Signal sessions.

## Status

**Experimental.** Signaling is fully ported. Media relay works partially depending on WhatsApp's relay server acceptance policies. See the [implementation table](../README.md#implementation-status) for details.

## Requirements

- Node.js 20+
- A Baileys socket connected to WhatsApp
- `@whiskeysockets/baileys` ^7.0.0
