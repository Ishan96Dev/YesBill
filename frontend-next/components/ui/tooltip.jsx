'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = ({ delayDuration = 300, ...props }) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
);

const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef(
  ({ className, sideOffset = 8, side = "top", showArrow = true, ...props }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        side={side}
        className={cn(
          // Base
          "relative z-50 rounded-xl px-3 py-2 text-xs font-medium shadow-xl max-w-[220px]",
          // Dark style matching dashboard theme
          "bg-gray-900 text-white border border-gray-700/60",
          // Animations
          "animate-in fade-in-0 zoom-in-95 duration-150",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-100",
          "data-[side=bottom]:slide-in-from-top-1.5 data-[side=left]:slide-in-from-right-1.5",
          "data-[side=right]:slide-in-from-left-1.5 data-[side=top]:slide-in-from-bottom-1.5",
          className
        )}
        {...props}
      >
        {props.children}
        {showArrow && (
          <TooltipPrimitive.Arrow
            className="fill-gray-900 drop-shadow-[0_1px_0_rgba(55,65,81,0.6)]"
            width={10}
            height={5}
          />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
);
TooltipContent.displayName = "TooltipContent";

/**
 * Convenience wrapper — wraps any child with a tooltip in one go.
 *
 * <WithTooltip tip="Open service calendar">
 *   <button>...</button>
 * </WithTooltip>
 */
function WithTooltip({ tip, side = "top", delayDuration = 250, children, disabled = false }) {
  if (!tip || disabled) return children;
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  WithTooltip,
};
