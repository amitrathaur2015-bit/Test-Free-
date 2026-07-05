import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout';
import { getPDFLibrary, addPDFToLibrary, updatePDF, deletePDF, incrementDownload } from '../../lib/admin-store';
import { FileText, Upload, Trash2, Edit3, Search, Download, Tag, Folder, Plus, X, Eye, Brain } from 'lucide-react';

const S = {
  card: { background: '#13161f', border: '1px solid #1e2433' },
  input: { background: '#0f1117', border: '1px solid #2a3040', color: '#e2e8f0' },
};

const CATEGORIES = ['Mathematics', 'Science', 'History', 'Geography', 'Technology', 'English', 'General Knowledge', 'Sports'];

export default function AdminPDFs() {
  const [pdfs, setPdfs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [toast, setToast] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPdf, setEditingPdf] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'Science', description: '', tags: '', fileName: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => setPdfs(getPDFLibrary());
  useEffect(() => { load(); }, []);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const handleSubmit = async () => {
    if (!form.title || !form.category) return;
    setUploading(true);

    let fileName = form.fileName;
    let fileSize = 0;

    if (uploadFile) {
      // Simulate upload — in production send to S3/Cloudflare R2
      await new Promise(r => setTimeout(r, 800));
      fileName = uploadFile.name;
      fileSize = parseFloat((uploadFile.size / 1024 / 1024).toFixed(2));
      showToast('📤 File uploaded to storage');
    }

    if (editingPdf) {
      updatePDF(editingPdf.id, { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), fileName, fileSize });
      showToast('✅ PDF updated');
    } else {
      addPDFToLibrary({ ...form, fileName: fileName || `${form.title.toLowerCase().replace(/\s+/g, '-')}.pdf`, fileSize, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), uploadedBy: 'Admin' });
      showToast('✅ PDF added to library');
    }

    setForm({ title: '', category: 'Science', description: '', tags: '', fileName: '' });
    setUploadFile(null);
    setEditingPdf(null);
    setShowForm(false);
    setUploading(false);
    load();
  };

  const startEdit = (pdf) => {
    setEditingPdf(pdf);
    setForm({ title: pdf.title, category: pdf.category, description: pdf.description, tags: pdf.tags?.join(', ') || '', fileName: pdf.fileName });
    setShowForm(true);
  };

  const handleDelete = (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deletePDF(id);
    load(); showToast('PDF deleted');
  };

  const filtered = pdfs.filter(p => {
    const m = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const c = filterCat === 'all' || p.category === filterCat;
    return m && c;
  });

  const totalDownloads = pdfs.reduce((s, p) => s + p.downloads, 0);
  const totalSize = pdfs.reduce((s, p) => s + (p.fileSize || 0), 0);

  return (
    <AdminLayout title="PDF Library">
      {toast && <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 shadow-xl">{toast}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total PDFs', value: pdfs.length, icon: FileText, color: 'indigo' },
          { label: 'Total Downloads', value: totalDownloads, icon: Download, color: 'green' },
          { label: 'Total Size', value: `${totalSize.toFixed(1)} MB`, icon: Folder, color: 'amber' },
          { label: 'Categories', value: [...new Set(pdfs.map(p => p.category))].length, icon: Tag, color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4 flex items-center gap-4" style={S.card}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/10 border border-${color}-500/20`}>
              <Icon size={18} className={`text-${color}-400`} />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PDFs..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none" style={S.input} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm" style={S.input}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <Link href="/admin2/pdf-upload-ai"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors" style={{ border: '1px solid #4c1d95', background: '#1a0a2e' }}>
          <Brain size={15} /> AI Extract
        </Link>
        <button onClick={() => { setEditingPdf(null); setForm({ title: '', category: 'Science', description: '', tags: '', fileName: '' }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
          <Plus size={15} /> Add PDF
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-5 space-y-3" style={{ ...S.card, border: '1px solid #3730a3' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{editingPdf ? 'Edit PDF' : 'Add PDF to Library'}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
          </div>

          {/* File upload zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
            style={{ borderColor: uploadFile ? '#6366f1' : '#2a3040', background: uploadFile ? '#1a1f40' : '#0f1117' }}>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setUploadFile(e.target.files[0])} />
            {uploadFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={24} className="text-indigo-400" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{uploadFile.name}</p>
                  <p className="text-xs text-gray-400">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setUploadFile(null); }} className="text-gray-500 hover:text-red-400 ml-2"><X size={16} /></button>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">Click to upload PDF (max 400 MB)</p>
              </>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="px-3 py-2.5 rounded-xl text-sm focus:outline-none sm:col-span-2" style={S.input} placeholder="PDF title..." />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="px-3 py-2.5 rounded-xl text-sm" style={S.input}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={S.input} placeholder="Tags (comma-separated)" />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2} className="px-3 py-2 rounded-xl text-sm focus:outline-none resize-none sm:col-span-2" style={S.input} placeholder="Description..." />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-60">
              {uploading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editingPdf ? 'Update PDF' : 'Add to Library'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* PDF Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(pdf => (
          <div key={pdf.id} className="rounded-2xl p-5 flex flex-col" style={S.card}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#1a1f2e', border: '1px solid #2a3040' }}>
                <FileText size={24} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-100 leading-tight">{pdf.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{pdf.category}</p>
              </div>
            </div>
            {pdf.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{pdf.description}</p>}
            {pdf.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {pdf.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1e2433', color: '#94a3b8' }}>#{tag}</span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: '#1e2433' }}>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Download size={12} /> {pdf.downloads}</span>
                <span>{pdf.fileSize} MB</span>
                <span>{pdf.uploadedAt}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(pdf)} className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(pdf.id, pdf.title)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-600">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p>No PDFs found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
