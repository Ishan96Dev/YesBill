// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * Google Sign-In Button Component
 * 
 * A reusable button for Google OAuth authentication using Supabase.
 * Handles the OAuth flow and redirects to the callback URL.
 */

import { useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Google logo SVG component
 */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40681 3.78409 7.82999 3.96409 7.28999V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
  </svg>
)

export default function GoogleSignInButton({ 
  text = "Continue with Google",
  className = "",
  onSuccess,
  onError 
}) {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Google sign-in error:', error)
        onError?.(error)
        return
      }

      // OAuth redirect will happen automatically
      onSuccess?.(data)
      
    } catch (err) {
      console.error('Unexpected error during Google sign-in:', err)
      onError?.(err)
    } finally {
      // Don't set loading to false here because user will be redirected
    }
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading}
      className={`
        group relative flex w-full items-center justify-center gap-3
        rounded-xl border-2 border-gray-200
        bg-white px-6 py-3.5
        font-medium text-gray-700
        shadow-sm
        transition-all duration-200
        hover:border-gray-300 hover:bg-gray-50 hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white
        ${className}
      `}
      type="button"
    >
      {loading ? (
        <>
          <div className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <GoogleIcon />
          <span className="text-[15px]">{text}</span>
        </>
      )}
    </button>
  )
}
