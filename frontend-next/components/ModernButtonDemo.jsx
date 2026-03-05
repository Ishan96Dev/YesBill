'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { ModernButton, HoverExpandButton } from "./ui/modern-button"
import { Zap } from "lucide-react"

export default function ModernButtonDemo() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-4xl space-y-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Size Variants</h2>
          <div className="flex flex-wrap items-center gap-4">
            <ModernButton size="sm">Small</ModernButton>
            <ModernButton size="default">Default</ModernButton>
            <ModernButton size="lg">Large</ModernButton>
            <ModernButton size="xl">Extra Large</ModernButton>
            <ModernButton size="icon">
              <Zap className="h-4 w-4" />
            </ModernButton>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Color Variants</h2>
          <div className="flex flex-wrap items-center gap-4">
            <ModernButton variant="default">Default</ModernButton>
            <ModernButton variant="secondary">Secondary</ModernButton>
            <ModernButton variant="destructive">Destructive</ModernButton>
            <ModernButton variant="outline">Outline</ModernButton>
            <ModernButton variant="ghost">Ghost</ModernButton>
            <ModernButton variant="link">Link</ModernButton>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Special Effects</h2>
          <div className="flex flex-wrap items-center gap-4">
            <ModernButton variant="gradient" size="lg">
              Gradient
            </ModernButton>
            <ModernButton variant="glass" size="lg">
              Glass
            </ModernButton>
            <ModernButton variant="shine" size="lg">
              Shine Effect
            </ModernButton>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">With Icons</h2>
          <div className="flex flex-wrap items-center gap-4">
            <ModernButton icon={<Zap className="h-4 w-4" />} iconPosition="left">
              Left Icon
            </ModernButton>
            <ModernButton 
              icon={<Zap className="h-4 w-4" />} 
              iconPosition="right"
              variant="secondary"
            >
              Right Icon
            </ModernButton>
            <ModernButton loading variant="outline">
              Loading
            </ModernButton>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Hover Expand</h2>
          <div className="flex flex-wrap items-center gap-4">
            <HoverExpandButton>Hover Me</HoverExpandButton>
            <HoverExpandButton className="bg-secondary text-secondary-foreground">
              Custom Color
            </HoverExpandButton>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">States</h2>
          <div className="flex flex-wrap items-center gap-4">
            <ModernButton disabled>Disabled</ModernButton>
            <ModernButton loading>Loading</ModernButton>
            <ModernButton variant="gradient" disabled>
              Disabled Gradient
            </ModernButton>
          </div>
        </div>
      </div>
    </div>
  )
}
