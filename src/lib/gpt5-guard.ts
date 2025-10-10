export type CoreSafe = {
  info: (m: string) => void
  warning: (m: string) => void
  setFailed: (m: string) => void
}

export type ListFilesFunc = (opts: { owner?: string; repo?: string; pull_number?: number }) => Promise<{ data?: Array<{ patch?: string }> }>

export const DEFAULT_KEYWORDS = ['ENABLE_GPT5', 'ENABLE_GPT5_ALLOW', 'OPENAI_API_KEY']

export async function checkPrForGpt5Keywords(opts: {
  pr?: any
  listFiles?: ListFilesFunc | undefined
  coreSafe?: CoreSafe
  keywords?: string[]
}): Promise<{ skipped: boolean; ok: boolean } | never> {
  const { pr, listFiles, coreSafe, keywords = DEFAULT_KEYWORDS } = opts

  const core = coreSafe || {
    info: (m: string) => console.log(m),
    warning: (m: string) => console.warn(m),
    setFailed: (m: string) => { console.error(m); throw new Error(m) },
  }

  if (!pr) {
    core.info('No pull_request payload found; skipping guard.')
    return { skipped: true, ok: true }
  }

  const labelAllowed = (pr.labels || []).some((l: any) => l && l.name === 'gpt5-approve')
  if (labelAllowed) {
    core.info('gpt5-approve label present — skipping guard')
    return { skipped: true, ok: true }
  }

  if (!listFiles || typeof listFiles !== 'function') {
    core.warning('GitHub client does not expose pulls.listFiles; skipping guard.')
    return { skipped: true, ok: true }
  }

  let files
  try {
    files = await listFiles({ owner: undefined, repo: undefined, pull_number: pr.number })
  } catch (err: any) {
    core.warning(`Failed to list PR files: ${err && err.message ? err.message : String(err)}`)
    return { skipped: true, ok: true }
  }

  const fileData = files && files.data
  if (!Array.isArray(fileData)) {
    core.warning('GitHub client does not expose pulls.listFiles; skipping guard.')
    return { skipped: true, ok: true }
  }

  for (const f of fileData) {
    const patch = f.patch || ''
    for (const kw of keywords) {
      if (patch.includes(kw)) {
        core.setFailed(`PR modifies or adds ${kw}. Add label 'gpt5-approve' to bypass.`)
      }
    }
  }

  return { skipped: false, ok: true }
}
