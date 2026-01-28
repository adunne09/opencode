import { handleTranscriptionRequest } from "./handler"

const port = Number(process.env["OPENCODE_TRANSCRIPTION_PORT"] ?? 4950)

const withCors = (response: Response, origin: string) => {
  const headers = new Headers(response.headers)
  headers.set("Access-Control-Allow-Origin", origin)
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")
  headers.set("Access-Control-Allow-Headers", "Content-Type")
  return new Response(response.body, { status: response.status, headers })
}

const server = Bun.serve({
  port,
  fetch: async (request) => {
    const url = new URL(request.url)
    const origin = request.headers.get("origin") ?? "*"
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), origin)
    }
    if (request.method === "POST" && url.pathname === "/transcription") {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
      const response = await handleTranscriptionRequest(request, ip)
      return withCors(response, origin)
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return withCors(Response.json({ healthy: true }), origin)
    }

    return withCors(new Response("Not found", { status: 404 }), origin)
  },
})

console.log(`Transcription server running on http://localhost:${server.port}`)
