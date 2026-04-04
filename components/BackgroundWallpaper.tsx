export function BackgroundWallpaper() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/backgrounds/japan_bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,191,0.08),transparent_34%),linear-gradient(180deg,rgba(5,5,12,0.04),rgba(5,5,12,0.24))]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,26,0.12),transparent_18%,transparent_82%,rgba(10,10,26,0.12))]" />
    </div>
  );
}
