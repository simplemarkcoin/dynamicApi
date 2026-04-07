import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Plus, Database, ChevronRight, X, LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Collection } from '../types';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { motion, AnimatePresence } from 'motion/react';

const Collections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({ name: '', slug: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const q = query(collection(db, 'collections'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setCollections(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'collections');
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollection.name || !newCollection.slug) return;

    try {
      await addDoc(collection(db, 'collections'), {
        ...newCollection,
        fields: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid
      });
      setIsModalOpen(false);
      setNewCollection({ name: '', slug: '' });
      const q = query(collection(db, 'collections'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCollections(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection)));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'collections');
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Collections</h1>
          <p className="text-sm md:text-base text-slate-400 mt-2">Define your data structures and tables.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Collection
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-900/50 animate-pulse rounded-3xl border border-slate-800"></div>)}
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[32px] p-12 md:p-24 text-center">
          <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-800">
            <Database className="text-slate-700 w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No collections yet</h3>
          <p className="text-slate-400 mb-10 max-w-sm mx-auto text-base">Create your first collection to start building your dynamic data structure.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Create Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((col, index) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              key={col.id}
            >
              <Link
                to={`/collections/${col.id}`}
                className="block bg-slate-900/50 p-8 rounded-3xl border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-indigo-500/10 p-4 rounded-2xl group-hover:bg-indigo-500/20 transition-colors">
                    <Database className="text-indigo-500 w-7 h-7" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{col.name}</h3>
                <p className="text-sm font-mono text-slate-500 mb-6">/{col.slug}</p>
                <div className="flex items-center gap-6 text-sm text-slate-400">
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    {col.fields?.length || 0} fields
                  </span>
                  <span className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Records
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
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
              <h2 className="text-2xl font-bold text-white mb-8">Create Collection</h2>
              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-3">Collection Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Products"
                    className="w-full h-14 px-5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                    value={newCollection.name}
                    onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-3">URL Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. products"
                    className="w-full h-14 px-5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                    value={newCollection.slug}
                    onChange={(e) => setNewCollection({ ...newCollection, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-14 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 mt-4 active:scale-95"
                >
                  Create Collection
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Collections;
