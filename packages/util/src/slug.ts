import { randomBytes } from "crypto"

/**
 * Generate a cryptographically secure random index.
 * Uses crypto.randomBytes instead of Math.random() for better randomness.
 */
function secureRandomIndex(max: number): number {
  // Generate a random byte and scale it to the range [0, max)
  const byte = randomBytes(1)[0]
  return Math.floor((byte / 256) * max)
}

export namespace Slug {
  const ADJECTIVES = [
    "brave",
    "calm",
    "clever",
    "cosmic",
    "crisp",
    "curious",
    "eager",
    "gentle",
    "glowing",
    "happy",
    "hidden",
    "jolly",
    "kind",
    "lucky",
    "mighty",
    "misty",
    "neon",
    "nimble",
    "playful",
    "proud",
    "quick",
    "quiet",
    "shiny",
    "silent",
    "stellar",
    "sunny",
    "swift",
    "tidy",
    "witty",
  ] as const

  const NOUNS = [
    "cabin",
    "cactus",
    "canyon",
    "circuit",
    "comet",
    "eagle",
    "engine",
    "falcon",
    "forest",
    "garden",
    "harbor",
    "island",
    "knight",
    "lagoon",
    "meadow",
    "moon",
    "mountain",
    "nebula",
    "orchid",
    "otter",
    "panda",
    "pixel",
    "planet",
    "river",
    "rocket",
    "sailor",
    "squid",
    "star",
    "tiger",
    "wizard",
    "wolf",
  ] as const

  export function create() {
    return [
      // Security: Use cryptographically secure random instead of Math.random()
      ADJECTIVES[secureRandomIndex(ADJECTIVES.length)],
      NOUNS[secureRandomIndex(NOUNS.length)],
    ].join("-")
  }
}
