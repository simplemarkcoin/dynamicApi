import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { History, CheckCircle2, XCircle, Clock, Activity, AlertCircle } from 'lucide-react';
import { ApiLog } from '../types';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { cn } from '../lib/utils';

const Logs = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, 'apiLogs'), orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ApiLog)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'apiLogs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">API Logs</h1>
          <p className="text-sm md:text-base text-slate-400 mt-2">History of external integration calls and webhook triggers.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
          <Activity className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Real-time monitoring</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-slate-900/50 animate-pulse rounded-2xl border border-slate-800"></div>)}
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800">
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Integration ID</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-24 text-center">
                      <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-800">
                        <History className="text-slate-700 w-8 h-8" />
                      </div>
                      <p className="text-slate-500 italic">No logs found yet. Trigger an integration to see activity.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      key={log.id} 
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            log.status >= 200 && log.status < 300 ? "bg-emerald-500/10" : "bg-red-500/10"
                          )}>
                            {log.status >= 200 && log.status < 300 ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <span className={cn(
                            "font-bold text-sm",
                            log.status >= 200 && log.status < 300 ? 'text-emerald-500' : 'text-red-500'
                          )}>
                            {log.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <code className="bg-slate-950 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 border border-slate-800">
                            {log.apiConfigId}
                          </code>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-400">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-slate-600" />
                          <span className="font-medium">
                            {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'MMM d, HH:mm:ss') : 'Just now'}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="flex items-center gap-4 bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-[24px]">
          <AlertCircle className="w-6 h-6 text-indigo-500 shrink-0" />
          <p className="text-sm text-slate-400 leading-relaxed">
            Showing the <span className="text-white font-bold">last 50</span> integration events. Logs are automatically rotated to optimize performance.
          </p>
        </div>
      )}
    </div>
  );
};

export default Logs;
