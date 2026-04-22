import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import {
  SpeedReadingView,
  countSpeedReadingWords,
  createSpeedReadingChunks,
} from "@moritzbrantner/speed-reading";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Progress,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";
import {
  extractTextFromPdf,
  type ExtractPdfTextResult,
  type PdfExtractionMode,
  type PdfExtractionProgress,
} from "./speed-reading-pdf";

const SAMPLE_TEXT = [
  "The station was still half asleep when Lea opened the bakery shutters.",
  "Steam drifted from the first trays of bread, and every few minutes another commuter stopped at the window, caught by the smell before the light had fully reached the street.",
  "By seven o'clock the square outside was all motion: bicycles rattling over cobblestones, voices bouncing under the awnings, and the newspaper stand calling out the day's headlines in a voice that somehow carried above everything else.",
].join(" ");

function SpeedReadingPlaygroundPage() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const deferredText = useDeferredValue(text);
  const [readerMode, setReaderMode] = useState<"text" | "pdf">("text");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfMode, setPdfMode] = useState<PdfExtractionMode>("ocr");
  const [extractionProgress, setExtractionProgress] = useState<PdfExtractionProgress | null>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractPdfTextResult | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [wordsPerMinute, setWordsPerMinute] = useState(360);
  const [chunkSize, setChunkSize] = useState(1);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const wordCount = useMemo(() => countSpeedReadingWords(deferredText), [deferredText]);
  const chunkCount = useMemo(
    () => createSpeedReadingChunks(deferredText, { chunkSize }).length,
    [chunkSize, deferredText],
  );
  const progressValue = chunkCount > 0 ? ((currentChunkIndex + 1) / chunkCount) * 100 : 0;

  useEffect(() => {
    setCurrentChunkIndex(0);
    setIsPlaying(false);
  }, [chunkSize, deferredText]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  async function handlePdfExtraction() {
    if (!pdfFile || isExtracting) {
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setExtractionError(null);
    setExtractionResult(null);
    setExtractionProgress({
      stage: "loading",
      pageIndex: 0,
      pageCount: 1,
      progress: 0,
      detail: "Preparing PDF extraction",
    });
    setIsExtracting(true);

    try {
      const result = await extractTextFromPdf(pdfFile, {
        mode: pdfMode,
        signal: controller.signal,
        onProgress: setExtractionProgress,
      });

      startTransition(() => {
        setText(result.text);
        setCurrentChunkIndex(0);
        setIsPlaying(false);
        setReaderMode("text");
        setExtractionResult(result);
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setExtractionError("PDF extraction cancelled.");
      } else {
        setExtractionError(error instanceof Error ? error.message : "PDF extraction failed.");
      }
    } finally {
      abortControllerRef.current = null;
      setIsExtracting(false);
    }
  }

  function handleCancelExtraction() {
    abortControllerRef.current?.abort();
  }

  return (
    <PlaygroundPage
      activePage="speed-reading"
      title="Speed reading package playground"
      description="An RSVP-style reader that accepts arbitrary pasted text or PDF uploads. The PDF path runs a browser OCR pass and removes common margin artifacts such as page numbers, repeated headers, and footer noise before feeding the speed reader."
    >
      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Source input
            </Badge>
            <CardTitle>Paste text or extract it from a PDF</CardTitle>
            <CardDescription>
              The text area is always editable. PDF extraction fills it with cleaned content so you
              can review or trim the OCR output before reading.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs
              value={readerMode}
              onValueChange={(value) => setReaderMode(value as "text" | "pdf")}
            >
              <TabsList variant="line">
                <TabsTrigger value="text">Paste text</TabsTrigger>
                <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-3">
                <Textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="min-h-[18rem] rounded-[1.5rem] bg-background/70 p-4 text-sm leading-7"
                  placeholder="Paste any passage here."
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => setText(SAMPLE_TEXT)}>
                    Load sample text
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setText("")}>
                    Clear
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="pdf" className="space-y-4">
                <div className="grid gap-3">
                  <label className="grid gap-2 text-sm text-muted-foreground">
                    <span>Select a PDF</span>
                    <Input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-muted-foreground">
                    <span>Extraction strategy</span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={pdfMode === "ocr" ? "default" : "outline"}
                        onClick={() => setPdfMode("ocr")}
                      >
                        OCR pass
                      </Button>
                      <Button
                        type="button"
                        variant={pdfMode === "smart" ? "default" : "outline"}
                        onClick={() => setPdfMode("smart")}
                      >
                        Smart hybrid
                      </Button>
                    </div>
                  </label>
                </div>

                <Alert className="rounded-[1.4rem] border-border/60">
                  <AlertTitle>OCR behavior</AlertTitle>
                  <AlertDescription>
                    <p>
                      <code>OCR pass</code> renders pages to images and runs Tesseract across them.{" "}
                      <code>Smart hybrid</code> keeps embedded PDF text when it is strong enough and
                      falls back to OCR for image-heavy pages.
                    </p>
                    <p>
                      Both modes filter margin artifacts so page numbers and repeated running
                      headers stay out of the reading stream.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handlePdfExtraction}
                    disabled={!pdfFile || isExtracting}
                  >
                    {isExtracting ? "Extracting..." : "Extract text from PDF"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelExtraction}
                    disabled={!isExtracting}
                  >
                    Cancel
                  </Button>
                </div>

                {pdfFile ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Selected file: <strong>{pdfFile.name}</strong>
                  </p>
                ) : null}

                {extractionProgress ? (
                  <Item variant="muted" className="block bg-background/65 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Badge variant="outline">{extractionProgress.stage}</Badge>
                      <span>
                        Page{" "}
                        {Math.min(extractionProgress.pageIndex + 1, extractionProgress.pageCount)}{" "}
                        of {extractionProgress.pageCount}
                      </span>
                    </div>
                    <Progress value={Math.max(4, extractionProgress.progress * 100)} />
                    <ItemDescription className="mt-3 line-clamp-none leading-6">
                      {extractionProgress.detail}
                    </ItemDescription>
                  </Item>
                ) : null}

                {extractionError ? (
                  <Alert variant="destructive" className="rounded-[1.4rem] border-border/60">
                    <AlertTitle>Extraction problem</AlertTitle>
                    <AlertDescription>{extractionError}</AlertDescription>
                  </Alert>
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Reader controls
              </Badge>
              <CardTitle>Run the speed reader against the current text</CardTitle>
              <CardDescription>
                Adjust pace and chunk size, then use play/pause and skip controls to inspect the
                package behavior over the extracted text.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Words per minute</span>
                    <strong>{wordsPerMinute}</strong>
                  </div>
                  <Slider
                    value={[wordsPerMinute]}
                    min={120}
                    max={900}
                    step={10}
                    onValueChange={(value) => setWordsPerMinute(value[0] ?? 360)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Words per chunk</span>
                    <strong>{chunkSize}</strong>
                  </div>
                  <Slider
                    value={[chunkSize]}
                    min={1}
                    max={4}
                    step={1}
                    onValueChange={(value) => setChunkSize(value[0] ?? 1)}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[auto_auto_auto_1fr]">
                <Button
                  type="button"
                  onClick={() => setIsPlaying((current) => !current)}
                  disabled={chunkCount === 0}
                >
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentChunkIndex((current) => Math.max(0, current - 10))}
                  disabled={chunkCount === 0}
                >
                  Back 10
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setCurrentChunkIndex((current) => Math.min(chunkCount - 1, current + 10))
                  }
                  disabled={chunkCount === 0}
                >
                  Forward 10
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentChunkIndex(0);
                    setIsPlaying(false);
                  }}
                  disabled={chunkCount === 0}
                >
                  Reset
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>
                    Chunk {chunkCount === 0 ? 0 : currentChunkIndex + 1} of {chunkCount}
                  </span>
                  <span>
                    {wordCount} words across {chunkCount} chunks
                  </span>
                </div>
                <Progress value={progressValue} />
              </div>

              <SpeedReadingView
                text={text}
                wordsPerMinute={wordsPerMinute}
                chunkSize={chunkSize}
                isPlaying={isPlaying}
                currentChunkIndex={currentChunkIndex}
                onPlayingChange={setIsPlaying}
                onCurrentChunkIndexChange={setCurrentChunkIndex}
                onComplete={() => setIsPlaying(false)}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Extraction report
              </Badge>
              <CardTitle>What the PDF pipeline kept and removed</CardTitle>
              <CardDescription>
                This section helps verify that OCR cleanup dropped obvious pagination artifacts
                before the text reached the reader.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {extractionResult ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Mode: {extractionResult.extractionMode}</Badge>
                    <Badge variant="outline">OCR pages: {extractionResult.ocrPageCount}</Badge>
                    <Badge variant="outline">
                      Text-layer pages: {extractionResult.textLayerPageCount}
                    </Badge>
                    <Badge variant="outline">
                      Removed artifacts: {extractionResult.removedBlocks.length}
                    </Badge>
                  </div>

                  <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
                    {extractionResult.removedBlocks.length > 0 ? (
                      extractionResult.removedBlocks.slice(0, 8).map((artifact, index) => (
                        <Item
                          key={`${artifact.pageIndex}-${artifact.reason}-${index}`}
                          variant="muted"
                          className="items-start bg-background/70 px-4 py-3"
                        >
                          <ItemContent>
                            <ItemTitle>
                              Page {artifact.pageIndex + 1} · {artifact.reason}
                            </ItemTitle>
                            <ItemDescription className="line-clamp-none">
                              {artifact.text}
                            </ItemDescription>
                          </ItemContent>
                        </Item>
                      ))
                    ) : (
                      <p>No removable page-number or repeated-margin artifacts were detected.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Upload a PDF and run extraction to inspect the cleanup report.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<SpeedReadingPlaygroundPage />);
