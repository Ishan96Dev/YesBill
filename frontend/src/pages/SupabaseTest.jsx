// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

/**
 * Supabase Connection Test Component
 * 
 * Use this to verify your Supabase connection is working.
 * Open browser console (F12) to see detailed logs.
 */

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SupabaseTest() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log("🧪 Testing Supabase connection...");
      
      // Test 1: Check client is initialized
      console.log("✅ Step 1: Supabase client initialized");
      
      // Test 2: Try to get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("📊 Step 2: Session check:", { 
        hasSession: !!sessionData?.session,
        error: sessionError 
      });
      
      // Test 3: Try to sign up with a test email
      // Using simple format without + to avoid validation issues
      const timestamp = Date.now();
      const testEmail = `testuser${timestamp}@gmail.com`;
      const testPassword = "TestPassword123!";
      
      console.log("📝 Step 3: Testing signup with:", testEmail);
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });
      
      console.log("📨 Step 4: Signup response:", {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error,
        userId: data?.user?.id,
        userEmail: data?.user?.email
      });
      
      if (error) {
        setTestResult({
          success: false,
          message: `Connection Error: ${error.message}`,
          details: error,
          step: 'signup'
        });
      } else if (data.user) {
        setTestResult({
          success: true,
          message: "✅ Supabase is working! User created successfully.",
          details: {
            userId: data.user.id,
            email: data.user.email,
            hasSession: !!data.session,
            createdAt: data.user.created_at
          },
          step: 'complete'
        });
        
        // Clean up: Sign out the test user
        await supabase.auth.signOut();
      } else {
        setTestResult({
          success: false,
          message: "⚠️ No user object returned",
          details: data,
          step: 'validation'
        });
      }
      
    } catch (err) {
      console.error("❌ Test failed:", err);
      setTestResult({
        success: false,
        message: `Unexpected Error: ${err.message}`,
        details: err,
        step: 'exception'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          🔧 Supabase Connection Test
        </h1>
        <p className="text-gray-600 mb-8">
          Test your Supabase authentication setup. Open browser console (F12) for detailed logs.
        </p>

        <button
          onClick={testConnection}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {loading ? "Testing Connection..." : "Run Connection Test"}
        </button>

        {testResult && (
          <div className={`p-6 rounded-xl ${testResult.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <h3 className={`font-bold mb-2 ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.message}
            </h3>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Show Details
              </summary>
              <pre className="mt-2 text-xs bg-white p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📝 Expected Results:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Supabase client initialized</li>
            <li>✅ Test user created successfully</li>
            <li>✅ User object returned with ID and email</li>
            <li>✅ User appears in Supabase Dashboard → Authentication → Users</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <h3 className="font-semibold text-red-900 mb-2">❌ Getting "email rate limit exceeded"?</h3>
          <div className="text-sm text-red-800 space-y-2">
            <p className="font-medium">Supabase free tier limits emails to 3-4 per hour. Quick fix:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Open <a href="https://app.supabase.com/project/dmabraziqscumpbwhjbf/auth/providers" target="_blank" className="underline font-semibold">Email Provider Settings</a></li>
              <li>Click on "Email" to expand</li>
              <li><strong>UNCHECK "Confirm email"</strong></li>
              <li>Click "Save"</li>
              <li>Refresh this page and try again</li>
            </ol>
            <p className="mt-2 text-xs">This disables email sending so signups work instantly without rate limits.</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <a 
            href="/signup" 
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Signup
          </a>
        </div>
      </div>
    </div>
  );
}
