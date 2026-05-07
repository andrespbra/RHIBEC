import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, query, collection, where, getDocs, limit } from 'firebase/firestore';
import { auth, db, UserProfile, OperationType, handleFirestoreError } from './lib/firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { Loader2, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdminRef, setIsAdminRef] = useState(false);
  const [loading, setLoading] = useState(true);

  const OWNER_EMAIL = 'andre.ibm.rocha@gmail.com';

  useEffect(() => {
    // Cache clearing logic on version change
    const buildTime = import.meta.env.VITE_BUILD_TIME;
    const storedBuildTime = localStorage.getItem('portal_build_time');
    
    if (buildTime && storedBuildTime !== buildTime) {
      console.log('New version detected, clearing cache...');
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('portal_build_time', buildTime);
      // Reload only once to be safe if we were in the middle of a session
      if (storedBuildTime) {
        window.location.reload();
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          let profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          
          setIsAdminRef(adminDoc.exists());

          if (profileDoc.exists()) {
            const data = profileDoc.data() as UserProfile;
            if (adminDoc.exists() && data.role !== 'admin') {
              data.role = 'admin';
              await setDoc(doc(db, 'users', firebaseUser.uid), data);
            }
            setProfile(data);
          } else {
            // Check for pre-registered profile by email
            const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email), limit(1));
            const preSnap = await getDocs(q);
            
            if (!preSnap.empty) {
              const preDoc = preSnap.docs[0];
              const preData = preDoc.data() as UserProfile;
              const linkProfile: UserProfile = {
                ...preData,
                uid: firebaseUser.uid,
                role: adminDoc.exists() ? 'admin' : preData.role || 'employee'
              };
              // Migrate to UID-based document for security rules consistency
              await setDoc(doc(db, 'users', firebaseUser.uid), linkProfile);
              if (preDoc.id !== firebaseUser.uid) {
                // Delete temporary pre-registration doc if it had a different ID
                // (e.g. if we used addDoc or email-as-id)
                // Note: requires delete permission or handled via rules
              }
              setProfile(linkProfile);
            } else {
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'Funcionário',
                username: firebaseUser.email?.split('@')[0] || firebaseUser.uid.slice(0, 8),
                email: firebaseUser.email || '',
                role: adminDoc.exists() ? 'admin' : 'employee',
                employeeId: firebaseUser.uid.slice(0, 8).toUpperCase(),
                createdAt: Timestamp.now(),
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
              setProfile(newProfile);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsAdminRef(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const promoteToAdmin = async () => {
    if (!user || user.email !== OWNER_EMAIL) return;
    setLoading(true);
    try {
      // NOTE: For this to work initially, firestore rules must allow creation of admins 
      // OR you must add yourself in the console. 
      // I'll provide a hint.
      await setDoc(doc(db, 'admins', user.uid), { email: user.email });
      await setDoc(doc(db, 'users', user.uid), { ...profile, role: 'admin' });
      window.location.reload();
    } catch (error) {
      alert("Para ativar o modo admin, você deve primeiro adicionar seu UID na coleção 'admins' via console do Firebase OU ajustar as regras temporariamente.");
      console.error(error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-indigo-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-100">
      {user?.email === OWNER_EMAIL && !isAdminRef && (
        <div className="fixed bottom-4 right-4 z-50">
          <button 
            onClick={promoteToAdmin}
            className="flex items-center space-x-2 bg-[#f27d26] text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl hover:scale-105 transition-transform"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ativar Modo Admin (Proprietário)</span>
          </button>
        </div>
      )}
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Login />
          </motion.div>
        ) : profile?.role === 'admin' ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
          >
            <AdminPanel profile={profile} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Dashboard profile={profile!} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
