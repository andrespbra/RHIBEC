import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  setDoc, 
  doc, 
  Timestamp, 
  addDoc,
  where,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { auth, db, UserProfile, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Upload, 
  Users, 
  Search, 
  FileText, 
  CheckCircle2, 
  X, 
  Plus, 
  LogOut,
  Settings,
  UserCheck,
  ShieldCheck,
  Briefcase,
  Building,
  Calendar,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  profile: UserProfile;
}

export default function AdminPanel({ profile }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success'>('idle');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  
  // New User State
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    employeeId: '',
    position: '',
    department: '',
    admissionDate: ''
  });

  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedUser) return;

    setIsUploading(true);
    setError(null);
    try {
      const storage = getStorage();
      // Use a stable ID (UID or sanitized email) if UID is not yet available
      const stableId = (selectedUser.uid || selectedUser.email).replace(/[@.]/g, '_');
      const storageRef = ref(storage, `holerites/${stableId}/${Date.now()}_${file.name}`);
      
      console.log('Starting upload to:', storageRef.fullPath);
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload successful, getting URL...');
      const pdfUrl = await getDownloadURL(snapshot.ref);

      console.log('Saving to Firestore...');
      await addDoc(collection(db, 'holerites'), {
        employeeId: selectedUser.uid || selectedUser.email, // Un-sanitized for easier rule matching
        email: selectedUser.email,
        month,
        year,
        pdfUrl,
        fileName: file.name,
        uploadedAt: Timestamp.now(),
      });

      setUploadStatus('success');
      showToast('Holerite enviado com sucesso para ' + selectedUser.name);
      setTimeout(() => {
        setUploadStatus('idle');
        setFile(null);
        setSelectedUser(null);
      }, 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Erro ao enviar arquivo. Verifique se o Cloud Storage está ativado e as permissões estão corretas.');
      // Still log to firestore error handler for diagnostics
      handleFirestoreError(err, OperationType.CREATE, 'holerites');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.employeeId.toLowerCase().includes(search.toLowerCase())
  ).filter(u => u.role === 'employee');

  const handleLogout = () => auth.signOut();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const internalEmail = `${newUser.username.toLowerCase()}@holerite.premium`;
      const userProfile: UserProfile = {
        name: newUser.name,
        username: newUser.username.toLowerCase(),
        email: internalEmail,
        employeeId: newUser.employeeId,
        position: newUser.position,
        department: newUser.department,
        admissionDate: newUser.admissionDate,
        role: 'employee',
        createdAt: Timestamp.now(),
      };
      // Use internal email as document ID
      await setDoc(doc(db, 'users', internalEmail), userProfile);
      
      // Store credentials temporarily for the system to know the password
      // In a real app, you would use createUserWithEmailAndPassword here.
      await setDoc(doc(db, 'temp_credentials', userProfile.username), {
        username: userProfile.username,
        password: newUser.password,
        email: internalEmail
      });
      
      setUploadStatus('success');
      showToast('Colaborador ' + newUser.name + ' cadastrado com sucesso!');
      setTimeout(() => {
        setUploadStatus('idle');
        setIsAddingUser(false);
        setNewUser({ name: '', username: '', password: '', employeeId: '', position: '', department: '', admissionDate: '' });
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    } finally {
      setIsUploading(false);
    }
  };

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

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border w-[90%] max-w-md ${
              toast.type === 'success' 
                ? 'bg-emerald-900 border-emerald-800 text-emerald-50' 
                : 'bg-red-900 border-red-800 text-red-50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="font-bold text-xs sm:text-sm tracking-tight truncate flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Admin Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 flex flex-col h-full border-r border-slate-800 transition-transform duration-300 transform
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Portal IBEC</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-4 px-4 py-3 bg-white/10 text-white rounded-xl transition-all text-left">
              <Users className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-sm">Gestão de Pessoal</span>
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all group text-left">
              <Settings className="w-5 h-5 group-hover:text-white transition-colors" />
              <span className="font-medium text-sm">Configurações</span>
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
              <div className="w-9 h-9 rounded-full bg-slate-600 text-slate-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                AD
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-sm font-bold truncate">Administrador</p>
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest truncate">Acesso Total</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full py-2 bg-slate-700/50 text-slate-300 text-[10px] font-black tracking-[0.2em] rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all uppercase"
            >
              SAIR
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between flex-shrink-0">
           <div className="flex items-center gap-4">
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg"
               >
                 <Users className="w-6 h-6 rotate-90" />
               </button>
               <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">Gestão RH</h1>
               <div className="hidden sm:block w-[1px] h-6 bg-slate-200" />
               <p className="hidden sm:block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Painel Administrativo</p>
           </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row p-4 lg:p-10 gap-6 lg:gap-8 overflow-hidden relative">
          {/* User List Panel */}
          <div className={`
            w-full lg:w-1/3 flex flex-col bg-white border border-slate-200 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-300
            ${(selectedUser || isAddingUser) ? 'hidden lg:flex' : 'flex'}
          `}>
             <div className="p-6 lg:p-8 border-b border-slate-50">
               <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <Users className="w-3.5 h-3.5" />
                 Colaboradores
               </h2>
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="Nome ou ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <button 
                  onClick={() => setIsAddingUser(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                >
                  <UserPlus className="w-4 h-4" />
                  Novo Cadastro
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredUsers.map(user => (
                  <button
                    key={user.uid || user.email || user.username}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                      selectedUser?.email === user.email 
                        ? 'bg-slate-900 text-white shadow-xl translate-x-1' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-4 text-left">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        selectedUser?.email === user.email ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {user.name[0]}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm truncate w-32 sm:w-40 tracking-tight">{user.name}</p>
                        <p className={`text-[9px] uppercase font-black tracking-widest truncate ${
                          selectedUser?.email === user.email ? 'text-slate-400' : 'text-slate-300'
                        }`}>
                          {user.position || 'Colaborador'}
                        </p>
                      </div>
                    </div>
                    {selectedUser?.email === user.email && <UserCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 ml-2" />}
                  </button>
                ))}
             </div>
          </div>

          {/* Upload Form Area */}
          <div className={`
            flex-1 transition-all duration-300
            ${(selectedUser || isAddingUser) ? 'flex' : 'hidden lg:flex'}
          `}>
            <AnimatePresence mode="wait">
                {isAddingUser ? (
                  <motion.div
                    key="add-user-panel"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="w-full h-full bg-white border border-slate-200 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden"
                  >
                    <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 lg:py-12 scroll-smooth">
                      <div className="absolute top-0 right-0 p-4 lg:p-8 z-10">
                          <button onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors bg-white/50 backdrop-blur-sm">
                              <X className="w-5 h-5 text-slate-400" />
                          </button>
                      </div>

                      <div className="max-w-2xl mx-auto w-full space-y-8 lg:space-y-10 pb-12">
                          <div className="text-center space-y-2">
                               <div className="w-12 h-12 lg:w-16 lg:h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600 transform -rotate-12">
                                  <UserPlus className="w-6 h-6 lg:w-8 lg:h-8" />
                               </div>
                               <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Cadastrar Funcionário</h3>
                               <p className="text-slate-400 text-xs sm:text-sm font-medium">Preencha os dados completos para acesso ao sistema.</p>
                          </div>

                          <form onSubmit={handleCreateUser} className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nome Completo</label>
                                      <input 
                                        required
                                        type="text"
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-500 font-bold text-slate-700 text-sm"
                                        placeholder="Ex: João da Silva"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Usuário (Login)</label>
                                      <input 
                                        required
                                        type="text"
                                        value={newUser.username}
                                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-500 font-bold text-slate-700 text-sm"
                                        placeholder="Ex: joao.silva"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Senha de Acesso</label>
                                      <input 
                                        required
                                        type="password"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-500 font-bold text-slate-700 text-sm"
                                        placeholder="••••••••"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Matrícula (ID)</label>
                                      <input 
                                        required
                                        type="text"
                                        value={newUser.employeeId}
                                        onChange={e => setNewUser({ ...newUser, employeeId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-500 font-bold text-slate-700 text-sm"
                                        placeholder="Ex: RH123"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Data de Admissão</label>
                                      <input 
                                        type="date"
                                        value={newUser.admissionDate}
                                        onChange={e => setNewUser({ ...newUser, admissionDate: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-500 font-bold text-slate-700 text-sm"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Cargo</label>
                                      <div className="relative">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input 
                                          type="text"
                                          value={newUser.position}
                                          onChange={e => setNewUser({ ...newUser, position: e.target.value })}
                                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 outline-none focus:border-emerald-500 font-bold text-slate-700 text-sm"
                                          placeholder="Ex: Analista"
                                        />
                                      </div>
                                  </div>
                              </div>

                              <button
                                disabled={isUploading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center justify-center space-x-3 overflow-hidden text-xs uppercase tracking-widest mt-4 lg:mt-8"
                              >
                                  {isUploading ? (
                                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                      <>
                                          <UserPlus className="w-5 h-5" />
                                          <span>Finalizar Cadastro</span>
                                      </>
                                  )}
                              </button>
                          </form>
                      </div>
                    </div>
                  </motion.div>
                ) : selectedUser ? (
                  <motion.div
                    key="upload-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full h-full bg-white border border-slate-200 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-6 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 lg:p-8">
                        <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="max-w-md w-full space-y-8 lg:space-y-10">
                        <div className="text-center space-y-2">
                             <div className="w-12 h-12 lg:w-16 lg:h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 transform rotate-12">
                                <Plus className="w-6 h-6 lg:w-8 lg:h-8" />
                             </div>
                             <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Lançar Holerite</h3>
                             <div className="flex flex-col items-center gap-1">
                                <p className="text-slate-500 text-xs sm:text-sm font-medium italic truncate max-w-xs px-4 text-center">
                                  Enviando para: <span className="text-slate-900 font-bold not-italic">{selectedUser.name}</span>
                                </p>
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{selectedUser.position || 'Funcionário'} • {selectedUser.employeeId}</p>
                             </div>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="grid grid-cols-2 gap-3 lg:gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mês</label>
                                    <select 
                                      value={month} 
                                      onChange={(e) => setMonth(Number(e.target.value))}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-indigo-500 font-bold text-slate-700 text-sm"
                                    >
                                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                        <option key={m} value={m}>Mês {m.toString().padStart(2, '0')}</option>
                                      ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Ano</label>
                                    <select 
                                      value={year} 
                                      onChange={(e) => setYear(Number(e.target.value))}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-indigo-500 font-bold text-slate-700 text-sm"
                                    >
                                      {[2026, 2025, 2024].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                      ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Arquivo PDF</label>
                                <div className="relative">
                                    <input 
                                      type="file" 
                                      accept=".pdf"
                                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                                      className="hidden"
                                      id="pdf-upload"
                                    />
                                    <label 
                                      htmlFor="pdf-upload"
                                      className={`flex flex-col items-center justify-center w-full h-32 lg:h-40 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all ${
                                        file ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50'
                                      }`}
                                    >
                                      <Upload className={`w-6 h-6 lg:w-8 lg:h-8 mb-2 ${file ? 'text-indigo-500' : 'text-slate-300'}`} />
                                      {file ? (
                                        <p className="text-xs font-bold text-indigo-600 truncate px-6 w-full text-center">{file.name}</p>
                                      ) : (
                                        <p className="text-[10px] text-slate-400 font-medium">Selecionar PDF</p>
                                      )}
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {error && (
                                  <div className="bg-red-50 border border-red-100 rounded-2xl p-3 flex items-start space-x-3 mb-4">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-red-600 leading-tight">{error}</p>
                                  </div>
                                )}

                                <button
                                  disabled={!file || isUploading}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-3 overflow-hidden text-xs uppercase tracking-widest"
                                >
                                {isUploading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5" />
                                        <span>Confirmar Envio</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full border border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center bg-white/50 space-y-6"
                  >
                    <Plus className="w-10 h-10 text-slate-200" />
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Seleção</h3>
                        <p className="text-xs text-slate-400 font-medium italic max-w-[200px] mx-auto">
                          Escolha um funcionário para realizar lançamentos.
                        </p>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
