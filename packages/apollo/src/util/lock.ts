export namespace Lock {
  const MAX_LOCK_ENTRIES = 10000 // Prevent unbounded growth
  const locks = new Map<
    string,
    {
      readers: number
      writer: boolean
      waitingReaders: (() => void)[]
      waitingWriters: (() => void)[]
      lastAccess: number
    }
  >()

  // Periodic cleanup of stale locks (every 5 minutes)
  const CLEANUP_INTERVAL = 5 * 60 * 1000
  const STALE_THRESHOLD = 10 * 60 * 1000 // 10 minutes

  function cleanupStaleLocks() {
    const now = Date.now()
    for (const [key, lock] of locks) {
      if (
        lock.readers === 0 &&
        !lock.writer &&
        lock.waitingReaders.length === 0 &&
        lock.waitingWriters.length === 0 &&
        now - lock.lastAccess > STALE_THRESHOLD
      ) {
        locks.delete(key)
      }
    }
  }

  setInterval(cleanupStaleLocks, CLEANUP_INTERVAL).unref()

  function get(key: string) {
    let lock = locks.get(key)
    if (!lock) {
      // Prevent unbounded growth - clean up if too many locks
      if (locks.size >= MAX_LOCK_ENTRIES) {
        cleanupStaleLocks()
      }
      lock = {
        readers: 0,
        writer: false,
        waitingReaders: [],
        waitingWriters: [],
        lastAccess: Date.now(),
      }
      locks.set(key, lock)
    } else {
      lock.lastAccess = Date.now()
    }
    return lock
  }

  function process(key: string) {
    const lock = locks.get(key)
    if (!lock || lock.writer || lock.readers > 0) return

    // Prioritize writers to prevent starvation
    if (lock.waitingWriters.length > 0) {
      const nextWriter = lock.waitingWriters.shift()!
      nextWriter()
      return
    }

    // Wake up all waiting readers
    while (lock.waitingReaders.length > 0) {
      const nextReader = lock.waitingReaders.shift()!
      nextReader()
    }

    // Clean up empty locks
    if (lock.readers === 0 && !lock.writer && lock.waitingReaders.length === 0 && lock.waitingWriters.length === 0) {
      locks.delete(key)
    }
  }

  export async function read(key: string): Promise<Disposable> {
    const lock = get(key)

    return new Promise((resolve) => {
      if (!lock.writer && lock.waitingWriters.length === 0) {
        lock.readers++
        resolve({
          [Symbol.dispose]: () => {
            lock.readers--
            process(key)
          },
        })
      } else {
        lock.waitingReaders.push(() => {
          lock.readers++
          resolve({
            [Symbol.dispose]: () => {
              lock.readers--
              process(key)
            },
          })
        })
      }
    })
  }

  export async function write(key: string): Promise<Disposable> {
    const lock = get(key)

    return new Promise((resolve) => {
      if (!lock.writer && lock.readers === 0) {
        lock.writer = true
        resolve({
          [Symbol.dispose]: () => {
            lock.writer = false
            process(key)
          },
        })
      } else {
        lock.waitingWriters.push(() => {
          lock.writer = true
          resolve({
            [Symbol.dispose]: () => {
              lock.writer = false
              process(key)
            },
          })
        })
      }
    })
  }
}
