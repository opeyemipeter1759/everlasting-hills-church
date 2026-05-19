"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

import {
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Heart,
  Users,
  Scroll,
  Sprout,
  Star,
  Handshake,
  Sparkles,
  Calendar,
  Gift,
} from "lucide-react";

const INVOLVEMENT_CARDS = [
  { 
    title: "Prayer Request", 
    description: "Submit your petitions and let our intercessors stand with you.",
    icon: <MessageSquare className="w-6 h-6" />, 
    href: "/prayer-request",
    size: "large",
    color: "bg-church-maroon/20"
  },
  { 
    title: "Membership", 
    description: "Start your journey of belonging.",
    icon: <Scroll className="w-5 h-5" />, 
    href: "#form-membership",
    size: "small",
    color: "bg-white/5"
  },
  { 
    title: "Serve", 
    description: "Join a volunteer team.",
    icon: <Users className="w-5 h-5" />, 
    href: "#form-volunteer",
    size: "small",
    color: "bg-white/5"
  },
  { 
    title: "Counselling", 
    description: "Find spiritual guidance and support for your season.",
    icon: <Heart className="w-6 h-6" />, 
    href: "#form-counselling",
    size: "medium",
    color: "bg-church-accent/10"
  },
  { 
    title: "Campus Connect", 
    description: "New to the area? Connect with a local campus near you.",
    icon: <Sprout className="w-5 h-5" />, 
    href: "#form-campus",
    size: "medium",
    color: "bg-white/5"
  },
  { 
    title: "First Timers", 
    description: "We'd love to know you were here.",
    icon: <Star className="w-5 h-5" />, 
    href: "#form-first-timer",
    size: "small",
    color: "bg-church-maroon/10"
  },
  { 
    title: "Groups", 
    description: "Better together in community.",
    icon: <Handshake className="w-5 h-5" />, 
    href: "#form-community",
    size: "small",
    color: "bg-white/5"
  },
];

export default function GetInvolvedPage() {
  return (
    <main className="min-h-screen bg-church-dark text-white selection:bg-church-maroon selection:text-white pb-32 relative overflow-x-hidden">
      <Navbar/>
      {/* Cinematic Background with Fade Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="images/church_congregation_3_1779193624434.png" 
          alt="Everlasting Hills Community" 
          className="w-full h-full object-cover opacity-40 scale-105"
        />
        {/* The Fade-In/Out Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-church-dark/40 to-church-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-church-dark/80 via-transparent to-church-dark/80" />
        <div className="absolute inset-0 bg-church-dark/20 backdrop-brightness-[0.8]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-16 lg:pt-24">
        {/* Navigation back */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-church-accent/60 hover:text-church-accent transition-all mb-12 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Home</span>
        </Link>

        {/* Header Section */}
        <div className="max-w-4xl mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="h-px w-12 bg-church-accent" />
            <span className="text-[10px] uppercase font-black tracking-[0.5em] text-church-accent">Connect with Purpose</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl sm:text-8xl font-display font-black tracking-tighter leading-[0.85] mb-8"
          >
            Find your <br/>
            <span className="font-serif italic font-normal text-church-accent lowercase">place.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/70 text-lg sm:text-xl max-w-xl leading-relaxed font-medium"
          >
            Everlasting Hills isn't just a place to attend—it's a home to belong. Explore the many ways you can grow, serve, and build community with us.
          </motion.p>
        </div>

        {/* Dynamic Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-[200px]">
          {/* Large Featured Slot: Prayer */}
          <BentoCard 
            title="Prayer Request" 
            desc="Let us stand with you in faith."
            icon={<MessageSquare className="w-8 h-8" />}
            href="/prayer-request"
            className="md:col-span-2 md:row-span-2 bg-church-maroon/20 border-church-maroon/40"
            featured
          />

          {/* Medium: Community Groups */}
          <BentoCard 
            title="Life Groups" 
            desc="Better together."
            icon={<Users className="w-6 h-6" />}
            href="#groups"
            className="md:col-span-2 md:row-span-1 bg-white/5"
          />

          {/* Medium: First Timers */}
          <BentoCard 
            title="New Here?" 
            desc="Start your journey."
            icon={<Star className="w-6 h-6" />}
            href="#new"
            className="md:col-span-2 md:row-span-1 bg-church-accent/10 border-church-accent/20"
          />

          {/* Large: Volunteer */}
          <BentoCard 
            title="Serve Team" 
            desc="Use your gifts to build the house."
            icon={<Handshake className="w-7 h-7" />}
            href="#serve"
            className="md:col-span-2 md:row-span-2 bg-white/5"
            featured
          />

          {/* Medium: Membership */}
          <BentoCard 
            title="Membership" 
            desc="Commitment to community."
            icon={<Scroll className="w-6 h-6" />}
            href="#membership"
            className="md:col-span-2 md:row-span-1 bg-white/5"
          />

          {/* Medium: Counselling */}
          <BentoCard 
            title="Counselling" 
            desc="Spiritual guidance."
            icon={<Heart className="w-6 h-6" />}
            href="#care"
            className="md:col-span-2 md:row-span-1 bg-white/5"
          />

          {/* Extra utility buttons as a row at the bottom */}
          <motion.a 
            href="#giving"
            whileHover={{ scale: 0.99, backgroundColor: "rgba(255,255,255,0.08)" }}
            className="md:col-span-3 h-20 glass-card bg-white/5 flex items-center justify-between px-8 group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <Gift className="text-church-accent" />
              <span className="font-display font-black text-xl">Online Giving</span>
            </div>
            <ChevronRight className="group-hover:translate-x-1 transition-transform text-white/20" />
          </motion.a>

          <motion.a 
            href="#testimony"
            whileHover={{ scale: 0.99, backgroundColor: "rgba(255,255,255,0.08)" }}
            className="md:col-span-3 h-20 glass-card bg-white/5 flex items-center justify-between px-8 group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <Sparkles className="text-church-accent" />
              <span className="font-display font-black text-xl">Share Testimony</span>
            </div>
            <ChevronRight className="group-hover:translate-x-1 transition-transform text-white/20" />
          </motion.a>
        </div>

        {/* Footer CTA */}
        <div className="mt-40 flex flex-col items-center text-center">
          <div className="w-px h-24 bg-gradient-to-b from-church-accent/50 to-transparent mb-12" />
          <h2 className="text-4xl font-display font-black mb-6 italic text-church-accent">Still have questions?</h2>
          <p className="text-white/50 max-w-md mb-12 font-bold tracking-tight uppercase text-sm">
            Our welcome team is ready to help you find the perfect community or resource.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-12 py-5 bg-white text-church-dark font-black rounded-2xl hover:bg-church-accent transition-all shadow-2xl"
          >
            Contact Support
          </motion.button>
        </div>
      </div>
      <Footer/>
    </main>
  );
}

function BentoCard({ title, desc, icon, href, className, featured = false }: any) {
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)" }}
      className={`
        glass-card p-10 flex flex-col transition-all duration-500 group relative overflow-hidden shadow-2xl
        ${className}
      `}
    >
      <div className={`
        w-12 h-12 rounded-2xl flex items-center justify-center mb-auto transition-all duration-300
        bg-white/10 text-church-accent group-hover:bg-church-accent group-hover:text-church-dark
      `}>
          {icon}
      </div>
      
      <div className={featured ? "mt-12" : "mt-6"}>
        <h3 className="font-display font-black text-3xl tracking-tighter text-white mb-2 group-hover:text-church-accent transition-colors">
          {title}
        </h3>
        {desc && (
          <p className="text-white/40 text-[10px] font-black leading-relaxed transition-colors uppercase tracking-[0.2em]">
            {desc}
          </p>
        )}
      </div>

      <div className="absolute bottom-10 right-10 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
        <ChevronRight size={24} className="text-church-accent" />
      </div>
    </motion.a>
  );
}

