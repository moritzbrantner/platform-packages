# @moritzbrantner/syntax-analysis

Syntax analysis pipelines for POS tags, lemmas, and dependency arcs on top of `@moritzbrantner/text-inference` model providers.

## Main APIs

- `createSyntaxPipeline({ posTagger, lemmatizer?, dependencyParser?, chunking? })`
- `pipeline.analyzeSyntax(input)`
- `pipeline.analyzeSentenceSyntax(sentence)`
- `analyzeSyntax(input, options)`
- `summarizeSyntaxDocument({ sentenceCount, tokens, dependencyArcs })`

## Example

```ts
import { createSyntaxPipeline } from "@moritzbrantner/syntax-analysis";

const pipeline = createSyntaxPipeline({
  posTagger: {
    provider,
    model: {
      task: "token-classification",
      model: "vblagoje/bert-english-uncased-finetuned-pos",
    },
  },
  lemmatizer: {
    provider,
    model: {
      task: "token-classification",
      model: "your-org/lemma-tagger",
    },
  },
  dependencyParser: {
    provider,
    model: {
      task: "text-classification",
      model: "your-org/dependency-parser",
    },
  },
});

const syntax = await pipeline.analyzeSyntax("Clara migrated legacy services to Berlin.");

console.log(syntax.tokens.map((token) => ({ text: token.text, pos: token.posTag, lemma: token.lemma })));
console.log(syntax.dependencyArcs);
console.log(syntax.summary);
```
