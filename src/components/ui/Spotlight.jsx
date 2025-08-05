"use client";
import React from "react";

const Spotlight = ({ className, fill = "white" }) => {
  return (
    <svg
      className={`animate-pulse ${className}`}
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="40" fill={fill} opacity="0.1" />
      <circle cx="50" cy="50" r="20" fill={fill} opacity="0.3" />
    </svg>
  );
};

export { Spotlight };
