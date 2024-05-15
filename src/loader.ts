import path from 'node:path'

import { DirectoryLoader } from "langchain/document_loaders/fs/directory"
import { CSVLoader } from "langchain/document_loaders/fs/csv"
import { TokenTextSplitter } from "langchain/text_splitter"
import { OpenAIEmbeddings } from "@langchain/openai";
import { RedisVectorStore } from "@langchain/redis";
// import { Document } from "@langchain/core/documents";

import { createClient } from 'redis'

const loader = new DirectoryLoader(
  path.resolve(__dirname, "../tmp"),
  {
    '.csv': path => new CSVLoader(path, "transcript")
  }
)

async function load() {
  const data = await loader.load()

  const splitter = new TokenTextSplitter({
    encodingName: 'cl100k_base', // algoritmo de calculo de tokens
    chunkSize: 600,
    chunkOverlap: 0, //não quero que o conteudo de um chunk apareça dentro de outro
  })

  const splittedDocs = await splitter.splitDocuments(data)

  const redis = createClient({
    url: 'redis://127.0.0.1:6379'
  })

  await redis.connect()

  await RedisVectorStore.fromDocuments(
    splittedDocs,
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
    {
      indexName: "lessons-embeddings", //forma de separar documentos
      redisClient: redis,
      keyPrefix: 'videos:'
    }
  )

  await redis.disconnect();
}

load()

// precisamos do redis-stack, ao inves do tradicional, pois essa versão vem com "redis search",
// enquanto a imagem original vem com uma versão mais pura
// docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest

// pnpm tsx src/gpt.ts
