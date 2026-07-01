import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

export default function PhotoGallery({ photos = [], title = "" }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!photos || photos.length === 0) return null;

  const open = (i) => setLightboxIndex(i);
  const close = () => setLightboxIndex(null);

  if (photos.length === 1) {
    return (
      <>
        <button onClick={() => open(0)} className="w-full block focus:outline-none">
          <img src={photos[0]} alt={title} className="w-full h-64 object-cover" />
        </button>
        {lightboxIndex !== null && (
          <Lightbox photos={photos} index={lightboxIndex} setIndex={setLightboxIndex} onClose={close} title={title} />
        )}
      </>
    );
  }

  if (photos.length === 2) {
    return (
      <>
        <div className="grid grid-cols-2 h-64 gap-0.5">
          {photos.map((url, i) => (
            <button key={i} onClick={() => open(i)} className="overflow-hidden focus:outline-none">
              <img src={url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </button>
          ))}
        </div>
        {lightboxIndex !== null && (
          <Lightbox photos={photos} index={lightboxIndex} setIndex={setLightboxIndex} onClose={close} title={title} />
        )}
      </>
    );
  }

  // 3+ photos: hero left + 2 thumbnails right
  return (
    <>
      <div className="grid grid-cols-2 gap-0.5 h-72">
        <button onClick={() => open(0)} className="row-span-2 overflow-hidden focus:outline-none">
          <img src={photos[0]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        </button>
        {photos.slice(1, 3).map((url, i) => (
          <button key={i + 1} onClick={() => open(i + 1)} className="relative overflow-hidden focus:outline-none">
            <img src={url} alt={`${title} ${i + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            {i === 1 && photos.length > 3 && (
              <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white pointer-events-none">
                <Images className="w-5 h-5 mb-1" />
                <span className="font-heading font-bold text-xl">+{photos.length - 3}</span>
                <span className="text-xs opacity-80">more photos</span>
              </div>
            )}
          </button>
        ))}
      </div>
      {lightboxIndex !== null && (
        <Lightbox photos={photos} index={lightboxIndex} setIndex={setLightboxIndex} onClose={close} title={title} />
      )}
    </>
  );
}

function Lightbox({ photos, index, setIndex, onClose, title }) {
  const prev = () => setIndex(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex(i => (i + 1) % photos.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center" onClick={onClose}>
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pb-3 bg-gradient-to-b from-black/60 to-transparent z-10"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        <span className="text-white/60 text-sm font-semibold">{index + 1} / {photos.length}</span>
        <p className="text-white font-heading font-bold text-sm truncate max-w-[60%] text-center">{title}</p>
        <button onClick={onClose} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image */}
      <img
        src={photos[index]}
        alt={`${title} ${index + 1}`}
        className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
        style={{ padding: "0 48px" }}
        onClick={e => e.stopPropagation()}
      />

      {/* Prev / Next */}
      {photos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto no-scrollbar"
          onClick={e => e.stopPropagation()}
        >
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                i === index ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-90"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}