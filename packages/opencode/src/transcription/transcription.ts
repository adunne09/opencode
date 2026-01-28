import os from "node:os"
import path from "node:path"
import fs from "node:fs/promises"
import z from "zod"

const Output = z
  .object({
    text: z.string(),
    confidence: z.number().optional(),
    durationSeconds: z.number().optional(),
    durationMs: z.number().optional(),
  })
  .passthrough()

export type Output = z.infer<typeof Output>

export type Result =
  | {
      ok: true
      data: Output
    }
  | {
      ok: false
      code: "missing_cli" | "failed" | "invalid_output" | "io"
      error: string
    }

export const Limits = {
  maxBytes: 25 * 1024 * 1024,
  windowMs: 60_000,
  maxRequests: 15,
} as const

const hits = new Map<string, number[]>()

export function rateLimited(ip: string) {
  const now = Date.now()
  const current = hits.get(ip) ?? []
  const next = current.filter((time) => now - time < Limits.windowMs)
  next.push(now)
  hits.set(ip, next)
  return next.length > Limits.maxRequests
}

export function normalize(input: unknown) {
  const parsed = Output.safeParse(input)
  if (!parsed.success) return undefined
  const data = parsed.data
  const durationMs = data.durationMs ?? (data.durationSeconds ? Math.round(data.durationSeconds * 1000) : undefined)
  return {
    text: data.text,
    confidence: data.confidence,
    durationMs,
  }
}

const readStream = async (stream: ReadableStream<Uint8Array> | null) => {
  if (!stream) return ""
  return new Response(stream).text()
}

export async function transcribe(file: File): Promise<Result> {
  const bin = Bun.which("fluidaudio")
  if (!bin) return { ok: false, code: "missing_cli", error: "fluidaudio CLI not found" }

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-transcription-"))
  const audioPath = path.join(dir, "audio")
  const jsonPath = path.join(dir, "result.json")

  const write = await Bun.write(audioPath, file).catch((err) => err)
  if (write instanceof Error) {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
    return { ok: false, code: "io", error: write.message }
  }

  const proc = Bun.spawn([bin, "transcribe", audioPath, "--output-json", jsonPath], {
    stdout: "pipe",
    stderr: "pipe",
  })

  const [code, stdout, stderr] = await Promise.all([proc.exited, readStream(proc.stdout), readStream(proc.stderr)])
  const cleanup = fs.rm(dir, { recursive: true, force: true }).catch(() => {})

  if (code !== 0) {
    await cleanup
    const message = stderr.trim() || stdout.trim() || "Transcription failed"
    return { ok: false, code: "failed", error: message }
  }

  const raw = await Bun.file(jsonPath)
    .json()
    .catch(() => undefined)
  await cleanup
  const output = normalize(raw)
  if (!output) return { ok: false, code: "invalid_output", error: "Invalid transcription output" }
  return { ok: true, data: output }
}
