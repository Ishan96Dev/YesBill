// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";

export function AuthHero() {
  return (
    <div className="hidden lg:flex relative flex-col justify-between p-12 bg-[#0F172A] text-white overflow-hidden h-full min-h-screen">
      
      {/* ━━━━━━━━━━━━━━ BACKGROUND DEPTH ━━━━━━━━━━━━━━ */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Mesh Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#0F172A] to-slate-950" />
        
        {/* Grainy Noise */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        
        {/* Floating Ambient Orbs */}
        <motion.div 
          animate={{ 
            x: [0, 40, 0], 
            y: [0, -40, 0],
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div 
          animate={{ 
            x: [0, -30, 0], 
            y: [0, 50, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] mix-blend-screen"
        />
        
        {/* Radial Glow Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[80px]" />
      </div>

      {/* ━━━━━━━━━━━━━━ CONTENT LAYER ━━━━━━━━━━━━━━ */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl">
            <span className="font-bold text-lg bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">Y</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white/90">YesBill</span>
        </motion.div>

        {/* Hero Illustration / Mockup */}
        <div className="relative w-full aspect-[4/3] my-8 perspective-1000">
           <motion.div
             initial={{ opacity: 0, rotateX: 20, y: 40 }}
             animate={{ opacity: 1, rotateX: 6, y: 0 }}
             transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
             className="w-full h-full bg-slate-900/50 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden relative group"
             style={{ transformStyle: 'preserve-3d' }}
           >
              {/* Fake Dashboard Header */}
              <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                </div>
              </div>
              
              {/* Fake Content */}
              <div className="p-6 grid grid-cols-3 gap-4">
                  <div className="col-span-2 h-32 bg-white/5 rounded-lg animate-pulse" />
                  <div className="col-span-1 h-32 bg-white/5 rounded-lg animate-pulse delay-75" />
                  <div className="col-span-1 h-32 bg-white/5 rounded-lg animate-pulse delay-100" />
                  <div className="col-span-2 h-32 bg-white/5 rounded-lg animate-pulse delay-150" />
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s]" />
           </motion.div>
           
           {/* Floating Elements */}
           <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-6 top-20 bg-slate-800/90 backdrop-blur p-4 rounded-xl border border-white/10 shadow-xl"
           >
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                 <div>
                   <div className="h-2 w-16 bg-white/20 rounded mb-1" />
                   <div className="h-1.5 w-10 bg-white/10 rounded" />
                 </div>
              </div>
           </motion.div>
        </div>

        {/* Text Content */}
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-6 bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent"
          >
            Master your daily service bills.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-slate-400 mb-8 max-w-md leading-relaxed"
          >
            Join thousands of users who use YesBill to track their daily expenses and manage vendor bills efficiently.
          </motion.p>
        </div>
      </div>
    </div>
  );
}