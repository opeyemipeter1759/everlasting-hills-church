"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Search, 
  ShieldCheck, 
  Zap, 
  Building2, 
  ArrowUpRight,
  Sparkles,
  Info,
  Globe,
  Coins
} from "lucide-react";
import Link from "next/link";

// import bgImage from "/images/church_congregation_2_1779193607195.png";

const LOCAL_ACCOUNTS = {
  primary: [
    {
      id: "prim-1",
      bank: "FIDELITY",
      purpose: "OFFERING / TITHE",
      number: "12345678",
      currency: "NGN",
    },
    {
      id: "prim-2",
      bank: "FIDELITY",
      purpose: "BUILDING",
      number: "12345678",
      currency: "NGN",
    },
    {
      id: "prim-3",
      bank: "FIDELITY",
      purpose: "RENT",
      number: "12345678",
      currency: "NGN",
    },
    {
      id: "prim-4",
      bank: "FIDELITY",
      purpose: "GLOBAL",
      number: "12345678",
      currency: "NGN",
    },
  ],
  others: [
    {
      id: "oth-1",
      bank: "ACCESS BANK",
      purpose: "BUILDING ACCOUNT",
      number: "12345678",
      currency: "NGN",
    },
    {
      id: "oth-2",
      bank: "ACCESS BANK",
      purpose: "SEED CHURCH",
      number: "12345678",
      currency: "NGN",
    },
    {
      id: "oth-3",
      bank: "STANBIC IBTC",
      purpose: "BUILDING ACCOUNT",
      number: "12345678",
      currency: "NGN",
    },
    {
      id: "oth-4",
      bank: "MONIEPOINT MFB",
      purpose: "MICROFINANCE BANK",
      number: "12345678",
      currency: "NGN",
    },
  ]
};

const DOM_ACCOUNTS = [
  {
    id: "dom-1",
    bank: "FIDELITY BANK",
    purpose: "USD DOMICILIARY",
    number: "12345678",
    currency: "USD",
  },
  {
    id: "dom-2",
    bank: "FIDELITY BANK",
    purpose: "GBP DOMICILIARY",
    number: "12345678",
    currency: "GBP",
  },
  {
    id: "dom-3",
    bank: "ACCESS BANK",
    purpose: "USD DOMICILIARY",
    number: "12345678",
    currency: "USD",
  }
];

export default function WaysToGivePage() {
  const [activeTab, setActiveTab] = useState<"local" | "dom">("local");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleCopy = (accountNum: string, id: string, purpose: string) => {
    navigator.clipboard.writeText(accountNum);
    setCopiedId(id);
    setToastMessage(`Copied: ${purpose} (${accountNum})`);
    setShowToast(true);
    
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Filter Local Accounts
  const filteredLocalPrimary = useMemo(() => {
    return LOCAL_ACCOUNTS.primary.filter(acc => 
      acc.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.number.includes(searchQuery)
    );
  }, [searchQuery]);

  const filteredLocalOthers = useMemo(() => {
    return LOCAL_ACCOUNTS.others.filter(acc => 
      acc.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.number.includes(searchQuery)
    );
  }, [searchQuery]);

  // Filter Domiciliary Accounts
  const filteredDom = useMemo(() => {
    return DOM_ACCOUNTS.filter(acc => 
      acc.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.number.includes(searchQuery)
    );
  }, [searchQuery]);

  const hasResults = activeTab === "local" 
    ? (filteredLocalPrimary.length > 0 || filteredLocalOthers.length > 0)
    : filteredDom.length > 0;

  return (
    <main className="min-h-screen bg-church-dark text-white selection:bg-church-maroon relative overflow-x-hidden font-sans">
      {/* Cinematic Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* <Image 
          src={bgImage} 
          alt="Everlasting Hills Worship" 
          className="w-full h-full object-cover opacity-15 scale-105 saturate-50 brightness-[0.3]"
        /> */}
        {/* Modern Fade gradients carefully overlaying the imagery to maintain absolute aesthetic cleanlines */}
        <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-church-dark/90 to-church-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-church-dark via-transparent to-church-dark/80" />
        
        {/* Subtle decorative lights to enhance modern hook look */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-church-maroon/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-church-accent/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-grid-white opacity-20 pointer-events-none" />
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-16 pb-32 max-w-7xl">
        {/* Minimal High-End Header Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-20">
          <Link 
            href="/" 
            className="group inline-flex items-center gap-3 text-white/40 hover:text-white transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-church-accent/30 group-hover:bg-white/5 transition-all">
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Back to Home</span>
          </Link>

          <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-5 py-2.5 rounded-2xl backdrop-blur-md">
            <ShieldCheck className="text-church-accent w-5 h-5 animate-pulse" />
            <div className="text-left">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/30 block leading-tight">Secure Payment Gateway</span>
              <span className="text-[11px] font-semibold text-white/70">PCI-DSS Secure Storage</span>
            </div>
          </div>
        </div>

        {/* Hero Hook Intro */}
        <div className="max-w-3xl mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-church-maroon/20 border border-church-maroon/30 rounded-lg mb-6"
          >
            <Sparkles size={12} className="text-church-accent" />
            <span className="text-[9px] uppercase font-bold tracking-widest text-church-accent">Partnership & Stewardship</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-display font-black tracking-tighter leading-[0.85] uppercase mb-6"
          >
            Ways to <span className="text-church-accent font-serif italic lowercase font-normal">Give.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-base sm:text-lg leading-relaxed font-sans max-w-2xl font-medium"
          >
            Find account details for offerings, building funds, and domiciliary transfers below. Click any card to copy the account number instantly to your clipboard.
          </motion.p>
        </div>

        {/* Tabs and Interactive Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          {/* Tab Switcher */}
          <div className="flex bg-white/[0.03] border border-white/5 p-1 rounded-2xl max-w-xs self-start backdrop-blur-md">
            <button 
              onClick={() => { setActiveTab("local"); setSearchQuery(""); }}
              className={`px-6 py-2.5 rounded-xl font-display text-xs font-black tracking-wider uppercase transition-all duration-300 ${
                activeTab === "local" 
                  ? "bg-church-maroon text-white shadow-lg shadow-church-maroon/20" 
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              Local Accounts
            </button>
            <button 
              onClick={() => { setActiveTab("dom"); setSearchQuery(""); }}
              className={`px-6 py-2.5 rounded-xl font-display text-xs font-black tracking-wider uppercase transition-all duration-300 ${
                activeTab === "dom" 
                  ? "bg-church-maroon text-white shadow-lg shadow-church-maroon/20" 
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              Domiciliary Account
            </button>
          </div>

          {/* Inline Search Filter to keep UI tidy and beautiful */}
          <div className="relative max-w-md w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              placeholder="Search account by bank or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white placeholder-white/20 focus:outline-none focus:border-church-accent/30 transition-all font-medium"
            />
          </div>
        </div>

        {/* Dynamic Content Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* If no search match */}
            {!hasResults && (
              <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm">
                <Info className="w-10 h-10 text-church-accent/40 mx-auto mb-4" />
                <p className="text-white/40 font-display font-medium text-lg">No matching accounts found for "{searchQuery}"</p>
                <button 
                  onClick={() => setSearchQuery("")}
                  className="text-church-accent hover:text-white transition-colors text-xs font-black uppercase mt-4 tracking-wider"
                >
                  Clear search filter
                </button>
              </div>
            )}

            {/* Local Accounts view */}
            {activeTab === "local" && hasResults && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Primary Column */}
                {filteredLocalPrimary.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.3em] font-black text-white/30 mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-church-accent" />
                      Primary Accounts
                    </h3>
                    
                    <div className="space-y-4">
                      {filteredLocalPrimary.map((acc) => (
                        <AccountCard 
                          key={acc.id}
                          acc={acc}
                          isCopied={copiedId === acc.id}
                          onCopy={() => handleCopy(acc.number, acc.id, acc.purpose)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Others Column */}
                {filteredLocalOthers.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.3em] font-black text-white/30 mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-church-maroon" />
                      Other Accounts
                    </h3>
                    
                    <div className="space-y-4">
                      {filteredLocalOthers.map((acc) => (
                        <AccountCard 
                          key={acc.id}
                          acc={acc}
                          isCopied={copiedId === acc.id}
                          onCopy={() => handleCopy(acc.number, acc.id, acc.purpose)}
                        />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Domiciliary Accounts view */}
            {activeTab === "dom" && hasResults && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] font-black text-white/30 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-church-accent" />
                  International Transfers
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDom.map((acc) => (
                    <AccountCard 
                      key={acc.id}
                      acc={acc}
                      isCopied={copiedId === acc.id}
                      onCopy={() => handleCopy(acc.number, acc.id, acc.purpose)}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Global Informative / Hook Module */}
        <div className="grid lg:grid-cols-12 gap-6 mt-24">
          <motion.div 
            whileHover={{ scale: 0.99 }}
            className="lg:col-span-8 glass-card p-10 border-white/5 bg-white/[0.01] flex flex-col justify-between"
          >
            <div>
              <h4 className="text-2xl font-display font-black mb-4 uppercase text-church-accent">Direct Kingdom Partner</h4>
              <p className="text-white/40 text-sm leading-relaxed mb-10 max-w-2xl font-medium">
                For recurring partnership, tithes, or larger seed contributions, bank transfers offer instant direct support to local church operations, events, outreach campaigns, and building developments.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 py-3.5 px-6 rounded-2xl">
                 <Coins className="text-church-accent w-5 h-5" />
                 <div>
                    <span className="text-[9px] block uppercase font-bold text-white/30 leading-none">ZERO PAYGATE FEES</span>
                    <span className="text-xs font-bold">100% Direct Receipt</span>
                 </div>
              </div>

              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 py-3.5 px-6 rounded-2xl">
                 <Building2 className="text-church-accent w-5 h-5" />
                 <div>
                    <span className="text-[9px] block uppercase font-bold text-white/30 leading-none">ACCURATE ATTRIBUTION</span>
                    <span className="text-xs font-bold">Always Safe</span>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Right side report and contact hooks */}
          <motion.div 
            whileHover={{ scale: 0.99 }}
            className="lg:col-span-4 glass-card p-10 border-church-accent/10 bg-church-accent/5 flex flex-col text-center items-center justify-center relative overflow-hidden group"
          >
            <div className="w-16 h-16 rounded-full border border-church-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
               <Zap size={24} className="text-church-accent" />
            </div>
            
            <h4 className="text-xl font-display font-black uppercase text-white tracking-wide mb-3">Auditted & Transparent</h4>
            
            <p className="text-white/40 text-xs leading-relaxed max-w-xs mb-8 font-medium">
              We publish comprehensive stewardship statements at the close of every ecclesiastical calendar year.
            </p>

            <button className="px-6 py-3 w-full bg-white text-church-dark rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-church-accent hover:shadow-lg transition-all">
              Request Latest Report
            </button>
          </motion.div>
        </div>

      </div>

      {/* Elegant Micro-Toast Notification overlay */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-8 right-6 left-6 sm:left-auto sm:max-w-md z-50 bg-[#160b0d] border border-church-accent/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-church-maroon flex items-center justify-center text-church-accent shadow-inner">
                <Check size={14} className="animate-bounce" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-church-accent">Copied to Clipboard</p>
                <p className="text-xs text-white/70 font-semibold max-w-[200px] truncate">{toastMessage}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

interface AccountCardProps {
  acc: {
    id: string;
    bank: string;
    purpose: string;
    number: string;
    currency: string;
  };
  isCopied: boolean;
  onCopy: () => void;
}

function AccountCard({ acc, isCopied, onCopy }: AccountCardProps) {
  return (
    <motion.div
      onClick={onCopy}
      whileHover={{ y: -2, backgroundColor: "rgba(255, 255, 255, 0.05)", borderColor: "rgba(255, 179, 193, 0.3)" }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative px-8 py-7 rounded-2xl border transition-all duration-300 cursor-pointer select-none overflow-hidden
        ${isCopied 
          ? "bg-church-maroon/20 border-church-accent" 
          : "bg-white/[0.02] border-white/10"
        }
      `}
    >
      {/* Visual Ambient flash behind active/copied cards */}
      {isCopied && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-church-accent/10 blur-[30px] rounded-full pointer-events-none" />
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-white/40 uppercase block mb-1">
            {acc.bank} <span className="opacity-40 font-normal">—</span> {acc.purpose}
          </span>
          <p className="font-mono text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
            {acc.number}
            <span className="text-[10px] font-black text-church-accent uppercase font-sans tracking-wide">
              {acc.currency}
            </span>
          </p>
        </div>

        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
          ${isCopied 
            ? "bg-church-accent text-church-dark rotate-12 scale-105" 
            : "bg-white/5 text-white/30 hover:text-white"
          }
        `}>
          {isCopied ? <Check size={15} strokeWidth={3} /> : <Copy size={15} />}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-white/30">
        <span className={`w-1.5 h-1.5 rounded-full ${isCopied ? "bg-church-accent animate-ping" : "bg-white/20"}`} />
        {isCopied ? (
          <span className="text-church-accent">Copied to clipboard successfully!</span>
        ) : (
          <span>Click Anywhere to Copy</span>
        )}
      </div>
    </motion.div>
  );
}
