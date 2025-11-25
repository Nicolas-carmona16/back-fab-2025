import "dotenv/config"
import express from "express"
import cors from "cors"
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@as-integrations/express5"
import { env } from "./config/env"
import { typeDefs } from "./graphql/type-defs"
import { resolvers } from "./graphql/resolvers"
import { buildContext } from "./graphql/context"

async function bootstrap() {
  const app = express()
  app.use(cors())
  app.use(express.json())

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })
  await server.start()

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" })
  })

  app.use("/graphql", expressMiddleware(server, { context: buildContext }))

  app.listen(env.PORT, () => {
    console.log(`🚀 CourierSync GraphQL server running at http://localhost:${env.PORT}/graphql`)
  })
}

bootstrap().catch((err) => {
  console.error("Failed to start server", err)
  process.exit(1)
})

