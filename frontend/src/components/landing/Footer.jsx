import { assetUrl } from "../../lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Twitter, Instagram, Github, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-gray-200 bg-white/50 backdrop-blur-xl">
      {/* Gradient Top Border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center mb-6">
              <img
                src={assetUrl("/assets/branding/yesbill_logo_black.png")}
                alt="YesBill"
                className="w-[140px] h-[140px] object-contain"
              />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm mb-8">
              The modern way to track daily services and automate monthly billing.
              Simple, transparent, and effective.
            </p>
            <div className="flex gap-4">
              {[Twitter, Github, Instagram].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ y: -2, color: "#4F46E5" }}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 transition-colors hover:bg-white hover:shadow-md hover:border-gray-200"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              {['Features', 'Pricing', 'Testimonials', 'Roadmap'].map(item => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="hover:text-primary transition-colors">{item}</Link>
                </li>
              ))}
              <li>
                <a
                  href="https://ishan96dev.github.io/YesBill/docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >Docs</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              {['About', 'Careers', 'Blog', 'Contact'].map(item => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="hover:text-primary transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              {['Privacy', 'Terms', 'Security'].map(item => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="hover:text-primary transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">© 2026 YesBill Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}