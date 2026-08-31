# Alexandria Index

A Library of Alexandria-inspired robotics team archive for storing videos, documents, notes, and project records.

## Stack

- React + Vite
- Express.js
- SQLite
- Multer for uploads

## Local development

```bash
npm install
npm run dev
```

This runs:
- Vite frontend on http://localhost:5173
- Express API on http://localhost:3001

## Production build

```bash
npm install
npm run build
npm start
```

## Free hosting setup

This project is configured for free deployment on Render.

1. Push this repo to GitHub.
2. Sign in to Render.
3. Create a New Web Service.
4. Connect the GitHub repo.
5. Render will use the included `render.yaml` file automatically.

### Notes for free hosting

- Uploaded files and the SQLite database are stored in the app filesystem and may be reset when the service restarts.
- This is fine for a demo or small team archive, but a paid plan or external storage is recommended for long-term production use.
