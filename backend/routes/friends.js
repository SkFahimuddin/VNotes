const express = require("express");
const router = express.Router();
const Friend = require("../models/Friend");
const User = require("../models/User");
const Note = require("../models/Note");
const authMiddleware = require("../middleware/auth");

// @route   GET /api/friends/search?query=
// @desc    Search for users by name or email
// @access  Private
router.get("/search", authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({ message: "Search query must be at least 2 characters" });
        }

        // Search for users excluding the current user
        const users = await User.find({
            _id: { $ne: req.user.id },
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } }
            ]
        }).select("name email").limit(10);

        // Get friendship status for each user
        const usersWithStatus = await Promise.all(users.map(async (user) => {
            const friendship = await Friend.findOne({
                $or: [
                    { requester: req.user.id, recipient: user._id },
                    { requester: user._id, recipient: req.user.id }
                ]
            });

            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                friendshipStatus: friendship ? friendship.status : null,
                isRequester: friendship && friendship.requester.toString() === req.user.id
            };
        }));

        res.json(usersWithStatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/friends/request/:userId
// @desc    Send a friend request
// @access  Private
router.post("/request/:userId", authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        if (userId === req.user.id) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself" });
        }

        // Check if user exists
        const recipient = await User.findById(userId);
        if (!recipient) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if friend request already exists
        const existingRequest = await Friend.findOne({
            $or: [
                { requester: req.user.id, recipient: userId },
                { requester: userId, recipient: req.user.id }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Friend request already exists" });
        }

        // Create friend request
        const friendRequest = new Friend({
            requester: req.user.id,
            recipient: userId,
            status: "pending"
        });

        await friendRequest.save();

        res.status(201).json({ message: "Friend request sent successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/friends/requests
// @desc    Get all pending friend requests (received)
// @access  Private
router.get("/requests", authMiddleware, async (req, res) => {
    try {
        const requests = await Friend.find({
            recipient: req.user.id,
            status: "pending"
        }).populate("requester", "name email");

        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   PUT /api/friends/accept/:requestId
// @desc    Accept a friend request
// @access  Private
router.put("/accept/:requestId", authMiddleware, async (req, res) => {
    try {
        const friendRequest = await Friend.findById(req.params.requestId);

        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (friendRequest.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        friendRequest.status = "accepted";
        friendRequest.updatedAt = Date.now();
        await friendRequest.save();

        res.json({ message: "Friend request accepted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   DELETE /api/friends/reject/:requestId
// @desc    Reject a friend request
// @access  Private
router.delete("/reject/:requestId", authMiddleware, async (req, res) => {
    try {
        const friendRequest = await Friend.findById(req.params.requestId);

        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (friendRequest.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await friendRequest.deleteOne();

        res.json({ message: "Friend request rejected" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/friends
// @desc    Get all friends
// @access  Private
router.get("/", authMiddleware, async (req, res) => {
    try {
        const friends = await Friend.find({
            $or: [
                { requester: req.user.id },
                { recipient: req.user.id }
            ],
            status: "accepted"
        }).populate("requester", "name email")
          .populate("recipient", "name email");

        // Format the response to show the friend (not the current user)
        const friendList = friends.map(friendship => {
            const friend = friendship.requester._id.toString() === req.user.id
                ? friendship.recipient
                : friendship.requester;
            
            return {
                _id: friend._id,
                name: friend.name,
                email: friend.email,
                friendshipId: friendship._id
            };
        });

        res.json(friendList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   DELETE /api/friends/:friendshipId
// @desc    Remove a friend
// @access  Private
router.delete("/:friendshipId", authMiddleware, async (req, res) => {
    try {
        const friendship = await Friend.findById(req.params.friendshipId);

        if (!friendship) {
            return res.status(404).json({ message: "Friendship not found" });
        }

        // Check if user is part of this friendship
        if (friendship.requester.toString() !== req.user.id && 
            friendship.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await friendship.deleteOne();

        res.json({ message: "Friend removed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/friends/:friendId/notes
// @desc    Get friend's notes
// @access  Private
router.get("/:friendId/notes", authMiddleware, async (req, res) => {
    try {
        // Check if they are friends
        const friendship = await Friend.findOne({
            $or: [
                { requester: req.user.id, recipient: req.params.friendId },
                { requester: req.params.friendId, recipient: req.user.id }
            ],
            status: "accepted"
        });

        if (!friendship) {
            return res.status(403).json({ message: "You must be friends to view their notes" });
        }

        // Get friend's notes
        const notes = await Note.find({ user: req.params.friendId })
            .sort({ date: -1 })
            .populate("user", "name email");

        res.json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;