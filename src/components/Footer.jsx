import React from 'react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-pink-500 text-white py-10 mt-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">MaternalCare</h2>
          <p className="text-sm text-pink-100">
            Empowering mothers with accessible healthcare, community support, and resources for a healthy journey.
          </p>
          <div className="flex gap-4 mt-4">
            <a href="#" className="hover:text-pink-200 transition"><FaFacebookF /></a>
            <a href="#" className="hover:text-pink-200 transition"><FaTwitter /></a>
            <a href="#" className="hover:text-pink-200 transition"><FaInstagram /></a>
            <a href="#" className="hover:text-pink-200 transition"><FaLinkedinIn /></a>
          </div>
        </div>

        {/* Services */}
        <nav>
          <h6 className="text-lg font-semibold mb-3">Services</h6>
          <ul className="space-y-2 text-pink-100">
            <li><a href="#" className="hover:text-white transition">Branding</a></li>
            <li><a href="#" className="hover:text-white transition">Design</a></li>
            <li><a href="#" className="hover:text-white transition">Marketing</a></li>
            <li><a href="#" className="hover:text-white transition">Advertisement</a></li>
          </ul>
        </nav>

        {/* Company */}
        <nav>
          <h6 className="text-lg font-semibold mb-3">Company</h6>
          <ul className="space-y-2 text-pink-100">
            <li><a href="#" className="hover:text-white transition">About Us</a></li>
            <li><a href="#" className="hover:text-white transition">Contact</a></li>
            <li><a href="#" className="hover:text-white transition">Jobs</a></li>
            <li><a href="#" className="hover:text-white transition">Press Kit</a></li>
          </ul>
        </nav>

        {/* Legal */}
        <nav>
          <h6 className="text-lg font-semibold mb-3">Legal</h6>
          <ul className="space-y-2 text-pink-100">
            <li><a href="#" className="hover:text-white transition">Terms of Use</a></li>
            <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
          </ul>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-pink-400 mt-10 pt-6 text-center text-sm text-pink-100">
        © {new Date().getFullYear()} MaternalCare. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
