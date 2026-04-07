"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  StickyNote, 
  Bell, 
  Plus, 
  Search, 
  User, 
  Clock, 
  Calendar, 
  AlertCircle,
  X,
  Check,
  Zap,
  ArrowRight,
  LogOut,
  Edit2,
  Menu,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LayoutDashboard,
  Target,
  TrendingUp,
  Activity,
  Layers,
  Settings,
  ChevronRight,
  MoreVertical,
  Sliders,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type ClientStatus = 'Excellent' | 'Optimizing' | 'Attention' | 'Starting';
type StageId = 'lead' | 'processing' | 'active' | 'review' | 'done';

interface ClientNote {
  id: string;
  clientName: string;
  statusSummary: string;
  content: string;
  status: ClientStatus;
  updatedAt: string;
  stage: StageId;
}

interface Reminder {
  id: string;
  title: string;
  clientName?: string;
  note: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  responsible?: string;
}

// --- Components ---

const StatusBadge = ({ status }: { status: ClientStatus }) => {
  const styles = {
    Excellent: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    Optimizing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Attention: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    Starting: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  };
  return <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest", styles[status])}>{status}</span>;
};

// --- Main Application ---

export default function OperacionalApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notes' | 'reminders' | 'admin'>('dashboard');
  
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<ClientNote | null>(null);
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [newNote, setNewNote] = useState({ clientName: '', statusSummary: '', content: '', status: 'Starting' as ClientStatus });
  const [newReminder, setNewReminder] = useState({ title: '', clientName: '', note: '', dueDate: '', priority: 'medium' as any, responsible: '' });

  // Persistence
  useEffect(() => {
    const auth = localStorage.getItem('op_auth_v1');
    setIsAuthenticated(auth === 'true');
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const { data: remoteNotes } = await supabase.from('notes').select('*').order('updatedAt', { ascending: false });
      const { data: remoteReminders } = await supabase.from('reminders').select('*');
      
      if (remoteNotes) setNotes(remoteNotes);
      if (remoteReminders) setReminders(remoteReminders);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingNoteId || Date.now().toString();
    const noteData: ClientNote = {
      id,
      ...newNote,
      updatedAt: new Date().toISOString(),
      stage: 'active' as StageId
    };

    // Optimistic update
    if (editingNoteId) {
      setNotes(prev => prev.map(n => n.id === editingNoteId ? noteData : n));
      if (selectedNote?.id === editingNoteId) setSelectedNote(noteData);
    } else {
      setNotes([noteData, ...notes]);
    }

    setIsNoteFormOpen(false);
    setEditingNoteId(null);
    setNewNote({ clientName: '', statusSummary: '', content: '', status: 'Starting' });

    // Supabase sync
    await supabase.from('notes').upsert(noteData);
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingReminderId || Date.now().toString();
    const reminderData: Reminder = {
      id,
      ...newReminder,
      completed: false
    };

    // Optimistic update
    if (editingReminderId) {
      setReminders(prev => prev.map(r => r.id === editingReminderId ? { ...r, ...newReminder } : r));
    } else {
      setReminders([reminderData, ...reminders]);
    }

    setIsReminderFormOpen(false);
    setEditingReminderId(null);
    setNewReminder({ title: '', clientName: '', note: '', dueDate: '', priority: 'medium', responsible: '' });

    // Supabase sync
    await supabase.from('reminders').upsert(reminderData);
  };

  // Persistence removed in favor of real-time cloud sync

  const stats = useMemo(() => ({
    totalClients: notes.length,
    dueToday: reminders.filter(r => !r.completed && r.dueDate === new Date().toISOString().split('T')[0]).length,
    urgency: reminders.filter(r => !r.completed && r.priority === 'high').length,
    activeOps: notes.filter(n => n.stage === 'active').length,
  }), [notes, reminders]);

  if (isAuthenticated === null) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 premium-gradient relative overflow-hidden">
        <div className="noise-texture" />
        <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-md glass-card p-12 rounded-[56px] shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 rounded-[28px] bg-slate-900 flex items-center justify-center mb-8 shadow-2xl"><Lock className="w-10 h-10 text-white" /></div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Operacional</h1>
            <p className="text-slate-400 text-sm font-medium tracking-tight">Workspace Interno FA Performance</p>
          </div>
          <form className="space-y-6" onSubmit={(e)=>{e.preventDefault(); if(loginEmail==='admin@fa'&&loginPassword==='admin@FA1'){setIsAuthenticated(true); localStorage.setItem('op_auth_v1','true');}}}>
             <input type="text" placeholder="Usuário" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} className="w-full px-8 py-5 rounded-3xl bg-white border border-gray-100 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all font-medium text-base shadow-sm" />
             <input type="password" placeholder="Senha" value={loginPassword} onChange={(e)=>setLoginPassword(e.target.value)} className="w-full px-8 py-5 rounded-3xl bg-white border border-gray-100 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all font-medium text-base shadow-sm" />
             <button type="submit" className="w-full py-5 btn-premium font-bold text-base tracking-tight hover:scale-[1.01] transition-transform">Desbloquear Workspace</button>
          </form>
           <p className="mt-12 text-center text-slate-300 text-[10px] font-bold uppercase tracking-[4px]">Acesso Restrito</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen premium-gradient select-none">
      <div className="noise-texture" />
      
      {/* Sidebar Refinement */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 glass border-r z-30 hidden lg:flex flex-col p-10">
        <div className="flex items-center gap-4 mb-20 px-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"><Zap className="w-6 h-6 text-white" /></div>
          <div><h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Operacional</h1><p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">FA Performance</p></div>
        </div>

        <nav className="space-y-4 flex-grow">
          {[
            { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
            { id: 'notes', label: 'Diário', icon: StickyNote },
            { id: 'reminders', label: 'Ações', icon: Bell },
            { id: 'admin', label: 'Avançado', icon: Settings },
          ].map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }} className={cn("w-full flex items-center gap-4 px-5 py-4 rounded-3xl transition-all group font-bold text-sm leading-none", activeTab === item.id ? "sidebar-active-premium" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/50")}>
              <item.icon className={cn("w-5 h-5 transition-colors", activeTab === item.id ? "text-emerald-600" : "text-slate-300 group-hover:text-slate-500")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-10 border-t border-slate-100 px-2">
           <button onClick={()=>{setIsAuthenticated(false); localStorage.removeItem('op_auth_v1');}} className="w-full flex items-center gap-3 px-2 py-4 text-slate-300 hover:text-rose-500 transition-all text-xs font-bold uppercase tracking-[3px]"><LogOut className="w-4 h-4" /> Sair do Sistema</button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={()=>setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-100/50 backdrop-blur-md z-40 lg:hidden" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed left-0 top-0 bottom-0 w-80 glass-focal border-r z-50 flex flex-col p-10 lg:hidden shadow-2xl">
              <div className="flex items-center justify-between mb-20 px-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"><Zap className="w-5 h-5 text-white" /></div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Operacional</h1>
                </div>
                <button onClick={()=>setIsMobileMenuOpen(false)} className="p-2 rounded-xl bg-slate-50 text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <nav className="space-y-4 flex-grow">
                {[
                  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
                  { id: 'notes', label: 'Diário', icon: StickyNote },
                  { id: 'reminders', label: 'Ações', icon: Bell },
                  { id: 'admin', label: 'Avançado', icon: Settings },
                ].map((item) => (
                  <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }} className={cn("w-full flex items-center gap-4 px-5 py-4 rounded-3xl transition-all group font-bold text-sm leading-none", activeTab === item.id ? "sidebar-active-premium" : "text-slate-400 hover:text-slate-900")}>
                    <item.icon className={cn("w-5 h-5 transition-colors", activeTab === item.id ? "text-emerald-600" : "text-slate-300")} />
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="mt-auto pt-8 border-t border-slate-100 px-2">
                <button onClick={()=>{setIsAuthenticated(false); localStorage.removeItem('op_auth_v1');}} className="w-full flex items-center gap-3 px-2 py-4 text-slate-400 text-xs font-bold uppercase tracking-[3px]"><LogOut className="w-4 h-4" /> Sair</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main UI */}
      <main className="flex-1 lg:ml-72 p-6 md:p-12 lg:p-20 overflow-y-auto h-screen relative">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden fixed top-6 left-6 z-20">
          <button onClick={()=>setIsMobileMenuOpen(true)} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xl text-slate-900 active:scale-90 transition-all"><Menu className="w-6 h-6" /></button>
        </div>

        <div className="max-w-6xl mx-auto pb-32">
          
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-20">
            <div>
               <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-emerald-400" /><span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Workspace Ativo</span></div>
               <h2 className="text-3xl md:text-5xl font-bold text-gradient tracking-tight leading-none">
                 {activeTab === 'dashboard' ? 'Hub Principal' : activeTab === 'notes' ? 'Diário' : activeTab === 'reminders' ? 'Lembretes' : 'Painel de Controle'}
               </h2>
            </div>
            <div className="flex items-center gap-3 md:gap-4 ml-auto lg:ml-0">
               <div className="relative glass-card rounded-2xl px-4 md:px-5 py-1 flex items-center group focus-within:ring-2 focus-within:ring-emerald-500/10">
                  <Search className="w-4 h-4 text-slate-300 mr-2 md:mr-4" />
                  <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none py-3 text-sm font-semibold w-24 md:w-32 xl:w-56" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
               </div>
               <button 
                onClick={() => {
                  setEditingNoteId(null);
                  setEditingReminderId(null);
                  setNewNote({ clientName: '', statusSummary: '', content: '', status: 'Starting' });
                  setNewReminder({ title: '', clientName: '', note: '', dueDate: '', priority: 'medium', responsible: '' });
                  if (activeTab === 'notes') setIsNoteFormOpen(true);
                  else setIsReminderFormOpen(true);
                }} 
                className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all text-emerald-500"
               >
                 <Plus className="w-6 h-6" />
               </button>
            </div>
          </motion.header>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[4px]">Sincronizando Nuvem</span>
              </motion.div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                
                {/* Real Bento: Varying Card Sizes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* PRIMARY FOCAL CARD (2/3 width) */}
                  <div className="md:col-span-3 lg:col-span-2 glass-focal rounded-[32px] md:rounded-[48px] p-6 md:p-12 flex flex-col gap-6 md:gap-10 aura-hover">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl md:text-2xl font-bold flex items-center gap-3 md:gap-4 text-slate-900"><Target className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" /> Registro Operacional</h3>
                       <button onClick={()=>setActiveTab('notes')} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full hover:bg-emerald-100 transition-colors uppercase tracking-widest">Abrir</button>
                    </div>
                    <div className="space-y-4 md:space-y-6">
                      {notes.slice(0, 3).map(n => (
                         <div key={n.id} onClick={()=>setSelectedNote(n)} className="group p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white/40 border border-gray-100/50 hover:bg-white hover:border-emerald-500/10 transition-all flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3 md:gap-5 min-w-0">
                               <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg md:text-xl font-bold shadow-2xl shrink-0">{n.clientName[0]}</div>
                               <div className="min-w-0"><h4 className="text-base md:text-lg font-bold text-slate-900 truncate">{n.clientName}</h4><p className="text-xs md:text-sm font-medium text-slate-400 truncate">{n.statusSummary}</p></div>
                            </div>
                            <div className="flex items-center gap-3 md:gap-6 shrink-0">
                               <div className="hidden xs:block"><StatusBadge status={n.status} /></div><ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-slate-200 group-hover:text-emerald-500 transition-colors" />
                            </div>
                         </div>
                      ))}
                    </div>
                  </div>

                  {/* SECONDARY STACK */}
                  <div className="md:col-span-3 lg:col-span-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-8">
                    {/* Urgency Card */}
                    <div className="glass-card rounded-3xl md:rounded-[40px] p-6 md:p-8 flex flex-col justify-between aura-hover">
                       <div className="flex items-center gap-4 mb-4 md:mb-6"><div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div><div className="text-sm font-bold text-slate-900">Urgência Alta</div></div>
                       <div className="text-4xl md:text-5xl font-bold text-rose-500 mb-2">{stats.urgency}</div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Items que requerem atenção imediata.</p>
                    </div>

                    {/* Quick Metric Card */}
                    <div className="glass-card rounded-3xl md:rounded-[40px] p-6 md:p-8 aura-hover bg-slate-900 overflow-hidden relative">
                       <div className="relative z-10 flex flex-col justify-between h-full">
                          <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 md:mb-6">Base de Eficiência</div>
                          <div className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tighter">98.4%</div>
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] md:text-xs font-bold leading-none"><Activity className="w-4 h-4" /> Sistema Otimizado</div>
                       </div>
                       <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full" />
                    </div>
                  </div>

                </div>

                {/* Lower Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                   {[
                     { label: 'Rede Ativa', value: stats.totalClients, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                     { label: 'Fluxo Diário', value: stats.activeOps, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                     { label: 'Acompanhamento', value: stats.dueToday, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                     { label: 'Ações Necessárias', value: notes.filter(n=>n.status==='Attention').length, icon: Sparkles, color: 'text-rose-500', bg: 'bg-rose-50' },
                   ].map((s, i) => (
                     <motion.div key={i} whileHover={{ scale: 1.05 }} className="glass-card p-6 rounded-[32px] border-slate-50 flex items-center gap-5 shadow-sm aura-hover">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", s.bg)}><s.icon className={cn("w-6 h-6", s.color)} /></div>
                        <div><div className="text-xl font-bold text-slate-900">{s.value}</div><div className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px]">{s.label}</div></div>
                     </motion.div>
                   ))}
                </div>

              </motion.div>
            )}

            {activeTab === 'notes' && (
               <motion.div key="notes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                  {notes.map(note => (
                     <motion.div key={note.id} whileHover={{ y: -5 }} onClick={()=>setSelectedNote(note)} className="glass-card p-6 md:p-12 rounded-3xl md:rounded-[56px] cursor-pointer group flex flex-col gap-6 md:gap-8 aura-hover border-transparent hover:border-emerald-500/10">
                        <div className="flex justify-between"><StatusBadge status={note.status} /><Activity className="w-5 h-5 md:w-6 md:h-6 text-slate-200" /></div>
                        <div className="flex-1 min-h-[100px] md:min-h-[140px]"><h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight group-hover:text-emerald-600 transition-colors">{note.clientName}</h3><p className="text-xs md:text-sm font-medium text-slate-400 leading-relaxed line-clamp-4">{note.content}</p></div>
                        <div className="pt-4 md:pt-6 border-t border-slate-50 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1">Última Modificação</span>
                            <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                              {new Date(note.updatedAt).toLocaleDateString()} {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="p-2 md:p-3 bg-slate-50 rounded-full group-hover:bg-emerald-50 text-slate-300 group-hover:text-emerald-500 transition-all">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                     </motion.div>
                  ))}
                  <button 
                   onClick={() => {
                     setEditingNoteId(null);
                     setNewNote({ clientName: '', statusSummary: '', content: '', status: 'Starting' });
                     setIsNoteFormOpen(true);
                   }}
                   className="h-[200px] md:h-[400px] rounded-3xl md:rounded-[56px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 md:gap-4 text-slate-300 hover:text-emerald-400 hover:border-emerald-100 transition-all group outline-none focus:ring-4 focus:ring-emerald-500/5"
                  >
                    <Plus className="w-8 h-8 md:w-12 md:h-12 group-hover:rotate-90 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-[4px]">Novo Card</span>
                  </button>
               </motion.div>
            )}

            {activeTab === 'reminders' && (
                <motion.div key="rem" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                   {reminders.sort((a,b)=>a.completed ? 1 : -1).map(rem => (
                     <div key={rem.id} className={cn("glass-card p-5 md:p-8 rounded-3xl md:rounded-[40px] flex md:items-center gap-4 md:gap-8 group aura-hover", rem.completed && "opacity-40 grayscale blur-[0.5px]")}>
                        <button onClick={()=>setReminders(prev => prev.map(r => r.id===rem.id ? {...r, completed: !r.completed} : r))} className={cn("w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-1 md:mt-0", rem.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-200 hover:border-emerald-500 shadow-sm")}>
                           {rem.completed && <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                           <h4 className={cn("text-lg md:text-xl font-bold text-slate-900 mb-1 truncate", rem.completed && "line-through")}>{rem.title}</h4>
                           <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                              <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[2px] whitespace-nowrap"><Target className="w-3 h-3 text-emerald-400" /> {rem.clientName || 'Nexus'}</div>
                              {rem.responsible && (
                                <>
                                  <div className="hidden xs:block w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                                  <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-indigo-500 uppercase tracking-[2px] whitespace-nowrap"><User className="w-3 h-3" /> {rem.responsible}</div>
                                </>
                              )}
                              <div className="hidden xs:block w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                              {rem.priority === 'high' && <div className="text-[8px] md:text-[9px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-2 shadow-sm rounded-full">Obrigatório</div>}
                           </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-4 shrink-0">
                           {/* Edit button always visible on mobile, hover on desktop */}
                           <button 
                             onClick={() => {
                               setEditingReminderId(rem.id);
                               setNewReminder({
                                 title: rem.title,
                                 clientName: rem.clientName || '',
                                 note: rem.note,
                                 dueDate: rem.dueDate,
                                 priority: rem.priority,
                                 responsible: rem.responsible || ''
                               });
                               setIsReminderFormOpen(true);
                             }}
                             className="p-2 md:p-3 bg-slate-50 rounded-xl text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                           >
                             <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                           </button>
                           <div className="flex items-center gap-2 md:gap-3 bg-white px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm text-[10px] md:text-sm font-bold text-slate-600 shrink-0">
                             <Calendar className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" /> <span className="hidden xs:inline">{rem.dueDate}</span><span className="xs:hidden">{rem.dueDate.split('-').slice(1).reverse().join('/')}</span>
                           </div>
                        </div>
                     </div>
                   ))}
                </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div key="admin" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto glass-card rounded-3xl md:rounded-[64px] p-6 md:p-12 lg:p-20 shadow-2xl relative overflow-hidden">
                 <div className="relative z-10"><h3 className="text-2xl md:text-4xl font-bold text-gradient mb-4">Motor do Sistema</h3><p className="text-slate-400 font-medium text-sm md:text-lg leading-relaxed mb-8 md:mb-16">Configurações para o ecossistema FA Nexus.</p></div>
                 <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-12 md:mb-16">
                    {[
                      { label: 'Aura do Tema', state: 'Premium White Ativo', icon: Sparkles },
                      { label: 'Sincronização', state: 'Otimização Real-time', icon: Activity },
                      { label: 'Persistência Cloud', state: 'Sync Habilitado', icon: Sliders },
                      { label: 'Camada de Segurança', state: 'Passcode Gates Ativos', icon: Lock },
                    ].map((s, i) => (
                      <div key={i} className="p-6 md:p-8 rounded-2xl md:rounded-[40px] bg-white border border-slate-100 shadow-sm flex flex-col gap-4 md:gap-6 aura-hover">
                         <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 flex items-center justify-center"><s.icon className="w-5 h-5 md:w-6 md:h-6 text-slate-900" /></div>
                         <div><div className="text-base md:text-lg font-bold text-slate-900 mb-1">{s.label}</div><div className="text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{s.state}</div></div>
                      </div>
                    ))}
                 </div>
                 <div className="relative z-10 pt-8 md:pt-16 border-t border-slate-50 flex flex-col md:flex-row gap-4 md:justify-between items-center"><button className="px-8 py-4 rounded-2xl text-slate-400 font-bold text-[10px] md:text-sm tracking-widest uppercase">Descartar Build</button><button className="w-full md:w-auto px-10 py-5 btn-premium font-bold text-base shadow-2xl shadow-black/10">Aplicar Workspace</button></div>
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[140px] pointer-events-none -z-0" />
              </motion.div>
            )}
              </>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Detail Journal Modal */}
      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={()=>setSelectedNote(null)} className="absolute inset-0 bg-slate-100/30 backdrop-blur-xl" />
            <motion.div layoutId={selectedNote.id} className="relative w-full max-w-2xl glass-focal rounded-3xl md:rounded-[56px] lg:rounded-[80px] p-6 md:p-12 lg:p-20 shadow-2xl overflow-y-auto max-h-[90vh] aura-glow">
               <div className="flex justify-between items-start mb-8 md:mb-16 relative z-10"><div><StatusBadge status={selectedNote.status} /><h2 className="text-2xl md:text-5xl font-bold text-gradient mt-6 md:mt-10 mb-2 md:mb-4 truncate max-w-[200px] md:max-w-md">{selectedNote.clientName}</h2><div className="px-1 py-1 rounded-xl bg-slate-50 text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[4px] md:tracking-[6px] inline-block">Index #{selectedNote.id}</div></div><button onClick={()=>setSelectedNote(null)} className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white border border-slate-100 hover:rotate-90 transition-all duration-300 shadow-sm"><X className="w-5 h-5 md:w-8 md:h-8 text-slate-400" /></button></div>
               <div className="space-y-6 md:space-y-10 mb-10 md:mb-20 relative z-10 min-h-[100px] md:min-h-[200px]"><p className="text-xl md:text-3xl font-bold text-slate-800 leading-tight tracking-tight">{selectedNote.statusSummary}</p><div className="flex items-center gap-4 md:gap-6"><div className="w-12 md:w-16 h-1 rounded-full bg-emerald-500" /><div className="w-1.5 h-1.5 rounded-full bg-emerald-200" /></div><p className="text-slate-500 text-base md:text-2xl font-medium leading-relaxed">{selectedNote.content}</p></div>
               <div className="relative z-10 pt-8 md:pt-16 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-[8px] md:text-xs font-bold text-slate-300 uppercase tracking-[4px]">
                 <div>Sync: {new Date(selectedNote.updatedAt).toLocaleTimeString()}</div>
                 <button 
                  onClick={() => {
                    setEditingNoteId(selectedNote.id);
                    setNewNote({
                      clientName: selectedNote.clientName,
                      statusSummary: selectedNote.statusSummary,
                      content: selectedNote.content,
                      status: selectedNote.status
                    });
                    setIsNoteFormOpen(true);
                  }}
                  className="w-full md:w-auto px-8 md:px-14 py-4 md:py-5 btn-emerald shadow-2xl shadow-emerald-500/10 font-bold text-sm md:text-lg leading-none active:scale-95 transition-all text-center"
                 >
                   Editar Registro
                 </button>
               </div>
               <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none -z-1" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Note Modal */}
      <AnimatePresence>
        {isNoteFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={()=>setIsNoteFormOpen(false)} className="absolute inset-0 bg-slate-900/10 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl glass-card rounded-3xl md:rounded-[64px] p-6 md:p-12 lg:p-16 shadow-2xl overflow-y-auto max-h-[90vh] aura-glow">
              <div className="flex justify-between items-center mb-8 md:mb-10"><h2 className="text-xl md:text-3xl font-bold text-gradient">{editingNoteId ? 'Editar Registro' : 'Novo Registro'}</h2><button onClick={()=>setIsNoteFormOpen(false)} className="p-3 md:p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"><X className="w-5 h-5 md:w-6 md:h-6 text-slate-400" /></button></div>
              <form onSubmit={handleAddNote} className="space-y-6 md:space-y-8">
                <div className="space-y-4">
                  <input required placeholder="Nome do Cliente" className="w-full px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-slate-50/50 border border-transparent focus:border-emerald-500/20 focus:bg-white transition-all outline-none font-bold placeholder:text-slate-300 text-sm md:text-base" value={newNote.clientName} onChange={e=>setNewNote({...newNote, clientName: e.target.value})} />
                  <input required placeholder="Resumo do Status" className="w-full px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-slate-50/50 border border-transparent focus:border-emerald-500/20 focus:bg-white transition-all outline-none font-semibold text-slate-600 placeholder:text-slate-300 text-xs md:text-sm" value={newNote.statusSummary} onChange={e=>setNewNote({...newNote, statusSummary: e.target.value})} />
                  <textarea required placeholder="Relato Detalhado..." rows={4} className="w-full px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-slate-50/50 border border-transparent focus:border-emerald-500/20 focus:bg-white transition-all outline-none font-medium text-slate-500 placeholder:text-slate-300 text-xs md:text-sm resize-none" value={newNote.content} onChange={e=>setNewNote({...newNote, content: e.target.value})} />
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {['Excellent', 'Optimizing', 'Attention', 'Starting'].map(s => (
                      <button key={s} type="button" onClick={()=>setNewNote({...newNote, status: s as any})} className={cn("py-3 md:py-4 rounded-xl md:rounded-2xl border transition-all text-[8px] md:text-[10px] font-bold uppercase tracking-widest", newNote.status === s ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-white text-slate-400 border-slate-100 hover:border-emerald-500/10")}>{s}</button>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full py-4 md:py-5 btn-emerald font-bold text-sm md:text-base shadow-2xl shadow-emerald-500/10 group"><div className="flex items-center justify-center gap-2">{editingNoteId ? 'Atualizar' : 'Salvar'} <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" /></div></button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Action Modal */}
      <AnimatePresence>
        {isReminderFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={()=>setIsReminderFormOpen(false)} className="absolute inset-0 bg-slate-900/10 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl glass-card rounded-3xl md:rounded-[64px] p-6 md:p-12 lg:p-16 shadow-2xl overflow-y-auto max-h-[90vh] aura-glow">
              <div className="flex justify-between items-center mb-8 md:mb-10">
                <h2 className="text-xl md:text-3xl font-bold text-gradient">{editingReminderId ? 'Editar Ação' : 'Nova Ação'}</h2>
                <button onClick={()=>setIsReminderFormOpen(false)} className="p-3 md:p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddReminder} className="space-y-4 md:space-y-6">
                <input required placeholder="Título da Ação" className="w-full px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-slate-50/50 border border-transparent focus:border-emerald-500/20 focus:bg-white transition-all outline-none font-bold placeholder:text-slate-300 text-sm md:text-base" value={newReminder.title} onChange={e=>setNewReminder({...newReminder, title: e.target.value})} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Cliente (Opcional)" className="w-full px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-slate-50/50 border border-transparent focus:border-emerald-500/20 focus:bg-white transition-all outline-none font-semibold text-xs md:text-sm placeholder:text-slate-300" value={newReminder.clientName} onChange={e=>setNewReminder({...newReminder, clientName: e.target.value})} />
                  <input required placeholder="Responsável" className="w-full px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-slate-50/50 border border-transparent focus:border-emerald-500/20 focus:bg-white transition-all outline-none font-semibold text-xs md:text-sm placeholder:text-slate-300" value={newReminder.responsible} onChange={e=>setNewReminder({...newReminder, responsible: e.target.value})} />
                </div>
                <input required type="date" className="w-full px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-slate-50/50 border border-transparent focus:border-emerald-500/20 focus:bg-white transition-all outline-none font-semibold text-xs md:text-sm text-slate-600" value={newReminder.dueDate} onChange={e=>setNewReminder({...newReminder, dueDate: e.target.value})} />
                <textarea placeholder="Nota adicional..." rows={2} className="w-full px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-slate-50/50 border border-transparent focus:border-emerald-500/20 focus:bg-white transition-all outline-none font-medium text-slate-500 text-xs md:text-sm placeholder:text-slate-300 resize-none" value={newReminder.note} onChange={e=>setNewReminder({...newReminder, note: e.target.value})} />
                
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest md:ml-2">Prioridade:</span>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map(p => (
                      <button key={p} type="button" onClick={()=>setNewReminder({...newReminder, priority: p as any})} className={cn("py-3 rounded-xl md:rounded-2xl border transition-all text-[8px] md:text-[9px] font-bold uppercase tracking-widest", newReminder.priority === p ? (p==='high' ? "bg-rose-500 text-white border-rose-500" : "bg-slate-900 text-white border-slate-900") : "bg-white text-slate-400 border-slate-100 hover:border-slate-300")}>{p}</button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full py-4 md:py-5 btn-premium font-bold text-sm md:text-base shadow-2xl shadow-black/10 mt-4">
                  {editingReminderId ? 'Atualizar' : 'Criar Ação'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 12px; }
      `}</style>
    </div>
  );
}

const CheckCircle2 = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);
