import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { lazy } from "../../util/lazy"
import { handleTranscriptionRequest } from "../../transcription"

const getIP = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  if (forwarded) return forwarded
  const real = request.headers.get("x-real-ip")
  if (real) return real
  return "unknown"
}

export const TranscriptionRoutes = lazy(() =>
  new Hono().post(
    "/",
    describeRoute({
      summary: "Transcribe audio",
      description: "Transcribe an audio file using the configured server-side engine.",
      operationId: "transcription.create",
      responses: {
        200: { description: "Transcription result" },
        400: { description: "Invalid request" },
        413: { description: "Payload too large" },
        415: { description: "Unsupported media type" },
        429: { description: "Rate limited" },
        500: { description: "Transcription failed" },
        503: { description: "Transcription unavailable" },
      },
    }),
    async (c) => {
      const ip = getIP(c.req.raw)
      const response = await handleTranscriptionRequest(c.req.raw, ip)
      return response
    },
  ),
)
