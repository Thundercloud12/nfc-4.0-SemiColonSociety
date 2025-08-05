import React from "react";

const Button = ({ text, click, className }) => {
  return (
    <button
      onClick={click}
      className={`px-6 py-3 rounded-full bg-pink-500 text-white hover:bg-pink-600 transition ${className}`}
    >
      {text}
    </button>
  );
};

export default Button;
