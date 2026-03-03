// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils"
import { assetUrl } from "../../lib/utils";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Testimonials", href: "/testimonials" },
    { name: "Contact", href: "/contact" },
    { name: "About", href: "/about" },
    { name: "Docs", href: "https://ishan96dev.github.io/YesBill/docs/", external: true }
  ];

  return (
    <>
      <motion.nav
        className={cn(
          "fixed w-full z-50 transition-all duration-300 h-[100px] flex items-center",
          scrolled || mobileMenuOpen
            ? "bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm h-[80px]"
            : "bg-transparent border-transparent"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "circOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-full flex items-center justify-between w-full">
          <div className="flex items-center cursor-pointer group" onClick={() => navigate("/")}>
            <img
              src={assetUrl("/assets/branding/yesbill_logo_black.png")}
              alt="YesBill"
              className="w-[140px] h-[140px] object-contain"
            />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium transition-colors relative group text-gray-600 hover:text-primary"
                  >
                    {link.name}
                    <span className="absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 w-0 group-hover:w-full" />
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={cn(
                      "text-sm font-medium transition-colors relative group",
                      location.pathname === link.href ? "text-primary" : "text-gray-600 hover:text-primary"
                    )}
                  >
                    {link.name}
                    <span className={cn(
                      "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300",
                      location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                    )} />
                  </Link>
                )
              )}
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="hover:bg-primary/5 hover:text-primary font-medium"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/signup")}
                className="bg-primary hover:bg-indigo-700 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 rounded-xl"
              >
                Get Started
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[80px] left-0 right-0 bg-white border-b border-gray-100 shadow-xl z-40 md:hidden overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-4">
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium p-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 block"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "text-base font-medium p-2 rounded-lg transition-colors",
                      location.pathname === link.href ? "bg-primary/5 text-primary" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {link.name}
                  </Link>
                )
              )}
              <div className="h-px w-full bg-gray-100 my-2" />
              <Button variant="ghost" onClick={() => navigate("/login")} className="justify-start">Sign In</Button>
              <Button onClick={() => navigate("/signup")} className="w-full bg-primary">Get Started</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
