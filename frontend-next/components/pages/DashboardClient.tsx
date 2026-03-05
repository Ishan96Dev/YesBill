'use client'
// ──────────────────────────────────────────────────────────────────────────────
// CLIENT COMPONENT SHELL — DashboardClient
//
// Migration instructions:
//   1. Copy frontend/src/pages/Dashboard.jsx into this file
//   2. Replace all `react-router-dom` imports:
//      - `import { useNavigate } from 'react-router-dom'`  →  no import needed
//      - `const navigate = useNavigate()`  →  `const router = useRouter()`
//      - `navigate('/path')`  →  `router.push('/path')`
//      - `import { Link } from 'react-router-dom'`  →  `import Link from 'next/link'`
//      - `<Link to="/path">`  →  `<Link href="/path">`
//   3. Replace recharts with a dynamic import to avoid SSR window issues:
//      ```tsx
//      import dynamic from 'next/dynamic'
//      const BarChart = dynamic(() =>
//        import('recharts').then((m) => m.BarChart), { ssr: false })
//      // ...repeat for each recharts component used
//      ```
//   4. Replace html2pdf.js with a dynamic import:
//      ```tsx
//      // Inside the async onClick handler:
//      const html2pdf = (await import('html2pdf.js')).default
//      ```
//   5. Replace `import.meta.env.VITE_*` with `process.env.NEXT_PUBLIC_*`
//   6. Image tags: replace `<img src="/assets/...">` with:
//      `import Image from 'next/image'` then `<Image src="/assets/..." ... />`
//      For user avatar URLs from Supabase Storage keep them as `<img>` or use
//      `<Image>` (both work — Image gives optimised delivery on Vercel).
// ──────────────────────────────────────────────────────────────────────────────

import { useRouter } from 'next/navigation'

export default function DashboardClient() {
  const router = useRouter()
  // TODO: paste Dashboard.jsx JSX here and apply the migration steps above
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Dashboard — paste your migrated component here
    </div>
  )
}
