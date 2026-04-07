import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Zap, X, Trash2, Globe, ArrowRight, Settings2, Activity } from 'lucide-react';
import { ApiConfig, Collection } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { cn } from '../lib/utils';

const Integrations = () => {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newConfig, setNewConfig] = useState<Partial<ApiConfig>>({ name: '', url: '', method: 'POST', trigger: 'onCreate', collectionId: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const configsSnap = await getDocs(query(collection(db, 'apiConfigs'), orderBy('name')));
        const collectionsSnap = await getDocs(query(collection(db, 'collections'), orderBy('name')));
        setConfigs(configsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ApiConfig)));
        setCollections(collectionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Collection)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'apiConfigs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfig.name || !newConfig.url || !newConfig.collectionId) return;
    try {
      await addDoc(collection(db, 'apiConfigs'), { ...newConfig, createdAt: serverTimestamp() });
      setIsModalOpen(false);
      const snap = await getDocs(query(collection(db, 'apiConfigs'), orderBy('name')));
      setConfigs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ApiConfig)));
      setNewConfig({ name: '', url: '', method: 'POST', trigger: 'onCreate', collectionId: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'apiConfigs');
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Integrations</h1>
          <p className="text-sm md:text-base text-slate-400 mt-2">Connect your data to external APIs and webhooks.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Integration
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map(i => <div key={i} className="h-48 bg-slate-900/50 animate-pulse rounded-[32px] border border-slate-800"></div>)}
        </div>
      ) : configs.length === 0 ? (
        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[32px] p-12 md:p-24 text-center">
          <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-800">
            <Zap className="text-slate-700 w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No integrations yet</h3>
          <p className="text-slate-400 mb-10 max-w-sm mx-auto text-base">Connect your collections to external APIs to trigger actions on data changes.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-amber-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Create Integration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {configs.map((config, index) => {
            const col = collections.find(c => c.id === config.collectionId);
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={config.id} 
                className="bg-slate-900/50 p-8 rounded-[32px] border border-slate-800 hover:border-amber-500/30 transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className="bg-amber-500/10 p-4 rounded-2xl group-hover:bg-amber-500/20 transition-colors">
                      <Globe className="text-amber-500 w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{config.name}</h3>
                      <p className="text-xs font-mono text-slate-500 mt-1 truncate max-w-[200px] md:max-w-xs">{config.url}</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => { if(window.confirm("Delete integration?")) { await deleteDoc(doc(db, 'apiConfigs', config.id)); setConfigs(configs.filter(c => c.id !== config.id)); } }} 
                    className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Settings2 className="w-4 h-4 text-indigo-500" />
                    {col?.name || 'Unknown'}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-700 hidden sm:block" />
                  <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {config.trigger}
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Activity className="w-3 h-3" />
                    {config.method}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl w-full max-w-lg p-8 md:p-10 relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-white mb-8">New Integration</h2>
              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-3">Integration Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Slack Webhook"
                    className="w-full h-14 px-5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-700" 
                    value={newConfig.name} 
                    onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-3">Endpoint URL</label>
                  <input 
                    type="url" 
                    required 
                    placeholder="https://api.example.com/webhook"
                    className="w-full h-14 px-5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base font-mono focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-700" 
                    value={newConfig.url} 
                    onChange={(e) => setNewConfig({ ...newConfig, url: e.target.value })} 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-3">Source Collection</label>
                    <select 
                      required 
                      className="w-full h-14 px-5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base focus:ring-2 focus:ring-amber-500 outline-none transition-all appearance-none" 
                      value={newConfig.collectionId} 
                      onChange={(e) => setNewConfig({ ...newConfig, collectionId: e.target.value })}
                    >
                      <option value="">Select Collection</option>
                      {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-3">Trigger Event</label>
                    <select 
                      className="w-full h-14 px-5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base focus:ring-2 focus:ring-amber-500 outline-none transition-all appearance-none" 
                      value={newConfig.trigger} 
                      onChange={(e) => setNewConfig({ ...newConfig, trigger: e.target.value as any })}
                    >
                      <option value="onCreate">On Create</option>
                      <option value="onUpdate">On Update</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full h-16 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 mt-4 active:scale-95">
                  Create Integration
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Integrations;
