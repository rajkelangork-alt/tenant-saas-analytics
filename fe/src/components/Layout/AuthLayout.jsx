import React from 'react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-gray-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-xl font-medium tracking-tight text-gray-900">
          {title || 'SaaS Analytics'}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-400">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 border border-gray-200 rounded-lg shadow-sm sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}