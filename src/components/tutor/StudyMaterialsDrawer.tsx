import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookMarked,
  CheckCircle2,
  Eye,
  EyeOff,
  FileUp,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { TUTOR_CLASSES, TUTOR_SUBJECTS } from '../../data/tutorCurriculum';
import { StudyMaterialMeta } from '../../types/aissee';

interface StudyMaterialsDrawerProps {
  open: boolean;
  onClose: () => void;
  materials: StudyMaterialMeta[];
  onRefreshMaterials: () => Promise<void>;
  onAskAboutMaterial: (material: StudyMaterialMeta) => void;
}

export const StudyMaterialsDrawer: React.FC<StudyMaterialsDrawerProps> = ({
  open,
  onClose,
  materials,
  onRefreshMaterials,
  onAskAboutMaterial,
}) => {
  // Admin token stored strictly in React memory (never localStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<{
    configuredViaEnv: boolean;
    needsInitialSetup: boolean;
  }>({ configuredViaEnv: false, needsInitialSetup: false });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [materialType, setMaterialType] = useState<'textbook' | 'scert' | 'syllabus' | 'notes'>('textbook');
  const [classLevel, setClassLevel] = useState('8');
  const [subject, setSubject] = useState('Mathematics');
  const [chapter, setChapter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch('/api/admin/status')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.needsInitialSetup === 'boolean') {
          setAuthStatus({
            configuredViaEnv: Boolean(data.configuredViaEnv),
            needsInitialSetup: Boolean(data.needsInitialSetup),
          });
        }
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim() || authLoading) return;
    setAuthLoading(true);
    setAuthError(null);

    const endpoint = authStatus.needsInitialSetup ? '/api/admin/setup' : '/api/admin/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Authentication failed.');
      }
      setAdminToken(data.token);
      setPasscode('');
      setAuthStatus((prev) => ({ ...prev, needsInitialSetup: false }));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to authenticate.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !adminToken || uploading) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim() || selectedFile.name.replace(/\.[^.]+$/, ''));
      formData.append('materialType', materialType);
      formData.append('classLevel', classLevel);
      formData.append('subject', subject);
      formData.append('chapter', chapter.trim() || 'General');

      const res = await fetch('/api/materials/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: formData,
      });
      const data = (await res.json()) as { material?: StudyMaterialMeta; error?: string };
      if (!res.ok || !data.material) {
        if (res.status === 401) setAdminToken(null);
        throw new Error(data.error || 'Upload failed.');
      }
      setUploadSuccess(
        `Indexed "${data.material.title}" (${data.material.chunkCount} searchable chunks).`
      );
      setSelectedFile(null);
      setTitle('');
      setChapter('');
      await onRefreshMaterials();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (mat: StudyMaterialMeta) => {
    if (!adminToken || busyId) return;
    setBusyId(mat.id);
    try {
      const res = await fetch(`/api/materials/${encodeURIComponent(mat.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ active: !mat.active }),
      });
      if (res.status === 401) setAdminToken(null);
      await onRefreshMaterials();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (mat: StudyMaterialMeta) => {
    if (!adminToken || busyId) return;
    setBusyId(mat.id);
    try {
      const res = await fetch(`/api/materials/${encodeURIComponent(mat.id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.status === 401) setAdminToken(null);
      await onRefreshMaterials();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
        onClick={onClose}
      />
      <aside className="relative z-10 w-full max-w-xl h-full bg-[#0B1324] border-l border-slate-800 flex flex-col overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500 shrink-0" />
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookMarked className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold text-white truncate">
                NotebookLM Study Library &amp; Textbooks
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {materials.filter((m) => m.active).length} active sources indexed for Textbook &amp; Auto modes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close study library"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Admin Controls Toggle */}
          <div className="rounded-xl bg-[#081020] border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                {adminToken ? (
                  <Unlock className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Lock className="h-4 w-4 text-amber-400" />
                )}
                <span>
                  {adminToken
                    ? 'Administrator Mode Active (Upload & Manage Materials)'
                    : 'Administrator Study Materials Manager'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminPanel((p) => !p)}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 whitespace-nowrap"
              >
                {showAdminPanel ? 'Hide' : adminToken ? 'Upload PDF / TXT' : 'Admin Sign-In'}
              </button>
            </div>

            {showAdminPanel && !adminToken && (
              <form onSubmit={handleAuthSubmit} className="space-y-3 pt-2 border-t border-slate-800/80">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {authStatus.needsInitialSetup
                    ? 'First-run administrator setup: choose a passcode (min 6 characters) to protect textbook uploads and document management.'
                    : 'Enter the administrator passcode to upload PDF/TXT textbooks, SCERT notes, or delete materials.'}
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder={
                        authStatus.needsInitialSetup
                          ? 'Set initial admin passcode (6+ chars)'
                          : 'Enter administrator passcode'
                      }
                      className="w-full rounded-lg bg-[#070D1A] border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading || !passcode.trim()}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 disabled:opacity-50 text-white text-xs font-semibold whitespace-nowrap"
                  >
                    {authLoading
                      ? 'Verifying...'
                      : authStatus.needsInitialSetup
                      ? 'Set Passcode'
                      : 'Unlock'}
                  </button>
                </div>
                {authError && (
                  <div className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}
              </form>
            )}

            {showAdminPanel && adminToken && (
              <form onSubmit={handleUpload} className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Upload Textbook, SCERT PDF, or Study Notes (max 10 MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdminToken(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Lock
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Document File (.pdf, .txt, .md, .csv, .json)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.csv,.json,application/pdf,text/plain,text/markdown"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setSelectedFile(f);
                      if (f && !title) {
                        setTitle(f.name.replace(/\.[^.]+$/, ''));
                      }
                    }}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-600/20 file:text-cyan-300 hover:file:bg-cyan-600/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., SCERT Class 8 Science Ch 4"
                      className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Material Type</label>
                    <select
                      value={materialType}
                      onChange={(e) =>
                        setMaterialType(e.target.value as 'textbook' | 'scert' | 'syllabus' | 'notes')
                      }
                      className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="textbook">Uploaded Textbook</option>
                      <option value="scert">SCERT Material</option>
                      <option value="syllabus">AISSEE Syllabus</option>
                      <option value="notes">Study Notes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Class</label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="All">All Classes (6–10)</option>
                      {TUTOR_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          Class {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="All">All Subjects</option>
                      {TUTOR_SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Chapter / Topic Tag</label>
                  <input
                    type="text"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder="e.g., Metals & Non-Metals or Rational Numbers"
                    className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:brightness-110 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Extracting &amp; Indexing...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="h-3.5 w-3.5" />
                      <span>Upload &amp; Index Document</span>
                    </>
                  )}
                </button>

                {uploadError && (
                  <div className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
                {uploadSuccess && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Indexed Documents List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Indexed Textbooks &amp; Study Sources ({materials.length})
            </h4>

            <div className="space-y-2.5">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    mat.active
                      ? 'bg-[#081020] border-slate-800'
                      : 'bg-[#081020]/40 border-slate-800/50 opacity-65'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="text-xs font-semibold text-white truncate">
                        {mat.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <span className="text-emerald-400 font-medium uppercase">
                          {mat.materialType}
                        </span>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span>{mat.classLevel === 'All' ? 'Classes 6–10' : `Class ${mat.classLevel}`}</span>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span className="text-cyan-400">{mat.subject}</span>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span className="font-mono tabular-nums">{mat.chunkCount} chunks</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        Chapter: {mat.chapter} · {mat.isBuiltIn ? 'Built-in Reference' : mat.fileName}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onAskAboutMaterial(mat);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white text-[11px] font-medium transition-colors"
                      >
                        Query
                      </button>
                      {adminToken && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === mat.id}
                            onClick={() => void handleToggleActive(mat)}
                            title={mat.active ? 'Disable source' : 'Enable source'}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            {mat.active ? (
                              <Eye className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                            )}
                          </button>
                          {!mat.isBuiltIn && (
                            <button
                              type="button"
                              disabled={busyId === mat.id}
                              onClick={() => void handleDelete(mat)}
                              title="Delete material"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/70 text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
