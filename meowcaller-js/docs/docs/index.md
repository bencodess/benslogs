# meowcaller-js

WhatsApp VoIP library for [Baileys](https://github.com/WhiskeySockets/Baileys). Provides call signaling, SRTP media relay, and audio/video adapters for Node.js.

**Version:** 0.2.0  
**License:** MIT

## What it does

- Place and receive WhatsApp voice and video calls
- DTLS relay transport via `node-datachannel` (libdatachannel), with automatic fallback to direct UDP
- Audio source/sink adapters for piping PCM, WAV, and custom frames
- Video sink for recording H.264 Annex B streams
- Call registry for inspecting and managing active sessions
- Full TypeScript type definitions included

## Implementation status

| Feature | Status |
|---------|--------|
| Outbound calls | Implemented |
| Inbound calls | Implemented |
| Audio calls | Signaling + media relay via DTLS/SCTP/DataChannel |
| Video calls | Signaling + depacketizer ported |
| DTLS relay | Implemented via `node-datachannel` |
| MLow codec | Stub — needs WASM port |
| Signal Protocol encryption | Not yet implemented |
| Opus codec | Planned |

## Requirements

- Node.js 18+
- A working [Baileys](https://github.com/WhiskeySockets/Baileys) socket connection
- `node-datachannel` — native dependency (C++ addon via libdatachannel)

## Tests

10 tests pass. Run with:

```sh
npm test
```

## Next

- [Installation](installation.md)
- [Quick Start](quick-start.md)
- [API Reference](api-reference.md)
