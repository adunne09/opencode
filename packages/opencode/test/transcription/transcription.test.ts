import { describe, expect, test } from "bun:test"
import { normalize } from "../../src/transcription"

describe("transcription.normalize", () => {
  test("maps duration seconds to milliseconds", () => {
    const output = normalize({ text: "hello", confidence: 0.9, durationSeconds: 1.5 })
    expect(output?.text).toBe("hello")
    expect(output?.confidence).toBe(0.9)
    expect(output?.durationMs).toBe(1500)
  })

  test("keeps explicit durationMs", () => {
    const output = normalize({ text: "hi", durationMs: 840 })
    expect(output?.durationMs).toBe(840)
  })
})
