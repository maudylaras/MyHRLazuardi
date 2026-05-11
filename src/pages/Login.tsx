import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, Lock, LogIn, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMsg(error.message || 'Gagal masuk dengan Google.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });
        if (error) throw error;
        alert('Cek email Anda untuk konfirmasi pendaftaran! (Jika email konfirmasi aktif di Supabase)');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      // Show more descriptive error for debugging
      if (error.message === 'Invalid path specified in request URL') {
        setErrorMsg('Konfigurasi URL Supabase di supabaseClient.js salah. Hapus "/rest/v1/" di akhir URL.');
      } else if (error.message === 'Invalid login credentials') {
        setErrorMsg('Email/Password tidak ditemukan. Jika Anda staf baru, pastikan klik "DAFTAR" dulu di bawah untuk buat akun.');
      } else if (error.message === 'User already registered') {
        setErrorMsg('Email ini sudah pernah didaftarkan. Harap klik "MASUK" di bawah untuk login.');
      } else if (error.status === 401 || error.status === 403) {
        setErrorMsg('Akses ditolak. Periksa kembali email dan password Anda.');
      } else if (error.message.includes('Email not confirmed')) {
        setErrorMsg('Email Anda belum dikonfirmasi. Silakan cek kotak masuk email Anda dan klik tautan konfirmasi.');
      } else {
        setErrorMsg(error.message || 'Gagal masuk. Periksa kembali data Anda.');
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
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-2xl bg-blue-50 p-4 text-blue-600">
            <ShieldCheck size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">MyHR Lazuardi</h1>
          <p className="mt-2 font-medium text-slate-500">Sistem Informasi SDM & Kepegawaian</p>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {!showEmailLogin ? (
              <motion.div
                key="google"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <button
                  id="login-btn"
                  onClick={handleGoogleLogin}
                  className="group flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-lg font-semibold transition-all hover:border-blue-600 hover:bg-blue-50 active:scale-95"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="h-6 w-6" />
                  <span className="text-slate-700 font-bold">Masuk dengan Google</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-black tracking-widest">Atau</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowEmailLogin(true)}
                  className="flex w-full items-center justify-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors py-2"
                >
                  <Mail size={16} />
                  Gunakan Email & Password
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {errorMsg && (
                  <div className="rounded-xl bg-red-50 p-4 border border-red-100">
                    <p className="text-xs text-red-600 font-bold text-center">{errorMsg}</p>
                  </div>
                )}

                {isSignUp && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                        <User size={18} />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama Lengkap Anda"
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all font-medium text-slate-900"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Karyawan</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@lazuardi.sch.id"
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-4 py-4 text-lg font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <LogIn size={20} />
                      {isSignUp ? 'Daftar Sekarang' : 'Masuk Sekarang'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg(null);
                  }}
                  className="w-full text-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors py-1"
                >
                  {isSignUp ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowEmailLogin(false);
                    setErrorMsg(null);
                  }}
                  className="flex w-full items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors py-2"
                >
                  Kembali ke Google Login
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-6 text-center text-slate-400">
          <p className="text-sm">&copy; 2026 MyHR Lazuardi. All rights reserved.</p>
          <p className="text-[10px] font-black uppercase tracking-widest mt-2">administrator maudy@lazuardi.sch.id</p>
        </div>
      </motion.div>
    </div>
  );
}
