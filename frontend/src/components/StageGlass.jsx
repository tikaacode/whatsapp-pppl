import React, { useLayoutEffect, useRef, useState } from 'react';
import { Glass } from '@samasante/liquid-glass';
import { WallpaperContent } from './WallpaperLayer';

/**
 * Calibrated Apple Liquid Glass optics presets for @samasante/liquid-glass.
 * Wide panels use gentler strength/curvature to prevent oval blooming;
 * round droplet orbs get stronger convex dome + rim meniscus + dispersion.
 */
export const GLASS_PRESETS = {
  card: {
    mapSize: 192,
    clipToShape: true,
    softEdge: true,
    depth: 0.72,
    curvature: 0.32,
    dispersion: 0.35,
    strength: 0.08,
    bend: 0.55,
    bendWidth: 0.12,
    frost: 3.5,
    brightness: 0.14,
    specular: 1.15,
    sheenAngle: 48,
    glow: 0.24,
    glowSpread: 1,
    glowFalloff: 1.2,
    sheen: 1.15,
    sheenWidth: 2.5,
    sheenFalloff: 1.4,
  },
  dock: {
    mapSize: 224,
    clipToShape: true,
    softEdge: true,
    depth: 0.85,
    curvature: 0.28,
    dispersion: 0.45,
    strength: 0.09,
    bend: 0.65,
    bendWidth: 0.13,
    frost: 4,
    brightness: 0.16,
    specular: 1.3,
    sheenAngle: 46,
    glow: 0.28,
    glowSpread: 1,
    glowFalloff: 1.1,
    sheen: 1.35,
    sheenWidth: 3,
    sheenFalloff: 1.3,
  },
  orb: {
    mapSize: 160,
    clipToShape: true,
    softEdge: true,
    depth: 0.95,
    curvature: 0.55,
    dispersion: 0.5,
    strength: 0.16,
    bend: 0.68,
    bendWidth: 0.14,
    frost: 3,
    brightness: 0.14,
    specular: 1.35,
    sheenAngle: 45,
    glow: 0.3,
    glowSpread: 1,
    glowFalloff: 1.1,
    sheen: 1.4,
    sheenWidth: 3,
    sheenFalloff: 1.2,
  },
};

function getOverlayStyles(variant, isDark) {
  if (variant === 'emeraldOrb' || variant === 'emeraldPill') {
    return {
      background:
        variant === 'emeraldOrb'
          ? 'radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.34) 0%, transparent 48%), linear-gradient(160deg, rgba(34, 139, 87, 0.62) 0%, rgba(17, 94, 58, 0.78) 100%)'
          : 'linear-gradient(180deg, rgba(28, 148, 88, 0.72) 0%, rgba(18, 112, 66, 0.86) 100%)',
      boxShadow:
        'inset 0 1.5px 1px rgba(255,255,255,0.82), inset 0 0 0 1px rgba(255,255,255,0.38), 0 10px 24px rgba(0,0,0,0.28)',
    };
  }

  if (variant === 'dock') {
    return {
      background: isDark
        ? 'linear-gradient(180deg, rgba(24, 30, 27, 0.44) 0%, rgba(16, 20, 18, 0.56) 100%)'
        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.52) 0%, rgba(255, 255, 255, 0.22) 100%)',
      boxShadow: isDark
        ? 'inset 0 1.5px 0 rgba(255,255,255,0.48), inset 0 0 0 1px rgba(255,255,255,0.22), 0 14px 32px rgba(0,0,0,0.52)'
        : 'inset 0 1.5px 0 rgba(255,255,255,0.92), inset 0 0 0 1px rgba(255,255,255,0.48), 0 14px 30px rgba(0,0,0,0.18)',
    };
  }

  if (variant === 'elevated') {
    return {
      background: isDark
        ? 'linear-gradient(180deg, rgba(28, 34, 31, 0.52) 0%, rgba(18, 22, 20, 0.42) 100%)'
        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.26) 100%)',
      boxShadow: isDark
        ? 'inset 0 1px 0 rgba(255,255,255,0.38), inset 0 0 0 1px rgba(255,255,255,0.16), 0 12px 28px rgba(0,0,0,0.46)'
        : 'inset 0 1px 0 rgba(255,255,255,0.90), inset 0 0 0 1px rgba(255,255,255,0.46), 0 10px 24px rgba(0,0,0,0.12)',
    };
  }

  return {
    background: isDark
      ? 'linear-gradient(180deg, rgba(22, 27, 25, 0.40) 0%, rgba(14, 18, 16, 0.30) 100%)'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.48) 0%, rgba(255, 255, 255, 0.18) 100%)',
    boxShadow: isDark
      ? 'inset 0 1px 0 rgba(255,255,255,0.34), inset 0 0 0 1px rgba(255,255,255,0.14), 0 10px 24px rgba(0,0,0,0.40)'
      : 'inset 0 1px 0 rgba(255,255,255,0.88), inset 0 0 0 1px rgba(255,255,255,0.42), 0 8px 20px rgba(0,0,0,0.10)',
  };
}

/**
 * StageGlass: Refracts the position-matched slice of the phone stage wallpaper
 * via @samasante/liquid-glass (`refract`), enabling real convex/meniscus bending
 * in Chrome, Edge, Safari (iOS/macOS), and Firefox.
 */
export const StageGlass = ({
  stageRef,
  wallpaper,
  isDark,
  variant = 'card',
  radius = 24,
  className = '',
  innerClassName = 'flex items-center',
  style = {},
  onClick,
  as: Tag = 'div',
  children,
  ...rest
}) => {
  const boxRef = useRef(null);
  const [box, setBox] = useState({ left: 0, top: 0, w: 0, h: 0, stageW: 0, stageH: 0 });

  useLayoutEffect(() => {
    const el = boxRef.current;
    const stage =
      stageRef?.current ||
      el?.closest('[data-glass-stage]') ||
      el?.closest('.device-shell');
    if (!el || !stage) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const next = {
        left: Math.round(r.left - s.left),
        top: Math.round(r.top - s.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
        stageW: Math.round(s.width),
        stageH: Math.round(s.height),
      };
      setBox((prev) =>
        prev.left === next.left &&
        prev.top === next.top &&
        prev.w === next.w &&
        prev.h === next.h &&
        prev.stageW === next.stageW &&
        prev.stageH === next.stageH
          ? prev
          : next
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(stage);
    const scrollParent = el.closest('[data-glass-scroll]');
    if (scrollParent) {
      scrollParent.addEventListener('scroll', measure, { passive: true });
    }
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      if (scrollParent) {
        scrollParent.removeEventListener('scroll', measure);
      }
      window.removeEventListener('resize', measure);
    };
  }, [stageRef]);

  const ready = box.w > 8 && box.h > 8 && box.stageW > 0 && box.stageH > 0;
  const presetKey =
    variant === 'dock' ? 'dock' : variant === 'orb' || variant === 'emeraldOrb' ? 'orb' : 'card';
  const baseOptics = GLASS_PRESETS[presetKey];
  const optics = {
    ...baseOptics,
    brightness: isDark ? -0.06 : baseOptics.brightness,
  };
  const overlayStyle = getOverlayStyles(variant, isDark);
  const behind = isDark ? wallpaper.behindDark : wallpaper.behindLight;

  return (
    <Tag
      ref={boxRef}
      onClick={onClick}
      className={`relative ${className}`}
      style={{ borderRadius: radius, ...style }}
      {...rest}
    >
      {ready && (
        <Glass
          optics={optics}
          brightnessInFilter
          width={box.w}
          height={box.h}
          radius={radius}
          behind={behind}
          refract={
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: -box.left,
                top: -box.top,
                width: box.stageW,
                height: box.stageH,
              }}
            >
              <WallpaperContent wallpaper={wallpaper} isDark={isDark} />
            </div>
          }
          style={{
            position: 'absolute',
            inset: 0,
            width: box.w,
            height: box.h,
            borderRadius: radius,
            pointerEvents: 'none',
          }}
        />
      )}

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
};

/**
 * MaterialGlass: Lightweight `@samasante/liquid-glass` material wrapper
 * for scrollable chat bubbles (zero DOM re-capture during scroll).
 */
export const MaterialGlass = ({
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
      ? 'rgba(22, 163, 74, 0.28)'
      : 'rgba(22, 163, 74, 0.24)'
    : isDark
    ? 'rgba(18, 22, 20, 0.42)'
    : 'rgba(255, 255, 255, 0.34)';

  return (
    <Glass
      optics={{
        ...GLASS_PRESETS.card,
        mapSize: 128,
        strength: 0.06,
        frost: 6,
        brightness: isDark ? -0.04 : 0.1,
      }}
      className={className}
      style={{
        background: bg,
        borderRadius: radius,
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255,255,255,0.30), inset 0 0 0 1px rgba(255,255,255,0.12), 0 8px 20px rgba(0,0,0,0.40)'
          : 'inset 0 1px 0 rgba(255,255,255,0.78), inset 0 0 0 1px rgba(255,255,255,0.34), 0 6px 16px rgba(0,0,0,0.12)',
        ...style,
      }}
    >
      {children}
    </Glass>
  );
};
