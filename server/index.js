import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// Initialize SQLite Database
import db from './database.js';

const app = express();
app.use(cors());
app.use(express.json());

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

// 2. Mood Logging
app.get('/api/moods', (req, res) => {
    db.all("SELECT * FROM MoodEntries ORDER BY createdAt DESC", [], (err, rows) => {
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
    db.all("SELECT * FROM JournalEntries ORDER BY createdAt DESC", [], (err, rows) => {
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
        origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178"], // Allow multiple local ports
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

server.listen(3001, () => {
    console.log("SERVER RUNNING on port 3001");
});
