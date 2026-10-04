import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, GraduationCap, Edit2, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, deleteDoc, updateDoc, doc, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './LightboxGallery.css';

// Dynamically import all images in the src/assets/imgs directory
const imagesImport = import.meta.glob('../assets/imgs/**/*.{png,jpg,jpeg,webp,gif}', { eager: true });

// Only Assiut branch
const ACTIVE_BRANCH = 'Assiut';

const LightboxGallery = () => {
  const [displayImages, setDisplayImages] = useState([]);
  const [localImages, setLocalImages] = useState([]);
  const [firebaseImages, setFirebaseImages] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchLimit, setFetchLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);
  const { isAdmin } = useAuth();

  // Load local images once — only Assiut
  useEffect(() => {
    let loadedImages = [];
    for (const path in imagesImport) {
      const module = imagesImport[path];
      if (!path.includes(`/${ACTIVE_BRANCH}/`)) continue;

      const filename = path.split('/').pop();
      const nameWithoutExtension = filename.replace(/\.[^/.]+$/, '');
      const studentName = nameWithoutExtension.replace(/[_-]/g, ' ');

      loadedImages.push({
        src: module.default,
        alt: `${studentName} - ${ACTIVE_BRANCH} Branch`,
        branch: ACTIVE_BRANCH,
        studentName: studentName,
        createdAt: 0,
      });
    }
    setLocalImages(loadedImages);
  }, []);

  // Listen to Firebase uploads for Assiut only in paginated groups
  useEffect(() => {
    const q = query(
      collection(db, 'uploads'),
      where('type', '==', 'Memories Gallery'),
      orderBy('createdAt', 'desc'),
      limit(fetchLimit)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let remote = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const normalizedBranch = data.branch ? data.branch.replace(' ', '_') : 'Unknown';
        // Only include Assiut images
        if (normalizedBranch !== ACTIVE_BRANCH) return;

        remote.push({
          id: docSnap.id,
          src: data.imageUrl,
          alt: `${data.name} - ${normalizedBranch} Branch`,
          branch: normalizedBranch,
          studentName: data.name,
          createdAt: data.createdAt || 0,
        });
      });

      setHasMore(querySnapshot.docs.length === fetchLimit);
      remote.sort((a, b) => b.createdAt - a.createdAt);
      setFirebaseImages(remote);
    });

    return () => unsubscribe();
  }, [fetchLimit]);

  // Combine Firebase + local images into displayed groups
  useEffect(() => {
    let combined = [...firebaseImages, ...localImages];

    // Mostafa Alshennawy always first
    combined.sort((a, b) => {
      const isMostafaA = a.studentName.toLowerCase().includes('mostafa alshennawy');
      const isMostafaB = b.studentName.toLowerCase().includes('mostafa alshennawy');
      if (isMostafaA && !isMostafaB) return -1;
      if (!isMostafaA && isMostafaB) return 1;
      return 0;
    });

    // Fallback placeholders if empty
    if (combined.length === 0) {
      for (let i = 1; i <= 3; i++) {
        combined.push({
          src: `https://via.placeholder.com/600x600/3b82f6/ffffff?text=Assiut+Student+${i}`,
          alt: `Student ${i} - Assiut Branch`,
          branch: ACTIVE_BRANCH,
          studentName: `Student ${i}`,
        });
      }
    }

    setDisplayImages(combined);
  }, [localImages, firebaseImages]);

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const handleEdit = async (img, e) => {
    e.stopPropagation();
    if (!img.id) return alert('Cannot edit local placeholder images');
    const newName = prompt('Enter new name:', img.studentName);
    if (newName && newName !== img.studentName) {
      try {
        await updateDoc(doc(db, 'uploads', img.id), { name: newName });
      } catch (error) {
        console.error('Error updating:', error);
      }
    }
  };

  const handleDelete = async (img, e) => {
    e.stopPropagation();
    if (!img.id) return alert('Cannot delete local placeholder images');
    if (window.confirm('Are you sure you want to delete this memory?')) {
      try {
        await deleteDoc(doc(db, 'uploads', img.id));
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  // Group loading observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setFetchLimit((prev) => prev + 20);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasMore]);

  return (
    <div className="gallery-container">
      <div className="gallery-grid">
        {displayImages.map((img, index) => (
          <div
            key={index}
            className="scrapbook-wrapper"
            onClick={() => openLightbox(index)}
          >
            <div className="scrapbook-title">{img.studentName}</div>
            <div className="gallery-item polaroid-frame">
              {isAdmin && img.id && (
                <div className="admin-gallery-controls">
                  <button onClick={(e) => handleEdit(img, e)} className="admin-btn edit-btn" title="Edit Name"><Edit2 size={16} /></button>
                  <button onClick={(e) => handleDelete(img, e)} className="admin-btn delete-btn" title="Delete Memory"><Trash2 size={16} /></button>
                </div>
              )}
              <div className="grad-cap-decoration">
                <GraduationCap size={40} strokeWidth={1.5} color="#111" fill="#111" />
              </div>
              <div className="year-decoration">
                <span>2</span>
                <span>0</span>
                <span>2</span>
                <span>7</span>
              </div>
              <div className="gallery-img-wrapper">
                <img src={img.src} alt={img.alt} loading="lazy" />
                <div className="gallery-overlay">
                  <span className="gallery-overlay-text">View Image</span>
                </div>
              </div>
              <div className="gallery-caption">
                <span className="student-status">SENIOR</span>
                <span className="branch-subtitle label-caps text-primary">{ACTIVE_BRANCH}</span>
              </div>
            </div>
            <div className="scrapbook-quote">Time flies, but memories last forever ✨</div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={observerTarget} style={{ height: '40px', width: '100%', margin: '2rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="loading-spinner" style={{ width: '30px', height: '30px', border: '3px solid var(--primary-container)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && displayImages[currentIndex] && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            <X size={32} />
          </button>
          <button className="lightbox-nav lightbox-prev" onClick={prevImage}>
            <ChevronLeft size={48} />
          </button>
          <button className="lightbox-nav lightbox-next" onClick={nextImage}>
            <ChevronRight size={48} />
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={displayImages[currentIndex].src}
              alt={displayImages[currentIndex].alt}
              className="lightbox-image"
            />
            <div className="lightbox-caption-box">
              <span className="lightbox-title">{displayImages[currentIndex].studentName}</span>
              <span className="lightbox-branch label-caps text-primary">
                {displayImages[currentIndex].branch} Branch
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LightboxGallery;
