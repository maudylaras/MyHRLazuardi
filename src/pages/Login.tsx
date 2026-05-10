import { motion } from 'motion/react';
import { LogIn, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-600 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">MyHR Lazuardi</h1>
          <p className="mt-2 text-slate-500">Selamat datang kembali! Silakan masuk untuk melanjutkan.</p>
        </div>

        <div className="space-y-4">
          <button
            id="login-btn"
            onClick={onLogin}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-lg font-semibold transition-all hover:border-blue-600 hover:bg-blue-50 active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-6 w-6" />
            <span className="text-slate-700 group-hover:text-blue-700">Masuk dengan Google</span>
          </button>
        </div>

        <div className="pt-6 text-center text-slate-400">
          <p className="text-sm">&copy; 2026 MyHR Lazuardi. All rights reserved.</p>
          <p className="text-[10px] font-black uppercase tracking-widest mt-2">administrator maudy@lazuardi.sch.id</p>
        </div>
      </motion.div>
    </div>
  );
}
