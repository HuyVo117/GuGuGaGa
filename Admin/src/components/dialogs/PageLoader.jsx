// src/components/PageLoader.jsx
import React from "react";

const PageLoader = () => {
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Đang tải...</p>
      </div>
    </div>
  );
};

export default PageLoader;
