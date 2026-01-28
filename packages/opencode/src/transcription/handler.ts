import { Limits, rateLimited, transcribe } from "./transcription"

const types = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
])

const pickFile = (form: FormData) => {
  const file = form.get("file") ?? form.get("audio")
  if (!file) return undefined
  if (file instanceof File) return file
  return undefined
}

export async function handleTranscriptionRequest(request: Request, ip: string) {
  if (rateLimited(ip)) {
    return Response.json({ message: "Rate limit exceeded" }, { status: 429 })
  }

  const form = await request.formData()
  const file = pickFile(form)
  if (!file) return Response.json({ message: "Missing audio file" }, { status: 400 })

  if (!types.has(file.type)) {
    return Response.json({ message: "Unsupported audio type" }, { status: 415 })
  }

  if (file.size > Limits.maxBytes) {
    return Response.json({ message: "Audio file too large" }, { status: 413 })
  }

  const result = await transcribe(file)
  if (!result.ok) {
    const status = result.code === "missing_cli" ? 503 : 500
    return Response.json({ message: result.error }, { status })
  }

  return Response.json(result.data)
}
