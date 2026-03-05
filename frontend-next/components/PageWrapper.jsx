'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useEffect } from "react";
import { usePathname } from 'next/navigation';
import { cn } from "../lib/utils";

export default function PageWrapper({ children, className }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={cn("min-h-screen w-full relative", className)}>
      {children}
    </div>
  );
}
