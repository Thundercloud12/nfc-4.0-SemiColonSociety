"use client";
import { useState, useEffect } from "react";

export default function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [visible, setVisible] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setVisible(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setVisible(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-pink-100 border border-pink-400 text-pink-700 px-4 py-3 rounded-lg shadow-md flex items-center justify-between w-[350px] z-50">
      <span className="text-sm font-medium">
        {isOffline ? "Offline mode: Your data is being saved locally" : ""}
      </span>
      <button 
        onClick={() => setVisible(false)} 
        className="ml-4 text-pink-600 hover:text-pink-800 font-bold"
      >
        ✖
      </button>
    </div>
  );
}
