import { useEffect, useMemo, useState } from 'react';

const initialForm = {
  title: '',
  category: '',
  uploader: '',
  description: '',
  file: null
};

function App() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadRecords = async () => {
    const res = await fetch('/api/records');
    const data = await res.json();
    setRecords(data);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;

    return records.filter((record) => {
      const haystack = [record.title, record.category, record.uploader, record.description]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [records, search]);

  const handleInputChange = (event) => {
    const { name, value, files } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title || !form.category || !form.file) {
      alert('Title, category, and a file are required.');
      return;
    }

    const payload = new FormData();
    payload.append('title', form.title);
    payload.append('category', form.category);
    payload.append('uploader', form.uploader);
    payload.append('description', form.description);
    payload.append('file', form.file);

    setIsSaving(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: payload
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setForm(initialForm);
      setShowForm(false);
      await loadRecords();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this resource from the archive?');
    if (!confirmed) return;

    const response = await fetch(`/api/records/${id}`, { method: 'DELETE' });
    if (response.ok) {
      await loadRecords();
    } else {
      alert('Failed to delete the item.');
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark" aria-label="Library icon" role="img">📚</div>
          <div>
            <p className="eyebrow">The Alexandria Index</p>
            <h1>Robotics Knowledge Vault</h1>
          </div>
        </div>
        <button className="primary-btn" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? 'Close Form' : 'Add Resource'}
        </button>
      </header>

      <p className="subtitle">
        A living archive for the robotics team — where designs, test footage, and field notes become collective memory.
      </p>

      <main className="layout">
        {showForm && (
          <section className="panel upload-panel">
            <h2>Upload a new resource</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid">
                <label>
                  <span>Title</span>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Autonomous Drive Review"
                    required
                  />
                </label>

                <label>
                  <span>Category</span>
                  <select name="category" value={form.category} onChange={handleInputChange} required>
                    <option value="">Select a category</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Programming">Programming</option>
                    <option value="Tuning">Tuning</option>
                    <option value="Strat">Strat</option>
                    <option value="HQ Operations">HQ Operations</option>
                    <option value="Pit">Pit</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  <span>Uploader</span>
                  <input
                    type="text"
                    name="uploader"
                    value={form.uploader}
                    onChange={handleInputChange}
                    placeholder="Team member name"
                  />
                </label>

                <label className="file-field">
                  <span>File</span>
                  <input type="file" name="file" onChange={handleInputChange} required />
                </label>
              </div>

              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Add context, notes, or a summary of the file..."
                />
              </label>

              <button type="submit" className="primary-btn" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save to library'}
              </button>
            </form>
          </section>
        )}

        <section className="panel library-panel">
          <div className="library-header">
            <h2>Knowledge base</h2>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, category, or uploader"
            />
          </div>

          <div className="records-grid">
            {filteredRecords.length === 0 ? (
              <div className="empty-state">
                <h3>No files found</h3>
                <p>Upload something to start building your robotics team library.</p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <article key={record.id} className="record-card">
                  <div className="tag">{record.fileType}</div>
                  <h3>{record.title}</h3>
                  <div className="meta">
                    {record.category} • {record.uploader || 'Unknown'} • {new Date(record.createdAt).toLocaleDateString()}
                  </div>
                  <p>{record.description || 'No description provided.'}</p>
                  <div className="card-actions">
                    <a href={record.filePath} target="_blank" rel="noreferrer noopener">
                      Open file
                    </a>
                    <button className="delete-btn" onClick={() => handleDelete(record.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
