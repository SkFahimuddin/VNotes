import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Friends.css';

const Friends = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [activeTab, setActiveTab] = useState('friends');
    const navigate = useNavigate();

    useEffect(() => {
        fetchFriends();
        fetchFriendRequests();
    }, []);

    const fetchFriends = async () => {
        try {
            const res = await api.get('/friends');
            setFriends(res.data);
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFriendRequests = async () => {
        try {
            const res = await api.get('/friends/requests');
            setFriendRequests(res.data);
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (searchQuery.trim().length < 2) {
            alert('Please enter at least 2 characters');
            return;
        }

        setSearching(true);
        try {
            const res = await api.get(`/friends/search?query=${searchQuery}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error('Error searching users:', error);
            alert('Failed to search users');
        } finally {
            setSearching(false);
        }
    };

    const sendFriendRequest = async (userId) => {
        try {
            await api.post(`/friends/request/${userId}`);
            alert('Friend request sent!');
            handleSearch({ preventDefault: () => {} }); // Refresh search results
        } catch (error) {
            console.error('Error sending friend request:', error);
            alert(error.response?.data?.message || 'Failed to send friend request');
        }
    };

    const acceptRequest = async (requestId) => {
        try {
            await api.put(`/friends/accept/${requestId}`);
            fetchFriendRequests();
            fetchFriends();
            alert('Friend request accepted!');
        } catch (error) {
            console.error('Error accepting request:', error);
            alert('Failed to accept friend request');
        }
    };

    const rejectRequest = async (requestId) => {
        try {
            await api.delete(`/friends/reject/${requestId}`);
            fetchFriendRequests();
            alert('Friend request rejected');
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Failed to reject friend request');
        }
    };

    const removeFriend = async (friendshipId) => {
        if (window.confirm('Are you sure you want to remove this friend?')) {
            try {
                await api.delete(`/friends/${friendshipId}`);
                fetchFriends();
                alert('Friend removed');
            } catch (error) {
                console.error('Error removing friend:', error);
                alert('Failed to remove friend');
            }
        }
    };

    const viewFriendNotes = (friendId) => {
        navigate(`/friends/${friendId}/notes`);
    };

    const getStatusButton = (user) => {
        if (user.friendshipStatus === 'accepted') {
            return <span className="status-badge status-friends">Friends ✓</span>;
        } else if (user.friendshipStatus === 'pending') {
            if (user.isRequester) {
                return <span className="status-badge status-pending">Request Sent</span>;
            } else {
                return <span className="status-badge status-pending">Pending Response</span>;
            }
        } else {
            return (
                <button 
                    onClick={() => sendFriendRequest(user._id)}
                    className="btn-add-friend"
                >
                    + Add Friend
                </button>
            );
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="friends-container">
            <div className="friends-header">
                <h1>👥 Friends</h1>
                <p>Connect with friends and share your notes</p>
            </div>

            {/* Search Section */}
            <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="search-input"
                    />
                    <button type="submit" className="btn-search" disabled={searching}>
                        {searching ? 'Searching...' : '🔍 Search'}
                    </button>
                </form>

                {searchResults.length > 0 && (
                    <div className="search-results">
                        <h3>Search Results</h3>
                        <div className="users-list">
                            {searchResults.map(user => (
                                <div key={user._id} className="user-card">
                                    <div className="user-info">
                                        <h4>{user.name}</h4>
                                        <p>{user.email}</p>
                                    </div>
                                    {getStatusButton(user)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    My Friends ({friends.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Friend Requests ({friendRequests.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'friends' ? (
                    <div className="friends-list">
                        {friends.length === 0 ? (
                            <div className="empty-state">
                                <p>No friends yet. Search and add friends to get started!</p>
                            </div>
                        ) : (
                            <div className="users-grid">
                                {friends.map(friend => (
                                    <div key={friend._id} className="friend-card">
                                        <div className="friend-info">
                                            <h4>{friend.name}</h4>
                                            <p>{friend.email}</p>
                                        </div>
                                        <div className="friend-actions">
                                            <button 
                                                onClick={() => viewFriendNotes(friend._id)}
                                                className="btn-view-notes"
                                            >
                                                📝 View Notes
                                            </button>
                                            <button 
                                                onClick={() => removeFriend(friend.friendshipId)}
                                                className="btn-remove"
                                            >
                                                ✕ Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="requests-list">
                        {friendRequests.length === 0 ? (
                            <div className="empty-state">
                                <p>No pending friend requests</p>
                            </div>
                        ) : (
                            <div className="users-grid">
                                {friendRequests.map(request => (
                                    <div key={request._id} className="request-card">
                                        <div className="request-info">
                                            <h4>{request.requester.name}</h4>
                                            <p>{request.requester.email}</p>
                                        </div>
                                        <div className="request-actions">
                                            <button 
                                                onClick={() => acceptRequest(request._id)}
                                                className="btn-accept"
                                            >
                                                ✓ Accept
                                            </button>
                                            <button 
                                                onClick={() => rejectRequest(request._id)}
                                                className="btn-reject"
                                            >
                                                ✕ Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Friends;