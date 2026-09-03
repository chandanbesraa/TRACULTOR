import React from 'react';

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default', // 'default', 'primary', 'income', 'expense', 'net'
  size = 'md',
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
      case 'net':
        return 'bg-[#1F5E3B] text-white border-[#16452B] shadow-sm';
      case 'income':
        return 'bg-emerald-50 text-[#1F5E3B] border-emerald-200';
      case 'expense':
        return 'bg-amber-50/60 text-amber-950 border-amber-200';
      default:
        return 'bg-white text-[#1A1A1A] border-[#E2E2DC]';
    }
  };

  const isNetOrPrimary = variant === 'primary' || variant === 'net';

  return (
    <div
      className={`rounded-2xl p-3.5 sm:p-4 border transition-all ${getVariantStyles()}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className={`text-xs font-bold uppercase tracking-wider ${
            isNetOrPrimary ? 'text-emerald-100/90' : 'text-gray-600'
          }`}
        >
          {title}
        </span>
        {Icon && (
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isNetOrPrimary
                ? 'bg-white/20 text-white'
                : variant === 'expense'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100/70 text-[#1F5E3B]'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div
        className={`font-black tracking-tight font-timer ${
          size === 'lg'
            ? 'text-2xl sm:text-3xl'
            : 'text-lg sm:text-xl'
        } ${
          isNetOrPrimary
            ? 'text-white'
            : variant === 'expense'
            ? 'text-amber-900'
            : variant === 'income'
            ? 'text-[#1F5E3B]'
            : 'text-[#1A1A1A]'
        }`}
      >
        {value}
      </div>

      {subtitle && (
        <div
          className={`text-[11px] mt-0.5 font-medium ${
            isNetOrPrimary ? 'text-emerald-200/80' : 'text-gray-500'
          }`}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
