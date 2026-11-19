import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api';
import { ErrorMessage } from '@/components';
import { getErrorMessage } from '@/lib/utils';

type BlockType = 'heading' | 'paragraph' | 'bold' | 'line' | 'table';
type Block = { type: BlockType; text?: string; rows?: string[][] };

const newBlock = (type: BlockType): Block => type === 'table'
  ? { type, rows: [['કૉલમ 1', 'કૉલમ 2'], ['', '']] }
  : { type, text: '' };

export function AdminAnswerComposerPage() {
  const { user } = useAuth();
  const [questionNumber, setQuestionNumber] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionTextGu, setQuestionTextGu] = useState('');
  const [marks, setMarks] = useState('25');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [university, setUniversity] = useState('GU');
  const [subject, setSubject] = useState('CONSTITUTIONAL');
  const [semester, setSemester] = useState('1');
  const [blocks, setBlocks] = useState<Block[]>([newBlock('heading'), newBlock('paragraph')]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateBlock = (index: number, patch: Partial<Block>) => setBlocks((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const addBlock = (type: BlockType) => setBlocks((items) => [...items, newBlock(type)]);
  const removeBlock = (index: number) => setBlocks((items) => items.filter((_, itemIndex) => itemIndex !== index));

  const save = async () => {
    try {
      setSaving(true); setError(null); setMessage(null);
      const response = await adminApi.createFormattedAnswer({ questionNumber, questionText, questionTextGu, marks: Number(marks), year: Number(year), university, subject, semester: Number(semester), blocks });
      setMessage(`સાચવ્યું: પ્રશ્ન ${response.data.question.questionNumber || questionNumber}`);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  };

  if (!user || user.role !== 'admin') return <div className="rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">Administrator access required</h1></div>;

  return <div className="mx-auto max-w-6xl space-y-6">
    <div><h1 className="text-3xl font-bold text-gray-900">Create Gujarati Answer</h1><p className="mt-2 text-gray-600">Add one exam question and build its answer with simple, reusable document blocks.</p></div>
    {error && <ErrorMessage message={error} />}{message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{message}</div>}
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <section className="rounded-xl bg-white p-5 shadow"><h2 className="text-lg font-semibold">Question details</h2><div className="mt-4 space-y-4">
        <label className="block text-sm font-medium">Question number<input value={questionNumber} onChange={(e) => setQuestionNumber(e.target.value)} className="mt-1 w-full rounded-lg border p-2" placeholder="Q1" /></label>
        <label className="block text-sm font-medium">Gujarati question<textarea value={questionTextGu} onChange={(e) => setQuestionTextGu(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border p-2" placeholder="પ્રશ્ન અહીં લખો..." /></label>
        <label className="block text-sm font-medium">English question (optional)<textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} className="mt-1 min-h-20 w-full rounded-lg border p-2" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Marks<input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><label className="text-sm font-medium">Year<input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label></div>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Semester<select value={semester} onChange={(e) => setSemester(e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></label><label className="text-sm font-medium">University<select value={university} onChange={(e) => setUniversity(e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="GU">Gujarat University</option><option value="TRICHY">Trichy University</option><option value="KES">KES</option><option value="OTHER">Other</option></select></label></div>
        <label className="block text-sm font-medium">Subject<select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="CONSTITUTIONAL">Constitutional History</option><option value="CRIMINAL">Criminal Law</option><option value="CONTRACT">Law of Contract</option><option value="TORTS">Law of Tort</option><option value="GENERAL">General / Legal Journals</option></select></label>
      </div></section>
      <section className="rounded-xl bg-white p-5 shadow"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Gujarati answer document</h2><p className="text-sm text-gray-500">Add blocks in the order students should read them.</p></div><div className="flex flex-wrap gap-2">{(['heading', 'paragraph', 'bold', 'line', 'table'] as BlockType[]).map((type) => <button key={type} type="button" onClick={() => addBlock(type)} className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50">+ {type}</button>)}</div></div>
        <div className="mt-5 space-y-3">{blocks.map((block, index) => <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold uppercase text-gray-500">{block.type}</span><button type="button" onClick={() => removeBlock(index)} className="text-xs text-red-600">Remove</button></div>{block.type === 'line' ? <div className="h-px bg-gray-400" /> : block.type === 'table' ? <div className="space-y-2">{(block.rows || []).map((row, rowIndex) => <div key={rowIndex} className="flex gap-2">{row.map((cell, cellIndex) => <input key={cellIndex} value={cell} onChange={(e) => { const rows = (block.rows || []).map((currentRow) => [...currentRow]); rows[rowIndex][cellIndex] = e.target.value; updateBlock(index, { rows }); }} className="min-w-0 flex-1 rounded border bg-white p-2 text-sm" />)}<button type="button" onClick={() => updateBlock(index, { rows: (block.rows || []).filter((_, i) => i !== rowIndex) })} className="text-xs text-red-600">×</button></div>)}<button type="button" onClick={() => updateBlock(index, { rows: [...(block.rows || []), ['', '']] })} className="text-xs text-blue-700">+ row</button></div> : <textarea value={block.text || ''} onChange={(e) => updateBlock(index, { text: e.target.value })} className={`min-h-20 w-full rounded border bg-white p-3 ${block.type === 'heading' ? 'text-lg font-bold' : block.type === 'bold' ? 'font-bold' : ''}`} placeholder={block.type === 'heading' ? 'વિભાગનું શીર્ષક' : 'અહીં લખો...'} />}</div>)}</div>
        <div className="mt-6 flex justify-end"><button type="button" disabled={saving || !questionTextGu.trim() || blocks.length === 0} onClick={() => void save()} className="rounded-lg bg-primary-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving…' : 'Save Gujarati answer'}</button></div>
      </section>
    </div>
  </div>;
}
