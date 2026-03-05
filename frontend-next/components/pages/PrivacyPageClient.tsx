// @ts-nocheck
'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Background from "@/components/landing/Background";

export default function PrivacyPageClient() {
  return (
    <div className="relative min-h-screen font-sans selection:bg-primary/20 text-gray-900">
      <Background />
      <Navbar />
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: March 3, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. What We Collect</h2>
            <p>When you use YesBill, we collect the following information:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Account information:</strong> Your name, email address, and password (hashed — never stored in plaintext).</li>
              <li><strong>Service tracking data:</strong> The names of services you track, daily YES/NO records, pricing, and billing cycles.</li>
              <li><strong>Bill records:</strong> Auto-generated monthly bill summaries, PDF exports, and delivery logs.</li>
              <li><strong>Contact information:</strong> WhatsApp number or email used for bill delivery, if provided.</li>
              <li><strong>Usage data:</strong> Anonymised product usage analytics to improve the app experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To calculate and generate your monthly bills automatically.</li>
              <li>To send bills to you or your customers via WhatsApp or email.</li>
              <li>To provide AI-powered bill summaries and spending insights.</li>
              <li>To send transactional notifications (bill generated, password changed, etc.).</li>
              <li>To improve the product and fix bugs based on anonymised usage patterns.</li>
            </ul>
            <p className="mt-3">We <strong>do not</strong> sell your personal data. We <strong>do not</strong> show you advertisements. Your billing data is only used to power the YesBill service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Storage & Security</h2>
            <p>
              All data is stored securely on <strong>Supabase</strong> (PostgreSQL), hosted on infrastructure with row-level
              security (RLS) policies ensuring you can only access your own data.
              Passwords are hashed using industry-standard bcrypt. All data in transit is encrypted with TLS 1.2+.
              PDF invoices are stored on encrypted cloud storage and accessible only via signed URLs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Retention</h2>
            <p>
              We retain your account and billing data for as long as your account is active.
              If you delete your account, all personal data is permanently removed within 30 days.
              Anonymised, aggregated usage statistics may be retained indefinitely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Third-Party Services</h2>
            <p>YesBill uses the following third-party services to deliver its features:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Supabase</strong> — database and authentication</li>
              <li><strong>Brevo (Sendinblue)</strong> — transactional email delivery</li>
              <li><strong>Google Gemini</strong> — AI-powered bill analysis and summaries</li>
            </ul>
            <p className="mt-2">Each provider processes only the minimum data required to perform their function.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access all data we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Export your billing data</li>
              <li>Delete your account and all associated data</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:support@yesbill.in" className="text-primary hover:underline">support@yesbill.in</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact</h2>
            <p>
              Questions about this policy? Email us at{" "}
              <a href="mailto:support@yesbill.in" className="text-primary hover:underline">support@yesbill.in</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
