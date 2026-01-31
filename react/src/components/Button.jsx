import React from "react";

/**
 * Button Component - UDIP v2.1 Compliant
 * - cursor-pointer on all interactive elements
 * - Touch targets minimum 44x44px (WCAG 2.1 AAA compliance)
 * - Color/opacity transitions only (no scale transforms = no CLS)
 * - Proper focus-visible states
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const baseStyles =
    "cursor-pointer font-semibold rounded-lg transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const variants = {
    primary:
      "bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-600 shadow-sm hover:shadow-md",
    secondary:
      "bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:ring-slate-600",
    ghost:
      "text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-400",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm min-w-[44px] min-h-[44px] flex items-center justify-center",
    md: "px-6 py-2.5 text-base min-w-[44px] min-h-[44px] flex items-center justify-center",
    lg: "px-8 py-3.5 text-lg min-w-[44px] min-h-[44px] flex items-center justify-center",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
