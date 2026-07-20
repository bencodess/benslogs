# Installation

```sh
npm install meowcaller-js
```

## Native dependency

`meowcaller-js` depends on [`node-datachannel`](https://github.com/murat-dogan/node-datachannel), which is a native C++ addon wrapping [libdatachannel](https://github.com/paullouisageneau/libdatachannel). It provides the DTLS, SCTP, and WebRTC DataChannel transport used to connect to WhatsApp's relay servers.

If `node-datachannel` fails to compile, ensure you have:

- A C++17 compiler (GCC 7+, Clang 5+, MSVC 2017+)
- CMake 3.12+
- Python 3 (for node-gyp)

On Debian/Ubuntu:

```sh
sudo apt install build-essential cmake g++ python3
```

On macOS:

```sh
xcode-select --install
brew install cmake
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@whiskeysockets/baileys` | WhatsApp Web socket protocol |
| `node-datachannel` | DTLS/SCTP/DataChannel (native) |
| `pino` | Structured logging |
| `protobufjs` | Protocol buffer encoding |

## TypeScript

TypeScript declarations are included at `types/index.d.ts`. No separate `@types` package is needed.

## Verify installation

```sh
node -e "import('meowcaller-js').then(m => console.log(Object.keys(m)))"
```

You should see the exported classes and functions listed.
