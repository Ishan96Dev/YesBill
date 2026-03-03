// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function EnhancedInput({ 
  label, 
  type = 'text', 
  placeholder, 
  icon: Icon,
  error,
  className = '',
  ...props 
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value);

  // Keep hasValue in sync with controlled value prop
  useEffect(() => {
    setHasValue(!!props.value);
  }, [props.value]);

  return (
    <div className="relative">
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <input
          type={type}
          className={`
            peer w-full px-4 ${Icon ? 'pl-12' : ''} py-3.5 
            bg-white/80 backdrop-blur-sm
            border-2 rounded-xl
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-gray-200 focus:border-primary focus:ring-primary/20'
            }
            text-gray-900 placeholder-transparent
            focus:outline-none focus:ring-4
            transition-all duration-200
            ${className}
          `}
          placeholder={placeholder || label}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            setHasValue(e.target.value !== '');
          }}
          onChange={(e) => setHasValue(e.target.value !== '')}
          {...props}
        />
        
        {label && (
          <label
            className={`
              absolute left-4 ${Icon ? 'left-12' : ''} 
              transition-all duration-200 pointer-events-none
              ${isFocused || hasValue || props.value
                ? '-top-2.5 text-xs bg-white px-2 text-primary font-medium'
                : 'top-1/2 -translate-y-1/2 text-gray-500'
              }
              ${error && (isFocused || hasValue || props.value) ? 'text-red-500' : ''}
            `}
          >
            {label}
          </label>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
        >
          <span className="w-1 h-1 rounded-full bg-red-600" />
          {error}
        </motion.p>
      )}
    </div>
  );
}
