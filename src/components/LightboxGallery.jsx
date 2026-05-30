import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, GraduationCap, Edit2, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, deleteDoc, updateDoc, doc, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './LightboxGallery.css';

// Dynamically import all images in the src/assets/imgs directory
const imagesImport = import.meta.glob('../assets/imgs/**/*.{png,jpg,jpeg,webp,gif}', { eager: true });

const LightboxGallery = ({ activeTab }) => {
  const [images, setImages] = useState([]);
  const [localImages, setLocalImages] = useState([]);
  const [firebaseImages, setFirebaseImages] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchLimit, setFetchLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);
  const { isAdmin } = useAuth();

  const branches = [
    'Assiut', 'Ain_shams', 'Alex', 'Sohag', 'Menoufia', 'Tanta',
    'Ismailia', 'Fayoum', 'Beni_Suef', 'Minya', 'Qena', 'Hurghada', 'Sadat'
  ];

  // Load local images once
  useEffect(() => {
    let loadedImages = [];
    for (const path in imagesImport) {
      const module = imagesImport[path];
      let branchName = 'Unknown';
      for (const branch of branches) {
        if (path.includes(`/${branch}/`)) {
          branchName = branch;
          break;
        }
      }
      const filename = path.split('/').pop();
      const nameWithoutExtension = filename.replace(/\.[^/.]+$/, "");
      const studentName = nameWithoutExtension.replace(/[_-]/g, " ");

      loadedImages.push({
        src: module.default,
        alt: `${studentName} - ${branchName} Branch`,
        branch: branchName,
        studentName: studentName,
        createdAt: 0 // Give local images an arbitrary old timestamp
      });
    }
    setLocalImages(loadedImages);
  }, []);

  // Listen to Firebase uploads that have the specific mark
  useEffect(() => {
    // We MUST use orderBy to ensure pagination grabs the correct images in order.
    // This requires a composite index in Firebase!
    const q = query(
      collection(db, 'uploads'),
      where('type', '==', 'Memories Gallery'),
      orderBy('createdAt', 'desc'),
      limit(fetchLimit)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let remote = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const normalizedBranch = data.branch ? data.branch.replace(' ', '_') : 'Unknown';
        
        remote.push({
          id: doc.id,
          src: data.imageUrl,
          alt: `${data.name} - ${normalizedBranch} Branch`,
          branch: normalizedBranch,
          studentName: data.name,
          createdAt: data.createdAt || 0
        });
      });
      
      // If the number of documents returned equals the limit, there might be more
      setHasMore(querySnapshot.docs.length === fetchLimit);
      
      // Sort in JS to avoid needing a composite index in Firestore
      remote.sort((a, b) => b.createdAt - a.createdAt);
      
      setFirebaseImages(remote);
    });
    return () => unsubscribe();
  }, [fetchLimit]);

  // Combine and filter images whenever activeTab, localImages, or firebaseImages change
  useEffect(() => {
    const targetBranches = activeTab === 'All' ? branches : [activeTab];
    let combined = [...firebaseImages, ...localImages]; // Firebase images first
    let filteredImages = combined.filter(img => targetBranches.includes(img.branch));

    // Sort to ensure Mostafa Alshennawy is displayed first
    filteredImages.sort((a, b) => {
      const isMostafaA = a.studentName.toLowerCase().includes('mostafa alshennawy');
      const isMostafaB = b.studentName.toLowerCase().includes('mostafa alshennawy');
      if (isMostafaA && !isMostafaB) return -1;
      if (!isMostafaA && isMostafaB) return 1;
      return 0;
    });

    // If no real images exist for this tab yet, generate fallback placeholders
    if (filteredImages.length === 0) {
      targetBranches.forEach(branch => {
        for (let i = 1; i <= 3; i++) {
          filteredImages.push({
            src: `https://via.placeholder.com/600x600/3b82f6/ffffff?text=${branch}+Student+${i}`,
            alt: `Student ${i} - ${branch} Branch`,
            branch: branch,
            studentName: `Student ${i}`
          });
        }
      });
    }

    setImages(filteredImages);
  }, [activeTab, localImages, firebaseImages]);

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
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleEdit = async (img, e) => {
    e.stopPropagation();
    if (!img.id) return alert("Cannot edit local placeholder images");
    const newName = prompt("Enter new name:", img.studentName);
    if (newName && newName !== img.studentName) {
      try {
        await updateDoc(doc(db, 'uploads', img.id), { name: newName });
      } catch (error) {
        console.error("Error updating:", error);
      }
    }
  };

  const handleDelete = async (img, e) => {
    e.stopPropagation();
    if (!img.id) return alert("Cannot delete local placeholder images");
    if (window.confirm("Are you sure you want to delete this memory?")) {
      try {
        await deleteDoc(doc(db, 'uploads', img.id));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setFetchLimit((prev) => prev + 20);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, observerTarget]);

  return (
    <div className="gallery-container">
      <div className="gallery-grid">
        {images.map((img, index) => (
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
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                />
                <div className="gallery-overlay">
                  <span className="gallery-overlay-text">View Image</span>
                </div>
              </div>
              <div className="gallery-caption">
                <span className="student-status">SENIOR</span>
                <span className="branch-subtitle label-caps text-primary">{img.branch.replace('_', ' ')}</span>
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

      {lightboxOpen && images.length > 0 && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            <X size={32} />
          </button>

          <button className="lightbox-nav lightbox-prev" onClick={prevImage}>
            <ChevronLeft size={48} />
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[currentIndex].src}
              alt={images[currentIndex].alt}
              className="lightbox-img"
            />
            <div className="lightbox-caption">
              <span className="lightbox-student-name">{images[currentIndex].studentName}</span>
              <span className="lightbox-branch-name">{images[currentIndex].branch.replace('_', ' ')} Branch</span>
            </div>
          </div>

          <button className="lightbox-nav lightbox-next" onClick={nextImage}>
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </div>
  );
};

export default LightboxGallery;
