const uploadForm = document.getElementById('uploadForm');
const recordsContainer = document.getElementById('recordsContainer');
const searchInput = document.getElementById('searchInput');
const toggleFormBtn = document.getElementById('toggleFormBtn');
const uploadPanel = document.getElementById('uploadPanel');

async function fetchRecords() {
  const res = await fetch('/api/records');
  const records = await res.json();
  renderRecords(records);
}

function renderRecords(records) {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = records.filter((record) => {
    const haystack = [record.title, record.category, record.uploader, record.description]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });

  if (!filtered.length) {
    recordsContainer.innerHTML = `
      <div class="empty-state">
        <h3>No files found</h3>
        <p>Upload something to start building your robotics team library.</p>
      </div>
    `;
    return;
  }

  recordsContainer.innerHTML = filtered
    .map((record) => `
      <article class="record-card">
        <div class="tag">${record.fileType}</div>
        <h3>${record.title}</h3>
        <div class="meta">${record.category} • ${record.uploader || 'Unknown'} • ${new Date(record.createdAt).toLocaleDateString()}</div>
        <p>${record.description || 'No description provided.'}</p>
        <div class="card-actions">
          <a href="${record.filePath}" target="_blank" rel="noopener noreferrer">Open file</a>
          <button class="delete-btn" data-id="${record.id}">Delete</button>
        </div>
      </article>
    `)
    .join('');

  document.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      const confirmed = window.confirm('Delete this item from the library?');
      if (!confirmed) return;

      const response = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchRecords();
      } else {
        alert('Failed to delete the item.');
      }
    });
  });
}

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(uploadForm);
  const submitButton = uploadForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Saving...';

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    uploadForm.reset();
    uploadPanel.classList.add('hidden');
    fetchRecords();
  } catch (error) {
    alert(error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Save to library';
  }
});

toggleFormBtn.addEventListener('click', () => {
  uploadPanel.classList.toggle('hidden');
});

searchInput.addEventListener('input', fetchRecords);

fetchRecords();
