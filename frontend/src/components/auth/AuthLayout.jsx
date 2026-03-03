// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { AuthHero } from "./AuthHero";
import { AuthCard } from "./AuthCard";

// Refactored to compose small components
export default function AuthLayout({ children }) {
  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2">
      <AuthHero />
      <AuthCard>
        {children}
      </AuthCard>
    </div>
  );
}