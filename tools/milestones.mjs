import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const run = (cmd, args = [], opts = {}) => {
  const res = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts })
  if (res.status !== 0) {
    const msg = res.stderr || res.stdout || `Command failed: ${cmd} ${args.join(' ')}`
    throw new Error(msg.trim())
  }
  return res.stdout.trim()
}

function repoSlugFromGit() {
  const url = run('git', ['config', '--get', 'remote.origin.url'])
  // git@github.com:owner/repo.git OR https://github.com/owner/repo(.git)
  const sshMatch = url.match(/github\.com:(.+)\.git$/)
  const httpsMatch = url.match(/github\.com\/(.+?)(?:\.git)?$/)
  const slug = (sshMatch && sshMatch[1]) || (httpsMatch && httpsMatch[1])
  if (!slug) throw new Error(`Could not parse GitHub slug from: ${url}`)
  return slug
}

function isoDatePlus(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

const slug = repoSlugFromGit()
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GH_PAT
const api = `https://api.github.com/repos/${slug}/milestones`

const milestones = [
  {
    title: 'v0.4.0 Near-Term',
    state: 'open',
    due_on: isoDatePlus(14),
    description: [
      'Search polish (ranking, keyboard, empty states) + tests',
      'Canvas perf for 1k–5k nodes; memoize + batch updates',
      'A11y: dialogs/menus ARIA, focus traps, contrast',
      'E2E: import/export, conflicts, mobile nav',
      'CI: GitHub Actions for lint/test/build + Playwright matrix',
    ].join('\n'),
  },
  {
    title: 'v0.5.0 Next',
    state: 'open',
    due_on: isoDatePlus(35),
    description: [
      'Large-graph scaling: virtualized labels, worker-friendly layouts',
      'Background workers: layout + search indexing off main thread',
      'Import/export: JSON schema validate + sanitize',
      'Plugin sandbox: scoped API and isolation',
      'i18n: complete ES strings, extraction, fallbacks',
    ].join('\n'),
  },
  {
    title: 'v0.6.0 Later',
    state: 'open',
    due_on: isoDatePlus(56),
    description: [
      'Data migrations for localStorage keys and data shape',
      'Undo/redo: bounded history, snapshot compression',
      'Plugin API 1.0: stable hooks, typed docs, examples',
      'Persistence: export bundles; evaluate optional cloud sync',
    ].join('\n'),
  },
]

if (!token) {
  console.log('No GitHub token found in env (GITHUB_TOKEN/GH_TOKEN/GH_PAT).')
  console.log('Preview the payload and use curl manually to create milestones:')
  console.log(JSON.stringify({ repo: slug, milestones }, null, 2))
  console.log('\nTo create them:')
  console.log('  export GITHUB_TOKEN=YOUR_TOKEN')
  console.log('  node tools/milestones.mjs')
  process.exit(0)
}

for (const m of milestones) {
  const payload = JSON.stringify(m)
  const args = [
    '-sS',
    '-X', 'POST',
    '-H', `Authorization: token ${token}`,
    '-H', 'Accept: application/vnd.github+json',
    '-H', 'X-GitHub-Api-Version: 2022-11-28',
    '-H', 'Content-Type: application/json',
    '-d', payload,
    api,
  ]
  try {
    const out = run('curl', args)
    const obj = JSON.parse(out)
    if (obj && obj.title) {
      console.log(`Created milestone: ${obj.title} (#${obj.number})`)
    } else {
      console.log('Response:', out)
    }
  } catch (e) {
    console.error(`Failed to create milestone "${m.title}": ${e.message}`)
  }
}

