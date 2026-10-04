import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import './AlbumViewer.css';

const AlbumViewer = ({ album, onClose }) => {
  const [photos, setPhotos] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch photos tagged with this album's id
  useEffect(() => {
    if (!album?.id) return;

    const q = query(
      collection(db, 'uploads'),
      where('albumId', '==', album.id),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        src: d.data().imageUrl,
        name: d.data().name || 'Unknown',
        alt: `${d.data().name} – ${album.title}`,
      }));
      setPhotos(list);
      setLoading(false);
    });

    return () => unsub();
  }, [album]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') setLightboxIndex((p) => (p + 1) % photos.length);
      if (e.key === 'ArrowLeft')  setLightboxIndex((p) => (p - 1 + photos.length) % photos.length);
      if (e.key === 'Escape')     setLightboxIndex(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, photos]);

  return (
    <>
      {/* ── Drawer ────────────────────────────────────── */}
      <div className="av-backdrop" onClick={onClose}>
        <div className="av-drawer" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="av-header">
            <div className="av-header-left">
              {album.coverUrl ? (
                <img src={album.coverUrl} alt={album.title} className="av-cover" />
              ) : (
                <div className="av-cover av-cover-placeholder">
                  <BookOpen size={24} />
                </div>
              )}
              <div>
                <h2 className="av-title">{album.title}</h2>
                {album.description && (
                  <p className="av-desc">{album.description}</p>
                )}
              </div>
            </div>
            <button className="av-close" onClick={onClose}>
              <X size={22} />
            </button>
          </div>

          {/* Photos grid */}
          <div className="av-body">
            {loading ? (
              <div className="av-loading">
                <div className="av-spinner" />
                <span>Loading photos…</span>
              </div>
            ) : photos.length === 0 ? (
              <div className="av-empty">
                <BookOpen size={48} opacity={0.25} />
                <p>No photos in this album yet.</p>
                <p className="av-empty-hint">
                  Tag a photo with this album by setting its <code>albumId</code> to <strong>{album.id}</strong>.
                </p>
              </div>
            ) : (
              <div className="av-grid">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="av-photo-card"
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <div className="av-photo-img-wrap">
                      <img src={photo.src} alt={photo.alt} loading="lazy" />
                      <div className="av-photo-overlay">
                        <span>View</span>
                      </div>
                    </div>
                    <span className="av-photo-name">{photo.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────── */}
      {lightboxIndex !== null && photos.length > 0 && (
        <div className="av-lightbox" onClick={() => setLightboxIndex(null)}>
          <button className="av-lb-close" onClick={() => setLightboxIndex(null)}>
            <X size={30} />
          </button>
          <button
            className="av-lb-nav av-lb-prev"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p - 1 + photos.length) % photos.length); }}
          >
            <ChevronLeft size={44} />
          </button>
          <div className="av-lb-content" onClick={(e) => e.stopPropagation()}>
            <img src={photos[lightboxIndex].src} alt={photos[lightboxIndex].alt} className="av-lb-img" />
            <div className="av-lb-caption">
              <span className="av-lb-name">{photos[lightboxIndex].name}</span>
              <span className="av-lb-album">{album.title}</span>
            </div>
          </div>
          <button
            className="av-lb-nav av-lb-next"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p + 1) % photos.length); }}
          >
            <ChevronRight size={44} />
          </button>
        </div>
      )}
    </>
  );
};

export default AlbumViewer;
