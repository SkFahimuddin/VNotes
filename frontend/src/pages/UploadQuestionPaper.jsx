// frontend/src/pages/UploadQuestionPaper.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './UploadQuestionPaper.css';

const UploadQuestionPaper = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        schoolBoard: '',
        class: '',
        degree: '',
        department: '',
        semester: '',
        university: '',
        examName: '',
        examType: '',
        subject: '',
        year: new Date().getFullYear(),
        setNumber: 'Set 1',
        tags: ''
    });
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Check file size (10MB limit)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                setFile(null);
                setFileName('');
                e.target.value = '';
                return;
            }

            // Check file type
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!allowedTypes.includes(selectedFile.type)) {
                setError('Only PDF, JPG, PNG, and DOC files are allowed');
                setFile(null);
                setFileName('');
                e.target.value = '';
                return;
            }

            setFile(selectedFile);
            setFileName(selectedFile.name);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.category) {
            setError('Please select a category');
            return;
        }

        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        setUploading(true);
        try {
            // Create FormData object
            const submitData = new FormData();
            
            // Append file
            submitData.append('file', file);
            
            // Append basic fields
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('category', formData.category);
            submitData.append('subject', formData.subject);
            submitData.append('year', formData.year);
            submitData.append('setNumber', formData.setNumber);
            submitData.append('tags', formData.tags);

            // Append category-specific fields
            if (formData.category === 'school') {
                submitData.append('schoolBoard', formData.schoolBoard);
                submitData.append('class', formData.class);
            } else if (formData.category === 'college') {
                submitData.append('degree', formData.degree);
                submitData.append('department', formData.department);
                submitData.append('semester', formData.semester);
                submitData.append('university', formData.university);
            } else if (formData.category === 'entrance_exam' || formData.category === 'competitive_exam') {
                submitData.append('examName', formData.examName);
                submitData.append('examType', formData.category === 'entrance_exam' ? 'entrance' : 'competitive');
            }

            // Send request with FormData (axios will automatically set Content-Type to multipart/form-data)
            await api.post('/question-papers', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Question paper uploaded successfully!');
            navigate('/question-papers');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload question paper');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-container">
            <div className="upload-card">
                <h2>Upload Question Paper</h2>
                <p className="upload-subtitle">Help others by sharing question papers</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="upload-form">
                    {/* Basic Information */}
                    <div className="form-section">
                        <h3>Basic Information</h3>
                        
                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Mathematics End Semester Exam 2023"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Additional details about the question paper"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Category *</label>
                                <select 
                                    name="category" 
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="school">School</option>
                                    <option value="college">College</option>
                                    <option value="entrance_exam">Entrance Exam</option>
                                    <option value="competitive_exam">Competitive Exam</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Subject *</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Mathematics, Physics"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Year *</label>
                                <input
                                    type="number"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    required
                                    min="1990"
                                    max={new Date().getFullYear() + 1}
                                />
                            </div>

                            <div className="form-group">
                                <label>Set Number</label>
                                <input
                                    type="text"
                                    name="setNumber"
                                    value={formData.setNumber}
                                    onChange={handleChange}
                                    placeholder="Set 1, Set A, etc."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category Specific Fields */}
                    {formData.category === 'school' && (
                        <div className="form-section">
                            <h3>School Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Board *</label>
                                    <select 
                                        name="schoolBoard" 
                                        value={formData.schoolBoard}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Board</option>
                                        <option value="CBSE">CBSE</option>
                                        <option value="ICSE">ICSE</option>
                                        <option value="State Board">State Board</option>
                                        <option value="IB">IB</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Class *</label>
                                    <select 
                                        name="class" 
                                        value={formData.class}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {formData.category === 'college' && (
                        <div className="form-section">
                            <h3>College Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Degree *</label>
                                    <select 
                                        name="degree" 
                                        value={formData.degree}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Degree</option>
                                        <option value="undergraduate">Undergraduate</option>
                                        <option value="postgraduate">Postgraduate</option>
                                        <option value="diploma">Diploma</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>University *</label>
                                    <input
                                        type="text"
                                        name="university"
                                        value={formData.university}
                                        onChange={handleChange}
                                        required
                                        placeholder="University name"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Department *</label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., Computer Science, Mechanical"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Semester *</label>
                                    <select 
                                        name="semester" 
                                        value={formData.semester}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Semester</option>
                                        {[...Array(10)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {(formData.category === 'entrance_exam' || formData.category === 'competitive_exam') && (
                        <div className="form-section">
                            <h3>Exam Details</h3>
                            <div className="form-group">
                                <label>Exam Name *</label>
                                <input
                                    type="text"
                                    name="examName"
                                    value={formData.examName}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., JEE Main, NEET, UPSC CSE, SSC CGL"
                                />
                            </div>
                        </div>
                    )}

                    {/* File Upload */}
                    <div className="form-section">
                        <h3>Upload File</h3>
                        <div className="form-group">
                            <label>Select File *</label>
                            <div className="file-upload-wrapper">
                                <input
                                    type="file"
                                    id="file-input"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    required
                                    className="file-input"
                                />
                                <label htmlFor="file-input" className="file-input-label">
                                    <span className="file-icon">📎</span>
                                    <span className="file-text">
                                        {fileName || 'Choose a file...'}
                                    </span>
                                </label>
                            </div>
                            <small>Supported formats: PDF, JPG, PNG, DOC (Max size: 10MB)</small>
                        </div>

                        <div className="form-group">
                            <label>Tags (comma-separated)</label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="e.g., calculus, mechanics, important"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-submit" disabled={uploading}>
                            {uploading ? 'Uploading...' : '📤 Upload Question Paper'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => navigate('/question-papers')} 
                            className="btn-cancel"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadQuestionPaper;