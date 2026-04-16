import { useState } from "react";

import {
  SpeechTranscriberPanel,
  createOpenAICompatibleTranscriber,
  transcriptToPhrases,
} from "@moritzbrantner/speech";
import {
  WordPredictionComposer,
  createWordPredictionModel,
  type WordPredictionComposerMessage,
} from "@moritzbrantner/word-prediction";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Slider,
  Switch,
  Textarea,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

const MOCK_TRANSCRIPTS = [
  "hello team this is the speech package demo",
  "hello team this is the speech package demo sending chunks to the transcription model",
  "hello team this is the speech package demo sending chunks to the transcription model so the word prediction composer learns from them",
] as const;

const initialMessages: WordPredictionComposerMessage[] = [
  {
    id: "speech-message-1",
    role: "incoming",
    author: "Assistant",
    text: "Record a short phrase, then start typing in the composer.",
  },
];

function splitCorpus(text: string): string[] {
  return text
    .split(/\n+/u)
    .map((value) => value.trim())
    .filter(Boolean);
}

function createMockTranscriber() {
  return {
    async transcribe({ chunkIndex = 0 }: { chunkIndex?: number }) {
      return {
        text: MOCK_TRANSCRIPTS[Math.min(chunkIndex, MOCK_TRANSCRIPTS.length - 1)] ?? "",
      };
    },
  };
}

function SpeechPage() {
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("whisper-1");
  const [language, setLanguage] = useState("en");
  const [timesliceMs, setTimesliceMs] = useState(1800);
  const [includeDefaultData, setIncludeDefaultData] = useState(true);
  const [seedCorpus, setSeedCorpus] = useState(
    [
      "Please send the transcript after the meeting.",
      "I will summarize the recording later tonight.",
      "Can you capture the next sentence as well?",
      "Let us review the notes after the call.",
    ].join("\n"),
  );
  const [draft, setDraft] = useState("I will ");
  const [messages, setMessages] = useState<WordPredictionComposerMessage[]>(initialMessages);
  const [transcript, setTranscript] = useState("");

  const transcriptPhrases = transcriptToPhrases(transcript);
  const activeTranscriber = endpoint.trim()
    ? createOpenAICompatibleTranscriber({
        endpoint: endpoint.trim(),
        model: modelName.trim() || "whisper-1",
        apiKey: apiKey.trim() || undefined,
      })
    : createMockTranscriber();
  const model = createWordPredictionModel({
    includeDefaultData,
    texts: [...splitCorpus(seedCorpus), ...transcriptPhrases, ...messages.map((message) => message.text)],
    maxContextSize: 3,
  });

  function submitDraft(value: string) {
    setMessages((current) => [
      ...current,
      {
        id: `speech-message-${current.length + 1}`,
        role: "outgoing",
        author: "You",
        text: value,
      },
    ]);
    setDraft("");
  }

  return (
    <PlaygroundPage
      activePage="speech"
      title="Speech transcription package examples"
      description="Capture microphone audio, chunk-upload it to a Whisper-compatible endpoint, and feed the returned transcript directly into the word prediction package. Without an endpoint, the page falls back to a mock transcriber so the integration path is still testable."
    >
      <section className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader className="space-y-4">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Transcription backend
            </Badge>
            <div className="space-y-2">
              <CardTitle>Configure the speech adapter</CardTitle>
              <CardDescription>
                Leave the endpoint empty to use a mock transcriber. Add your own HTTP
                endpoint to exercise a real Whisper or compatible speech-to-text model.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3">
              <Label htmlFor="speech-endpoint">Transcription endpoint</Label>
              <Input
                id="speech-endpoint"
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                placeholder="https://api.example.com/audio/transcriptions"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-3">
                <Label htmlFor="speech-model">Model name</Label>
                <Input
                  id="speech-model"
                  value={modelName}
                  onChange={(event) => setModelName(event.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="speech-language">Language</Label>
                <Input
                  id="speech-language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  placeholder="en"
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="speech-api-key">API key</Label>
              <Input
                id="speech-api-key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Optional bearer token"
              />
            </div>

            <div className="rounded-[1.35rem] border border-border/60 bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Include built-in word data</p>
                  <p className="text-sm text-muted-foreground">
                    Keeps the composer useful before your first transcript arrives.
                  </p>
                </div>
                <Switch checked={includeDefaultData} onCheckedChange={setIncludeDefaultData} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Chunk interval</span>
                <span className="text-muted-foreground">{timesliceMs} ms</span>
              </div>
              <Slider
                min={800}
                max={4000}
                step={200}
                value={[timesliceMs]}
                onValueChange={(value) => setTimesliceMs(value[0] ?? 1800)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="speech-seed-corpus">Seed corpus</Label>
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {splitCorpus(seedCorpus).length} phrases
                </span>
              </div>
              <Textarea
                id="speech-seed-corpus"
                value={seedCorpus}
                onChange={(event) => setSeedCorpus(event.target.value)}
                className="min-h-56 rounded-[1.35rem]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                Capture
              </Badge>
              <CardTitle>Record and transcribe</CardTitle>
              <CardDescription>
                {endpoint.trim()
                  ? "Audio chunks are posted to your endpoint as they are recorded."
                  : "Mock mode is active. The recorder still captures audio, but the transcriber returns scripted text so the pipeline can be exercised without a backend."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SpeechTranscriberPanel
                transcriber={activeTranscriber}
                language={language.trim() || undefined}
                timesliceMs={timesliceMs}
                helperText="Keep speaking while the component uploads rolling chunks. Edit the transcript if you need to correct model output before it is used elsewhere."
                onTranscriptChange={(value: string) => setTranscript(value)}
                textareaProps={{
                  placeholder: "Transcript will appear here.",
                }}
              />
            </CardContent>
          </Card>

          <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
              <CardHeader>
                <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                  Transcript corpus
                </Badge>
                <CardTitle>Speech data feeding the model</CardTitle>
                <CardDescription>
                  The transcript is segmented into phrases and added to the training data
                  for the word prediction composer on the right.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1.35rem] border border-border/60 bg-muted/30 px-4 py-3">
                  <p className="text-sm font-medium">Current mode</p>
                  <p className="text-sm text-muted-foreground">
                    {endpoint.trim()
                      ? `HTTP mode using ${modelName.trim() || "whisper-1"}`
                      : "Mock mode using scripted transcripts"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Transcript phrases</p>
                  <Textarea
                    value={transcriptPhrases.join("\n")}
                    readOnly
                    className="min-h-48 rounded-[1.35rem]"
                    placeholder="Record a phrase to populate the live corpus."
                  />
                </div>

                <Button type="button" variant="outline" onClick={() => setDraft(transcript ? `${transcript} ` : "I will ")}>
                  Copy transcript into the composer draft
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
              <CardHeader>
                <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                  Prediction
                </Badge>
                <CardTitle>Transcript-aware word prediction</CardTitle>
                <CardDescription>
                  Suggestions are trained from the seed phrases, the live transcript,
                  and the messages already sent in this demo conversation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WordPredictionComposer
                  model={model}
                  value={draft}
                  onValueChange={setDraft}
                  onSubmit={submitDraft}
                  messages={messages}
                  placeholder="Start typing after recording a phrase"
                />
              </CardContent>
            </Card>
          </section>
        </div>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<SpeechPage />);
