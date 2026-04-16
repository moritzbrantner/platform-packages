#!/usr/bin/env python3
"""Reference websocket server for a local faster-whisper installation.

Protocol:
  client -> server: {"type":"start","model":"large-v3","language":"en","prompt":"..."}
  client -> server: {"type":"audio_chunk","audio":"<base64>","mimeType":"audio/webm",...}
  client -> server: {"type":"stop"}

  server -> client: {"text":"...","isFinal":true,"language":"en","segments":[...]}

Dependencies:
  pip install faster-whisper websockets
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from faster_whisper import WhisperModel
from websockets.asyncio.server import serve
from websockets.exceptions import ConnectionClosed


HOST = os.getenv("SPEECH_SERVER_HOST", "127.0.0.1")
PORT = int(os.getenv("SPEECH_SERVER_PORT", "8787"))
DEFAULT_MODEL = os.getenv("WHISPER_MODEL", "base")
DEVICE = os.getenv("WHISPER_DEVICE", "auto")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "default")
BEAM_SIZE = int(os.getenv("WHISPER_BEAM_SIZE", "1"))
VAD_FILTER = os.getenv("WHISPER_VAD_FILTER", "false").lower() in {"1", "true", "yes", "on"}


@dataclass
class SessionState:
    language: str | None = None
    model: str | None = None
    prompt: str | None = None


MODEL_CACHE: dict[str, WhisperModel] = {}


async def main() -> None:
    async with serve(handle_connection, HOST, PORT, max_size=None):
        print(f"Local Whisper websocket server listening on ws://{HOST}:{PORT}")
        await asyncio.Future()


async def handle_connection(websocket) -> None:
    state = SessionState()

    try:
        async for raw_message in websocket:
            message = parse_message(raw_message)
            message_type = message.get("type")

            if message_type == "start":
                state.language = as_optional_str(message.get("language"))
                state.model = as_optional_str(message.get("model"))
                state.prompt = as_optional_str(message.get("prompt"))
                await websocket.send(
                    json.dumps(
                        {
                            "type": "ready",
                            "model": state.model or DEFAULT_MODEL,
                            "language": state.language,
                        }
                    )
                )
                continue

            if message_type == "stop":
                await websocket.send(json.dumps({"type": "stopped"}))
                await websocket.close()
                return

            if message_type != "audio_chunk":
                raise ValueError(f"Unsupported message type: {message_type}")

            result = await transcribe_chunk(message, state)
            await websocket.send(json.dumps(result))
    except ConnectionClosed:
        return


async def transcribe_chunk(message: dict[str, Any], state: SessionState) -> dict[str, Any]:
    audio_base64 = message.get("audio")
    if not isinstance(audio_base64, str) or not audio_base64:
        raise ValueError("audio_chunk message must include a base64 'audio' field.")

    mime_type = as_optional_str(message.get("mimeType")) or "audio/webm"
    suffix = f".{extension_from_mime_type(mime_type)}"
    audio_bytes = base64.b64decode(audio_base64)
    model_name = as_optional_str(message.get("model")) or state.model or DEFAULT_MODEL
    language = as_optional_str(message.get("language")) or state.language
    prompt = as_optional_str(message.get("prompt")) or state.prompt
    chunk_index = int(message.get("chunkIndex", 0) or 0)
    started_at_ms = int(message.get("startedAt", 0) or 0)
    ended_at_ms = int(message.get("endedAt", started_at_ms) or started_at_ms)

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
        temp_file.write(audio_bytes)
        temp_path = Path(temp_file.name)

    try:
        result = await asyncio.to_thread(
            run_transcription,
            temp_path,
            model_name,
            language,
            prompt,
            chunk_index,
            started_at_ms,
            ended_at_ms,
        )
    finally:
        temp_path.unlink(missing_ok=True)

    return result


def run_transcription(
    audio_path: Path,
    model_name: str,
    language: str | None,
    prompt: str | None,
    chunk_index: int,
    started_at_ms: int,
    ended_at_ms: int,
) -> dict[str, Any]:
    model = get_model(model_name)
    segments, info = model.transcribe(
        str(audio_path),
        language=language,
        initial_prompt=prompt,
        beam_size=BEAM_SIZE,
        vad_filter=VAD_FILTER,
    )

    normalized_segments: list[dict[str, Any]] = []
    text_parts: list[str] = []

    for segment_number, segment in enumerate(segments):
        text = segment.text.strip()
        if not text:
            continue

        text_parts.append(text)
        normalized_segments.append(
            {
                "id": f"chunk-{chunk_index}-segment-{segment_number}",
                "text": text,
                "start": segment.start,
                "end": segment.end,
                "final": True,
            }
        )

    text = " ".join(text_parts).strip()
    if not normalized_segments and text:
        normalized_segments.append(
            {
                "id": f"chunk-{chunk_index}",
                "text": text,
                "start": started_at_ms / 1000,
                "end": ended_at_ms / 1000,
                "final": True,
            }
        )

    return {
        "text": text,
        "isFinal": True,
        "language": info.language or language,
        "segments": normalized_segments,
    }


def get_model(model_name: str) -> WhisperModel:
    model = MODEL_CACHE.get(model_name)
    if model is None:
        model = WhisperModel(model_name, device=DEVICE, compute_type=COMPUTE_TYPE)
        MODEL_CACHE[model_name] = model
    return model


def parse_message(raw_message: Any) -> dict[str, Any]:
    if isinstance(raw_message, bytes):
        text = raw_message.decode("utf-8")
    elif isinstance(raw_message, str):
        text = raw_message
    else:
        raise ValueError("Unsupported websocket frame type.")

    value = json.loads(text)
    if not isinstance(value, dict):
        raise ValueError("Websocket message must be a JSON object.")
    return value


def as_optional_str(value: Any) -> str | None:
    return value if isinstance(value, str) and value else None


def extension_from_mime_type(mime_type: str) -> str:
    extension = mime_type.split("/", 1)[1].strip() if "/" in mime_type else ""
    return extension or "webm"


if __name__ == "__main__":
    asyncio.run(main())
