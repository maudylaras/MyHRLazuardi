import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, ShieldCheck, Mail, Lock, User as UserIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { signUp, signIn, resetPassword } from '../lib/firebase';

interface LoginProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password, name);
        onLogin();
      } else if (mode === 'login') {
        await signIn(email, password);
        onLogin();
      } else if (mode === 'forgot-password') {
        await resetPassword(email);
        setSuccess('Instruksi pemulihan kata sandi telah dikirim ke email Anda.');
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email or password is incorrect');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('User already exists. Please sign in');
      } else {
        setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-600 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-[40px] bg-white p-10 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">MyHR Lazuardi</h1>
          <p className="mt-2 text-slate-500">
            {mode === 'login' && 'Selamat datang kembali! Silakan masuk.'}
            {mode === 'signup' && 'Buat akun baru untuk mulai menggunakan layanan.'}
            {mode === 'forgot-password' && 'Masukkan email Anda untuk memulihkan kata sandi.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-100">
                {error}
              </div>
            )}
            
            {success && (
              <div className="rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-600 border border-emerald-100">
                {success}
              </div>
            )}

            <div className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {mode !== 'forgot-password' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kata Sandi</label>
                    {mode === 'login' && (
                      <button 
                        type="button"
                        onClick={() => setMode('forgot-password')}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                      >
                        Lupa?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                mode === 'login' ? 'MASUK' : (mode === 'signup' ? 'DAFTAR SEKARANG' : 'KIRIM LINK PEMULIHAN')
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="pt-2 text-center">
          {mode === 'login' ? (
            <div className="space-y-6">
              <p className="text-xs font-bold text-slate-500">
                Belum punya akun?{' '}
                <button 
                  onClick={() => setMode('signup')}
                  className="text-blue-600 font-black hover:underline uppercase"
                >
                  Daftar
                </button>
              </p>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100"></span>
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                  <span className="bg-white px-4 text-slate-400">Atau</span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  try {
                    await onLogin();
                  } catch (err: any) {
                    if (err.code === 'auth/unauthorized-domain') {
                      setError('This domain is not authorized. Please check Firebase Console.');
                    } else if (err.code === 'auth/popup-closed-by-user') {
                      setError('Sign-in popup closed. Please try again.');
                    } else {
                      setError('Terjadi kesalahan saat masuk dengan Google.');
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-100 bg-white py-4 text-xs font-black transition-all hover:border-blue-600 hover:bg-blue-50 active:scale-95 disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
                <span className="text-slate-700 uppercase tracking-widest group-hover:text-blue-700">Lanjutkan dengan Google</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setMode('login')}
              className="flex items-center gap-2 mx-auto text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Kembali ke Masuk
            </button>
          )}
        </div>

        <div className="pt-6 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] space-y-1">
          <div>&copy; 2026 MyHR Lazuardi. Powered by HR Connect Pro.</div>
          <div className="text-blue-400/50 italic">Administrator: maudy@lazuardi.sch.id</div>
        </div>
      </motion.div>
    </div>
  );
}
