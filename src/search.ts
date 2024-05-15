import { redis, redisVectorStore } from "./redis-store";

async function search() {
  await redis.connect()

  const response = await redisVectorStore.similaritySearchWithScore(
    'What is Apache Beam ?',
    5
  )

  console.log(response)
  // quanto mais baixo o score, mais alta a possibilidade de responder a pergunta do usuario

  await redis.disconnect()
}

search()