# Curated language model verification

Consumer: native-whisperx#392. Package issue: #154.

The catalog adds French, Spanish and Dutch in both directions with English to the
existing German/English pairs. Actual public Hugging Face model metadata verified
Marian configuration and Q4 encoder/decoder assets before inclusion. The pinned
model revision is passed to Transformers.js and retained in result provenance.
No caller can substitute a mismatched pair model.

All six new directions ran through the actual public adapter in Chromium 1248,
Transformers.js 4.2.0 and real pinned ONNX Q4 models. WebGPU was enabled through
Chrome's SwiftShader adapter (vendor `google`, architecture `swiftshader`), so this
is actual software WebGPU execution, not physical GPU throughput evidence. Models
and runtime were downloaded by the real browser implementation. Segment ID 7 was
preserved in every result. Short development fixtures establish compatibility,
not broad translation quality.

| Direction | Input             | Observed output   | Pinned model                                                                                                                      |
| --------- | ----------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| fr → en   | Bonjour le monde. | Hello, the world. | [onnx-community/opus-mt-fr-en](https://huggingface.co/onnx-community/opus-mt-fr-en/tree/f7e3c392bacfe300a66b0ddbd20de1d2dfc3b77e) |
| en → fr   | Good morning.     | Bonjour.          | [onnx-community/opus-mt-en-fr](https://huggingface.co/onnx-community/opus-mt-en-fr/tree/060ab253b6aae185f277c1e048fb0cf61a02c6c0) |
| es → en   | Buenos días.      | Good morning.     | [onnx-community/opus-mt-es-en](https://huggingface.co/onnx-community/opus-mt-es-en/tree/0ca6ea53b39356aece8a15bd92eaf7bb40035ea6) |
| en → es   | Good morning.     | Buenos días.      | [onnx-community/opus-mt-en-es](https://huggingface.co/onnx-community/opus-mt-en-es/tree/b5eba94a023a1954c90401b43537f479f962981d) |
| nl → en   | Goedemorgen.      | Good morning.     | [onnx-community/opus-mt-nl-en](https://huggingface.co/onnx-community/opus-mt-nl-en/tree/2da2cd590ecd6ed7f46907df7fa01435aef5a8b9) |
| en → nl   | Good morning.     | Goedemorgen.      | [onnx-community/opus-mt-en-nl](https://huggingface.co/onnx-community/opus-mt-en-nl/tree/67fd5925ddb7382a131b7d3ee1a8cc1b1bd0cdf4) |

The public provider-boundary regression first failed because French → English was
unsupported. It now verifies every added direction, pinned model acquisition,
per-profile model reuse, result provenance and preserved segment identity. All
nine package tests, strict type checking, package lint and declaration build pass.
The browser package remains experimental; no version bump, changeset or package
publication is part of this source-first change.

Shared convention sourceRevision: `6cc05789dab39cee6758b288f83fb48b4ee6dbdb`.
