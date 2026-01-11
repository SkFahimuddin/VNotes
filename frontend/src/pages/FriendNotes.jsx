import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './FriendNotes.css';

const FriendNotes = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [friendName, setFriendName] = useState('');
    const { friendId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchFriendNotes();
    }, [friendId]);

    const fetchFriendNotes = async () => {
        try {
            const res = await api.get(`/friends/${friendId}/notes`);
            setNotes(res.data);
            if (res.data.length > 0) {
                setFriendName(res.data[0].user.name);
            }
        } catch (error) {
            console.error('Error fetching friend notes:', error);
            alert(error.response?.data?.message || 'Failed to load notes');
            navigate('/friends');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return <div className="loading">Loading notes...</div>;
    }

    return (
        <div className="friend-notes-container">
            <div className="friend-notes-header">
                <button onClick={() => navigate('/friends')} className="btn-back">
                    ← Back to Friends
                </button>
                <h1>📓 {friendName}'s Notes</h1>
                <p>{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
            </div>

            {notes.length === 0 ? (
                <div className="empty-state">
                    <h2>No notes yet</h2>
                    <p>{friendName} hasn't created any notes yet.</p>
                </div>
            ) : (
                <div className="notes-grid">
                    {notes.map(note => (
                        <div key={note._id} className="friend-note-card">
                            <h3 className="note-title">{note.title}</h3>
                            <p className="note-date">📅 {formatDate(note.date)}</p>
                            <p className="note-content">{note.content}</p>
                            <div className="note-footer">
                                <span className="note-author">By {note.user.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendNotes;