/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogIn, Sparkles } from 'lucide-react';
import { signInWithGoogle } from '../../firebase';

export const Login = () => {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        <div className="bg-white p-10 rounded-3xl border border-zinc-200 shadow-2xl shadow-black/5 text-center">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-black/10">
            <div className="w-8 h-8 border-4 border-white rotate-45" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tighter text-zinc-900 mb-4 uppercase">
            ARCHIVISION
          </h1>
          <p className="text-zinc-500 mb-10 text-lg leading-relaxed">
            The professional platform for architects to design, showcase, and market their vision in 2D and 3D.
          </p>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-black text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 group"
          >
            <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            Sign in with Google
          </button>

          <div className="mt-10 pt-8 border-t border-zinc-100 flex items-center justify-center gap-2 text-zinc-400 text-sm font-medium">
            <Sparkles size={16} className="text-yellow-500" />
            Powered by Gemini AI for Marketing
          </div>
        </div>
        
        <p className="mt-8 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
          © 2026 ARCHIVISION STUDIO
        </p>
      </div>
    </div>
  );
};
