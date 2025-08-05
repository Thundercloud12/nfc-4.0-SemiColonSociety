"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-pink-50 shadow-sm sticky top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between align-middle h-16">
        <Link href="/" className="text-2xl font-bold text-pink-500">
          MaternalCare
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 justify-center items-center">
          <Link href="/" className="text-gray-700 hover:text-pink-500 transition">Home</Link>
          <Link href="/appointment" className="text-gray-700 hover:text-pink-500 transition">Appointment</Link>
          <Link href="/family-login" className="text-gray-700 hover:text-pink-500 transition">Family</Link>
          <Link href="/login" className="px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          className="md:hidden text-pink-500 text-2xl"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <Link 
            href="/" 
            className="block px-6 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-500"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
        
          <Link 
            href="/family-login" 
            className="block px-6 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-500"
            onClick={() => setMenuOpen(false)}
          >
            Family
          </Link>
          <Link 
            href="/login" 
            className="block px-6 py-3 text-pink-500 font-semibold hover:bg-pink-100"
            onClick={() => setMenuOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;