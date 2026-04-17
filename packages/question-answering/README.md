# @moritzbrantner/question-answering

Extractive question answering on top of a provider-agnostic inference contract.

## Main APIs

- `createQuestionAnsweringPipeline({ provider, model, chunking?, defaultLimit?, minimumScore? })`
- `pipeline.answer(question, context, { limit?, minScore?, chunking? })`
- `pipeline.answerMany(questions, context, options?)`
- `pipeline.findBestAnswer(question, context, options?)`

The default chunking path uses `@moritzbrantner/text-inference` so longer contexts can be fanned out across multiple model calls and ranked back into one answer list.
