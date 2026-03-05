// @ts-nocheck
'use client'
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Background from "@/components/landing/Background";
import PageWrapper from "@/components/PageWrapper";
import HeroSection from "@/components/HeroSection";
import HeroWhatsapp from "@/components/hero-graphics/HeroWhatsapp";
import TestimonialsList from "@/components/landing/Testimonials";

export default function TestimonialsPage() {
  return (
    <PageWrapper>
      <Background />
      <Navbar />

      <main className="mb-24">
        <HeroSection
          title="Loved by Users"
          subtitle="From milk distributors to apartment managers, see how YesBill changes lives."
          graphic={<HeroWhatsapp />}
        />

        <TestimonialsList />
      </main>

      <Footer />
    </PageWrapper>
  );
}
