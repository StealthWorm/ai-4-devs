import { ChatOpenAI } from 'langchain/chat_models/openai'
import { PromptTemplate } from 'langchain/prompts'
import { RetrievalQAChain } from "langchain/chains";
import { redis, redisVectorStore } from "./redis-store";
// import { createRetrievalChain } from "langchain/chains/retrieval";
// import { MemoryVectorStore } from "langchain/vectorstores/memory";

const openAiChat = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-3.5-turbo',
  temperature: 0.3, // define a criatividade das respostas
})

const promptTemplate = new PromptTemplate({
  template: `
    You are responsible to answering questions related to technological area.
    The user is currently watching videos from different classes.
    Use the content of the transcriptions below to answer the user questions.
    If the answers are not found in the transcriptions, answer to the user that you don't know, do not generate random answers without context.
    
    When necessary, include code examples in Javascript.

    Transcriptions:
    {context}

    Question:
    {question}
  `.trim(),
  inputVariables: ['context', 'question'],
})

const chain = RetrievalQAChain.fromLLM(openAiChat, redisVectorStore.asRetriever(2), {
  prompt: promptTemplate,
  returnSourceDocuments: true,
  verbose: true,
})

async function main() {
  await redis.connect()

  const response = await chain.invoke(
    {
      query: 'What the classes explain about light on images ?'
    }
  )

  console.log({ response })

  await redis.disconnect()
}

main()