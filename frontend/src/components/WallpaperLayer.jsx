import React from 'react';

const LIGHT_MESH_BG = [
  'radial-gradient(circle at 88% 8%, rgba(226, 238, 224, 0.72) 0%, rgba(163, 189, 168, 0.32) 32%, transparent 58%)',
  'radial-gradient(circle at 12% 38%, rgba(242, 246, 238, 0.58) 0%, rgba(186, 204, 188, 0.22) 34%, transparent 60%)',
  'radial-gradient(ellipse 55% 32% at 92% 54%, rgba(62, 84, 70, 0.45) 0%, transparent 65%)',
  'radial-gradient(circle at 42% 96%, rgba(215, 228, 214, 0.50) 0%, rgba(82, 104, 90, 0.24) 38%, transparent 64%)',
  'linear-gradient(180deg, #6B8273 0%, #83998A 50%, #596E60 100%)',
].join(', ');

const DARK_MESH_BG = [
  'radial-gradient(circle at 86% 10%, rgba(116, 178, 58, 0.55) 0%, rgba(56, 118, 36, 0.24) 32%, transparent 58%)',
  'radial-gradient(circle at 14% 36%, rgba(168, 214, 94, 0.40) 0%, rgba(62, 124, 42, 0.18) 34%, transparent 60%)',
  'radial-gradient(ellipse 55% 32% at 92% 52%, rgba(190, 232, 118, 0.32) 0%, rgba(34, 84, 28, 0.16) 36%, transparent 65%)',
  'radial-gradient(circle at 38% 96%, rgba(78, 142, 44, 0.42) 0%, rgba(14, 38, 18, 0.34) 40%, transparent 65%)',
  'linear-gradient(180deg, #1B3F19 0%, #122B14 50%, #071409 100%)',
].join(', ');

export const WallpaperContent = ({ wallpaper, isDark }) => {
  if (!wallpaper.url) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: isDark ? DARK_MESH_BG : LIGHT_MESH_BG,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: wallpaper.fallbackGradient,
      }}
    >
      <img
        src={wallpaper.url}
        alt={wallpaper.label}
        crossOrigin="anonymous"
        decoding="async"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          transform: 'scale(1.03)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.55) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.25) 100%)',
        }}
      />
    </div>
  );
};

export const WallpaperLayer = ({ wallpaper, isDark }) => (
  <div
    id="wallpaper-layer"
    aria-hidden="true"
    style={{ contain: 'strict', transform: 'translateZ(0)' }}
    className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
  >
    <WallpaperContent wallpaper={wallpaper} isDark={isDark} />
  </div>
);
