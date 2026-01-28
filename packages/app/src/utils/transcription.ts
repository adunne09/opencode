export function mergeTranscript(current: string, transcript: string) {
  const prefix = current.trim().length > 0 ? "\n" : ""
  return prefix + transcript
}
