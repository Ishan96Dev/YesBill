'use client'
﻿import { assetUrl } from "../lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";

export default function AuthSidePanel({ variant }) {
  const bg =
    variant === "login"
      ? assetUrl("/assets/branding/auth_side_login.png")
      : assetUrl("/assets/branding/auth_side_signup.png");

  return (
    <div
      className="hidden md:flex relative w-3/5 h-screen overflow-hidden bg-cover bg-center p-10"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundPosition: "center top",
        backgroundSize: "cover"
      }}
    >
      {/* Overlay gradient for text readability and fix image issue */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />

      {/* Logo removed - moved to Auth form */}
    </div>
  );
}
