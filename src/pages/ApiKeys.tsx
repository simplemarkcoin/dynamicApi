import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Plus, Key, X, Trash2, Copy, Check, ShieldAlert } from 'lucide-react';
import { ApiKey } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { cn } from '../lib/utils';

const ApiKeys = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const q = query(collection(db, 'apiKeys'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setKeys(snap.docs.map(d => ({ id: d.id, ...d.data() } as ApiKey)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'apiKeys');
      } finally {
        setLoading(false);
      }
    };
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    const generatedKey = 'sk_' + Math.random().toString(36).substr(2, 24);
    
    try {
      await addDoc(collection(db, 'apiKeys'), {
        name: newKeyName,
        key: generatedKey,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid
      });
      setIsModalOpen(false);
      setNewKeyName('');
      
      const q = query(collection(db, 'apiKeys'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setKeys(snap.docs.map(d => ({ id: d.id, ...d.data() } as ApiKey)));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'apiKeys');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Revoke this API key? This will immediately break any application using it.")) return;
    try {
      await deleteDoc(doc(db, 'apiKeys', id));
      setKeys(keys.filter(k => k.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `apiKeys/${id}`);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">API Keys</h1>
          <p className="text-sm md:text-base text-slate-400 mt-2">Manage access keys for external applications to use your dynamic APIs.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Generate Key
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => <div key={i} className="h-24 bg-slate-900/50 animate-pulse rounded-[24px] border border-slate-800"></div>)}
        </div>
      ) : keys.length === 0 ? (
        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[32px] p-12 md:p-24 text-center">
          <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-800">
            <Key className="text-slate-700 w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No API keys yet</h3>
          <p className="text-slate-400 mb-10 max-w-sm mx-auto text-base">Generate an API key to allow external apps to interact with your collections via REST API.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Generate First Key
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800">
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Name</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Key</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {keys.map((k, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={k.id} 
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-8 py-6 font-bold text-white">{k.name}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <code className="bg-slate-950 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 border border-slate-800">
                          {k.key.substring(0, 8)}...{k.key.substring(k.key.length - 4)}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(k.key, k.id)}
                          className="p-2 bg-slate-900 text-slate-500 hover:text-indigo-400 rounded-xl transition-all active:scale-90"
                        >
                          {copiedId === k.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDelete(k.id)} 
                        className="p-2 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl w-full max-w-md p-8 md:p-10 relative"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-white mb-8">Generate API Key</h2>
              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-3">Key Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mobile App"
                    className="w-full h-14 px-5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="flex items-start gap-4 bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl">
                  <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This key will grant <span className="text-white font-bold">full access</span> to your collections via the REST API. Never share this key or expose it in client-side code.
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full h-16 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 mt-4 active:scale-95"
                >
                  Generate Key
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApiKeys;
