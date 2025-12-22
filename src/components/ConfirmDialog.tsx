"use client";

import { X, AlertTriangle } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
};

export default function ConfirmDialog({
  open,
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  onConfirm,
  onCancel,
  dangerous = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <AlertTriangle size={18} className={dangerous ? "text-red-600" : "text-yellow-600"} />
            {title}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-red-600">
            <X size={22} />
          </button>
        </div>
        <div className="p-6 text-sm text-gray-700 leading-relaxed">{message}</div>
        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-gray-200">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-bold text-white ${dangerous ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
