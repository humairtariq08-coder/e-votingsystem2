'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Award, Sparkles, User, FileText } from 'lucide-react';
import Image from 'next/image';

export interface CandidateProps {
  id: string;
  name: string;
  party: string | null;
  bio: string;
  imageUrl: string;
  voteCount?: number;
}

interface CandidateCardProps {
  candidate: CandidateProps;
  isSelected: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function CandidateCard({ candidate, isSelected, onSelect, disabled }: CandidateCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Framer Motion 3D tilt values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for buttery-smooth tilt effect
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-150, 150], [12, -12]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-150, 150], [-12, 12]), springConfig);

  // Dynamic light glare effect transform
  const glareX = useTransform(mouseX, [-150, 150], [0, 100]);
  const glareY = useTransform(mouseY, [-150, 150], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || disabled) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="relative snap-center shrink-0 py-6 px-3">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => !disabled && onSelect(candidate.id)}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={`relative w-80 sm:w-96 rounded-2xl cursor-pointer select-none transition-all duration-300 ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        {/* Animated glowing selection border using layoutId */}
        {isSelected && (
          <motion.div
            layoutId="selectedBorder"
            className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 p-[2px] blur-sm opacity-90 animate-pulse-glow"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}

        {/* Card Body with Glassmorphism */}
        <div
          className={`relative h-full rounded-2xl p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
            isSelected
              ? 'bg-slate-900/90 border-2 border-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.35)]'
              : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-xl'
          }`}
          style={{ transform: 'translateZ(20px)' }}
        >
          {/* Specular Glare Reflection Overlay */}
          <motion.div
            className="pointer-events-none absolute -inset-full opacity-20 bg-gradient-to-br from-white via-transparent to-transparent rounded-2xl"
            style={{
              x: glareX,
              y: glareY,
            }}
          />

          <div>
            {/* Header / Selection Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Candidate</span>
              </div>

              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-110'
                    : 'border-2 border-slate-700 bg-slate-800/50 text-transparent'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 stroke-[3]" />
              </div>
            </div>

            {/* Avatar Profile Image */}
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-5 border border-slate-800 group" style={{ transform: 'translateZ(30px)' }}>
              <Image
                src={candidate.imageUrl}
                alt={candidate.name}
                fill
                sizes="(max-width: 768px) 100vw, 384px"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              
              {candidate.party && (
                <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-xs font-medium text-teal-300 flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="truncate">{candidate.party}</span>
                </div>
              )}
            </div>

            {/* Candidate Details */}
            <div style={{ transform: 'translateZ(25px)' }}>
              <h3 className="text-xl font-bold text-slate-100 mb-2 flex items-center gap-2 tracking-tight">
                {candidate.name}
              </h3>
              <p className="text-xs leading-relaxed text-slate-400 line-clamp-3 mb-4 font-normal">
                {candidate.bio}
              </p>
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400" style={{ transform: 'translateZ(15px)' }}>
            <span className="flex items-center gap-1 text-slate-500">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Manifesto Validated
            </span>
            <span className={`font-medium ${isSelected ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
              {isSelected ? 'Ready to Cast' : 'Click to Select'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
