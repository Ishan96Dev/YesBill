// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const Popover = React.forwardRef((props, ref) => (
  <PopoverPrimitive.Root data-slot="popover" {...props} />
));
Popover.displayName = "Popover";

const PopoverTrigger = React.forwardRef((props, ref) => (
  <PopoverPrimitive.Trigger
    ref={ref}
    data-slot="popover-trigger"
    {...props}
  />
));
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverContent = React.forwardRef(
  ({ className, align = "center", sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 text-gray-900 shadow-lg outline-none",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
);
PopoverContent.displayName = "PopoverContent";

const PopoverAnchor = React.forwardRef((props, ref) => (
  <PopoverPrimitive.Anchor ref={ref} data-slot="popover-anchor" {...props} />
));
PopoverAnchor.displayName = "PopoverAnchor";

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
