#!/usr/bin/env node
/**
 * migrate-components.mjs
 *
 * Run from the workspace root:
 *   node frontend-next/scripts/migrate-components.mjs
 *
 * What it does:
 *   1. Copies all components/ from frontend/src/components/ to frontend-next/components/
 *   2. Copies all hooks/ from frontend/src/hooks/ to frontend-next/hooks/
 *   3. Copies all services/ from frontend/src/services/ to frontend-next/services/
 *   4. Copies lib/ files from frontend/src/lib/ to frontend-next/lib/
 *   5. Copies public/ assets from frontend/public/ to frontend-next/public/
 *   6. Rewrites react-router-dom imports to next/link + next/navigation
 *   7. Inserts "use client" at the top of every component/hook file
 *   8. Renames VITE_ env vars to NEXT_PUBLIC_ inside copied files
 *
 * This is a BEST-EFFORT script. Review all changes before committing.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const SRC = path.join(ROOT, 'frontend/src')
const DEST = path.join(ROOT, 'frontend-next')

// ── Replacements applied to every copied file ──────────────────────────────
const TRANSFORMS = [
  // Add "use client" if file doesn't already have it
  {
    test: /\.(jsx?|tsx?)$/,
    fn: (src) =>
      src.startsWith("'use client'") || src.startsWith('"use client"')
        ? src
        : `'use client'\n${src}`,
  },
  // react-router-dom Link → next/link
  {
    test: /\.(jsx?|tsx?)$/,
    fn: (src) =>
      src
        .replace(/from ['"]react-router-dom['"]/g, "from 'react-router-dom' /* MIGRATED */")
        .replace(/import\s*\{([^}]+)\}\s*from\s*['"]react-router-dom['"]\s*\/\*\s*MIGRATED\s*\*\//g,
          (_, imports) => {
            const parts = imports.split(',').map((s) => s.trim())
            const linkIdx = parts.indexOf('Link')
            const navParts = parts.filter(
              (p) => !['Link', 'BrowserRouter', 'Routes', 'Route', 'Switch'].includes(p)
            )
            const lines = []
            if (linkIdx !== -1) lines.push("import Link from 'next/link'")
            const navRemap = {
              useNavigate: 'useRouter',
              useParams: 'useParams',
              useLocation: 'usePathname',
              Navigate: 'redirect',
            }
            const navImports = navParts
              .map((p) => navRemap[p] ?? p)
              .filter(Boolean)
            if (navImports.length)
              lines.push(`import { ${navImports.join(', ')} } from 'next/navigation'`)
            return lines.join('\n')
          }
        ),
  },
  // useNavigate() → useRouter()  +  navigate( → router.push(
  {
    test: /\.(jsx?|tsx?)$/,
    fn: (src) =>
      src
        .replace(/const\s+navigate\s*=\s*useNavigate\(\)/g, 'const router = useRouter()')
        .replace(/\bnavigate\(/g, 'router.push('),
  },
  // <Link to=" → <Link href="
  {
    test: /\.(jsx?|tsx?)$/,
    fn: (src) => src.replace(/<Link\s+to=/g, '<Link href='),
  },
  // VITE_ env vars → NEXT_PUBLIC_
  {
    test: /\.(jsx?|tsx?|js|ts)$/,
    fn: (src) => src.replace(/import\.meta\.env\.VITE_/g, 'process.env.NEXT_PUBLIC_'),
  },
]

function copyDir(from, to, transforms = []) {
  if (!fs.existsSync(from)) {
    console.warn(`  SKIP (not found): ${from}`)
    return
  }
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name)
    const destPath = path.join(to, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, transforms)
    } else {
      let content = fs.readFileSync(srcPath, 'utf8')
      for (const { test, fn } of transforms) {
        if (test.test(entry.name)) content = fn(content)
      }
      fs.writeFileSync(destPath, content, 'utf8')
      console.log(`  copied: ${destPath.replace(ROOT, '')}`)
    }
  }
}

console.log('🚀 YesBill component migration starting…\n')

// 1. Components
console.log('📦 Copying components/')
copyDir(path.join(SRC, 'components'), path.join(DEST, 'components'), TRANSFORMS)

// 2. Hooks
console.log('\n🪝 Copying hooks/')
copyDir(path.join(SRC, 'hooks'), path.join(DEST, 'hooks'), TRANSFORMS)

// 3. Services
console.log('\n🌐 Copying services/')
copyDir(path.join(SRC, 'services'), path.join(DEST, 'services'), TRANSFORMS)

// 4. Lib
console.log('\n🔧 Copying lib/')
copyDir(path.join(SRC, 'lib'), path.join(DEST, 'lib'), TRANSFORMS)

// 5. Public assets (no transforms)
console.log('\n🖼  Copying public/')
copyDir(path.join(ROOT, 'frontend/public'), path.join(DEST, 'public'))

console.log('\n✅  Migration complete!')
console.log('\n⚠️  Manual steps still required:')
console.log('   1. Review every file for remaining react-router-dom references')
console.log('   2. Wrap recharts components with dynamic(() => import(...), { ssr: false })')
console.log('   3. Wrap html2pdf.js with dynamic import inside async handlers')
console.log('   4. Replace <img> with next/image <Image> where image optimisation is desired')
console.log('   5. Run: cd frontend-next && npm install && npm run build')
