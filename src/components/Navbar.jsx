"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Load Google Translate script
    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi,mr",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };
  }, []);

  // Function to trigger translation manually
  const translateLanguage = (lang) => {
    const select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
    }
  };

  return (
    <nav className="bg-pink-50 shadow-sm sticky top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="text-2xl font-bold text-pink-500">
          MaternalCare
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/" className="text-gray-700 hover:text-pink-500">Home</Link>
          <Link href="/login" className="px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600">
            Login
          </Link>
          {/* Custom Language Buttons */}
          <div className="flex gap-2">
            <button onClick={() => translateLanguage("en")} className="p-2 bg-pink-300 rounded text-sm hover:bg-pink-500">EN</button>
            <button onClick={() => translateLanguage("hi")} className="p-2 bg-pink-300 rounded text-sm hover:bg-pink-500">HI</button>
            <button onClick={() => translateLanguage("mr")} className="p-2 bg-pink-300 rounded text-sm hover:bg-pink-500">MR</button>
          </div>
        </div>

        {/* Hidden Google Translate Element */}
        <div id="google_translate_element" className="hidden"></div>

        {/* Mobile Menu Button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-pink-500 text-2xl">
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
