import { useState } from "react";

import {
  DEFAULT_WORD_PREDICTION_TEXTS,
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
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
  Label,
  Slider,
  Switch,
  Textarea,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type PresetKey = "chat" | "support" | "travel";

const presets: Record<
  PresetKey,
  {
    label: string;
    corpus: string;
    draft: string;
    messages: WordPredictionComposerMessage[];
  }
> = {
  chat: {
    label: "Chat replies",
    corpus: [
      "On my way now.",
      "On my way home.",
      "See you soon.",
      "See you tonight.",
      "Call me when you land.",
      "Text me when you get there.",
      "Sounds good to me.",
      "Sounds good, see you soon.",
      "I can do that now.",
      "I can do that tomorrow.",
    ].join("\n"),
    draft: "On my ",
    messages: [
      {
        id: "chat-1",
        role: "incoming",
        author: "Alex",
        text: "Can you text me when you get there?",
      },
      {
        id: "chat-2",
        role: "outgoing",
        author: "You",
        text: "Yes, I can do that.",
      },
      {
        id: "chat-3",
        role: "incoming",
        author: "Alex",
        text: "Perfect. When are you leaving?",
      },
    ],
  },
  support: {
    label: "Support responses",
    corpus: [
      "Thanks for reaching out.",
      "Thanks for the screenshot.",
      "Can you try again now?",
      "Can you restart the app?",
      "I am checking this now.",
      "I am checking with the team.",
      "We have shipped a fix.",
      "We have shipped a fix for this.",
      "Please send the link again.",
      "Please send the file again.",
    ].join("\n"),
    draft: "We have shi",
    messages: [
      {
        id: "support-1",
        role: "incoming",
        author: "Customer",
        text: "The upload still fails after refreshing.",
      },
      {
        id: "support-2",
        role: "outgoing",
        author: "You",
        text: "Thanks for the screenshot.",
      },
    ],
  },
  travel: {
    label: "Travel planning",
    corpus: [
      "We should book the early train.",
      "We should book the hotel tonight.",
      "Let us meet at the station.",
      "Let us leave after lunch.",
      "The weather looks clear tomorrow.",
      "The weather looks clear this weekend.",
      "I can bring snacks for the drive.",
      "I can bring coffee for the drive.",
    ].join("\n"),
    draft: "We should book ",
    messages: [
      {
        id: "travel-1",
        role: "incoming",
        author: "Sam",
        text: "Do you want to leave Friday night or Saturday morning?",
      },
      {
        id: "travel-2",
        role: "outgoing",
        author: "You",
        text: "Saturday morning is better for me.",
      },
    ],
  },
};

function splitCorpus(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function cloneMessages(messages: WordPredictionComposerMessage[]): WordPredictionComposerMessage[] {
  return messages.map((message) => ({ ...message }));
}

function WordPredictionPage() {
  const [activePreset, setActivePreset] = useState<PresetKey>("chat");
  const [corpus, setCorpus] = useState<string>(presets.chat.corpus);
  const [draft, setDraft] = useState<string>(presets.chat.draft);
  const [messages, setMessages] = useState<WordPredictionComposerMessage[]>(
    cloneMessages(presets.chat.messages),
  );
  const [includeDefaultData, setIncludeDefaultData] = useState(true);
  const [maxContextSize, setMaxContextSize] = useState(3);
  const [predictionLimit, setPredictionLimit] = useState(5);

  const model = createWordPredictionModel({
    includeDefaultData,
    texts: [...splitCorpus(corpus), ...messages.map((message) => message.text)],
    maxContextSize,
  });

  function applyPreset(presetKey: PresetKey) {
    const preset = presets[presetKey];
    setActivePreset(presetKey);
    setCorpus(preset.corpus);
    setDraft(preset.draft);
    setMessages(cloneMessages(preset.messages));
  }

  return (
    <PlaygroundPage
      activePage="word-prediction"
      title="Word prediction package examples"
      description="A chat-style predictive typing demo built from the package exports. Suggestions stay above the textbox, stay ranked by relevance, and can be accepted with Ctrl+1-9 while score and context details remain hidden until you enable them."
    >
      <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Prediction controls
            </Badge>
            <CardTitle>Train the composer</CardTitle>
            <CardDescription>
              Each non-empty line becomes another example phrase. The conversation on the right is
              also fed back into the model so the ranking adapts as you send messages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(presets) as Array<[PresetKey, (typeof presets)[PresetKey]]>).map(
                ([key, preset]) => (
                  <Button
                    key={key}
                    type="button"
                    size="sm"
                    variant={activePreset === key ? "default" : "outline"}
                    onClick={() => applyPreset(key)}
                  >
                    {preset.label}
                  </Button>
                ),
              )}
            </div>

            <Field
              orientation="horizontal"
              className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
            >
              <FieldContent>
                <FieldTitle>Use built-in default data</FieldTitle>
                <FieldDescription>
                  Starts from {DEFAULT_WORD_PREDICTION_TEXTS.length} seed phrases before applying
                  the preset corpus and live conversation.
                </FieldDescription>
              </FieldContent>
              <Switch checked={includeDefaultData} onCheckedChange={setIncludeDefaultData} />
            </Field>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="training-corpus">Training corpus</Label>
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {splitCorpus(corpus).length} examples
                </span>
              </div>
              <Textarea
                id="training-corpus"
                value={corpus}
                onChange={(event) => setCorpus(event.target.value)}
                className="min-h-72 rounded-[1.35rem]"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Context window</span>
                  <span className="text-muted-foreground">{maxContextSize} tokens</span>
                </div>
                <Slider
                  value={[maxContextSize]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={(value) => setMaxContextSize(value[0] ?? 3)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Suggestions shown</span>
                  <span className="text-muted-foreground">{predictionLimit}</span>
                </div>
                <Slider
                  value={[predictionLimit]}
                  min={3}
                  max={8}
                  step={1}
                  onValueChange={(value) => setPredictionLimit(value[0] ?? 5)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Chat-style composer</CardTitle>
              <CardDescription>
                Suggestions stay above the textbox, are clickable, and map directly to Ctrl+1-9. By
                default only the word is shown; the composer itself lets you reveal score and
                context when needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WordPredictionComposer
                model={model}
                value={draft}
                onValueChange={setDraft}
                messages={messages}
                limit={predictionLimit}
                placeholder="Type a reply and accept a suggestion with Ctrl+1"
                onSubmit={(message) => {
                  setMessages((current) => [
                    ...current,
                    {
                      id: `message-${current.length + 1}`,
                      role: "outgoing",
                      author: "You",
                      text: message,
                    },
                  ]);
                }}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Model snapshot</CardTitle>
              <CardDescription>
                Quick sanity checks while tuning the corpus and composer behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                vocabulary {model.vocabularySize}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                tokens {model.tokenCount}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                max context {model.maxContextSize}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                defaults {includeDefaultData ? "on" : "off"}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                live messages {messages.length}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                draft length {draft.trim().length}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<WordPredictionPage />);
