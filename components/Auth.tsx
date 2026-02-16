
import React, { useState } from 'react';
import { Mail, User as UserIcon, Shield, ArrowRight, Sparkles, Building2, UserCircle } from 'lucide-react';
import { User, UserRole } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BUYER);
  const [step, setStep] = useState<'email' | 'details'>('email');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Check if user exists in local storage
    const savedUsers = JSON.parse(localStorage.getItem('propbrain_users') || '[]');
    const existingUser = savedUsers.find((u: User) => u.email === email);
    
    if (existingUser) {
      onLogin(existingUser);
    } else {
      setStep('details');
    }
  };

  const handleFullSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role
    };

    // Save user for future sessions
    const savedUsers = JSON.parse(localStorage.getItem('propbrain_users') || '[]');
    localStorage.setItem('propbrain_users', JSON.stringify([...savedUsers, newUser]));
    
    onLogin(newUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-indigo-500/30 mx-auto mb-6">
            PB
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">PropBrain</h1>
          <p className="text-slate-400 font-medium">Your Real Estate Second Brain</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-slate-400 text-sm">Enter your email to access your workspace.</p>
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 group"
              >
                Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all"
              >
                Launch Workspace
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
        
        <p className="text-center text-slate-600 text-[10px] mt-8 font-black uppercase tracking-widest">
          No verification needed. Simple as a brain.
        </p>
      </div>
    </div>
  );
};

export default Auth;
