'use client'
﻿import { assetUrl } from "../../lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import React, { useEffect, useState } from "react";
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
    { name: "Testimonials", href: "/testimonials" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 md:w-10 md:h-10">
              <img 
                src={assetUrl("/assets/branding/yesbill_logo_black.png")} 
                alt="YesBill" 
                className="w-full h-full object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <span className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 group-hover:text-primary transition-colors">
              YesBill
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href ? "text-primary" : "text-slate-600"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-full bg-primary hover:bg-indigo-700 text-white shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100vh" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden fixed inset-0 top-[80px] bg-white z-40 overflow-y-auto"
          >
            <div className="flex flex-col p-6 gap-6">
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`text-lg font-medium py-2 border-b border-gray-50 flex justify-between items-center ${
                      pathname === link.href ? "text-primary" : "text-slate-600"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
              
              <div className="flex flex-col gap-4 mt-4">
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-gray-200">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup" className="w-full">
                  <Button className="w-full h-12 rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
