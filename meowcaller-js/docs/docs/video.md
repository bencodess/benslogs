# Video

meowcaller-js supports H.264 video in Annex B format. Video support is less mature than audio — signaling works but the media send path is not fully wired.

## Sending video

### `call.sendVideo(accessUnit)`

Send an H.264 access unit (one or more NAL units in Annex B format) to the remote peer.

| Parameter | Type | Description |
|-----------|------|-------------|
| `accessUnit` | `Uint8Array` | H.264 Annex B data |

```js
// Send a raw H.264 frame
call.sendVideo(h264Frame);
```

**Note:** The video send pipeline is not yet initialized in the media layer. This method will throw until video TX support is added.

## Receiving video

### `call.receiveVideo(sink)`

Set a sink to receive incoming video frames.

```js
import { VideoSinkFunc } from 'meowcaller-js';

call.receiveVideo(VideoSinkFunc((au) => {
  // au: Uint8Array containing H.264 Annex B data
  console.log('video frame:', au.length, 'bytes');
}));
```

## Video sink adapters

### `VideoSinkFunc(fn)`

Create a video sink from a callback.

```js
import { VideoSinkFunc } from 'meowcaller-js';

const sink = VideoSinkFunc((au) => {
  // au is a Uint8Array with H.264 Annex B data
  processFrame(au);
});

call.receiveVideo(sink);
```

### `AnnexBRecorder(path)`

Record incoming H.264 video to a `.h264` file in Annex B format. The file can be played with ffplay or muxed with ffmpeg.

```js
import { AnnexBRecorder } from 'meowcaller-js';

const recorder = await AnnexBRecorder('output.h264');
call.receiveVideo(recorder);

// When the call ends:
await recorder.close();
```

The recorder returns an object with:

| Method | Description |
|--------|-------------|
| `recorder.writeVideo(au)` | Write an Annex B access unit |
| `recorder.close()` | Close the file |

## H.264 depacketizer

The `H264Depacketizer` class parses Annex B byte streams into individual NAL units.

```js
import { H264Depacketizer } from 'meowcaller-js/src/rtp.js';

const depacketizer = new H264Depacketizer();
const nalus = depacketizer.Depacketize(annexBData);

for (const nalu of nalus) {
  // each nalu is a Uint8Array containing one NAL unit (without start code)
  const naluType = nalu[0] & 0x1F;
  console.log('NALU type:', naluType);
}
```

## NAL unit types

| Type | Meaning |
|------|---------|
| 1 | Non-IDR slice (P-frame) |
| 5 | IDR slice (I-frame) |
| 6 | SEI |
| 7 | SPS |
| 8 | PPS |

## Video state events

```js
call.onVideoState((vs) => {
  console.log('video active:', vs.Active);
  console.log('upgrade requested:', vs.Upgrade);
});
```

## Limitations

- Video TX is not wired up in the media pipeline — `sendVideo` will throw
- No VP8/VP9 support, only H.264
- No simulcast or SVC
- The depacketizer handles single NALU and FU-A fragmentation only
