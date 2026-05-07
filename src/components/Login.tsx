import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { LogIn, ShieldCheck, User, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const internalEmail = `${username.toLowerCase()}@holerite.premium`;

    try {
      // First, try standard login
      await signInWithEmailAndPassword(auth, internalEmail, password);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // Check if user is pre-registered in temp_credentials
        try {
          const credDoc = await getDoc(doc(db, 'temp_credentials', username.toLowerCase()));
          if (credDoc.exists()) {
            const data = credDoc.data();
            if (data.password === password) {
              // Valid pre-registration! Create the actual Auth user now
              await createUserWithEmailAndPassword(auth, internalEmail, password);
              // Successful creation also signs in the user
              return;
            }
          }
          setError('Usuário ou senha incorretos.');
        } catch (e) {
          setError('Erro ao verificar credenciais.');
        }
      } else {
        setError('Ocorreu um erro ao entrar. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 font-sans">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-indigo-50 to-transparent" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-8 py-12 text-center"
      >
        <div className="mb-10 inline-flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 leading-none">Portal IBEC</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-10 shadow-2xl shadow-indigo-100/50 space-y-8 max-w-[90vw] mx-auto sm:max-w-md">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Acesso Privado</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Utilize seu usuário e senha cadastrados pelo RH para acessar seus documentos.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Nome de Usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  placeholder="Ex: joao.silva"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-[11px] font-bold leading-none">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              disabled={isLoading}
              className="w-full relative flex items-center justify-center space-x-3 bg-indigo-600 text-white py-4 px-6 rounded-2xl font-bold transition-all hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>
          
          <div className="flex items-center justify-center space-x-4">
            <div className="h-px flex-1 bg-slate-100" />
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-bold">
              Autenticação RH
            </div>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <button 
            type="button"
            onClick={async () => {
              const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
              const provider = new GoogleAuthProvider();
              try {
                await signInWithPopup(auth, provider);
              } catch (e) {
                console.error(e);
              }
            }}
            className="w-full py-3 text-slate-300 text-[10px] font-black tracking-widest hover:text-indigo-400 transition-colors uppercase"
          >
            Acesso Administrativo (Google)
          </button>
        </div>
        
        <p className="mt-8 text-slate-400 text-xs leading-relaxed max-w-[280px] mx-auto">
          Dificuldades no acesso? Entre em contato com o departamento de RH de sua unidade.
        </p>
      </motion.div>
    </div>
  );
}
