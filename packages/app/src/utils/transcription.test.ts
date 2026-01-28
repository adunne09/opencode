import { describe, expect, test } from "bun:test"
import { mergeTranscript } from "./transcription"

describe("mergeTranscript", () => {
  test("adds newline when existing text is present", () => {
    const result = mergeTranscript("Hello", "World")
    expect(result).toBe("\nWorld")
  })

  test("returns transcript when input is empty", () => {
    const result = mergeTranscript("   ", "Hello")
    expect(result).toBe("Hello")
  })
})
