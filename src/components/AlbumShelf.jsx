import React, { useState, useEffect } from 'react';
import { BookOpen, Edit2, Trash2, Check } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import AddAlbumModal from './AddAlbumModal';
import './AlbumShelf.css';

const AlbumShelf = ({ selectedAlbum = null, onSelectAlbum = () => {} }) => {
  const [albums, setAlbums] = useState([]);
  const [editAlbum, setEditAlbum] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { isAdmin } = useAuth();

  // Real-time albums listener
  useEffect(() => {
    const q = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAlbums(list);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (album, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the album "${album.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'albums', album.id));
      if (selectedAlbum?.id === album.id) {
        onSelectAlbum(null);
      }
    } catch (err) {
      console.error('Error deleting album:', err);
    }
  };

  const handleEdit = (album, e) => {
    e.stopPropagation();
    setEditAlbum(album);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditAlbum(null);
  };

  return (
    <>
      <div className="album-shelf">
        <div className="album-shelf-header">
          <div className="album-shelf-label">
            <BookOpen size={16} />
            <span>Digital Yearbook Albums</span>
          </div>
          {selectedAlbum && (
            <button className="album-clear-selection-btn" onClick={() => onSelectAlbum(null)}>
              Viewing: <strong>{selectedAlbum.title}</strong> (Click to reset)
            </button>
          )}
        </div>

        {albums.length === 0 ? (
          <div className="album-shelf-empty">
            No albums created yet.
          </div>
        ) : (
          <div className="album-shelf-track">
            {albums.map((album) => {
              const isSelected = selectedAlbum?.id === album.id;
              return (
                <div
                  key={album.id}
                  className={`album-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectAlbum(isSelected ? null : album)}
                  title={isSelected ? 'Click to show main images' : `View ${album.title}`}
                >
                  {/* Cover thumbnail */}
                  <div className="album-chip-cover">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.title} />
                    ) : (
                      <div className="album-chip-placeholder">
                        <BookOpen size={22} />
                      </div>
                    )}
                    {isSelected && (
                      <div className="album-chip-active-badge">
                        <Check size={14} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="album-chip-info">
                    <span className="album-chip-title">{album.title}</span>
                    {album.description && (
                      <span className="album-chip-desc">{album.description}</span>
                    )}
                  </div>

                  {/* Album action controls (Edit & Delete) */}
                  {isAdmin && (
                    <div className="album-chip-controls">
                      <button
                        className="album-chip-btn edit"
                        onClick={(e) => handleEdit(album, e)}
                        title="Edit Album Title & Cover"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="album-chip-btn delete"
                        onClick={(e) => handleDelete(album, e)}
                        title="Remove Album"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal (triggered from chip) */}
      {showEditModal && (
        <AddAlbumModal onClose={closeEditModal} editAlbum={editAlbum} />
      )}
    </>
  );
};

export default AlbumShelf;
