'use client'
import { useState, useEffect } from "react";
import { assetUrl } from "../lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";

export default function AuthSidePanel({ variant }) {
  const bg =
    variant === "login"
      ? assetUrl("/assets/branding/auth_side_login.png")
      : assetUrl("/assets/branding/auth_side_signup.png");

  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = bg;
  }, [bg]);

  return (
    <div
      className="hidden md:flex relative w-3/5 h-screen overflow-hidden p-10"
      style={imageLoaded ? {
        backgroundImage: `url(${bg})`,
        backgroundPosition: "center top",
        backgroundSize: "cover"
      } : undefined}
    >
      {/* Placeholder gradient shown while the image loads */}
      {!imageLoaded && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        />
      )}
      {/* Fade-in transition once image is ready */}
      {imageLoaded && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            backgroundImage: `url(${bg})`,
            backgroundPosition: "center top",
            backgroundSize: "cover"
          }}
        />
      )}
      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
    </div>
  );
}
