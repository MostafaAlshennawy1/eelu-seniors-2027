import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import './LightboxGallery.css';

const LightboxGallery = ({ activeTab }) => {
  const [images, setImages] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // In Vite, we can dynamically load all images from the public directory
    // Note: Since they are in public, we can just assume a structure or mock them if empty.
    // For a real deployment, you'd either fetch from an API or use import.meta.glob inside src/assets
    // Here we will generate placeholders to demonstrate the UI, but allow them to be replaced by real images.
    
    // Simulate fetching images based on branch (activeTab)
    // If it's "All", combine them.
    const branches = [
      'Assiut', 'Ain_shams', 'Alex', 'Sohag', 'Menoufia', 'Tanta',
      'Ismailia', 'Fayoum', 'Beni_Suef', 'Minya', 'Qena', 'Hurghada', 'Sadat'
    ];
    
    let loadedImages = [];
    
    // Create some placeholder data since public folder images can't be listed via JS easily without an API
    // In a real scenario, the user will drop images here. We'll simulate 3 images per branch.
    const targetBranches = activeTab === 'All' ? branches : [activeTab];
    
    targetBranches.forEach(branch => {
      // Pushing simulated image paths (these won't exist until the user adds them, so we add a fallback)
      for (let i = 1; i <= 3; i++) {
        loadedImages.push({
          src: `/imgs/${branch}/student${i}.jpg`,
          alt: `${branch} Student ${i}`,
          fallback: `https://via.placeholder.com/600x600/3b82f6/ffffff?text=${branch}+Student+${i}`,
          branch: branch
        });
      }
    });

    setImages(loadedImages);
  }, [activeTab]);

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
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

  // Handle fallback image error
  const handleImageError = (e, fallbackSrc) => {
    e.target.src = fallbackSrc;
  };

  return (
    <div className="gallery-container">
      <div className="gallery-grid">
        {images.map((img, index) => (
          <div 
            key={index} 
            className="gallery-item"
            onClick={() => openLightbox(index)}
          >
            <div className="gallery-img-wrapper">
              <img 
                src={img.src} 
                alt={img.alt} 
                onError={(e) => handleImageError(e, img.fallback)}
                loading="lazy"
              />
              <div className="gallery-overlay">
                <span className="gallery-overlay-text">View Image</span>
              </div>
            </div>
            <div className="gallery-caption">
              <span className="label-caps text-primary">{img.branch.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>

      {lightboxOpen && (
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
              onError={(e) => handleImageError(e, images[currentIndex].fallback)}
              className="lightbox-img"
            />
            <div className="lightbox-caption">
              {images[currentIndex].branch.replace('_', ' ')} Branch
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
