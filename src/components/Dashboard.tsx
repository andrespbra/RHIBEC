import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db, UserProfile, Holerite, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  LogOut, 
  FileText, 
  Download, 
  Calendar, 
  ChevronRight, 
  User as UserIcon,
  ShieldAlert,
  Search,
  Building,
  Briefcase,
  IdCard,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  profile: UserProfile;
}

export default function Dashboard({ profile }: DashboardProps) {
  const [holerites, setHolerites] = useState<Holerite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchHolerites = async () => {
      setLoading(true);
      try {
        const ids = [
          profile.uid,
          profile.email,
          profile.email?.replace(/[@.]/g, '_')
        ].filter(Boolean);
        const q = query(
          collection(db, 'holerites'),
          where('employeeId', 'in', ids),
          where('year', '==', selectedYear),
          orderBy('month', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Holerite[];
        setHolerites(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'holerites');
      }
      setLoading(false);
    };

    fetchHolerites();
  }, [profile.uid, selectedYear]);

  const handleLogout = () => auth.signOut();

  const latestHolerite = holerites[0];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden relative">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 flex flex-col h-full border-r border-slate-800 transition-transform duration-300 transform
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">PortalIBEC</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-4 px-4 py-3 bg-white/10 text-white rounded-xl transition-all text-left">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-sm">Meus Holerites</span>
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all group text-left">
              <UserIcon className="w-5 h-5 group-hover:text-white transition-colors" />
              <span className="font-medium text-sm">Meus Dados</span>
            </button>
          </nav>
        </div>
        
        <div className="mt-auto p-8">
          <div className="mb-4 px-2">
            <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">Versão do Sistema</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              {import.meta.env.VITE_BUILD_TIME ? new Date(import.meta.env.VITE_BUILD_TIME).toLocaleString('pt-BR') : 'N/A'}
            </p>
          </div>
          <div className="p-5 bg-slate-800/50 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold ring-2 ring-indigo-500/30 flex-shrink-0">
                {profile.name[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-sm font-bold truncate">{profile.name}</p>
                <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest truncate">{profile.position || 'Funcionário'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full py-2 bg-slate-700/50 text-slate-300 text-[10px] font-black tracking-[0.2em] rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all uppercase"
            >
              Encerrar Sessão
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg"
            >
              <Search className="w-6 h-6 rotate-90" /> {/* Using search as a menu placeholder if Menu is not imported, let's use search for now or just FileText */}
            </button>
            <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">Painel do Colaborador</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Último Lançamento</p>
              <p className="text-sm font-bold text-slate-900">
                {latestHolerite ? format(latestHolerite.uploadedAt.toDate(), "dd 'de' MMM", { locale: ptBR }) : '---'}
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-10 flex-1 flex flex-col gap-6 lg:gap-10 overflow-auto">
          {/* Highlight Card */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            <div className="xl:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 text-white shadow-2xl shadow-indigo-200/50 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 -m-12 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-all" />
              
              <div className="relative z-10 w-full md:w-auto text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                  <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm border border-white/20">
                    <p className="text-white font-bold text-[9px] uppercase tracking-widest">{profile.department || 'Operacional'}</p>
                  </div>
                  <div className="px-3 py-1 bg-indigo-400/30 rounded-full backdrop-blur-sm border border-white/20">
                    <p className="text-white font-bold text-[9px] uppercase tracking-widest">Matrícula: {profile.employeeId}</p>
                  </div>
                </div>
                <p className="text-indigo-200 font-semibold mb-2 uppercase tracking-widest text-[10px]">Novo Holerite Disponível</p>
                <h2 className="text-3xl lg:text-4xl font-bold mb-8 italic capitalize">
                  {latestHolerite 
                    ? format(new Date(latestHolerite.year, latestHolerite.month - 1), "MMMM / yyyy", { locale: ptBR })
                    : "Carregando..."
                  }
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                  {latestHolerite && (
                    <a 
                      href={latestHolerite.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl shadow-lg hover:bg-slate-50 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Baixar PDF
                    </a>
                  )}
                  <button className="px-8 py-4 bg-indigo-500/40 text-white font-bold rounded-2xl backdrop-blur-md border border-white/20 text-sm hover:bg-indigo-500/60 transition-all">
                    Visualizar Online
                  </button>
                </div>
              </div>

              <div className="text-center md:text-right mt-8 md:mt-0 relative z-10 w-full md:w-auto">
                <p className="text-indigo-200 text-xs font-bold mb-1 uppercase tracking-widest">Ano de Ref.</p>
                <p className="text-5xl lg:text-6xl font-black">{selectedYear}</p>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-[2rem] lg:rounded-[2.5rem] p-8 lg:p-10 flex flex-col justify-center items-center text-center shadow-lg shadow-slate-200/50">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 lg:w-8 lg:h-8 text-indigo-500" />
              </div>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">Filtrar Período</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[2026, 2025, 2024].map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedYear === year 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List Section */}
          <div className="flex-1 bg-white border border-slate-200 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 flex flex-col shadow-xl shadow-slate-200/50 min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-500" />
                Histórico
              </h4>
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                {selectedYear}
              </div>
            </div>

            <div className="flex-1">
              {loading ? (
                <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-20 w-full bg-slate-50 rounded-2xl animate-pulse" />)}
                </div>
              ) : holerites.length > 0 ? (
                <div className="overflow-hidden">
                  {/* Desktop Table */}
                  <table className="w-full text-left hidden sm:table">
                    <thead className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] border-b border-slate-100">
                      <tr>
                        <th className="pb-5 font-black px-4">Mês Referência</th>
                        <th className="pb-5 font-black text-center">Tipo</th>
                        <th className="pb-5 font-black text-right">Data de Lançamento</th>
                        <th className="pb-5 font-black text-right px-4 text-nowrap">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 font-semibold text-sm">
                      {holerites.map((h) => (
                        <tr key={h.id} className="group hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0">
                          <td className="py-6 px-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:scale-110 transition-transform flex-shrink-0">
                                   {h.month.toString().padStart(2, '0')}
                                </div>
                                <span className="font-bold text-slate-900 tracking-tight capitalize">
                                    {format(new Date(h.year, h.month - 1), "MMMM 'de' yyyy", { locale: ptBR })}
                                </span>
                            </div>
                          </td>
                          <td className="py-6 text-center">
                            <span className="px-3 py-1 bg-slate-100 text-[9px] rounded-full uppercase font-black text-slate-500 tracking-wider">
                              Holerite
                            </span>
                          </td>
                          <td className="py-6 text-right text-slate-400 font-medium">
                            {format(h.uploadedAt.toDate(), "dd/MM/yyyy")}
                          </td>
                          <td className="py-6 text-right px-4">
                            <a 
                              href={h.pdfUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors inline-flex items-center gap-2 group-hover:translate-x-1 transition-transform"
                            >
                              Download
                              <ChevronRight className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-4">
                    {holerites.map((h) => (
                      <div key={h.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                              {h.month.toString().padStart(2, '0')}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 capitalize">{format(new Date(h.year, h.month - 1), "MMMM", { locale: ptBR })}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{h.year}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-white text-[8px] rounded-lg uppercase font-black text-slate-500 border border-slate-200">
                            Holerite
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                          <p className="text-[10px] text-slate-400 font-medium">Lançado em {format(h.uploadedAt.toDate(), "dd/MM/yyyy")}</p>
                          <a 
                            href={h.pdfUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm shadow-indigo-100 items-center justify-center inline-flex gap-2"
                          >
                            PDF <Download className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium italic text-sm">Nenhum registro encontrado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
