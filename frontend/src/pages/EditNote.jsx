import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import './NoteForm.css';

const EditNote = () => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        date: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        fetchNote();
    }, [id]);

    const fetchNote = async () => {
        try {
            const res = await api.get(`/notes/${id}`);
            const note = res.data;
            setFormData({
                title: note.title,
                content: note.content,
                date: new Date(note.date).toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('Error fetching note:', error);
            setError('Failed to load note');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.put(`/notes/${id}`, formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update note');
        }
    };

    if (loading) {
        return <div className="loading">Loading note...</div>;
    }

    return (
        <div className="note-form-container">
            <div className="note-form-card">
                <h2>Edit Note</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit} className="note-form">
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Enter note title"
                        />
                    </div>
                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Content</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            required
                            rows="10"
                            placeholder="Write your note here..."
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn-submit">Update Note</button>
                        <button type="button" onClick={() => navigate('/dashboard')} className="btn-cancel">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditNote;