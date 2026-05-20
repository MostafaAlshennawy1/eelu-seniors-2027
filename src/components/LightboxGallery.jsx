import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import './LightboxGallery.css';

// Dynamically import all images in the src/assets/imgs directory
const imagesImport = import.meta.glob('../assets/imgs/**/*.{png,jpg,jpeg,webp,gif}', { eager: true });

const LightboxGallery = ({ activeTab }) => {
  const [images, setImages] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const branches = [
      'Assiut', 'Ain_shams', 'Alex', 'Sohag', 'Menoufia', 'Tanta',
      'Ismailia', 'Fayoum', 'Beni_Suef', 'Minya', 'Qena', 'Hurghada', 'Sadat'
    ];
    
    let loadedImages = [];
    
    // Process imported images
    for (const path in imagesImport) {
      const module = imagesImport[path];
      
      // Path looks like: ../assets/imgs/Assiut/Mostafa_Alshennawy.jpg
      let branchName = 'Unknown';
      
      // Find which branch this belongs to
      for (const branch of branches) {
        if (path.includes(`/${branch}/`)) {
          branchName = branch;
          break;
        }
      }

      // Extract student name from filename
      const filename = path.split('/').pop();
      const nameWithoutExtension = filename.replace(/\.[^/.]+$/, "");
      const studentName = nameWithoutExtension.replace(/[_-]/g, " ");

      loadedImages.push({
        src: module.default,
        alt: `${studentName} - ${branchName} Branch`,
        branch: branchName,
        studentName: studentName
      });
    }

    // Filter by active tab
    const targetBranches = activeTab === 'All' ? branches : [activeTab];
    let filteredImages = loadedImages.filter(img => targetBranches.includes(img.branch));

    // Sort to ensure Mostafa Alshennawy is displayed first
    filteredImages.sort((a, b) => {
      const isMostafaA = a.studentName.includes('Mostafa');
      const isMostafaB = b.studentName.includes('Mostafa');
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
  }, [activeTab]);

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
                loading="lazy"
              />
              <div className="gallery-overlay">
                <span className="gallery-overlay-text">View Image</span>
              </div>
            </div>
            <div className="gallery-caption">
              <span className="student-name">{img.studentName}</span>
              <span className="branch-subtitle label-caps text-primary">{img.branch.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>

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
