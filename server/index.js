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

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Email Transporter (Nodemailer)
// If credentials are missing, we keep transporter null and return a clear API error
// instead of throwing Nodemailer internals.
const transporter =
    EMAIL_USER && EMAIL_PASS
        ? nodemailer.createTransport({
              service: 'gmail',
              auth: {
                  user: EMAIL_USER,
                  pass: EMAIL_PASS,
              },
          })
        : null;

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
    } catch {
        res.status(401).json({ error: "Invalid Google ID Token" });
    }
});

// Custom Google OAuth (Implicit Flow with Access Token)
app.post('/api/auth/google-custom', async (req, res) => {
    const { access_token } = req.body;
    try {
        console.log('[auth/google-custom] called:', { hasAccessToken: !!access_token, accessTokenLen: access_token ? String(access_token).length : 0 });
        if (!access_token) return res.status(400).json({ error: 'Missing access_token' });

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
            if (!transporter) {
                otpStore.delete(email);
                return res.status(500).json({ error: 'Email service not configured (set EMAIL_USER/EMAIL_PASS in server .env)' });
            }

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
            if (!transporter) {
                otpStore.delete(email);
                return res.status(500).json({ error: 'Email service not configured (set EMAIL_USER/EMAIL_PASS in server .env)' });
            }

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
    const { userId, mood, energy, label, stress, sleep, tags, challenge } = req.body;

    const safeStress = stress === null || stress === undefined ? null : Number(stress);
    const safeSleep = sleep === null || sleep === undefined ? null : Number(sleep);
    const safeTags = Array.isArray(tags) ? JSON.stringify(tags.slice(0, 3)) : null;
    const safeChallenge = challenge && typeof challenge === 'object' ? JSON.stringify(challenge) : null;

    const stmt = db.prepare(
        "INSERT INTO MoodEntries (userId, mood, energy, label, stress, sleep, tags, challenge) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    stmt.run([userId || null, mood, energy || 50, label, safeStress, safeSleep, safeTags, safeChallenge], function(err) {
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
    const { userId, title, content, mood, style } = req.body;
    const safeStyle = style && typeof style === 'object' ? JSON.stringify(style) : (typeof style === 'string' ? style : null);
    const stmt = db.prepare("INSERT INTO JournalEntries (userId, title, content, mood, style) VALUES (?, ?, ?, ?, ?)");
    stmt.run([userId || null, title, content, mood, safeStyle], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        db.get("SELECT * FROM JournalEntries WHERE id = ?", [this.lastID], (err, row) => {
            res.json(row);
        });
    });
    stmt.finalize();
});

app.put('/api/journals/:id', (req, res) => {
    const { title, content, mood, style } = req.body;
    const safeStyle = style && typeof style === 'object' ? JSON.stringify(style) : (typeof style === 'string' ? style : null);
    db.run("UPDATE JournalEntries SET title = ?, content = ?, mood = ?, style = ? WHERE id = ?", 
        [title, content, mood, safeStyle, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get("SELECT * FROM JournalEntries WHERE id = ?", [req.params.id], (err, row) => {
            res.json(row);
        });
    });
});

// 4. Daily Drop (carousel — admin-managed, visible to everyone)
const parseDailyDropColors = (raw) => {
    try {
        const a = JSON.parse(raw || '[]');
        return Array.isArray(a) && a.length >= 2 ? a : ['#7aa6ff', '#7bdcb5'];
    } catch (_) {
        return ['#7aa6ff', '#7bdcb5'];
    }
};

app.get('/api/daily-drops', (req, res) => {
    db.all("SELECT * FROM DailyDrops ORDER BY sortOrder ASC, id ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(
            (rows || []).map((r) => ({
                id: r.id,
                text: r.text,
                author: r.author || 'Inspiration',
                colors: parseDailyDropColors(r.colors),
                createdAt: r.createdAt,
            }))
        );
    });
});

app.post('/api/daily-drops', (req, res) => {
    const { text, author, colors, role } = req.body;
    if (role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });
    const colorsJson = Array.isArray(colors) ? JSON.stringify(colors) : colors || '["#7aa6ff","#7bdcb5","#f6b7d2"]';
    const auth = author && typeof author === 'string' ? author : 'Inspiration';
    db.get("SELECT COALESCE(MAX(sortOrder), -1) + 1 as next FROM DailyDrops", [], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        const sortOrder = row?.next ?? 0;
        db.run(
            "INSERT INTO DailyDrops (text, author, colors, sortOrder) VALUES (?, ?, ?, ?)",
            [text.trim(), auth, colorsJson, sortOrder],
            function (err2) {
                if (err2) return res.status(400).json({ error: err2.message });
                const newId = this.lastID;
                db.get("SELECT * FROM DailyDrops WHERE id = ?", [newId], (e3, r) => {
                    if (e3 || !r) return res.json({ id: newId, text: text.trim(), author: auth });
                    res.json({
                        id: r.id,
                        text: r.text,
                        author: r.author,
                        colors: parseDailyDropColors(r.colors),
                        createdAt: r.createdAt,
                    });
                });
            }
        );
    });
});

app.delete('/api/daily-drops/:id', (req, res) => {
    const { role } = req.query;
    if (role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    db.run("DELETE FROM DailyDrops WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ ok: true });
    });
});

// 4b. User motivation vault (private per user)
app.get('/api/user-motivation-quotes', (req, res) => {
    const userId = Number(req.query.userId);
    if (!Number.isFinite(userId)) return res.status(400).json({ error: 'userId required' });
    db.all(
        "SELECT * FROM UserMotivationQuotes WHERE userId = ? ORDER BY createdAt DESC",
        [userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json((rows || []).map((r) => ({ id: r.id, text: r.text, userId: r.userId, createdAt: r.createdAt })));
        }
    );
});

app.post('/api/user-motivation-quotes', (req, res) => {
    const { userId, text } = req.body;
    const uid = Number(userId);
    if (!Number.isFinite(uid) || !text || typeof text !== 'string') {
        return res.status(400).json({ error: 'userId and text required' });
    }
    const stmt = db.prepare("INSERT INTO UserMotivationQuotes (userId, text) VALUES (?, ?)");
    stmt.run([uid, text.trim()], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        db.get("SELECT * FROM UserMotivationQuotes WHERE id = ?", [this.lastID], (e2, row) => {
            if (e2 || !row) return res.json({ id: this.lastID, text: text.trim(), userId: uid });
            res.json({ id: row.id, text: row.text, userId: row.userId, createdAt: row.createdAt });
        });
    });
    stmt.finalize();
});

app.delete('/api/user-motivation-quotes/:id', (req, res) => {
    const userId = Number(req.query.userId);
    if (!Number.isFinite(userId)) return res.status(400).json({ error: 'userId required' });
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    db.get("SELECT * FROM UserMotivationQuotes WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Not found' });
        if (Number(row.userId) !== userId) return res.status(403).json({ error: 'Forbidden' });
        db.run("DELETE FROM UserMotivationQuotes WHERE id = ?", [id], function(err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ ok: true });
        });
    });
});

// 5. Chat History
function mapChatRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        room: row.roomName,
        senderName: row.senderName,
        sender: row.senderName,
        text: row.text,
        color: row.color,
        createdAt: row.createdAt,
        senderUserId: row.senderUserId != null ? row.senderUserId : null,
    };
}

app.get('/api/chats/:room', (req, res) => {
    db.all("SELECT * FROM ChatMessages WHERE roomName = ? ORDER BY createdAt ASC LIMIT 100", [req.params.room], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json((rows || []).map(mapChatRow));
    });
});

function requireAdminUserId(userId, res, cb) {
    const uid = Number(userId);
    if (!Number.isFinite(uid)) {
        res.status(400).json({ error: 'adminUserId required' });
        return;
    }
    db.get("SELECT id, role FROM Users WHERE id = ?", [uid], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row || row.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        cb(uid);
    });
}

// Report a specific chat message (logged-in: reporterUserId; guest: reporterClientKey from device)
app.post('/api/chat-reports', (req, res) => {
    const messageId = Number(req.body.messageId);
    const reason = typeof req.body.reason === 'string' ? req.body.reason.slice(0, 500) : '';
    const rawUid = req.body.reporterUserId;
    const reporterUserId =
        rawUid != null && rawUid !== '' && Number.isFinite(Number(rawUid)) ? Number(rawUid) : null;
    const reporterClientKey =
        typeof req.body.reporterClientKey === 'string' ? req.body.reporterClientKey.trim().slice(0, 128) : '';

    if (!Number.isFinite(messageId)) {
        return res.status(400).json({ error: 'messageId required' });
    }
    if (reporterUserId == null && !reporterClientKey) {
        return res.status(400).json({ error: 'Sign in or use device reporting (reporterClientKey)' });
    }
    if (reporterUserId != null && reporterClientKey) {
        return res.status(400).json({ error: 'Send either reporterUserId or reporterClientKey, not both' });
    }

    db.get("SELECT * FROM ChatMessages WHERE id = ?", [messageId], (err, msg) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        const reportedUserId = msg.senderUserId != null ? Number(msg.senderUserId) : null;

        if (reporterUserId != null && Number.isFinite(reportedUserId) && reportedUserId === reporterUserId) {
            return res.status(400).json({ error: 'Cannot report your own message' });
        }

        db.run(
            `INSERT INTO ChatReports (messageId, roomName, reporterUserId, reporterClientKey, reportedUserId, messageText, reason)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                messageId,
                msg.roomName,
                reporterUserId,
                reporterUserId != null ? null : reporterClientKey || null,
                Number.isFinite(reportedUserId) ? reportedUserId : null,
                msg.text || '',
                reason,
            ],
            function (insErr) {
                if (insErr) {
                    if (String(insErr.message).includes('UNIQUE')) {
                        return res.status(409).json({ error: 'You already reported this message' });
                    }
                    return res.status(500).json({ error: insErr.message });
                }
                res.json({
                    id: this.lastID,
                    messageId,
                    roomName: msg.roomName,
                    reportedUserId: Number.isFinite(reportedUserId) ? reportedUserId : null,
                    messageText: msg.text || '',
                });
            }
        );
    });
});

// Reporter: list own reports (user id or guest reporterClientKey)
app.get('/api/chat-reports/mine', (req, res) => {
    const reporterUserId = Number(req.query.reporterUserId);
    const reporterClientKey =
        typeof req.query.reporterClientKey === 'string' ? req.query.reporterClientKey.trim().slice(0, 128) : '';

    if (Number.isFinite(reporterUserId)) {
        db.all(
            `SELECT r.id, r.messageId, r.roomName, r.reportedUserId, r.messageText, r.reason, r.createdAt
             FROM ChatReports r WHERE r.reporterUserId = ? ORDER BY r.createdAt DESC`,
            [reporterUserId],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows || []);
            }
        );
        return;
    }
    if (reporterClientKey) {
        db.all(
            `SELECT r.id, r.messageId, r.roomName, r.reportedUserId, r.messageText, r.reason, r.createdAt
             FROM ChatReports r WHERE r.reporterUserId IS NULL AND r.reporterClientKey = ? ORDER BY r.createdAt DESC`,
            [reporterClientKey],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows || []);
            }
        );
        return;
    }
    res.status(400).json({ error: 'reporterUserId or reporterClientKey required' });
});

// Admin: all reports with user emails/names
app.get('/api/chat-reports', (req, res) => {
    requireAdminUserId(req.query.adminUserId, res, () => {
        db.all(
            `SELECT r.id, r.messageId, r.roomName, r.reporterUserId, r.reporterClientKey, r.reportedUserId, r.messageText, r.reason, r.createdAt,
                    rep.email AS reporterEmail, rep.name AS reporterName,
                    acc.email AS reportedEmail, acc.name AS reportedName
             FROM ChatReports r
             LEFT JOIN Users rep ON rep.id = r.reporterUserId
             LEFT JOIN Users acc ON acc.id = r.reportedUserId
             ORDER BY r.createdAt DESC`,
            [],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows || []);
            }
        );
    });
});

app.delete('/api/chat-reports/:id', (req, res) => {
    const reportId = Number(req.params.id);
    if (!Number.isFinite(reportId)) return res.status(400).json({ error: 'Invalid report id' });
    requireAdminUserId(req.query.adminUserId, res, () => {
        db.run("DELETE FROM ChatReports WHERE id = ?", [reportId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ deleted: this.changes });
        });
    });
});

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
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
        const room = data.room;
        if (!room) return;
        const senderName = data.senderName || data.sender || 'Guest';
        const rawUid = data.senderUserId;
        const senderUserId =
            rawUid != null && rawUid !== '' && Number.isFinite(Number(rawUid)) ? Number(rawUid) : null;

        const stmt = db.prepare(
            "INSERT INTO ChatMessages (roomName, senderName, text, color, senderUserId) VALUES (?, ?, ?, ?, ?)"
        );
        stmt.run([room, senderName, data.text, data.color, senderUserId], function (err) {
            if (err) {
                console.error("Database Save Error:", err.message);
                stmt.finalize();
                return;
            }
            const id = this.lastID;
            db.get("SELECT * FROM ChatMessages WHERE id = ?", [id], (e2, row) => {
                stmt.finalize();
                if (e2 || !row) return;
                const payload = mapChatRow(row);
                io.in(room).emit("receive_message", payload);
            });
        });
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
    console.log("SERVER RUNNING on port 3001 (External: http://10.24.0.249:3001)");
});
