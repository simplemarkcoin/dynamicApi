import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Database, Settings, Table as TableIcon, LayoutGrid, X, Trash2, Edit2, ChevronLeft, AlertCircle, MoreVertical } from 'lucide-react';
import { Collection, FieldDefinition, FieldType, DataRecord } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'records' | 'fields' | 'settings'>('records');
  const [col, setCol] = useState<Collection | null>(null);
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [newField, setNewField] = useState<Partial<FieldDefinition>>({ name: '', label: '', type: 'text', required: false });

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>({});
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'collections', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCol({ id: docSnap.id, ...docSnap.data() } as Collection);
          const q = query(collection(db, 'records'), where('collectionId', '==', id));
          const recordsSnap = await getDocs(q);
          setRecords(recordsSnap.docs.map(d => ({ id: d.id, ...d.data() } as DataRecord)));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `collections/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!col || !newField.name || !newField.type) return;
    try {
      const field: FieldDefinition = {
        id: Math.random().toString(36).substr(2, 9),
        name: newField.name,
        label: newField.label || newField.name,
        type: newField.type as FieldType,
        required: !!newField.required
      };
      const updatedFields = [...(col.fields || []), field];
      await updateDoc(doc(db, 'collections', col.id), { fields: updatedFields });
      setCol({ ...col, fields: updatedFields });
      setIsFieldModalOpen(false);
      setNewField({ name: '', label: '', type: 'text', required: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `collections/${col.id}`);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!col || !id) return;
    try {
      if (editingRecordId) {
        await updateDoc(doc(db, 'records', editingRecordId), { data: currentRecord, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'records'), { collectionId: id, data: currentRecord, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      const q = query(collection(db, 'records'), where('collectionId', '==', id));
      const recordsSnap = await getDocs(q);
      setRecords(recordsSnap.docs.map(d => ({ id: d.id, ...d.data() } as DataRecord)));
      setIsRecordModalOpen(false);
      setCurrentRecord({});
      setEditingRecordId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'records');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
  
  if (!col) return (
    <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[32px] text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white">Collection not found</h2>
      <button onClick={() => navigate('/collections')} className="mt-6 text-indigo-400 font-bold hover:underline">Back to Collections</button>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <button 
          onClick={() => navigate('/collections')} 
          className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all active:scale-90"
        >
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{col.name}</h1>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-500 rounded-xl text-xs font-mono">/{col.slug}</span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar gap-8">
        {[
          { id: 'records', label: 'Records', icon: TableIcon }, 
          { id: 'fields', label: 'Fields Builder', icon: LayoutGrid }, 
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={cn(
              "flex items-center gap-3 pb-5 text-sm font-bold transition-all relative whitespace-nowrap", 
              activeTab === tab.id ? "text-indigo-500" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 rounded-full" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'records' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-white">Data Records</h2>
              <button 
                onClick={() => { setIsRecordModalOpen(true); setEditingRecordId(null); setCurrentRecord({}); }} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Record
              </button>
            </div>

            {col.fields.length === 0 ? (
              <div className="bg-amber-500/5 border border-amber-500/20 p-8 rounded-[32px] flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="text-amber-500 w-8 h-8" />
                </div>
                <div className="text-center md:text-left">
                  <p className="font-bold text-white text-lg">No fields defined yet</p>
                  <p className="text-slate-500 mt-1">Go to the "Fields Builder" tab to define your collection structure.</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800">
                        {col.fields.map(f => (
                          <th key={f.id} className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{f.label}</th>
                        ))}
                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan={col.fields.length + 1} className="px-8 py-16 text-center text-slate-600 italic">
                            No records found in this collection.
                          </td>
                        </tr>
                      ) : (
                        records.map(record => (
                          <tr key={record.id} className="hover:bg-slate-800/30 transition-colors group">
                            {col.fields.map(f => (
                              <td key={f.id} className="px-8 py-5 text-sm text-slate-300 font-medium">
                                {f.type === 'boolean' ? (
                                  <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold uppercase", record.data[f.name] ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-500")}>
                                    {record.data[f.name] ? 'True' : 'False'}
                                  </span>
                                ) : (
                                  String(record.data[f.name] || '-')
                                )}
                              </td>
                            ))}
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => { setEditingRecordId(record.id); setCurrentRecord(record.data); setIsRecordModalOpen(true); }} 
                                  className="p-2 bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-xl transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={async () => { if(window.confirm("Delete this record?")) { await deleteDoc(doc(db, 'records', record.id)); setRecords(records.filter(r => r.id !== record.id)); } }} 
                                  className="p-2 bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'fields' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-white">Fields Definition</h2>
              <button 
                onClick={() => setIsFieldModalOpen(true)} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Field
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {col.fields.map((field, index) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  key={field.id} 
                  className="bg-slate-900/50 p-6 rounded-[24px] border border-slate-800 flex justify-between items-center group hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center font-bold text-indigo-500 text-sm uppercase">
                      {field.type.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{field.label}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{field.name}</span>
                        <span>•</span>
                        <span className="capitalize">{field.type}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={async () => { if(window.confirm("Delete field?")) { const updated = col.fields.filter(f => f.id !== field.id); await updateDoc(doc(db, 'collections', col.id), { fields: updated }); setCol({ ...col, fields: updated }); } }} 
                    className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl bg-slate-900/50 p-8 rounded-[32px] border border-slate-800"
          >
            <h2 className="text-lg font-bold text-white mb-8">Collection Settings</h2>
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-3">Collection Name</label>
                <input 
                  type="text" 
                  className="w-full h-14 px-5 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  defaultValue={col.name}
                  onBlur={async (e) => { if(e.target.value !== col.name) { await updateDoc(doc(db, 'collections', col.id), { name: e.target.value }); setCol({ ...col, name: e.target.value }); } }}
                />
              </div>
              <div className="pt-6 border-t border-slate-800">
                <h3 className="text-red-500 font-bold mb-2">Danger Zone</h3>
                <p className="text-slate-500 text-sm mb-6">Once you delete a collection, there is no going back. Please be certain.</p>
                <button 
                  onClick={async () => { if(window.confirm("Delete entire collection and all records?")) { await deleteDoc(doc(db, 'collections', col.id)); navigate('/collections'); } }}
                  className="w-full sm:w-auto px-8 py-4 bg-red-500/10 text-red-500 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >
                  Delete Collection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isFieldModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl w-full max-w-md p-8 md:p-10 relative"
            >
              <button onClick={() => setIsFieldModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-white mb-8">Add New Field</h2>
              <form onSubmit={handleAddField} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-3">Field Label</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Price"
                    className="w-full h-14 px-5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700" 
                    value={newField.label} 
                    onChange={(e) => setNewField({ ...newField, label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-3">Field Type</label>
                  <select 
                    className="w-full h-14 px-5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none" 
                    value={newField.type} 
                    onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType })}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <button type="submit" className="w-full h-14 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 mt-4 active:scale-95">
                  Add Field
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isRecordModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl w-full max-w-2xl p-8 md:p-10 relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button onClick={() => setIsRecordModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-white mb-8">{editingRecordId ? 'Edit Record' : 'Add Record'}</h2>
              <form onSubmit={handleSaveRecord} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {col.fields.map(field => (
                  <div key={field.id} className={cn(field.type === 'json' ? 'sm:col-span-2' : '')}>
                    <label className="block text-sm font-bold text-slate-400 mb-3">{field.label}</label>
                    {field.type === 'boolean' ? (
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setCurrentRecord({ ...currentRecord, [field.name]: !currentRecord[field.name] })}
                          className={cn(
                            "w-14 h-8 rounded-full transition-all relative",
                            currentRecord[field.name] ? "bg-indigo-600" : "bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 bg-white rounded-full absolute top-1 transition-all",
                            currentRecord[field.name] ? "left-7" : "left-1"
                          )} />
                        </button>
                        <span className="text-sm text-slate-300 font-medium">{currentRecord[field.name] ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    ) : field.type === 'json' ? (
                      <textarea 
                        className="w-full h-32 px-5 py-4 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                        value={typeof currentRecord[field.name] === 'object' ? JSON.stringify(currentRecord[field.name]) : currentRecord[field.name] || ''}
                        onChange={(e) => setCurrentRecord({ ...currentRecord, [field.name]: e.target.value })}
                        placeholder='{"key": "value"}'
                      />
                    ) : (
                      <input 
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} 
                        className="w-full h-14 px-5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                        value={currentRecord[field.name] || ''} 
                        onChange={(e) => setCurrentRecord({ ...currentRecord, [field.name]: e.target.value })} 
                      />
                    )}
                  </div>
                ))}
                <div className="sm:col-span-2 pt-6">
                  <button type="submit" className="w-full h-16 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                    {editingRecordId ? 'Update Record' : 'Save Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollectionDetail;
