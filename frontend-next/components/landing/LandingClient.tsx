'use client'
// LandingClient — wraps all interactive landing-page pieces.
// Separated from the SSG page.tsx so the Server Component can export metadata
// while this component handles client-side hooks (useEffect, useNavigate, toast).
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import Hero from './Hero'
import Features from './Features'
import Testimonials from './Testimonials'
import Footer from './Footer'
import Background from './Background'
import { useToast } from '@/components/ui/toaster-custom'

export default function LandingClient() {
  const { toast } = useToast()
  const router = useRouter()
  const [emailChangeBanner, setEmailChangeBanner] = useState<string | null>(null)

  // Detect Supabase "Secure Email Change" first-click redirect to root
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const message = hash.get('message')
    const hasSbParam = window.location.hash.includes('sb=')
    if (message && hasSbParam) {
      setEmailChangeBanner(
        "Almost there! Your old email is confirmed. Please check your new email inbox and click the confirmation link to complete the change."
      )
      toast({
        title: 'Check your new email',
        description:
          'Click the confirmation link sent to your new email address to finish.',
        type: 'info',
        duration: 8000,
      })
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [toast])

  return (
    <div className="relative min-h-screen font-sans selection:bg-primary/20 text-gray-900">
      <Background />
      <Navbar />

      {emailChangeBanner && (
        <div className="fixed top-[100px] left-0 right-0 z-[45] bg-indigo-600 text-white text-sm text-center px-4 py-3 flex items-center justify-between gap-3 shadow-md w-full">
          <span className="flex-1">📧 {emailChangeBanner}</span>
          <button
            onClick={() => setEmailChangeBanner(null)}
            className="shrink-0 text-white/70 hover:text-white text-lg leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <main className={`flex flex-col gap-0${emailChangeBanner ? ' pt-11' : ''}`}>
        <Hero />
        <Features />

        {/* CTA Banner */}
        <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-36 bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden mt-12 rounded-t-[3rem] mx-2 shadow-2xl shadow-indigo-900/20">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light" />
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/10 to-transparent" />
          <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight drop-shadow-sm">
              Ready to eliminate billing disputes?
            </h2>
            <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of households and service providers who use YesBill to track daily
              services and generate bills automatically.
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-900/20 hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Get Started for Free
            </button>
          </div>
        </section>

        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}
