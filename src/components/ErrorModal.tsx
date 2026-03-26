"use client";

import { X, AlertCircle } from "lucide-react";
import { useEffect } from "react";

interface ErrorModalProps {
  error: string;
  onClose: () => void;
}

export default function ErrorModal({ error, onClose }: ErrorModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  if (!error) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-[#0a1122] border border-red-500/20 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in zoom-in slide-in-from-bottom-4 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
            <AlertCircle className="text-red-500" size={32} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white tracking-tight">Submission Error</h3>
            <p className="text-gray-400 font-medium leading-relaxed">
              {error}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 active:scale-[0.98]"
          >
            I'll Fix It
          </button>
        </div>
      </div>
    </div>
  );
}
