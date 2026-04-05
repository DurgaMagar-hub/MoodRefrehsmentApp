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
                stress INTEGER,
                sleep INTEGER,
                tags TEXT,
                challenge TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(userId) REFERENCES Users(id)
            )`);

            const ensureColumn = (table, column, type) => {
                db.all(`PRAGMA table_info(${table})`, [], (e, cols) => {
                    if (e) return;
                    const exists = (cols || []).some((c) => c.name === column);
                    if (exists) return;
                    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, [], () => {});
                });
            };

            // Backwards-compatible migrations for existing databases
            ensureColumn('MoodEntries', 'stress', 'INTEGER');
            ensureColumn('MoodEntries', 'sleep', 'INTEGER');
            ensureColumn('MoodEntries', 'tags', 'TEXT');
            ensureColumn('MoodEntries', 'challenge', 'TEXT');

            // 3. JournalEntries Table
            db.run(`CREATE TABLE IF NOT EXISTS JournalEntries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                title TEXT,
                content TEXT,
                mood TEXT,
                style TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(userId) REFERENCES Users(id)
            )`);

            ensureColumn('JournalEntries', 'style', 'TEXT');

            // 4. Quotes Table (legacy; migrated to DailyDrops on first run)
            db.run(`CREATE TABLE IF NOT EXISTS Quotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT UNIQUE,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // 4b. Daily Drop carousel (admin-managed, visible to all users)
            db.run(`CREATE TABLE IF NOT EXISTS DailyDrops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                author TEXT DEFAULT 'Inspiration',
                colors TEXT DEFAULT '["#7aa6ff","#7bdcb5","#f6b7d2"]',
                sortOrder INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // 4c. Private motivation quotes per user
            db.run(`CREATE TABLE IF NOT EXISTS UserMotivationQuotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                text TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(userId) REFERENCES Users(id)
            )`);

            // 5. ChatMessages Table
            db.run(`CREATE TABLE IF NOT EXISTS ChatMessages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                roomName TEXT,
                senderName TEXT,
                text TEXT,
                color TEXT,
                senderUserId INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            ensureColumn('ChatMessages', 'senderUserId', 'INTEGER');

            db.run(`CREATE TABLE IF NOT EXISTS ChatReports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                messageId INTEGER NOT NULL,
                roomName TEXT,
                reporterUserId INTEGER,
                reporterClientKey TEXT,
                reportedUserId INTEGER,
                messageText TEXT,
                reason TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(messageId) REFERENCES ChatMessages(id)
            )`);

            // Migrate legacy ChatReports (reporterUserId NOT NULL, no reporterClientKey)
            db.all('PRAGMA table_info(ChatReports)', [], (pe, cols) => {
                if (pe || !cols || cols.length === 0) return;
                if (cols.some((c) => c.name === 'reporterClientKey')) {
                    db.run(
                        'CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_user_message ON ChatReports(reporterUserId, messageId) WHERE reporterUserId IS NOT NULL'
                    );
                    db.run(
                        "CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_guest_message ON ChatReports(reporterClientKey, messageId) WHERE reporterUserId IS NULL AND reporterClientKey IS NOT NULL AND length(trim(reporterClientKey)) > 0"
                    );
                    return;
                }
                db.serialize(() => {
                    db.run(`CREATE TABLE ChatReports_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        messageId INTEGER NOT NULL,
                        roomName TEXT,
                        reporterUserId INTEGER,
                        reporterClientKey TEXT,
                        reportedUserId INTEGER,
                        messageText TEXT,
                        reason TEXT,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(messageId) REFERENCES ChatMessages(id)
                    )`);
                    db.run(
                        `INSERT INTO ChatReports_new (id, messageId, roomName, reporterUserId, reporterClientKey, reportedUserId, messageText, reason, createdAt)
                         SELECT id, messageId, roomName, reporterUserId, NULL, reportedUserId, messageText, reason, createdAt FROM ChatReports`
                    );
                    db.run('DROP TABLE ChatReports');
                    db.run('ALTER TABLE ChatReports_new RENAME TO ChatReports');
                    db.run(
                        'CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_user_message ON ChatReports(reporterUserId, messageId) WHERE reporterUserId IS NOT NULL'
                    );
                    db.run(
                        "CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_guest_message ON ChatReports(reporterClientKey, messageId) WHERE reporterUserId IS NULL AND reporterClientKey IS NOT NULL AND length(trim(reporterClientKey)) > 0"
                    );
                    console.log('✅ Migrated ChatReports (guest reporting + nullable reporter).');
                });
            });
            
            // --- Default Seed Data ---

            // Insert Default Quotes if Empty (legacy table)
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

            // Migrate legacy Quotes → DailyDrops once, or seed defaults (if DailyDrops is empty)
            db.get("SELECT COUNT(*) as c FROM DailyDrops", [], (e1, r1) => {
                if (e1 || !r1 || r1.c > 0) return;
                db.all("SELECT * FROM Quotes ORDER BY id ASC", [], (e2, legacy) => {
                    if (legacy && legacy.length > 0) {
                        const palettes = [
                            '["#a855f7","#e879f9"]',
                            '["#c084fc","#f0abfc"]',
                            '["#d4a574","#fda4af"]',
                            '["#7aa6ff","#7bdcb5"]',
                        ];
                        const ins = db.prepare(
                            "INSERT INTO DailyDrops (text, author, colors, sortOrder) VALUES (?, ?, ?, ?)"
                        );
                        legacy.forEach((row, i) => {
                            ins.run([row.text, 'Inspiration', palettes[i % palettes.length], i]);
                        });
                        ins.finalize();
                        console.log('🌅 Migrated Quotes → DailyDrops.');
                        return;
                    }
                    const stmt = db.prepare(
                        "INSERT INTO DailyDrops (text, author, colors, sortOrder) VALUES (?, ?, ?, ?)"
                    );
                    stmt.run([
                        "Happiness is not something ready made. It comes from your own actions.",
                        'Dalai Lama',
                        '["#a855f7","#e879f9"]',
                        0,
                    ]);
                    stmt.run([
                        "The only limit to our realization of tomorrow will be our doubts of today.",
                        'F.D. Roosevelt',
                        '["#c084fc","#f0abfc"]',
                        1,
                    ]);
                    stmt.run([
                        "You don't have to be great to start, but you have to start to be great.",
                        'Zig Ziglar',
                        '["#d4a574","#fda4af"]',
                        2,
                    ]);
                    stmt.finalize();
                    console.log('🌅 Seeded default DailyDrops.');
                });
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
