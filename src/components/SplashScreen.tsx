import React from 'react';

export function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[100]">
      <img 
        src="/Liafe logo.png"
        alt="Liafe"
        className="w-96 h-96 object-contain animate-splash"
      />
    </div>
  );
}