import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import axios from 'axios';

// Initialize SQLite Database
import db from './database.js';

const app = express();
app.use(cors());
app.use(express.json());

const googleClient = new OAuth2Client();

// Email Transporter (Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// In-Memory OTP Store
const otpStore = new Map();

// --- RAW SQL REST API ROUTES ---

// 1. Users & Auth (Simulated)
app.get('/api/users', (req, res) => {
    db.all("SELECT * FROM Users ORDER BY joinedAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/users', (req, res) => {
    const { email, password, name, role, avatar, color } = req.body;
    const stmt = db.prepare("INSERT INTO Users (email, password, name, role, avatar, color) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run([email, password, name, role || 'user', avatar || '👤', color || '#6c5ce7'], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, email, name, role });
    });
    stmt.finalize();
});

app.delete('/api/users/:email', (req, res) => {
    if (req.params.email === 'admin@mood.com') return res.status(403).json({ error: "Cannot delete admin" });
    db.run("DELETE FROM Users WHERE email = ?", [req.params.email], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.put('/api/users/:email/role', (req, res) => {
    if (req.params.email === 'admin@mood.com') return res.status(403).json({ error: "Cannot change admin role" });
    const { role } = req.body;
    db.run("UPDATE Users SET role = ? WHERE email = ?", [role, req.params.email], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: this.changes });
    });
});

// Google OAuth Registration / Login
app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.VITE_GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name: googleName } = payload;
        
        db.get("SELECT * FROM Users WHERE email = ?", [email], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (row) {
                // User exists, log them in
                res.json(row);
            } else {
                // Register Google User with Anonymous Identity by default
                const colors = ["#ff7675", "#74b9ff", "#55efc4", "#a29bfe", "#fdcb6e"];
                const avatars = ["🦊", "🐼", "🐸", "🐱", "🦉", "🐙", "🦋", "🍄"];
                const avatar = avatars[Math.floor(Math.random() * avatars.length)];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const anonName = googleName.split(' ')[0] + " " + avatars[Math.floor(Math.random() * avatars.length)]; 

                const stmt = db.prepare("INSERT INTO Users (email, password, name, role, avatar, color) VALUES (?, ?, ?, ?, ?, ?)");
                stmt.run([email, 'google_oauth', anonName, 'user', avatar, color], function(err) {
                    if (err) return res.status(400).json({ error: err.message });
                    res.json({ id: this.lastID, email, name: anonName, role: 'user', avatar, color });
                });
                stmt.finalize();
            }
        });
    } catch (err) {
        res.status(401).json({ error: "Invalid Google ID Token" });
    }
});

// Custom Google OAuth (Implicit Flow with Access Token)
app.post('/api/auth/google-custom', async (req, res) => {
    const { access_token } = req.body;
    try {
        // Fetch user info from Google using the access token
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        
        const { email, name: googleName } = response.data;
        
        db.get("SELECT * FROM Users WHERE email = ?", [email], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (row) {
                res.json(row);
            } else {
                const colors = ["#ff7675", "#74b9ff", "#55efc4", "#a29bfe", "#fdcb6e"];
                const avatars = ["🦊", "🐼", "🐸", "🐱", "🦉", "🐙", "🦋", "🍄"];
                const avatar = avatars[Math.floor(Math.random() * avatars.length)];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const anonName = googleName.split(' ')[0] + " " + avatars[Math.floor(Math.random() * avatars.length)]; 

                const stmt = db.prepare("INSERT INTO Users (email, password, name, role, avatar, color) VALUES (?, ?, ?, ?, ?, ?)");
                stmt.run([email, 'google_oauth_custom', anonName, 'user', avatar, color], function(err) {
                    if (err) return res.status(400).json({ error: err.message });
                    res.json({ id: this.lastID, email, name: anonName, role: 'user', avatar, color });
                });
                stmt.finalize();
            }
        });
    } catch (err) {
        console.error("Google Custom Auth Error:", err.message);
        res.status(401).json({ error: "Invalid Google Access Token" });
    }
});

// Simple Email OTP Registration Flow
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    db.get("SELECT * FROM Users WHERE email = ?", [email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: "Email already registered" });

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        otpStore.set(email, { otp, expires: Date.now() + 10 * 60000, type: 'signup' });

        try {
            await transporter.sendMail({
                from: `"Mood Refreshment App" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Your Authentication Code",
                html: `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
                        <h2>Verify Your Email</h2>
                        <p>Your secure verification code is:</p>
                        <h1 style="color: #6c5ce7; font-size: 40px; letter-spacing: 5px;">${otp}</h1>
                        <p>This code expires in 10 minutes.</p>
                    </div>`
            });
            res.json({ success: true, message: "OTP Sent" });
        } catch (error) {
            console.error("Nodemailer Error:", error);
            res.status(500).json({ error: "Failed to send email. Check App Password." });
        }
    });
});

// Password Reset Flow
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    db.get("SELECT * FROM Users WHERE email = ?", [email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "We couldn't find an account with that email 📬" });

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        // Tag it as a reset OTP to distinguish from signup
        otpStore.set(email, { otp, expires: Date.now() + 10 * 60000, type: 'reset' });

        try {
            await transporter.sendMail({
                from: `"Mood Refreshment App" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Reset Your Password",
                html: `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
                        <h2>Password Reset Code</h2>
                        <p>Use the code below to reset your password:</p>
                        <h1 style="color: #ff7675; font-size: 40px; letter-spacing: 5px;">${otp}</h1>
                        <p>This code expires in 10 minutes.</p>
                    </div>`
            });
            res.json({ success: true, message: "Reset code sent" });
        } catch (error) {
            console.error("Nodemailer Error:", error);
            res.status(500).json({ error: "Failed to send email. Check App Password." });
        }
    });
});

app.post('/api/auth/reset-password', (req, res) => {
    const { email, otp, newPassword } = req.body;
    
    const storedData = otpStore.get(email);
    if (!storedData || storedData.type !== 'reset') {
        return res.status(400).json({ error: "Reset code expired or not requested" });
    }
    
    if (Date.now() > storedData.expires) {
        otpStore.delete(email);
        return res.status(400).json({ error: "Reset code has expired" });
    }
    
    if (storedData.otp !== otp) {
        return res.status(400).json({ error: "Invalid Reset Code" });
    }
    
    // Check if new password is same as current
    db.get("SELECT password FROM Users WHERE email = ?", [email], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row && row.password === newPassword) {
            return res.status(400).json({ error: "New password cannot be the same as your current one 🔐" });
        }

        // OTP matches & password is new! Update password in DB
        db.run("UPDATE Users SET password = ? WHERE email = ?", [newPassword, email], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            otpStore.delete(email); // Clean up
            res.json({ success: true, message: "Password updated successfully ✨" });
        });
    });
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { email, password, otp } = req.body;
    
    const storedData = otpStore.get(email);
    if (!storedData) return res.status(400).json({ error: "OTP expired or not requested" });
    if (Date.now() > storedData.expires) {
        otpStore.delete(email);
        return res.status(400).json({ error: "OTP has expired" });
    }
    
    if (storedData.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP code" });
    }
    
    // OTP matches! Delete to prevent reuse
    otpStore.delete(email);

    // Auto-generate generic user avatar visually
    const colors = ["#ff7675", "#74b9ff", "#55efc4", "#a29bfe", "#fdcb6e"];
    const avatars = ["🦊", "🐼", "🐸", "🐱", "🦉", "🐙", "🦋", "🍄"];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const name = email.split('@')[0]; // Build a default username from the email

    const stmt = db.prepare("INSERT INTO Users (email, password, name, role, avatar, color) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run([email, password, name, 'user', avatar, color], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, email, name, role: 'user', avatar, color });
    });
    stmt.finalize();
});

// Update User Identity (Name, Avatar, Color)
app.put('/api/users/:email', (req, res) => {
    const { email } = req.params;
    const { name, avatar, color } = req.body;
    
    db.run(
        "UPDATE Users SET name = ?, avatar = ?, color = ? WHERE email = ?",
        [name, avatar, color, email],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "User not found" });
            
            // Return the updated user object
            db.get("SELECT * FROM Users WHERE email = ?", [email], (err, row) => {
                res.json(row);
            });
        }
    );
});

// 2. Mood Logging
app.get('/api/moods', (req, res) => {
    const { userId } = req.query;
    let query = "SELECT * FROM MoodEntries";
    let params = [];
    
    if (userId) {
        query += " WHERE userId = ?";
        params.push(userId);
    }
    
    query += " ORDER BY createdAt DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/moods', (req, res) => {
    const { userId, mood, energy, label } = req.body;
    const stmt = db.prepare("INSERT INTO MoodEntries (userId, mood, energy, label) VALUES (?, ?, ?, ?)");
    stmt.run([userId || null, mood, energy || 50, label], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        db.get("SELECT * FROM MoodEntries WHERE id = ?", [this.lastID], (err, row) => {
            res.json(row);
        });
    });
    stmt.finalize();
});

// 3. Journaling
app.get('/api/journals', (req, res) => {
    const { userId } = req.query;
    let query = "SELECT * FROM JournalEntries";
    let params = [];
    
    if (userId) {
        query += " WHERE userId = ?";
        params.push(userId);
    }
    
    query += " ORDER BY createdAt DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/journals', (req, res) => {
    const { userId, title, content, mood } = req.body;
    const stmt = db.prepare("INSERT INTO JournalEntries (userId, title, content, mood) VALUES (?, ?, ?, ?)");
    stmt.run([userId || null, title, content, mood], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        db.get("SELECT * FROM JournalEntries WHERE id = ?", [this.lastID], (err, row) => {
            res.json(row);
        });
    });
    stmt.finalize();
});

app.put('/api/journals/:id', (req, res) => {
    const { title, content, mood } = req.body;
    db.run("UPDATE JournalEntries SET title = ?, content = ?, mood = ? WHERE id = ?", 
        [title, content, mood, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get("SELECT * FROM JournalEntries WHERE id = ?", [req.params.id], (err, row) => {
            res.json(row);
        });
    });
});

// 4. Quotes / Motivation
app.get('/api/quotes', (req, res) => {
    db.all("SELECT * FROM Quotes ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.text));
    });
});

app.post('/api/quotes', (req, res) => {
    const { text } = req.body;
    const stmt = db.prepare("INSERT INTO Quotes (text) VALUES (?)");
    stmt.run([text], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, text });
    });
    stmt.finalize();
});

// 5. Chat History
app.get('/api/chats/:room', (req, res) => {
    db.all("SELECT * FROM ChatMessages WHERE roomName = ? ORDER BY createdAt ASC LIMIT 100", [req.params.room], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173", "http://localhost:5174", 
            "http://192.168.2.186:5173", "http://192.168.2.186:5174"
        ],
        methods: ["GET", "POST"],
    },
});

// Store user counts per room
const usersInRooms = {};

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_room", (data) => {
        socket.join(data);

        // Track users
        if (!usersInRooms[data]) usersInRooms[data] = 0;
        usersInRooms[data]++;

        console.log(`User with ID: ${socket.id} joined room: ${data}`);

        // Broadcast updated user count
        io.to(data).emit("room_data", { users: usersInRooms[data] });
        // Broadcast ALL room data globally
        io.emit("global_room_data", usersInRooms);
    });

    socket.on("send_message", (data) => {
        console.log("Message received:", data);
        
        // Save Message to SQL Database
        const stmt = db.prepare("INSERT INTO ChatMessages (roomName, senderName, text, color) VALUES (?, ?, ?, ?)");
        stmt.run([data.room, data.sender, data.text, data.color], function(err) {
            if (err) console.error("Database Save Error:", err.message);
        });
        stmt.finalize();

        socket.to(data.room).emit("receive_message", data);
    });

    socket.on("disconnecting", () => {
        // Handle user count decrement on disconnect
        const rooms = Array.from(socket.rooms);
        rooms.forEach((room) => {
            if (usersInRooms[room]) {
                usersInRooms[room]--;
                io.to(room).emit("room_data", { users: usersInRooms[room] });
            }
        });
        // Broadcast ALL room data globally
        io.emit("global_room_data", usersInRooms);
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});

server.listen(3001, "0.0.0.0", () => {
    console.log("SERVER RUNNING on port 3001 (External: http://192.168.2.186:3001)");
});
