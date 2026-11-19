import React, { memo } from 'react';
import { Glass } from '@samasante/liquid-glass';

const BASE_CARD = {
  mapSize: 96,
  clipToShape: true,
  softEdge: true,
  depth: 0.72,
  curvature: 0.3,
  dispersion: 0,
  strength: 0.06,
  bend: 0.5,
  bendWidth: 0.12,
  frost: 4,
  saturate: 1.35,
  specular: 1.05,
  sheenAngle: 48,
  glow: 0.2,
  glowSpread: 1,
  glowFalloff: 1.2,
  sheen: 1.0,
  sheenWidth: 2.5,
  sheenFalloff: 1.4,
};

const BASE_DOCK = {
  mapSize: 112,
  clipToShape: true,
  softEdge: true,
  depth: 0.85,
  curvature: 0.28,
  dispersion: 0.32,
  strength: 0.08,
  bend: 0.6,
  bendWidth: 0.13,
  frost: 5,
  saturate: 1.45,
  specular: 1.2,
  sheenAngle: 46,
  glow: 0.24,
  glowSpread: 1,
  glowFalloff: 1.1,
  sheen: 1.25,
  sheenWidth: 3,
  sheenFalloff: 1.3,
};

const BASE_ORB = {
  mapSize: 96,
  clipToShape: true,
  softEdge: true,
  depth: 0.92,
  curvature: 0.5,
  dispersion: 0.35,
  strength: 0.12,
  bend: 0.62,
  bendWidth: 0.14,
  frost: 4,
  saturate: 1.45,
  specular: 1.25,
  sheenAngle: 45,
  glow: 0.26,
  glowSpread: 1,
  glowFalloff: 1.1,
  sheen: 1.3,
  sheenWidth: 3,
  sheenFalloff: 1.2,
};

// Module-level frozen optic presets so @samasante/liquid-glass never re-triggers
// geometry/displacement regeneration across parent React renders.
const OPTICS_TABLE = {
  card: {
    light: { ...BASE_CARD, brightness: 0.08 },
    dark: { ...BASE_CARD, brightness: -0.04 },
  },
  dock: {
    light: { ...BASE_DOCK, brightness: 0.1 },
    dark: { ...BASE_DOCK, brightness: -0.05 },
  },
  orb: {
    light: { ...BASE_ORB, brightness: 0.1 },
    dark: { ...BASE_ORB, brightness: -0.04 },
  },
};

function getOverlayStyles(variant, isDark) {
  if (variant === 'emeraldOrb' || variant === 'emeraldPill') {
    return {
      background:
        variant === 'emeraldOrb'
          ? 'radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.34) 0%, transparent 48%), linear-gradient(160deg, rgba(34, 139, 87, 0.68) 0%, rgba(17, 94, 58, 0.84) 100%)'
          : 'linear-gradient(180deg, rgba(28, 148, 88, 0.76) 0%, rgba(18, 112, 66, 0.90) 100%)',
      boxShadow:
        'inset 0 1.5px 1px rgba(255,255,255,0.82), inset 0 0 0 1px rgba(255,255,255,0.38), 0 10px 24px rgba(0,0,0,0.28)',
    };
  }

  if (variant === 'dock') {
    return {
      background: isDark
        ? 'linear-gradient(180deg, rgba(24, 30, 27, 0.46) 0%, rgba(16, 20, 18, 0.58) 100%)'
        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.54) 0%, rgba(255, 255, 255, 0.24) 100%)',
      boxShadow: isDark
        ? 'inset 0 1.5px 0 rgba(255,255,255,0.48), inset 0 0 0 1px rgba(255,255,255,0.22), 0 14px 32px rgba(0,0,0,0.52)'
        : 'inset 0 1.5px 0 rgba(255,255,255,0.92), inset 0 0 0 1px rgba(255,255,255,0.48), 0 14px 30px rgba(0,0,0,0.18)',
    };
  }

  if (variant === 'elevated') {
    return {
      background: isDark
        ? 'linear-gradient(180deg, rgba(28, 34, 31, 0.54) 0%, rgba(18, 22, 20, 0.44) 100%)'
        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.28) 100%)',
      boxShadow: isDark
        ? 'inset 0 1px 0 rgba(255,255,255,0.38), inset 0 0 0 1px rgba(255,255,255,0.16), 0 12px 28px rgba(0,0,0,0.46)'
        : 'inset 0 1px 0 rgba(255,255,255,0.90), inset 0 0 0 1px rgba(255,255,255,0.46), 0 10px 24px rgba(0,0,0,0.12)',
    };
  }

  return {
    background: isDark
      ? 'linear-gradient(180deg, rgba(22, 27, 25, 0.42) 0%, rgba(14, 18, 16, 0.32) 100%)'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.50) 0%, rgba(255, 255, 255, 0.20) 100%)',
    boxShadow: isDark
      ? 'inset 0 1px 0 rgba(255,255,255,0.34), inset 0 0 0 1px rgba(255,255,255,0.14), 0 10px 24px rgba(0,0,0,0.40)'
      : 'inset 0 1px 0 rgba(255,255,255,0.88), inset 0 0 0 1px rgba(255,255,255,0.42), 0 8px 20px rgba(0,0,0,0.10)',
  };
}

const ABS_GLASS_STYLE_CACHE = new Map();
function getAbsGlassStyle(radius) {
  if (!ABS_GLASS_STYLE_CACHE.has(radius)) {
    ABS_GLASS_STYLE_CACHE.set(radius, {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      display: 'block',
      borderRadius: radius,
      pointerEvents: 'none',
    });
  }
  return ABS_GLASS_STYLE_CACHE.get(radius);
}

const EMPTY_GLASS_CHILD = <span aria-hidden="true" />;

const MemoGlassLayer = memo(({ optics, radius }) => (
  <Glass optics={optics} radius={radius} style={getAbsGlassStyle(radius)}>
    {EMPTY_GLASS_CHILD}
  </Glass>
));
MemoGlassLayer.displayName = 'MemoGlassLayer';

/**
 * StageGlass: Uses @samasante/liquid-glass Material mode via a memoized layer
 * so typing or text updates inside the card never re-trigger SVG filter generation.
 */
export const StageGlass = memo(({
  isDark,
  variant = 'card',
  radius = 24,
  className = '',
  innerClassName = 'flex items-center',
  style = {},
  onClick,
  as: Tag = 'div',
  children,
  stageRef: _stageRef,
  wallpaper: _wallpaper,
  ...rest
}) => {
  const presetKey =
    variant === 'dock' ? 'dock' : variant === 'orb' || variant === 'emeraldOrb' ? 'orb' : 'card';
  const optics = OPTICS_TABLE[presetKey][isDark ? 'dark' : 'light'];
  const overlayStyle = getOverlayStyles(variant, isDark);

  return (
    <Tag
      onClick={onClick}
      className={`relative ${className}`}
      style={{ borderRadius: radius, ...style }}
      {...rest}
    >
      <MemoGlassLayer optics={optics} radius={radius} />

      <div
        className={`relative z-10 w-full h-full ${innerClassName}`}
        style={{
          borderRadius: radius,
          ...overlayStyle,
        }}
      >
        {children}
      </div>
    </Tag>
  );
});

StageGlass.displayName = 'StageGlass';

/**
 * MaterialGlass: Fast GPU-composited Liquid Glass styling for repeating
 * scrollable chat bubbles so long conversations stay at 60fps.
 */
export const MaterialGlass = memo(({
  isDark,
  variant = 'incoming',
  radius = 22,
  className = '',
  style = {},
  children,
}) => {
  const isOutgoing = variant === 'outgoing';
  const bg = isOutgoing
    ? isDark
      ? 'linear-gradient(180deg, rgba(22, 163, 74, 0.34) 0%, rgba(16, 118, 56, 0.24) 100%)'
      : 'linear-gradient(180deg, rgba(34, 197, 94, 0.28) 0%, rgba(22, 163, 74, 0.18) 100%)'
    : isDark
    ? 'linear-gradient(180deg, rgba(26, 33, 30, 0.56) 0%, rgba(16, 21, 19, 0.44) 100%)'
    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.34) 100%)';

  return (
    <div
      className={`backdrop-blur-md ${className}`}
      style={{
        background: bg,
        borderRadius: radius,
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255,255,255,0.34), inset 0 0 0 1px rgba(255,255,255,0.14), 0 8px 20px rgba(0,0,0,0.36)'
          : 'inset 0 1px 0 rgba(255,255,255,0.86), inset 0 0 0 1px rgba(255,255,255,0.40), 0 6px 16px rgba(0,0,0,0.10)',
        ...style,
      }}
    >
      {children}
    </div>
  );
});

MaterialGlass.displayName = 'MaterialGlass';
