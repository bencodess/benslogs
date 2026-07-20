# Differences from Go

meowcaller-js is a port of [meowcaller](https://github.com/purpshell/meowcaller) written in Go. Here are the key differences.

## Concurrency model

| Go | JavaScript |
|----|-----------|
| Goroutines (`go func()`) | `async`/`await` + `setInterval` |
| Channels (`chan`) | Callbacks + Promises |
| `context.Context` for cancellation | `AbortController` + `signal.aborted` |

In Go, the media send/receive loops run as goroutines communicating via channels. In JavaScript, they run as async intervals and while-loops with `AbortController` for cleanup.

## Error handling

| Go | JavaScript |
|----|-----------|
| Explicit `if err != nil` checks | `try`/`catch` blocks |
| Returned errors bubble up | Errors logged and swallowed in timers |

The Go version propagates errors up the call stack. The JavaScript version logs errors in interval timers (keepalive, send loop) since unhandled promise rejections in intervals crash the process.

## Naming conventions

| Go | JavaScript |
|----|-----------|
| `NewCallRegistry()` | `new CallRegistry()` |
| `Insert()` / `Get()` / `List()` | `insert()` / `get()` / `list()` |
| `CallPhase` (iota enum) | `CallPhase` (frozen Symbol enum) |
| `Mlow` (struct with methods) | `MlowEncoder` / `MlowDecoder` classes |

The JavaScript API uses camelCase for methods and lower-case class constructors where the Go version used PascalCase exported methods.

## Data types

| Go | JavaScript |
|----|-----------|
| `[]byte` | `Buffer` or `Uint8Array` |
| `int` | `number` (or `BigInt` for SRTP indices) |
| `map[string]interface{}` | Plain objects `{}` |
| `struct` | Classes or plain objects |
| `iota` enums | `Object.freeze(Symbol(...))` |

## Structural differences

### Call registry

Go uses a mutex-protected map. JavaScript uses a plain `Map` since Node.js is single-threaded — no mutex needed.

### Audio pipeline

Go uses the real MLow codec (pure Go implementation). JavaScript uses a passthrough stub that sends raw PCM bytes. A WASM port of the Go MLow codec is needed for real audio.

### DTLS transport

Go uses [pion/dtls](https://github.com/pion/dtls) for DTLS transport to WhatsApp's relay servers. JavaScript bypasses DTLS and communicates directly via STUN + SRTP over UDP. This may or may not work depending on the relay server's acceptance policies.

### Signal Protocol

Go uses [libsignal](https://github.com/nickvdyck/libsignal) for encrypting call keys via Signal sessions. JavaScript passes the call key in plaintext with a TODO comment. Production use requires implementing Signal session encryption.

### WebSocket serialization

Go's whatsmeow library sends raw binary nodes directly. JavaScript uses Baileys' `encodeBinaryNode()` to serialize stanzas into WhatsApp's custom binary format before sending over the Noise-encrypted WebSocket.

### Configuration

Go uses functional options (`WithLogger(logger)`). JavaScript copies this pattern — the same `WithLogger` / `WithDiagnostics` helpers exist.

## What's the same

- The call lifecycle state machine is identical
- STUN message format and construction
- SRTP key derivation (HMAC-SHA256 + HKDF)
- RTP header format and sequence tracking
- WAV file parsing and PCM conversion
- Call ID generation (random 16 bytes, hex-encoded)
- Relay endpoint selection logic
- Capability offer bytes

## Porting notes

If you're familiar with the Go version and want to understand the JavaScript equivalent:

| Go | JavaScript |
|----|-----------|
| `meowcaller.NewClient(wa)` | `new Client(wa)` |
| `client.Connect()` | `client.connect()` |
| `client.Call(ctx, target)` | `await client.call(ctx, target)` |
| `call.Answer()` | `await call.answer()` |
| `call.Reject()` | `await call.reject()` |
| `call.Hangup()` | `await call.hangup()` |
| `call.Play(src)` | `call.play(src)` |
| `call.Receive(sink)` | `call.receive(sink)` |
| `call.OnReady(fn)` | `call.onReady(fn)` |
| `call.OnEnd(fn)` | `call.onEnd(fn)` |
| `call.OnStateChange(fn)` | `call.onStateChange(fn)` |
| `registry.List()` | `client.listCalls()` |
| `registry.Get(id)` | `client.getCall(id)` |
