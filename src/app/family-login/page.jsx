"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { useTranslation } from "@/lib/useTranslation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function FamilyLogin() {
  const [uniqueCode, setUniqueCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation('auth');

  useEffect(() => {
    if (session && session.user.role === 'family') {
      router.push('/family-dashboard');
    }
  }, [session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Call our family login API
      const response = await fetch('/api/family/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uniqueCode, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sign in with NextAuth using the family member credentials
        const result = await signIn('credentials', {
          redirect: false,
          identifier: uniqueCode,
          password: password,
          type: 'family_login',
          callbackUrl: '/family-dashboard'
        });

        if (result.error) {
          setMessage(`Login Failed: ${result.error}`);
        } else {
          setMessage(data.message || 'Login successful! Redirecting to family dashboard...');
          // Force redirect to family dashboard
          window.location.href = '/family-dashboard';
        }
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error connecting to server. Please try again.');
      console.error('Family login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-pink-500">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👨‍👩‍👧‍👦</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Family Dashboard</h2>
            <p className="text-gray-600 text-lg">Enter your unique code to access patient information</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Unique Code *
              </label>
              <input
                type="text"
                value={uniqueCode}
                onChange={(e) => setUniqueCode(e.target.value.toUpperCase())}
                required
                placeholder="Enter the unique code from patient"
                className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 font-mono text-center text-lg tracking-widest"
                maxLength="8"
              />
              <p className="text-xs text-gray-500 mt-2">
                Ask the pregnant woman for her unique code to access her health information
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a password for your account"
                className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                minLength="6"
              />
              <p className="text-xs text-gray-500 mt-2">
                Create a password (min 6 characters) for future logins
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !uniqueCode.trim() || !password.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accessing Dashboard...
                </span>
              ) : (
                "🔐 Access Family Dashboard"
              )}
            </button>
          </form>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl border-l-4 ${
              message.includes("successful") || message.includes("Success")
                ? "bg-green-50 text-green-800 border-green-400"
                : "bg-red-50 text-red-800 border-red-400"
            } shadow-sm`}>
              <div className="flex items-start">
                <span className="mr-3 text-lg">
                  {message.includes("successful") || message.includes("Success") ? "✅" : "❌"}
                </span>
                <div className="flex-1">
                  <div>{message}</div>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 p-4 bg-pink-50 border-2 border-pink-200 rounded-xl">
            <h3 className="font-bold text-pink-800 mb-2 flex items-center">
              <span className="mr-2">💡</span>
              How to get the unique code:
            </h3>
            <ul className="text-sm text-pink-700 space-y-1">
              <li>• Ask the pregnant woman for her unique code</li>
              <li>• The code was provided during her registration</li>
              <li>• This code allows you to view her health information</li>
              <li>• Keep this code secure and private</li>
            </ul>
          </div>

          {/* Back to Main */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-pink-600 hover:text-pink-800 text-sm font-semibold"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
