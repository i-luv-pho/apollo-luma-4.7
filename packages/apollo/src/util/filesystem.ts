import { realpathSync } from "fs"
import { realpath } from "fs/promises"
import path, { dirname, join, relative } from "path"

export namespace Filesystem {
  export const exists = (p: string) =>
    Bun.file(p)
      .stat()
      .then(() => true)
      .catch(() => false)

  export const isDir = (p: string) =>
    Bun.file(p)
      .stat()
      .then((s) => s.isDirectory())
      .catch(() => false)
  /**
   * On Windows, normalize a path to its canonical casing using the filesystem.
   * This is needed because Windows paths are case-insensitive but LSP servers
   * may return paths with different casing than what we send them.
   */
  export function normalizePath(p: string): string {
    if (process.platform !== "win32") return p
    try {
      return realpathSync.native(p)
    } catch {
      return p
    }
  }

  /**
   * Check if two paths overlap (lexical only, does NOT resolve symlinks).
   * Use overlapsSecure() for security-sensitive checks.
   */
  export function overlaps(a: string, b: string) {
    const relA = relative(a, b)
    const relB = relative(b, a)
    // Fixed: Use AND (&&) not OR (||) - paths overlap if EITHER path contains the other
    return (!relA || !relA.startsWith("..")) || (!relB || !relB.startsWith(".."))
  }

  /**
   * Check if parent contains child (lexical only, does NOT resolve symlinks).
   * WARNING: This is vulnerable to symlink attacks. Use containsSecure() for security checks.
   */
  export function contains(parent: string, child: string) {
    return !relative(parent, child).startsWith("..")
  }

  /**
   * Securely check if parent contains child by resolving symlinks first.
   * This prevents symlink traversal attacks where a symlink inside the project
   * points to files outside the allowed boundary.
   *
   * @param parent - The allowed parent directory
   * @param child - The path to check
   * @returns true if child is within parent after resolving symlinks
   */
  export async function containsSecure(parent: string, child: string): Promise<boolean> {
    try {
      // Resolve both paths to their real locations (following symlinks)
      const realParent = await realpath(parent)
      const realChild = await realpath(child)

      // Check containment on resolved paths
      const rel = relative(realParent, realChild)
      // Fixed: Also check for Windows absolute paths (drive letters like C:)
      return !rel.startsWith("..") && !path.isAbsolute(rel)
    } catch {
      // If realpath fails (e.g., file doesn't exist yet), fall back to lexical check
      // but be more strict: reject if path contains suspicious patterns
      if (child.includes("..") || child.includes("./")) {
        return false
      }
      return !relative(parent, child).startsWith("..")
    }
  }

  /**
   * Synchronous version of containsSecure for cases where async is not possible.
   */
  export function containsSecureSync(parent: string, child: string): boolean {
    try {
      const realParent = realpathSync(parent)
      const realChild = realpathSync(child)
      const rel = relative(realParent, realChild)
      // Fixed: Also check for Windows absolute paths (drive letters like C:)
      return !rel.startsWith("..") && !path.isAbsolute(rel)
    } catch {
      if (child.includes("..") || child.includes("./")) {
        return false
      }
      return !relative(parent, child).startsWith("..")
    }
  }

  export async function findUp(target: string, start: string, stop?: string) {
    let current = start
    const result = []
    while (true) {
      const search = join(current, target)
      if (await exists(search)) result.push(search)
      if (stop === current) break
      const parent = dirname(current)
      if (parent === current) break
      current = parent
    }
    return result
  }

  export async function* up(options: { targets: string[]; start: string; stop?: string }) {
    const { targets, start, stop } = options
    let current = start
    while (true) {
      for (const target of targets) {
        const search = join(current, target)
        if (await exists(search)) yield search
      }
      if (stop === current) break
      const parent = dirname(current)
      if (parent === current) break
      current = parent
    }
  }

  export async function globUp(pattern: string, start: string, stop?: string) {
    let current = start
    const result = []
    while (true) {
      try {
        const glob = new Bun.Glob(pattern)
        for await (const match of glob.scan({
          cwd: current,
          absolute: true,
          onlyFiles: true,
          followSymlinks: true,
          dot: true,
        })) {
          result.push(match)
        }
      } catch {
        // Skip invalid glob patterns
      }
      if (stop === current) break
      const parent = dirname(current)
      if (parent === current) break
      current = parent
    }
    return result
  }
}
