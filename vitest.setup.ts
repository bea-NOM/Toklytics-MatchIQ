// Suppress noisy Next.js relative-URL redirect warnings during tests
const origConsoleError = console.error
console.error = (...args: any[]) => {
  try {
    const msg = String(args[0] || '')
    if (msg.includes('URL is malformed') && msg.includes('Please use only absolute URLs')) {
      // ignore
      return
    }
  } catch (e) {
    // fallthrough to real console
  }
  return origConsoleError.apply(console, args)
}
