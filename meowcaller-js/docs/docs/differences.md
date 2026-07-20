# Differences from meowcaller (Go)

meowcaller-js is a JavaScript port of [meowcaller](https://github.com/purpshell/meowcaller). Here are the key differences.

## Language and runtime

- **JavaScript (ES modules)** instead of Go
- **Async/await** instead of goroutines and channels
- **camelCase methods** on `Call`, `Client`, `CallRegistry` — helper functions retain PascalCase (e.g. `NewPlayer`, `WAVFile`, `ConnectRelayMedia`)
- Runs on Node.js 18+, no CGO required

## Architecture

- **Callback-based events** instead of Go channels — `onReady`, `onEnd`, `onStateChange` on each `Call` object
- **Call registry** — `CallRegistry` provides `list()`, `get()`, `remove()`, and `abortAll()` for managing active sessions
- **Source/sink adapters** — `AudioSource` and `AudioSink` interfaces with convenience constructors (`SinkFunc`, `SourceFunc`, `PCMStream`, `WAVFile`)

## Transport

- **DTLS relay via `node-datachannel`** — uses libdatachannel to establish DTLS → SCTP → DataChannel transport with WhatsApp's relay servers
- **Automatic fallback** — the engine tries DTLS first, then falls back to direct UDP if DTLS fails
- **No CGO** — `node-datachannel` is a prebuilt native addon, no manual C compilation needed

## Audio

- Audio is processed as `Float32Array` frames at 16 kHz mono, 960 samples per frame (60 ms)
- Built-in WAV file reader with automatic resampling and stereo downmix
- `PCMStream` adapter for raw s16le PCM streams
- `MP3File` and `OpusFile` are stubbed — use external decoders with `PCMStream`

## Video

- H.264 Annex B access units via `VideoSink` interface
- `AnnexBRecorder` writes raw H.264 to a file
- `VideoSinkFunc` for custom video processing callbacks

## Codec

- MLow codec is stubbed (needs WASM port)
- Opus codec is planned
- `selectAudioCodec()` helper for capability negotiation

## Not yet implemented

- Signal Protocol encryption for call keys (call keys are currently sent in plaintext)
- MLow codec WASM implementation
- Opus codec integration
