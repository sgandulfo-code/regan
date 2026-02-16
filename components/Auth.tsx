
import React, { useState } from 'react';
import { Mail, User as UserIcon, ArrowRight, Sparkles, Building2, UserCircle, Loader2 } from 'lucide-react';
import { User, UserRole } from '../types';
import { dataService } from '../services/dataService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BUYER);
  const [step, setStep] = useState<'email' | 'details'>('email');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    const existingUser = await dataService.getProfileByEmail(email);
    setIsLoading(false);
    
    if (existingUser) {
      onLogin(existingUser);
    } else {
      setStep('details');
    }
  };

  const handleFullSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsLoading(true);
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9), // Supabase can generate UUIDs too
      name,
      email,
      role
    };

    const createdUser = await dataService.createProfile(newUser);
    setIsLoading(false);
    
    if (createdUser) {
      onLogin({
        id: createdUser.id,
        name: createdUser.full_name,
        email: createdUser.email,
        role: createdUser.role as UserRole
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-indigo-500/30 mx-auto mb-6">
            PB
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">PropBrain</h1>
          <p className="text-slate-400 font-medium">Synced with Supabase Cloud</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-slate-400 text-sm">Enter your email to verify your session.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="email"
                    placeholder="name@company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 group disabled:bg-slate-800"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleFullSignup} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white mb-2">Finalize Profile</h2>
                <p className="text-slate-400 text-sm">Tell us who you are to personalize PropBrain.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="text"
                    placeholder="Alejandro Martinez"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: UserRole.BUYER, icon: UserCircle, label: 'Buyer' },
                    { id: UserRole.ARCHITECT, icon: Sparkles, label: 'Archit.' },
                    { id: UserRole.CONTRACTOR, icon: Building2, label: 'Contr.' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        role === r.id 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <r.icon className="w-5 h-5 mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all disabled:bg-slate-800 flex justify-center"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Launch Workspace"}
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep('email')}
                className="w-full text-slate-500 text-xs font-bold hover:text-slate-400 transition-colors"
              >
                Back to email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
