import React from 'react';

export default function OrbitStatusBadge({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orbit text-orbit-light">
      {children}
    </span>
  );
}
