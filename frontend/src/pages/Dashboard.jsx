import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NoteCard from '../components/NoteCard';
import api from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
    const [notes, setNotes] = useState([]);
    const [recentPapers, setRecentPapers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qpLoading, setQpLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotes();
        fetchRecentPapers();
        fetchStats();
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

    const fetchRecentPapers = async () => {
        try {
            // Fetch recent papers (limit to 5)
            const res = await api.get('/question-papers/search?limit=5');
            setRecentPapers(res.data.slice(0, 5));
        } catch (error) {
            console.error('Error fetching recent papers:', error);
        } finally {
            setQpLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/question-papers/stats/summary');
            // Calculate total papers
            const total = res.data.reduce((sum, stat) => sum + stat.count, 0);
            setStats({ categories: res.data, total });
        } catch (error) {
            console.error('Error fetching stats:', error);
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

    const handlePaperClick = (paper) => {
        navigate('/question-papers');
    };

    const handleDownload = async (e, paperId, fileUrl) => {
        e.stopPropagation();
        try {
            await api.put(`/question-papers/${paperId}/download`);
            
            if (fileUrl.startsWith('http')) {
                window.open(fileUrl, '_blank');
            } else {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                window.open(`${baseURL}${fileUrl}`, '_blank');
            }
        } catch (error) {
            console.error('Error downloading:', error);
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

            <div className="dashboard-content">
                {/* Notes Section */}
                <div className="notes-section">
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

                {/* Question Papers Sidebar */}
                <aside className="qp-sidebar">
                    <div className="qp-sidebar-header">
                        <h2>
                            <span className="qp-icon">📚</span>
                            Question Papers
                        </h2>
                        <button 
                            onClick={() => navigate('/question-papers')}
                            className="btn-view-all"
                        >
                            View All →
                        </button>
                    </div>

                    {qpLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                            Loading...
                        </div>
                    ) : recentPapers.length === 0 ? (
                        <div className="qp-empty">
                            <p>No question papers yet</p>
                            <button 
                                onClick={() => navigate('/question-papers/upload')}
                                className="btn-upload-mini"
                            >
                                + Upload First Paper
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="recent-papers">
                                {recentPapers.map(paper => (
                                    <div 
                                        key={paper._id} 
                                        className="qp-mini-card"
                                        onClick={() => handlePaperClick(paper)}
                                    >
                                        <div className="qp-mini-header">
                                            <div className="qp-mini-title">{paper.title}</div>
                                            <div className="qp-mini-year">{paper.year}</div>
                                        </div>
                                        <div className="qp-mini-details">
                                            📖 {paper.subject}
                                            {paper.schoolBoard && ` • ${paper.schoolBoard}`}
                                            {paper.class && ` • Class ${paper.class}`}
                                            {paper.university && ` • ${paper.university}`}
                                            {paper.examName && ` • ${paper.examName}`}
                                        </div>
                                        <div className="qp-mini-meta">
                                            <span>👁️ {paper.views}</span>
                                            <span>⬇️ {paper.downloads}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {stats && (
                                <div className="qp-stats">
                                    <h3>Quick Stats</h3>
                                    <div className="stats-grid">
                                        <div className="stat-item">
                                            <span className="stat-number">{stats.total}</span>
                                            <span className="stat-label">Total Papers</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-number">{stats.categories.length}</span>
                                            <span className="stat-label">Categories</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;