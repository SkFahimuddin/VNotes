// frontend/src/pages/QuestionPapers.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './QuestionPapers.css';

const QuestionPapers = () => {
    const [category, setCategory] = useState('');
    const [filters, setFilters] = useState({
        schoolBoard: '',
        class: '',
        degree: '',
        department: '',
        semester: '',
        university: '',
        examName: '',
        subject: '',
        year: '',
        search: ''
    });
    const [questionPapers, setQuestionPapers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/question-papers/stats/summary');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleCategoryChange = (newCategory) => {
        setCategory(newCategory);
        setFilters({
            schoolBoard: '',
            class: '',
            degree: '',
            department: '',
            semester: '',
            university: '',
            examName: '',
            subject: '',
            year: '',
            search: ''
        });
        setQuestionPapers([]);
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!category) {
            alert('Please select a category first');
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({ category, ...filters });
            // Remove empty params
            for (let [key, value] of [...params.entries()]) {
                if (!value) params.delete(key);
            }
            
            const res = await api.get(`/question-papers/search?${params.toString()}`);
            setQuestionPapers(res.data);
        } catch (error) {
            console.error('Error searching:', error);
            alert('Failed to search question papers');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (paperId, fileUrl) => {
        try {
            await api.put(`/question-papers/${paperId}/download`);
            
            // Check if it's a local file or external URL
            if (fileUrl.startsWith('http')) {
                window.open(fileUrl, '_blank');
            } else {
                // For local files, construct the full URL
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                window.open(`${baseURL}${fileUrl}`, '_blank');
            }
        } catch (error) {
            console.error('Error downloading:', error);
        }
    };

    const getCategoryStats = (cat) => {
        const stat = stats.find(s => s._id === cat);
        return stat ? stat.count : 0;
    };

    return (
        <div className="qp-container">
            <div className="qp-header">
                <h1>📚 Question Papers Library</h1>
                <p>Search and download previous year question papers</p>
                <button 
                    onClick={() => navigate('/question-papers/upload')}
                    className="btn-upload"
                >
                    + Upload Question Paper
                </button>
            </div>

            {/* Category Selection */}
            <div className="category-section">
                <h2>Select Category</h2>
                <div className="category-grid">
                    <div 
                        className={`category-card ${category === 'school' ? 'active' : ''}`}
                        onClick={() => handleCategoryChange('school')}
                    >
                        <div className="category-icon">🏫</div>
                        <h3>School</h3>
                        <p>{getCategoryStats('school')} papers</p>
                    </div>
                    <div 
                        className={`category-card ${category === 'college' ? 'active' : ''}`}
                        onClick={() => handleCategoryChange('college')}
                    >
                        <div className="category-icon">🎓</div>
                        <h3>College</h3>
                        <p>{getCategoryStats('college')} papers</p>
                    </div>
                    <div 
                        className={`category-card ${category === 'entrance_exam' ? 'active' : ''}`}
                        onClick={() => handleCategoryChange('entrance_exam')}
                    >
                        <div className="category-icon">📝</div>
                        <h3>Entrance Exams</h3>
                        <p>{getCategoryStats('entrance_exam')} papers</p>
                    </div>
                    <div 
                        className={`category-card ${category === 'competitive_exam' ? 'active' : ''}`}
                        onClick={() => handleCategoryChange('competitive_exam')}
                    >
                        <div className="category-icon">🏆</div>
                        <h3>Competitive Exams</h3>
                        <p>{getCategoryStats('competitive_exam')} papers</p>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            {category && (
                <div className="filter-section">
                    <h2>Filters</h2>
                    <form onSubmit={handleSearch} className="filter-form">
                        <div className="filter-row">
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search by title, subject, or tags..."
                                className="filter-input full-width"
                            />
                        </div>

                        <div className="filter-row">
                            {/* School Filters */}
                            {category === 'school' && (
                                <>
                                    <select 
                                        name="schoolBoard" 
                                        value={filters.schoolBoard}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    >
                                        <option value="">Select Board</option>
                                        <option value="CBSE">CBSE</option>
                                        <option value="ICSE">ICSE</option>
                                        <option value="State Board">State Board</option>
                                        <option value="IB">IB</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <select 
                                        name="class" 
                                        value={filters.class}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    >
                                        <option value="">Select Class</option>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                                        ))}
                                    </select>
                                </>
                            )}

                            {/* College Filters */}
                            {category === 'college' && (
                                <>
                                    <select 
                                        name="degree" 
                                        value={filters.degree}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    >
                                        <option value="">Select Degree</option>
                                        <option value="undergraduate">Undergraduate</option>
                                        <option value="postgraduate">Postgraduate</option>
                                        <option value="diploma">Diploma</option>
                                    </select>
                                    <input
                                        type="text"
                                        name="university"
                                        value={filters.university}
                                        onChange={handleFilterChange}
                                        placeholder="University"
                                        className="filter-input"
                                    />
                                    <input
                                        type="text"
                                        name="department"
                                        value={filters.department}
                                        onChange={handleFilterChange}
                                        placeholder="Department"
                                        className="filter-input"
                                    />
                                    <select 
                                        name="semester" 
                                        value={filters.semester}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    >
                                        <option value="">Select Semester</option>
                                        {[...Array(10)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                                        ))}
                                    </select>
                                </>
                            )}

                            {/* Exam Filters */}
                            {(category === 'entrance_exam' || category === 'competitive_exam') && (
                                <input
                                    type="text"
                                    name="examName"
                                    value={filters.examName}
                                    onChange={handleFilterChange}
                                    placeholder="Exam Name (e.g., JEE, NEET, UPSC)"
                                    className="filter-input"
                                />
                            )}

                            {/* Common Filters */}
                            <input
                                type="text"
                                name="subject"
                                value={filters.subject}
                                onChange={handleFilterChange}
                                placeholder="Subject"
                                className="filter-input"
                            />
                            <input
                                type="number"
                                name="year"
                                value={filters.year}
                                onChange={handleFilterChange}
                                placeholder="Year"
                                min="1990"
                                max={new Date().getFullYear() + 1}
                                className="filter-input"
                            />
                        </div>

                        <button type="submit" className="btn-search" disabled={loading}>
                            {loading ? 'Searching...' : '🔍 Search'}
                        </button>
                    </form>
                </div>
            )}

            {/* Results Section */}
            {questionPapers.length > 0 && (
                <div className="results-section">
                    <h2>Results ({questionPapers.length})</h2>
                    <div className="qp-grid">
                        {questionPapers.map(paper => (
                            <div key={paper._id} className="qp-card">
                                <div className="qp-header-info">
                                    <h3>{paper.title}</h3>
                                    <span className="qp-year">{paper.year}</span>
                                </div>
                                
                                <div className="qp-details">
                                    <p><strong>Subject:</strong> {paper.subject}</p>
                                    {paper.setNumber && <p><strong>Set:</strong> {paper.setNumber}</p>}
                                    
                                    {paper.category === 'school' && (
                                        <>
                                            <p><strong>Board:</strong> {paper.schoolBoard}</p>
                                            <p><strong>Class:</strong> {paper.class}</p>
                                        </>
                                    )}
                                    
                                    {paper.category === 'college' && (
                                        <>
                                            <p><strong>University:</strong> {paper.university}</p>
                                            <p><strong>Department:</strong> {paper.department}</p>
                                            <p><strong>Semester:</strong> {paper.semester}</p>
                                            <p><strong>Degree:</strong> {paper.degree}</p>
                                        </>
                                    )}
                                    
                                    {(paper.category === 'entrance_exam' || paper.category === 'competitive_exam') && (
                                        <p><strong>Exam:</strong> {paper.examName}</p>
                                    )}
                                </div>

                                {paper.description && (
                                    <p className="qp-description">{paper.description}</p>
                                )}

                                <div className="qp-meta">
                                    <span>👁️ {paper.views} views</span>
                                    <span>⬇️ {paper.downloads} downloads</span>
                                </div>

                                <div className="qp-footer">
                                    <span className="qp-uploader">By {paper.uploadedBy?.name}</span>
                                    <button 
                                        onClick={() => handleDownload(paper._id, paper.fileUrl)}
                                        className="btn-download"
                                    >
                                        📥 Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {questionPapers.length === 0 && category && !loading && (
                <div className="empty-state">
                    <p>No question papers found. Try different filters or upload one!</p>
                </div>
            )}
        </div>
    );
};

export default QuestionPapers;