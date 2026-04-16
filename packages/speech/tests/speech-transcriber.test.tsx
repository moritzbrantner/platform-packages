import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { SpeechTranscriberPanel } from "@moritzbrantner/speech";

class MockTrack {
  stop = vi.fn();
}

class MockMediaStream {
  track = new MockTrack();

  getTracks() {
    return [this.track] as unknown as MediaStreamTrack[];
  }
}

class MockMediaRecorder {
  state: "inactive" | "paused" | "recording" = "inactive";
  mimeType = "audio/webm";
  private chunkCount = 0;
  private dataListeners = new Set<(event: Event & { data: Blob }) => void>();
  private stopListeners = new Set<() => void>();

  addEventListener(type: "dataavailable" | "stop", listener: ((event: Event & { data: Blob }) => void) | (() => void)) {
    if (type === "dataavailable") {
      this.dataListeners.add(listener as (event: Event & { data: Blob }) => void);
      return;
    }

    this.stopListeners.add(listener as () => void);
  }

  removeEventListener(type: "dataavailable" | "stop", listener: ((event: Event & { data: Blob }) => void) | (() => void)) {
    if (type === "dataavailable") {
      this.dataListeners.delete(listener as (event: Event & { data: Blob }) => void);
      return;
    }

    this.stopListeners.delete(listener as () => void);
  }

  requestData() {
    if (this.state !== "recording") {
      return;
    }

    const blob = new Blob([`chunk-${this.chunkCount}`], {
      type: this.mimeType,
    });
    this.chunkCount += 1;

    for (const listener of this.dataListeners) {
      listener({ data: blob } as Event & { data: Blob });
    }
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";

    for (const listener of this.stopListeners) {
      listener();
    }
  }
}

describe("@moritzbrantner/speech component", () => {
  test("records audio chunks, transcribes them, and lets the transcript be edited", async () => {
    const mediaStream = new MockMediaStream();
    let recorder: MockMediaRecorder | undefined;
    const transcriber = {
      transcribe: vi.fn(async ({ chunkIndex }: { chunkIndex?: number }) => {
        if (chunkIndex === 0) {
          return {
            text: "hello there",
          };
        }

        return {
          text: "there from speech",
        };
      }),
    };

    render(
      <SpeechTranscriberPanel
        transcriber={transcriber}
        timesliceMs={1000}
        mediaDevices={{
          getUserMedia: vi.fn(async () => mediaStream as unknown as MediaStream),
        }}
        mediaRecorderFactory={() => {
          recorder = new MockMediaRecorder();
          return recorder;
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start recording" }));

    await waitFor(() => {
      expect(screen.getByText("Recording")).toBeTruthy();
    });

    recorder?.requestData();

    await waitFor(() => {
      expect(screen.getByDisplayValue("hello there")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Stop recording" }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("hello there from speech")).toBeTruthy();
    });

    const textarea = screen.getByLabelText("Transcript");
    fireEvent.change(textarea, {
      target: {
        value: "hello there from speech and prediction",
      },
    });

    expect(screen.getByDisplayValue("hello there from speech and prediction")).toBeTruthy();
    expect(transcriber.transcribe).toHaveBeenCalledTimes(2);
    expect(mediaStream.track.stop).toHaveBeenCalledTimes(1);
  });
});
