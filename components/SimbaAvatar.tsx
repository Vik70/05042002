import Image from "next/image";

export function SimbaAvatar({
  className = "",
  imageClassName = "",
  alt = "Simba",
}: {
  className?: string;
  imageClassName?: string;
  alt?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-full border border-lantern-gold/30 bg-lantern-gold/10 shadow-[0_0_28px_rgba(245,197,66,0.18)] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(245,197,66,0.24),transparent_70%)]" />
      <Image
        src="/sprites/simba.png"
        alt={alt}
        width={320}
        height={320}
        className={`relative h-full w-full scale-[1.28] object-cover object-[center_18%] ${imageClassName}`}
      />
    </div>
  );
}
