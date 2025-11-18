import { Link } from 'react-router-dom';
import './NoteCard.css';

const NoteCard = ({ note, onDelete }) => {
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="note-card">
            <h3 className="note-title">{note.title}</h3>
            <p className="note-date">📅 {formatDate(note.date)}</p>
            <p className="note-content">{note.content.substring(0, 150)}...</p>
            <div className="note-actions">
                <Link to={`/edit/${note._id}`} className="btn-edit">✏️ Edit</Link>
                <button onClick={() => onDelete(note._id)} className="btn-delete">🗑️ Delete</button>
            </div>
        </div>
    );
};

export default NoteCard;