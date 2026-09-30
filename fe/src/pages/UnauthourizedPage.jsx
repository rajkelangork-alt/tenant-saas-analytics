import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UnauthourizedPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h1 className="text-lg font-semibold tracking-tight text-gray-900">Access Restricted</h1>
      <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
        Administrative privileges are required to manage workspace settings and API credentials.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-2xs transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Overview
      </Link>
    </div>
  );
}