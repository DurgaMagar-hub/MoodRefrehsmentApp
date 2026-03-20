import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the SQLite Database (creates it if it doesn't exist)
const dbPath = path.resolve(__dirname, 'database.sqlite');

// Turn on verbose mode for better error messages
const sqlite = sqlite3.verbose();

const db = new sqlite.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('✅ Connected to the local SQLite database.');
        
        // Initialize Tables using raw SQL
        db.serialize(() => {
            console.log('🛠️  Running database schema synchronization...');

            // 1. Users Table
            db.run(`CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT,
                name TEXT,
                role TEXT,
                avatar TEXT,
                color TEXT,
                joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // 2. MoodEntries Table
            db.run(`CREATE TABLE IF NOT EXISTS MoodEntries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                mood TEXT,
                energy INTEGER,
                label TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(userId) REFERENCES Users(id)
            )`);

            // 3. JournalEntries Table
            db.run(`CREATE TABLE IF NOT EXISTS JournalEntries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                title TEXT,
                content TEXT,
                mood TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(userId) REFERENCES Users(id)
            )`);

            // 4. Quotes Table
            db.run(`CREATE TABLE IF NOT EXISTS Quotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT UNIQUE,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // 5. ChatMessages Table
            db.run(`CREATE TABLE IF NOT EXISTS ChatMessages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                roomName TEXT,
                senderName TEXT,
                text TEXT,
                color TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            
            // --- Default Seed Data ---

            // Insert Default Quotes if Empty
            db.get("SELECT COUNT(*) as count FROM Quotes", [], (err, row) => {
                if (!err && row.count === 0) {
                    const stmt = db.prepare("INSERT INTO Quotes (text) VALUES (?)");
                    stmt.run("Believe you can and you're halfway there.");
                    stmt.run("The only way to do great work is to love what you do.");
                    stmt.run("You are stronger than you think.");
                    stmt.run("Every day may not be good, but there's something good in every day.");
                    stmt.finalize();
                    console.log('🌱 Seeded default quotes.');
                }
            });

            // Insert Default Admin User
            db.get("SELECT * FROM Users WHERE email = ?", ["admin@mood.com"], (err, row) => {
                if (!err && !row) {
                    db.run(`INSERT INTO Users (email, password, name, role, avatar, color) 
                            VALUES (?, ?, ?, ?, ?, ?)`, 
                            ["admin@mood.com", "admin123", "System Admin", "admin", "🛡️", "#2d3436"]);
                    console.log('🛡️  Seeded default Admin user.');
                }
            });

            console.log('✅ SQLite Schema synchronized.');
        });
    }
});

export default db;
