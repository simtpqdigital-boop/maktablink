import React, { useEffect, useState } from 'react';
import { ArrowRight, Download, KeyRound, Smartphone, User } from 'lucide-react';

interface LoginSectionProps {
  onLogin: (username: string, password: string) => Promise<void> | void;
}

export const LoginSection: React.FC<LoginSectionProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PWA Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is running as standalone PWA
    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isPWA);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallGuide((prev) => !prev);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submit
    setIsSubmitting(true);
    try {
      await onLogin(username, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="p-5 md:p-8 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] flex-1 flex flex-col justify-center overflow-y-auto max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <div className="mb-3 flex justify-center">
          <div className="relative p-1 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[2.2rem] shadow-xl shadow-emerald-500/20 border-2 border-emerald-300/40 flex items-center justify-center overflow-hidden">
            <img
              src="/maktablink-icon.svg"
              alt="MaktabLink Logo"
              className="h-16 w-16 object-contain filter drop-shadow"
            />
          </div>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight font-['Outfit']">
          Maktab<span className="text-emerald-400">Link</span>
        </h1>
        <p className="text-teal-200/70 text-[11px] mt-1 font-bold uppercase tracking-widest font-['Outfit']">
          Platform informasi santri berbasis link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[#083834]/65 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-teal-500/25 shadow-2xl text-slate-100">
        <div>
          <label className="block text-[10px] font-black text-teal-200/80 uppercase tracking-widest mb-1.5 ml-1 font-['Outfit']">
            Username Akun
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-[#042422] border border-teal-600/40 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 font-bold text-sm text-white transition-all placeholder:text-teal-200/40 placeholder:font-normal"
              placeholder="Masukkan username..."
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-teal-200/80 uppercase tracking-widest mb-1.5 ml-1 font-['Outfit']">
            Password / Kata Sandi
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-[#042422] border border-teal-600/40 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 font-bold text-sm text-white transition-all placeholder:text-teal-200/40 placeholder:font-normal"
              placeholder="Masukkan password..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all uppercase text-xs tracking-wider flex items-center justify-center space-x-2 font-['Outfit'] border border-emerald-300/40 ${
            isSubmitting ? 'opacity-80 cursor-not-allowed' : 'active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Memverifikasi Akses...</span>
            </>
          ) : (
            <>
              <span>Masuk Sistem MaktabLink</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>

        {/* PWA Download Button */}
        {!isStandalone && (
          <div className="pt-3 border-t border-teal-500/20 mt-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3 px-4 bg-teal-900/40 hover:bg-emerald-500/20 text-emerald-300 rounded-2xl text-xs font-extrabold border border-teal-500/30 transition-all flex items-center justify-center space-x-2 active:scale-98 shadow-xs font-['Outfit']"
            >
              <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>Instal Aplikasi MaktabLink</span>
            </button>

            {showInstallGuide && (
              <div className="mt-2.5 p-3 bg-[#031d1b] border border-teal-500/30 text-teal-100 rounded-2xl text-[10px] space-y-1.5 font-sans leading-relaxed animate-in fade-in duration-200">
                <div className="flex items-center space-x-1.5 font-bold text-emerald-400 font-['Outfit']">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Cara Menginstal di Ponsel / Chrome:</span>
                </div>
                <p>1. Klik titik tiga (⋮) di pojok kanan atas browser Chrome.</p>
                <p>2. Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.</p>
                <p>3. Aplikasi MaktabLink akan terpasang di layar HP seperti aplikasi Android/iOS resmi.</p>
              </div>
            )}
          </div>
        )}
      </form>
    </section>
  );
};
