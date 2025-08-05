'use client';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandOnlyfans,
} from "@tabler/icons-react";


export default function OTPLogin() {
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      // Redirect based on user role
      if (session.user.role === "asha") {
        router.push("/asha-dashboard");
      } else if (session.user.role === "pregnant") {
        router.push("/patient-dashboard");
      } else {
        router.push("/"); // Default redirect for other roles
      }
    }
  }, [session, router]);

  useEffect(() => {
    if (session) {
      // Redirect based on user role
      if (session.user.role === 'asha') {
        router.push('/asha-dashboard');
      } else if (session.user.role ==='pregnant') {
        router.push('/patient-dashboard'); 
      } else {
        router.push('/');
      }
    }
  }, [session, router]);

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('OTP sent! Please check your email.');
        setOtpSent(true);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error sending OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // First verify OTP backend API
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setMessage(`OTP Verification Failed: ${verifyData.error}`);
        setLoading(false);
        return;
      }

      // Sign in via next-auth
      const result = await signIn('credentials', {
        redirect: false,
        identifier,
        otp,
      });

      if (result.error) {
        setMessage(`Login Failed: ${result.error}`);
      } else {
        setMessage('Logged in successfully!');
        // Session will be updated and redirect will happen via useEffect
      }
    } catch (err) {
      setMessage('Error verifying OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };


 
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 ">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your MaternalCare account</p>
          </div>

          {!otpSent ? (
            <form onSubmit={requestOtp} className="space-y-6">
              
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  Login Credentials
                </h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email or Phone Number
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                    placeholder="Enter your email or phone"
                  />
                </div>
              
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-pink-500 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </span>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-6">
              <div className="bg-pink-50 p-6 rounded-xl border-2 border-pink-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  
                  Verify OTP
                </h3>
                
                <div className="mb-4">
                  <div className="flex items-center p-3 bg-pink-100 rounded-lg text-sm text-pink-800">
                    
                    OTP sent to: <span className="font-semibold ml-1">{identifier}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength="6"
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 text-center font-mono text-lg tracking-widest"
                    placeholder="000000"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    " Verify & Login"
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setMessage('');
                  }}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          {/* Success/Error Messages */}
          {message && (
              <div className="flex mt-5 items-center justify-center">
                <div className="flex-1 justify-center text-center">
                  <div>{message}</div>
                </div>
              </div>
            
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="text-pink-600 hover:text-pink-700 font-semibold transition-colors">
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}