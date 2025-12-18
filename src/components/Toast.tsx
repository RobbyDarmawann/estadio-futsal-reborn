"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  show: boolean;
  onClose?: () => void;
  duration?: number;
};

export default function Toast({ message, show, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className="fixed left-1/2 bottom-8 z-[80] -translate-x-1/2">
      <div className="max-w-lg px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-lg text-center text-sm text-gray-900">
        {message}
      </div>
    </div>
  );
}
