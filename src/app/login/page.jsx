'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function OTPLogin() {
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/send', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
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
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ identifier, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setMessage(`OTP Verification Failed: ${verifyData.error}`);
        setLoading(false);
        return;
      }

      // Sign in via next-auth
      const result = await signIn("credentials", {
        redirect: false,
        identifier,
        otp,
      });

      if (result.error) {
        setMessage(`Login Failed: ${result.error}`);
      } else {
        setMessage('Logged in successfully!');
        // Optionally add redirect logic here
      }
    } catch (err) {
      setMessage('Error verifying OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 border rounded-md shadow-md">
      {!otpSent ? (
        <form onSubmit={requestOtp} className="space-y-4">
          <label>
            Email or Phone:
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="Enter your email or phone"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          <label>
            Enter OTP:
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="Enter the OTP"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Verify OTP & Login'}
          </button>
        </form>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded text-sm ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
