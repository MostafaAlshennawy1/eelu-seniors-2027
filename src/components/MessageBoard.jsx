import React, { useState, useEffect, useRef } from 'react';
import { MessageSquarePlus, X, Edit2, Trash2, ArrowLeft, BookOpen } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, updateDoc, doc, limit, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './MessageBoard.css';

import AddAlbumModal from './AddAlbumModal';

const MessageBoard = ({ selectedAlbum = null, onClearAlbum = () => {} }) => {
  const [messages, setMessages] = useState([]);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [showEditAlbumModal, setShowEditAlbumModal] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newText, setNewText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [fetchLimit, setFetchLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);
  const { isAdmin } = useAuth();

  const colors = ['#ffd3b6', '#d4f0f0', '#ffaaa5', '#a8e6cf', '#fdffab', '#f3c6ff', '#ffe3a8'];

  // Listen for main messages when no album is selected
  useEffect(() => {
    if (selectedAlbum) return;

    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(fetchLimit));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, sourceCollection: 'messages', ...docSnap.data() });
      });
      setHasMore(querySnapshot.docs.length === fetchLimit);
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [fetchLimit, selectedAlbum]);

  // Listen for album photos/notes when an album is selected
  useEffect(() => {
    if (!selectedAlbum?.id) {
      setAlbumPhotos([]);
      return;
    }

    // Query uploads for this album (sort in JS to avoid needing Firestore composite index)
    const qUploads = query(
      collection(db, 'uploads'),
      where('albumId', '==', selectedAlbum.id)
    );

    const unsubUploads = onSnapshot(qUploads, (snapUploads) => {
      const itemsFromUploads = snapUploads.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          sourceCollection: 'uploads',
          text: data.name || data.title || '',
          author: data.uploaderName || data.name || 'Classmate',
          imageUrl: data.imageUrl || data.url || null,
          createdAt: data.createdAt || 0,
        };
      });

      // Also query messages for this album
      const qMessages = query(
        collection(db, 'messages'),
        where('albumId', '==', selectedAlbum.id)
      );

      const unsubMessages = onSnapshot(qMessages, (snapMessages) => {
        const itemsFromMessages = snapMessages.docs.map((docSnap) => ({
          id: docSnap.id,
          sourceCollection: 'messages',
          ...docSnap.data(),
        }));

        // Combine both
        const combined = [...itemsFromUploads, ...itemsFromMessages].sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
        setAlbumPhotos(combined);
      });

      return () => unsubMessages();
    });

    return () => unsubUploads();
  }, [selectedAlbum]);

  // Infinite scroll observer for main messages
  useEffect(() => {
    if (selectedAlbum) return;

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
  }, [hasMore, observerTarget, selectedAlbum]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteDoc(doc(db, 'messages', id));
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  const handleEdit = (msg) => {
    setEditingMessage(msg);
    setNewAuthor(msg.author || '');
    setNewText(msg.text || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newText.trim()) return;

    setIsSubmitting(true);
    let uploadedImageUrl = null;

    if (imageFile) {
      try {
        let fileToCompress = imageFile;
        const isHeic =
          imageFile.type === 'image/heic' ||
          imageFile.type === 'image/heif' ||
          imageFile.name.toLowerCase().endsWith('.heic') ||
          imageFile.name.toLowerCase().endsWith('.heif');

        if (isHeic) {
          const heicModule = await import('heic2any');
          const heic2any = heicModule.default || heicModule;
          
          const convertedBlob = await heic2any({
            blob: imageFile,
            toType: 'image/jpeg',
            quality: 0.8
          });
          const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          fileToCompress = new File([blobToUse], imageFile.name.replace(/\.hei[cf]$/i, '.jpg'), {
            type: 'image/jpeg',
          });
        }

        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(fileToCompress, options);

        // Upload to ImgBB
        const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
        if (!apiKey) {
          throw new Error("ImgBB API key is missing. Please add VITE_IMGBB_API_KEY to your .env file.");
        }

        const formData = new FormData();
        formData.append('image', compressedFile);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          uploadedImageUrl = data.data.url;
        } else {
          throw new Error(data.error?.message || "ImgBB upload failed");
        }
      } catch (error) {
        console.error("Error compressing or uploading image:", error);
        alert(`Failed to process or upload image: ${error.message || error}\nPlease try a different image format.`);
        setIsSubmitting(false);
        return;
      }
    }

    if (editingMessage) {
      try {
        const updateData = {
          author: newAuthor,
          text: newText,
        };
        if (uploadedImageUrl) {
          updateData.imageUrl = uploadedImageUrl;
        }
        await updateDoc(doc(db, 'messages', editingMessage.id), updateData);
      } catch (error) {
        console.error("Error updating document: ", error);
      }
    } else {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      try {
        const newDoc = {
          author: newAuthor,
          text: newText,
          color: randomColor,
          imageUrl: uploadedImageUrl,
          createdAt: Date.now(),
        };

        // Attach albumId if an album is currently selected
        if (selectedAlbum?.id) {
          newDoc.albumId = selectedAlbum.id;
        }

        await addDoc(collection(db, 'messages'), newDoc);
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    }

    setNewAuthor('');
    setNewText('');
    setImageFile(null);
    setEditingMessage(null);
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleImageUpload = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleAlbumDelete = async () => {
    if (!selectedAlbum?.id) return;
    if (window.confirm(`Are you sure you want to delete the album "${selectedAlbum.title}"?`)) {
      try {
        await deleteDoc(doc(db, 'albums', selectedAlbum.id));
        onClearAlbum();
      } catch (err) {
        console.error('Error deleting album:', err);
      }
    }
  };

  const handleAlbumEdit = () => {
    setEditingAlbum(selectedAlbum);
    setShowEditAlbumModal(true);
  };

  const activeGridItems = selectedAlbum ? albumPhotos : messages;

  return (
    <div className="message-board-container" id="digital-yearbook-section">
      {/* Header section */}
      {selectedAlbum ? (
        <div className="board-header album-active-header">
          <div className="album-title-block">
            <div className="album-pill-badge">
              <BookOpen size={14} /> Album View
            </div>
            <h2 className="board-title">{selectedAlbum.title}</h2>
            {selectedAlbum.description && (
              <p className="album-active-desc">{selectedAlbum.description}</p>
            )}
          </div>

          <div className="album-header-actions">
            {isAdmin && (
              <>
                <button className="btn btn-outline album-action-btn" onClick={handleAlbumEdit} title="Edit Album Details">
                  <Edit2 size={16} /> Edit Album
                </button>
                <button className="btn btn-outline album-action-btn delete" onClick={handleAlbumDelete} title="Delete Album">
                  <Trash2 size={16} /> Remove Album
                </button>
              </>
            )}
            <button className="btn btn-outline return-main-btn" onClick={onClearAlbum}>
              <ArrowLeft size={18} />
              Return to Main Images
            </button>
            <button className="btn btn-primary add-note-btn" onClick={() => {
              setEditingMessage(null);
              setNewAuthor('');
              setNewText('');
              setImageFile(null);
              setIsModalOpen(true);
            }}>
              <MessageSquarePlus size={20} />
              Add Photo / Note to Album
            </button>
          </div>
        </div>
      ) : (
        <div className="board-header">
          <div>
            <h2 className="board-title">Sign Our Digital Yearbook</h2>
            <p className="board-subtitle">Leave notes, memories, and photos on our digital sticky board.</p>
          </div>
          <button className="btn btn-primary add-note-btn" onClick={() => {
            setEditingMessage(null);
            setNewAuthor('');
            setNewText('');
            setImageFile(null);
            setIsModalOpen(true);
          }}>
            <MessageSquarePlus size={20} />
            Leave a Note
          </button>
        </div>
      )}

      {/* Sticky Notes Grid */}
      <div className="notes-grid">
        {activeGridItems.length === 0 ? (
          <div className="empty-album-sticky">
            <div className="sticky-note empty-note">
              <div className="pin"></div>
              <p className="note-text">
                {selectedAlbum
                  ? `No photos or notes in "${selectedAlbum.title}" yet. Be the first to add one!`
                  : "No notes yet. Be the first to sign the yearbook!"}
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '12px' }}
                onClick={() => {
                  setEditingMessage(null);
                  setNewAuthor('');
                  setNewText('');
                  setImageFile(null);
                  setIsModalOpen(true);
                }}
              >
                <MessageSquarePlus size={16} />
                {selectedAlbum ? "Add First Photo" : "Leave a Note"}
              </button>
            </div>
          </div>
        ) : (
          activeGridItems.map((msg, index) => {
            const cardColor = msg.color || colors[index % colors.length];
            return (
              <div key={msg.id} className="sticky-note" style={{ backgroundColor: cardColor }}>
                <div className="pin"></div>
                {isAdmin && (
                  <div className="admin-note-controls">
                    <button onClick={() => handleEdit(msg)} className="admin-btn edit-btn" title="Edit Note"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(msg.id)} className="admin-btn delete-btn" title="Delete Note"><Trash2 size={16} /></button>
                  </div>
                )}
                {msg.imageUrl && (
                  <div
                    className="note-image"
                    onClick={() => setSelectedImage(msg.imageUrl)}
                    style={{ cursor: 'pointer' }}
                    title="Click to expand"
                  >
                    <img src={msg.imageUrl} alt={msg.text || "Attachment"} />
                  </div>
                )}
                {msg.text && <p className="note-text">"{msg.text}"</p>}
                {(msg.author || msg.name) && (
                  <p className="note-author">- {msg.author || msg.name}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Navigation to Return to Main Images */}
      {selectedAlbum && (
        <div className="album-bottom-nav">
          <button className="btn btn-primary btn-large return-main-btn-bottom" onClick={onClearAlbum}>
            <ArrowLeft size={20} />
            Return to Main Yearbook Images
          </button>
        </div>
      )}

      {/* Infinite Scroll Spinner for main notes */}
      {!selectedAlbum && hasMore && (
        <div ref={observerTarget} style={{ height: '40px', width: '100%', margin: '2rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="loading-spinner" style={{ width: '30px', height: '30px', border: '3px solid var(--primary-container)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Modal for adding/editing notes */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal-btn" onClick={() => {
              setIsModalOpen(false);
              setEditingMessage(null);
              setNewAuthor('');
              setNewText('');
              setImageFile(null);
            }} disabled={isSubmitting}>
              <X size={24} />
            </button>
            <h3 className="modal-title">{editingMessage ? 'Edit Message' : selectedAlbum ? `Add to ${selectedAlbum.title}` : 'Leave a Message'}</h3>
            <form onSubmit={handleSubmit} className="note-form">
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="John Doe"
                  maxLength={20}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Write something memorable..."
                  maxLength={120}
                  rows={4}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label>Upload Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ padding: '0.5rem', background: '#2a2a2a' }}
                  disabled={isSubmitting}
                />
              </div>
              <button type="submit" className="btn btn-primary submit-note-btn" disabled={isSubmitting}>
                {isSubmitting ? (editingMessage ? 'Updating...' : 'Posting...') : (editingMessage ? 'Update Note' : 'Post Note')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)} style={{ zIndex: 2000 }}>
          <button className="close-modal-btn" onClick={() => setSelectedImage(null)} style={{ position: 'fixed', top: '20px', right: '30px', color: '#fff', zIndex: 2001 }}>
            <X size={36} />
          </button>
          <div className="lightbox-image-container" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Expanded note attachment"
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}
            />
          </div>
        </div>
      )}

      {/* Album Edit Modal */}
      {showEditAlbumModal && (
        <AddAlbumModal
          onClose={() => {
            setShowEditAlbumModal(false);
            setEditingAlbum(null);
          }}
          editAlbum={editingAlbum}
        />
      )}
    </div>
  );
};

export default MessageBoard;
