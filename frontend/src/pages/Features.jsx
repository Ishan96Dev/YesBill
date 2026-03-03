// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import Background from "../components/landing/Background";
import FeaturesBase from "../components/landing/Features";
import PageWrapper from "../components/PageWrapper";
import HeroSection from "../components/HeroSection";
import HeroCalendar from "../components/hero-graphics/HeroCalendar";

export default function Features() {
  return (
    <PageWrapper>
      <Background />
      <Navbar />

      <main className="mb-24">
        <HeroSection
          title="All Features"
          subtitle="Discover how YesBill automates your daily service tracking and billing with zero hassle."
          graphic={<HeroCalendar />}
        />
        <FeaturesBase />
      </main>

      <Footer />
    </PageWrapper>
  );
}
