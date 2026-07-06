"use client";

import { useState } from "react";

type Props = {
  src: string | undefined;
  alt?: string;
  className?: string;
  emoji?: string;
};

export default function AnuncioFoto({
  src,
  alt = "",
  className = "w-full h-full object-cover",
  emoji = "🎸",
}: Props) {
  const [fallo, setFallo] = useState(false);

  if (!src || fallo) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-4xl sm:text-5xl">
        {emoji}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFallo(true)}
    />
  );
}
