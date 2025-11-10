import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const run = (cmd, args = []) => {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (res.status !== 0) {
    process.exit(res.status || 1)
  }
}

const bumpType = (process.argv[2] || process.env.BUMP || 'minor').toLowerCase()
if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error(`Invalid bump type: ${bumpType}. Use patch|minor|major.`)
  process.exit(1)
}

const today = new Date().toISOString().slice(0, 10)

const bumpSemver = (v, type) => {
  const [major, minor, patchWithPre] = v.split('.')
  const patch = (patchWithPre || '0').split('-')[0]
  let M = parseInt(major, 10)
  let m = parseInt(minor, 10)
  let p = parseInt(patch, 10)
  if (Number.isNaN(M) || Number.isNaN(m) || Number.isNaN(p)) {
    throw new Error(`Invalid semver: ${v}`)
  }
  if (type === 'major') { M += 1; m = 0; p = 0 }
  else if (type === 'minor') { m += 1; p = 0 }
  else { p += 1 }
  return `${M}.${m}.${p}`
}

const pkgPath = new URL('../package.json', import.meta.url)
const changelogPath = new URL('../CHANGELOG.md', import.meta.url)

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const currentVersion = pkg.version
const newVersion = bumpSemver(currentVersion, bumpType)

// Run checks first
run('npm', ['run', 'lint'])
run('npm', ['test'])

// Update package.json
pkg.version = newVersion
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')

// Update CHANGELOG.md: move Unreleased -> new version section, keep empty Unreleased
const changelog = readFileSync(changelogPath, 'utf8')
const unrelIdx = changelog.indexOf('## Unreleased')
if (unrelIdx === -1) {
  throw new Error('CHANGELOG.md missing "## Unreleased" section')
}
const nextIdx = changelog.indexOf('\n## ', unrelIdx + 1)
const head = changelog.slice(0, unrelIdx)
const unrelSection = changelog.slice(unrelIdx, nextIdx === -1 ? changelog.length : nextIdx)
const tail = nextIdx === -1 ? '' : changelog.slice(nextIdx)

const unrelBody = unrelSection.replace(/^## Unreleased\s*/m, '')
const trimmedBody = unrelBody.trim()

let newUnrelSection = '## Unreleased\n\n'
let newVersionSection = ''
if (trimmedBody.length > 0) {
  newVersionSection = `## [${newVersion}] - ${today}\n\n${trimmedBody}\n\n`
}

const newChangelog = head + newUnrelSection + newVersionSection + tail
writeFileSync(changelogPath, newChangelog, 'utf8')

// Commit and push (no tags)
run('git', ['add', 'package.json', 'CHANGELOG.md'])
run('git', ['commit', '-m', `chore(release): v${newVersion}`])
run('git', ['push'])

console.log(`Released ${newVersion} (pushed). No tag created.`)

