"use client";
import React from "react";

const SkeletonLoader = ({ width = "100%", height = "1rem", className = "" }) => {
  return (
    <div
      className={`bg-gray-300 animate-pulse rounded ${className}`}
      style={{ width, height }}
    ></div>
  );
};

export default SkeletonLoader;
