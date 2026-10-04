import React, { useState, useEffect } from 'react';
import { X, BookOpen, Image as ImageIcon, AlignLeft, Loader, Upload } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import './AddAlbumModal.css';

const AddAlbumModal = ({ onClose, editAlbum = null }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useUrlMode, setUseUrlMode] = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (editAlbum) {
      setTitle(editAlbum.title || '');
      setDescription(editAlbum.description || '');
      setCoverUrl(editAlbum.coverUrl || '');
      setPreviewUrl(editAlbum.coverUrl || '');
    }
  }, [editAlbum]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Album title is required.');
    setLoading(true);
    setError('');

    let finalCoverUrl = coverUrl.trim();

    // If a file was selected, compress and upload to ImgBB
    if (coverFile) {
      try {
        let fileToCompress = coverFile;
        const isHeic =
          coverFile.type === 'image/heic' ||
          coverFile.type === 'image/heif' ||
          coverFile.name.toLowerCase().endsWith('.heic') ||
          coverFile.name.toLowerCase().endsWith('.heif');

        if (isHeic) {
          const heicModule = await import('heic2any');
          const heic2any = heicModule.default || heicModule;
          const convertedBlob = await heic2any({
            blob: coverFile,
            toType: 'image/jpeg',
            quality: 0.8,
          });
          const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          fileToCompress = new File([blobToUse], coverFile.name.replace(/\.hei[cf]$/i, '.jpg'), {
            type: 'image/jpeg',
          });
        }

        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(fileToCompress, options);

        const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
        if (!apiKey) {
          throw new Error('ImgBB API key missing. Please add VITE_IMGBB_API_KEY to your .env file.');
        }

        const formData = new FormData();
        formData.append('image', compressedFile);

        const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          finalCoverUrl = data.data.url;
        } else {
          throw new Error(data.error?.message || 'Cover image upload failed');
        }
      } catch (err) {
        console.error('Error compressing/uploading cover image:', err);
        setError(`Cover upload error: ${err.message || err}`);
        setLoading(false);
        return;
      }
    }

    try {
      if (editAlbum) {
        await updateDoc(doc(db, 'albums', editAlbum.id), {
          title: title.trim(),
          description: description.trim(),
          coverUrl: finalCoverUrl,
        });
      } else {
        await addDoc(collection(db, 'albums'), {
          title: title.trim(),
          description: description.trim(),
          coverUrl: finalCoverUrl,
          branch: 'Assiut',
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err) {
      console.error('Error saving album:', err);
      setError('Failed to save album. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="album-modal-backdrop" onClick={onClose}>
      <div className="album-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="album-modal-header">
          <div className="album-modal-title-row">
            <BookOpen size={22} className="album-modal-icon" />
            <h2 className="album-modal-title">
              {editAlbum ? 'Edit Album' : 'New Album'}
            </h2>
          </div>
          <button className="album-modal-close" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="album-modal-form">
          {error && <div className="album-modal-error">{error}</div>}

          <div className="album-field">
            <label className="album-label">
              <BookOpen size={14} /> Album Title *
            </label>
            <input
              className="album-input"
              type="text"
              placeholder="e.g. Graduation Day 2027"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="album-field">
            <label className="album-label">
              <AlignLeft size={14} /> Description
            </label>
            <textarea
              className="album-input album-textarea"
              placeholder="A short description of this album…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Cover Image Upload / URL Mode */}
          <div className="album-field">
            <div className="album-label-row">
              <label className="album-label">
                <ImageIcon size={14} /> Album Cover Image
              </label>
              <button
                type="button"
                className="album-toggle-mode-btn"
                onClick={() => setUseUrlMode(!useUrlMode)}
                disabled={loading}
              >
                {useUrlMode ? 'Upload File Instead' : 'Use Image URL'}
              </button>
            </div>

            {!useUrlMode ? (
              <input
                className="album-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
              />
            ) : (
              <input
                className="album-input"
                type="url"
                placeholder="https://example.com/cover.jpg"
                value={coverUrl}
                onChange={(e) => {
                  setCoverUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                disabled={loading}
              />
            )}

            {previewUrl && (
              <div className="album-cover-preview">
                <img
                  src={previewUrl}
                  alt="Cover preview"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          <div className="album-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader size={16} className="spin-icon" /> : null}
              {loading
                ? (editAlbum ? 'Saving...' : 'Uploading & Creating...')
                : (editAlbum ? 'Save Changes' : 'Create Album')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAlbumModal;
