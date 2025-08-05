"use client";
import React from "react";

const Button = ({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary",
  disabled = false,
  ...props 
}) => {
  const baseClasses = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-pink-500 text-white hover:bg-pink-600 focus:ring-pink-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
    outline: "border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white focus:ring-pink-500"
  };

  const disabledClasses = "opacity-50 cursor-not-allowed";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${disabled ? disabledClasses : ""} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
