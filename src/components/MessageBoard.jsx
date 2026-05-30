import React, { useState, useEffect, useRef } from 'react';
import { MessageSquarePlus, X, Edit2, Trash2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, updateDoc, doc, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './MessageBoard.css';

const MessageBoard = () => {
  const [messages, setMessages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const colors = ['#ffd3b6', '#d4f0f0', '#ffaaa5', '#a8e6cf', '#fdffab'];

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(fetchLimit));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setHasMore(querySnapshot.docs.length === fetchLimit);
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [fetchLimit]);

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
    setNewAuthor(msg.author);
    setNewText(msg.text);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newText.trim()) return;

    setIsSubmitting(true);
    let uploadedImageUrl = null;

    if (imageFile) {
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(imageFile, options);

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
          console.error("ImgBB upload failed:", data);
        }
      } catch (error) {
        console.error("Error compressing or uploading image:", error);
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
        await addDoc(collection(db, 'messages'), {
          author: newAuthor,
          text: newText,
          color: randomColor,
          imageUrl: uploadedImageUrl,
          createdAt: Date.now(),
        });
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

  return (
    <div className="message-board-container">
      <div className="board-header">
        <h2 className="board-title">Sign Our Digital Yearbook</h2>
        <button className="btn btn-primary add-note-btn" onClick={() => {
          setEditingMessage(null);
          setNewAuthor('');
          setNewText('');
          setIsModalOpen(true);
        }}>
          <MessageSquarePlus size={20} />
          Leave a Note
        </button>
      </div>

      <div className="notes-grid">
        {messages.length === 0 ? (
          <p style={{ color: '#888' }}>No notes yet. Be the first to sign the yearbook!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="sticky-note" style={{ backgroundColor: msg.color }}>
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
                  <img src={msg.imageUrl} alt="Attachment" />
                </div>
              )}
              <p className="note-text">"{msg.text}"</p>
              <p className="note-author">- {msg.author}</p>
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div ref={observerTarget} style={{ height: '40px', width: '100%', margin: '2rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="loading-spinner" style={{ width: '30px', height: '30px', border: '3px solid var(--primary-container)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal-btn" onClick={() => {
              setIsModalOpen(false);
              setEditingMessage(null);
              setNewAuthor('');
              setNewText('');
            }} disabled={isSubmitting}>
              <X size={24} />
            </button>
            <h3 className="modal-title">{editingMessage ? 'Edit Message' : 'Leave a Message'}</h3>
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
    </div>
  );
};

export default MessageBoard;
