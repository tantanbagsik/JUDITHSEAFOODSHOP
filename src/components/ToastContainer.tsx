'use client';

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore } from '@/lib/store/toast';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: 'from-green-500 to-emerald-500',
  error: 'from-red-500 to-rose-500',
  info: 'from-blue-500 to-cyan-500',
  warning: 'from-amber-500 to-orange-500',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-in"
          >
            <div className="flex items-start gap-3 p-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[toast.type]} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="flex-1 text-sm font-medium text-gray-900 pt-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="h-1 bg-gray-100">
              <div
                className={`h-full bg-gradient-to-r ${colorMap[toast.type]} animate-shrink`}
                style={{ animationDuration: `${toast.duration}ms` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
