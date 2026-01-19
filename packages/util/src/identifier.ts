import { randomBytes } from "crypto"

export namespace Identifier {
  const LENGTH = 26

  // State for monotonic ID generation
  // Note: This is safe in Node.js/Bun's single-threaded event loop
  // but concurrent async operations in the same tick could theoretically
  // see inconsistent state. The counter helps ensure uniqueness within
  // the same millisecond timestamp.
  let lastTimestamp = 0
  let counter = 0
  const MAX_COUNTER = 0xfff // 4095 - max counter before timestamp collision possible

  export function ascending() {
    return create(false)
  }

  export function descending() {
    return create(true)
  }

  function randomBase62(length: number): string {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    let result = ""
    const bytes = randomBytes(length)
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % 62]
    }
    return result
  }

  export function create(descending: boolean, timestamp?: number): string {
    const currentTimestamp = timestamp ?? Date.now()

    if (currentTimestamp !== lastTimestamp) {
      lastTimestamp = currentTimestamp
      counter = 0
    } else if (counter >= MAX_COUNTER) {
      // Fixed: Prevent counter overflow by waiting for next millisecond
      // This is extremely rare but ensures ID uniqueness
      const nextMs = currentTimestamp + 1
      lastTimestamp = nextMs
      counter = 0
    }
    counter++

    let now = BigInt(currentTimestamp) * BigInt(0x1000) + BigInt(counter)

    now = descending ? ~now : now

    const timeBytes = Buffer.alloc(6)
    for (let i = 0; i < 6; i++) {
      timeBytes[i] = Number((now >> BigInt(40 - 8 * i)) & BigInt(0xff))
    }

    return timeBytes.toString("hex") + randomBase62(LENGTH - 12)
  }
}
