import React, { useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import './MessageBoard.css';

const initialMessages = [
  { id: 1, author: 'Mostafa', text: 'We finally made it! Best class ever.', color: '#ffd3b6' },
  { id: 2, author: 'Ahmed', text: 'I will miss our late night debugging sessions.', color: '#d4f0f0' },
  { id: 3, author: 'Sara', text: 'Congrats Class of 2027! 🎉', color: '#ffaaa5' },
  { id: 4, author: 'Kareem', text: 'Time to build the future!', color: '#a8e6cf' },
];

const MessageBoard = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newText, setNewText] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const colors = ['#ffd3b6', '#d4f0f0', '#ffaaa5', '#a8e6cf', '#fdffab'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newText.trim()) return;

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newMessage = {
      id: Date.now(),
      author: newAuthor,
      text: newText,
      color: randomColor,
      imageUrl: newImageUrl.trim(),
    };

    setMessages([...messages, newMessage]);
    setNewAuthor('');
    setNewText('');
    setNewImageUrl('');
    setIsModalOpen(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="message-board-container">
      <div className="board-header">
        <h2 className="board-title">Sign Our Digital Yearbook</h2>
        <button className="btn btn-primary add-note-btn" onClick={() => setIsModalOpen(true)}>
          <MessageSquarePlus size={20} />
          Leave a Note
        </button>
      </div>

      <div className="notes-grid">
        {messages.map((msg) => (
          <div key={msg.id} className="sticky-note" style={{ backgroundColor: msg.color }}>
            <div className="pin"></div>
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
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>
            <h3 className="modal-title">Leave a Message</h3>
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
                />
              </div>
              <div className="form-group">
                <label>Upload Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ padding: '0.5rem', background: '#2a2a2a' }}
                />
              </div>
              <button type="submit" className="btn btn-primary submit-note-btn">
                Post Note
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
