// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import Background from "../components/landing/Background";

export default function Terms() {
  return (
    <div className="relative min-h-screen font-sans selection:bg-primary/20 text-gray-900">
      <Background />
      <Navbar />
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: March 3, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using YesBill ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              YesBill is a daily service tracking and automated billing application that allows users to:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Track daily YES/NO records for recurring services (milk, tiffin, laundry, etc.)</li>
              <li>Auto-calculate monthly bill totals based on daily records</li>
              <li>Generate and export PDF invoices</li>
              <li>Deliver bills via WhatsApp or email</li>
              <li>View AI-powered summaries and usage insights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for the accuracy of the data you enter into YesBill.</li>
              <li>You must not use YesBill for illegal purposes or fraudulent billing.</li>
              <li>You must keep your account credentials secure and not share them with others.</li>
              <li>You must provide accurate contact information when registering.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Free Tier & Paid Plans</h2>
            <p>
              YesBill offers a free tier that allows tracking up to 3 services with core features.
              Paid plans (when available) will unlock additional features including unlimited services,
              custom billing cycles, and priority support. Pricing for paid plans is subject to change
              with 30 days notice. All prices are in Indian Rupees (INR) and exclusive of applicable taxes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data & Content</h2>
            <p>
              You retain ownership of all billing data and records you create in YesBill.
              You grant YesBill a limited licence to store, process, and transmit your data solely to provide the Service.
              We do not claim ownership of your data and will not use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Service Availability</h2>
            <p>
              We strive for high availability but do not guarantee uninterrupted access. YesBill may be
              temporarily unavailable due to maintenance, updates, or unforeseen technical issues.
              We are not liable for any loss caused by service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Termination</h2>
            <p>
              You may delete your account at any time from the Settings page. We reserve the right to
              suspend or terminate accounts that violate these terms or engage in abusive behaviour.
              Upon account deletion, all your data will be permanently removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
            <p>
              YesBill is provided "as is" without warranties of any kind. We are not liable for
              any indirect, incidental, or consequential damages arising from your use of the Service,
              including any billing disputes between service providers and customers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact</h2>
            <p>
              For any legal queries regarding these terms, contact us at{" "}
              <a href="mailto:support@yesbill.in" className="text-primary hover:underline">support@yesbill.in</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
