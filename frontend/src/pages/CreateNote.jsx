import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './NoteForm.css';

const CreateNote = () => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/notes', formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create note');
        }
    };

    return (
        <div className="note-form-container">
            <div className="note-form-card">
                <h2>Create New Note</h2>
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
                        <button type="submit" className="btn-submit">Create Note</button>
                        <button type="button" onClick={() => navigate('/dashboard')} className="btn-cancel">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateNote;