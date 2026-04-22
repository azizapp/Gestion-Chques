
import React, { useState } from 'react';
import { supabase } from '../supabase.ts';
import { ShieldCheck, Loader2, Mail, Key, UserPlus, LogIn } from 'lucide-react';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (isSignUp) alert('Compte créé avec succès ! Connectez-vous.');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] p-6 font-['Inter']">
      <div className="glass-card w-full max-w-[400px] p-10 rounded-[16px] border-white/5 shadow-2xl">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-14 h-14 rounded-[12px] bg-transparent border border-gold/30 flex items-center justify-center mb-6 shadow-2xl shadow-gold/5">
            <ShieldCheck className="text-gold" size={28} />
          </div>
          <h1 className="text-[22px] font-bold leading-[33px] italic tracking-tight mb-1 text-white uppercase">FINANSSE PRO</h1>
          <p className="text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold">
            {isSignUp ? 'Enregistrement Sécurisé' : 'Accès au Coffre-fort'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-1">E-mail Professionnel</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-gold/50 transition-colors" size={16} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/5 rounded-[12px] py-3.5 pl-11 pr-5 text-xs font-medium focus:border-gold/30 outline-none transition-all placeholder:text-white/5"
                placeholder="nom@entreprise.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-1">Clé d'Accès</label>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-gold/50 transition-colors" size={16} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/5 rounded-[12px] py-3.5 pl-11 pr-5 text-xs font-medium focus:border-gold/30 outline-none transition-all placeholder:text-white/5"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gold text-black rounded-[12px] font-bold text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : isSignUp ? (
              <>
                <UserPlus size={16} />
                Créer un compte
              </>
            ) : (
              <>
                <LogIn size={16} />
                Se connecter
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] text-white/20 hover:text-gold/60 transition-colors font-semibold uppercase tracking-widest"
          >
            {isSignUp ? 'Déjà inscrit ? Connexion' : 'Nouvel utilisateur ? S\'inscrire'}
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-[8px] text-white/10 font-medium tracking-widest uppercase">
            Protocole AES-256 actif
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;