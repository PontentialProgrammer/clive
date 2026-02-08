import React, { useState } from 'react';
import { Leaf, ArrowRight, Menu, X } from 'lucide-react';
import { SignedIn, SignedOut, SignUpButton, UserButton } from "@clerk/clerk-react";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-emerald-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        
        {/* LOGO SECTION */}
        <div className="flex items-center gap-2 text-xl font-bold text-emerald-900">
          <Leaf size={32} className="text-emerald-600" />
          <span>CLIVE</span>
        </div>

        {/* DESKTOP LINKS (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-slate-600 hover:text-emerald-600 font-medium">Features</a>
          <a href="#impact" className="text-slate-600 hover:text-emerald-600 font-medium">Impact</a>
          
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="bg-emerald-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-500 transition shadow-sm">
                Get Started <ArrowRight size={18} />
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* MOBILE MENU BUTTON (Hidden on Desktop) */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsOpen(!isOpen)} className="text-emerald-900">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-emerald-50 p-6 space-y-4 shadow-xl">
          <a href="#features" className="block text-lg font-medium text-slate-700">Features</a>
          <a href="#impact" className="block text-lg font-medium text-slate-700">Impact</a>
          <div className="pt-4 border-t border-emerald-50">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-3">
                <UserButton /> <span className="text-slate-600">My Account</span>
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;