"use client";
import React from "react";
import { Spotlight } from "./ui/Spotlight";
import { useRouter } from "next/navigation";

const Hero = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/signup");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-bl from-pink-100 via-pink-50 to-transparent">
      {/* Spotlights */}
      <Spotlight fill="#FA86C4" className="top-0 left-0 md:-top-20 md:-left-32 h-[80vh] w-[80vw]" />
      <Spotlight fill="#FA86C4" className="top-0 right-0 md:-top-10 md:-right-32 h-[60vh] w-[60vw]" />
      <Spotlight fill="#FA86C4" className="bottom-0 left-1/2 transform -translate-x-1/2 h-[50vh] w-[50vw]" />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold">
          Welcome to <span className="text-pink-500">Maternity Care</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl max-w-3xl text-gray-800">Your trusted platform for maternal health — track your wellness, book appointments, and connect with healthcare professionals, all in one place</p>

        <button onClick={handleClick} className={`mt-6 px-6 py-3 rounded-full bg-pink-500 text-white hover:bg-pink-600 transition`}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Hero;