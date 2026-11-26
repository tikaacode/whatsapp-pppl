import React, { memo } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { getRetroAvatarBackground } from '../data/themes';

/**
 * Crisp circular white button with 1.5px black ink outline (new-ui-1.jpg & new-ui-2.jpg).
 */
export const RetroCircleButton = memo(function RetroCircleButton({
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      className={`y2k-circle-btn ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

/**
 * Glossy 3D Y2K Pill Button (lime/theme accent or chrome/silver secondary).
 */
export const RetroPillButton = memo(function RetroPillButton({
  variant = 'accent',
  serif = false,
  className = '',
  children,
  ...rest
}) {
  const baseClass =
    variant === 'silver'
      ? 'y2k-pill-silver'
      : variant === 'danger'
      ? 'y2k-pill-danger'
      : 'y2k-pill-accent';

  return (
    <button
      type="button"
      className={`${baseClass} ${serif ? 'y2k-serif-btn' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

/**
 * Glossy circular action orb (floating scroll-to-bottom button, FAB, etc.).
 */
export const RetroOrbButton = memo(function RetroOrbButton({
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      className={`y2k-orb-accent ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

/**
 * Glossy circular avatar with crisp 1.5px ink border.
 */
export const RetroAvatar = memo(function RetroAvatar({
  initials,
  seed,
  photoUrl = '',
  alt = '',
  size = 'md',
  className = '',
}) {
  const sizeClass =
    size === 'xs'
      ? 'w-7 h-7 text-[10px]'
      : size === 'sm'
      ? 'w-9 h-9 text-xs'
      : size === 'lg'
      ? 'w-12 h-12 text-sm'
      : size === 'xl'
      ? 'w-20 h-20 text-xl'
      : 'w-10 h-10 text-[13px]';

  return (
    <div
      className={`rounded-full border-[1.5px] border-[#111300] flex items-center justify-center font-extrabold text-[#111300] shrink-0 overflow-hidden select-none ${sizeClass} ${className}`}
      style={photoUrl ? undefined : { background: getRetroAvatarBackground(seed || initials) }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={alt || initials} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
});

/**
 * Condensed outlined serif brand wordmark inspired by new-ui-2.jpg.
 */
export const RetroWordmark = memo(function RetroWordmark({
  text = 'WhatsNew',
  size = 'md',
  orbit = false,
  className = '',
}) {
  if (orbit) {
    return (
      <div className={`relative inline-block px-7 py-1.5 ${className}`}>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-5 inset-y-1 w-[calc(100%+40px)] h-[calc(100%-8px)]"
          viewBox="0 0 420 90"
          fill="none"
          preserveAspectRatio="none"
        >
          <ellipse
            cx="210"
            cy="46"
            rx="198"
            ry="26"
            stroke="#111300"
            strokeWidth="1.5"
            transform="rotate(-2.5 210 46)"
          />
        </svg>
        <span className="y2k-wordmark-hero relative z-10">{text}</span>
      </div>
    );
  }

  return (
    <span
      className={`${
        size === 'sm' ? 'y2k-wordmark-sm' : 'y2k-wordmark-md'
      } ${className}`}
    >
      {text}
    </span>
  );
});

/**
 * Message read/delivered/sent tick styled in crisp Y2K accent.
 */
export const TickIcon = memo(function TickIcon({ tick, className = '' }) {
  if (tick === 'read') {
    return (
      <CheckCheck
        className={`w-3.5 h-3.5 shrink-0 ${className}`}
        style={{ color: 'var(--y2k-tick)' }}
        strokeWidth={2.6}
      />
    );
  }
  if (tick === 'delivered') {
    return (
      <CheckCheck
        className={`w-3.5 h-3.5 text-[#767a70] shrink-0 ${className}`}
        strokeWidth={2.4}
      />
    );
  }
  return (
    <Check
      className={`w-3.5 h-3.5 text-[#767a70] shrink-0 ${className}`}
      strokeWidth={2.4}
    />
  );
});
