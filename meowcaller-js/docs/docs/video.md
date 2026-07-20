# Video

Video in meowcaller-js uses H.264 Annex B access units.

## Interfaces

### `VideoSink`

```ts
interface VideoSink {
  writeVideo(au: Uint8Array): Promise<void>;
  close(): Promise<void>;
}
```

A sink that receives decoded incoming video access units.

## Functions

### `VideoSinkFunc(fn)`

Create a `VideoSink` from a simple callback.

```js
import { VideoSinkFunc } from 'meowcaller-js';

call.receiveVideo(VideoSinkFunc((au) => {
  console.log('video access unit:', au.length, 'bytes');
}));
```

### `AnnexBRecorder(path)`

Create a `VideoSink` that writes raw H.264 Annex B data to a file. Returns a `Promise<VideoSink>`.

```js
const recorder = await AnnexBRecorder('call.h264');
call.receiveVideo(recorder);

// Later, when the call ends:
await recorder.close();
```

## Sending video

To send video to the remote peer, use `call.sendVideo(annexB)`. The argument should be a `Uint8Array` containing an H.264 Annex B access unit.

```js
call.sendVideo(h264AccessUnit);
```

Note: video sending requires an active video media pipeline, which is established when the call is a video call.
