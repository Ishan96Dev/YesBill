'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the correct URL for a public asset.
 * In Next.js on Vercel, public assets are always served from root /.
 */
export const assetUrl = (path) =>
  `/${path.replace(/^\//, '')}`;
