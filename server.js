const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const __root = __dirname;
const uploadsDir = path.join(__root, 'uploads');
const dbPath = path.join(__root, 'library.db');
const distDir = path.join(__root, 'dist');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
    process.exit(1);
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      description TEXT,
      uploader TEXT,
      fileName TEXT,
      filePath TEXT,
      fileType TEXT,
      createdAt TEXT NOT NULL
    )
  `, (createErr) => {
    if (createErr) {
      console.error('Failed to initialize database schema:', createErr.message);
      process.exit(1);
    }
    console.log('Database ready.');
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Robotics team library is running.' });
});

app.get('/api/records', (req, res) => {
  db.all(
    'SELECT * FROM records ORDER BY createdAt DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Error reading records:', err.message);
        return res.status(500).json({ error: 'Unable to read records' });
      }
      res.json(rows);
    }
  );
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  const { title, category, description, uploader } = req.body;
  const file = req.file;

  if (!title || !category || !file) {
    return res.status(400).json({
      error: 'Title, category, and a file are required.'
    });
  }

  const fileType = file.mimetype.startsWith('video/') ? 'video' : 'document';
  const recordId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const relativePath = `/uploads/${file.filename}`;

  db.run(
    `INSERT INTO records (id, title, category, description, uploader, fileName, filePath, fileType, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [recordId, title, category, description || '', uploader || 'Unknown', file.originalname, relativePath, fileType, new Date().toISOString()],
    (dbErr) => {
      if (dbErr) {
        console.error('Error saving record:', dbErr.message);
        return res.status(500).json({ error: 'Unable to save the uploaded file.' });
      }

      res.status(201).json({
        message: 'Upload saved successfully.',
        record: {
          id: recordId,
          title,
          category,
          description,
          uploader,
          fileName: file.originalname,
          filePath: relativePath,
          fileType,
          createdAt: new Date().toISOString()
        }
      });
    }
  );
});

app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM records WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error finding record:', err.message);
      return res.status(500).json({ error: 'Unable to delete record.' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    const diskPath = path.join(__root, row.filePath.replace(/^\//, ''));
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }

    db.run('DELETE FROM records WHERE id = ?', [id], (deleteErr) => {
      if (deleteErr) {
        console.error('Error deleting record:', deleteErr.message);
        return res.status(500).json({ error: 'Unable to delete record.' });
      }
      res.json({ success: true, message: 'Record deleted.' });
    });
  });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }

  const indexPath = fs.existsSync(distDir)
    ? path.join(distDir, 'index.html')
    : path.join(__root, 'public', 'index.html');

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Alexandria Index API running on http://0.0.0.0:${PORT}`);
});
