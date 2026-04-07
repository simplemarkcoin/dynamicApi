import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Database, Zap, ArrowUpRight, Key, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { motion } from 'motion/react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    collections: 0,
    records: 0,
    integrations: 0,
    keys: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const collectionsSnap = await getDocs(collection(db, 'collections'));
        const recordsSnap = await getDocs(collection(db, 'records'));
        const integrationsSnap = await getDocs(collection(db, 'apiConfigs'));
        const keysSnap = await getDocs(collection(db, 'apiKeys'));
        
        setStats({
          collections: collectionsSnap.size,
          records: recordsSnap.size,
          integrations: integrationsSnap.size,
          keys: keysSnap.size
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'dashboard_stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { name: 'Collections', value: stats.collections, icon: Database, color: 'bg-indigo-500', link: '/collections' },
    { name: 'Total Records', value: stats.records, icon: Database, color: 'bg-blue-500', link: '/collections' },
    { name: 'Integrations', value: stats.integrations, icon: Zap, color: 'bg-amber-500', link: '/integrations' },
    { name: 'API Keys', value: stats.keys, icon: Key, color: 'bg-emerald-500', link: '/api-keys' },
  ];

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">System Overview</h1>
        <p className="text-sm md:text-base text-slate-400 mt-2">Monitor your dynamic schema and external integrations.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {cards.map((card, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={card.name}
          >
            <Link 
              to={card.link}
              className="block bg-slate-900/50 p-6 md:p-8 rounded-3xl border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <card.icon className="w-16 h-16" />
              </div>
              <div className="flex justify-between items-start mb-6">
                <div className={`${card.color} p-3 rounded-2xl shadow-lg shadow-indigo-500/10`}>
                  <card.icon className="text-white w-6 h-6" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <div className="text-xl md:text-lg font-bold text-white mb-1">
                {loading ? '...' : card.value}
              </div>
              <div className="text-sm font-medium text-slate-400">{card.name}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-base md:text-lg font-bold text-white">Quick Actions</h2>
            <Activity className="w-5 h-5 text-slate-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/collections" className="flex items-center gap-4 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <Database className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <span className="block text-sm font-bold text-white">New Collection</span>
                <span className="text-xs text-slate-500">Define a new data structure</span>
              </div>
            </Link>
            <Link to="/integrations" className="flex items-center gap-4 p-6 rounded-2xl border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <span className="block text-sm font-bold text-white">Add Integration</span>
                <span className="text-xs text-slate-500">Connect external services</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
          <h2 className="text-base md:text-lg font-bold text-white mb-8">Recent Activity</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4 opacity-50">
              <div className="w-2 h-2 bg-slate-700 rounded-full" />
              <div className="flex-1 h-4 bg-slate-800 rounded-full" />
            </div>
            <div className="flex items-center gap-4 opacity-30">
              <div className="w-2 h-2 bg-slate-700 rounded-full" />
              <div className="flex-1 h-4 bg-slate-800 rounded-full" />
            </div>
            <p className="text-slate-500 text-center py-4 text-sm italic">No recent activity found.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
