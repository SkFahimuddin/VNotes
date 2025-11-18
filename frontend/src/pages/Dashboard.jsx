import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NoteCard from '../components/NoteCard';
import api from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await api.get('/notes');
            setNotes(res.data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await api.delete(`/notes/${id}`);
                setNotes(notes.filter(note => note._id !== id));
            } catch (error) {
                console.error('Error deleting note:', error);
                alert('Failed to delete note');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading your notes...</div>;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Welcome back, {user?.name}! 👋</h1>
                    <p>You have {notes.length} note{notes.length !== 1 ? 's' : ''}</p>
                </div>
                <Link to="/create" className="btn-create">+ New Note</Link>
            </div>

            {notes.length === 0 ? (
                <div className="empty-state">
                    <h2>📝 No notes yet</h2>
                    <p>Start writing your first note!</p>
                    <Link to="/create" className="btn-create">Create Note</Link>
                </div>
            ) : (
                <div className="notes-grid">
                    {notes.map(note => (
                        <NoteCard key={note._id} note={note} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;