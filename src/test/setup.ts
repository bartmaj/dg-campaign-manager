import '@testing-library/jest-dom/vitest'

// Node 25 ships an experimental built-in `localStorage` that requires a
// `--localstorage-file` flag to be functional. In jsdom-environment tests
// the built-in shadows jsdom's own `Storage` impl, leaving us with a
// `localStorage` object whose methods are missing. Install a small
// in-memory polyfill so tests get a working Storage API regardless of
// Node's flag state.
function makeMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => (data.has(key) ? (data.get(key) ?? null) : null),
    key: (i) => Array.from(data.keys())[i] ?? null,
    removeItem: (key) => {
      data.delete(key)
    },
    setItem: (key, value) => {
      data.set(key, String(value))
    },
  }
}

if (typeof window !== 'undefined') {
  const ls = window.localStorage as unknown as Storage | undefined
  if (!ls || typeof ls.setItem !== 'function') {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: makeMemoryStorage(),
    })
  }
  const ss = window.sessionStorage as unknown as Storage | undefined
  if (!ss || typeof ss.setItem !== 'function') {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: makeMemoryStorage(),
    })
  }
}
