'use client';

import { useState, useRef } from 'react';
import type { GeneralTabProps, Section } from './types';
import { AvatarSection } from './AvatarSection';
import { PersonalSection } from './PersonalSection';
import { AboutSection } from './AboutSection';
import { AddressSection } from './AddressSection';
import { SocialSection } from './SocialSection';

export function GeneralTab({ profile, onSave }: GeneralTabProps) {
  const member = profile.member;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fromMember = () => ({
    firstName: member?.firstName ?? '',
    lastName: member?.lastName ?? '',
    email: member?.email ?? '',
    phone: member?.phone ?? '',
    occupation: member?.occupation ?? '',
    bio: member?.bio ?? '',
    address: member?.address ?? '',
    state: (member as any)?.state ?? '',
    country: (member as any)?.country ?? '',
    dateOfBirth: member?.dateOfBirth ?? '',
    twitter: (member as any)?.twitter ?? '',
    instagram: (member as any)?.instagram ?? '',
    facebook: (member as any)?.facebook ?? '',
    linkedin: (member as any)?.linkedin ?? '',
  });

  const [formData, setFormData] = useState(fromMember);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    onSave?.({ photoFile: file });
  };

  const handleSave = (_s: Section) => { onSave?.(formData); setEditingSection(null); };

  const handleCancel = (section: Section) => {
    const o = fromMember();
    if (section === 'personal') setFormData(p => ({ ...p, firstName: o.firstName, lastName: o.lastName, email: o.email, phone: o.phone, occupation: o.occupation, dateOfBirth: o.dateOfBirth }));
    else if (section === 'about') setFormData(p => ({ ...p, bio: o.bio }));
    else if (section === 'address') setFormData(p => ({ ...p, address: o.address, state: o.state, country: o.country }));
    else if (section === 'social') setFormData(p => ({ ...p, twitter: o.twitter, instagram: o.instagram, facebook: o.facebook, linkedin: o.linkedin }));
    setEditingSection(null);
  };

  const formatDob = (raw: string) => {
    if (!raw) return '';
    try { return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return raw; }
  };

  const fullName = [member?.firstName, member?.lastName].filter(Boolean).join(' ') || 'Member';
  const initials = [member?.firstName?.[0], member?.lastName?.[0]].filter(Boolean).join('') || '?';
  const displayPhoto = avatarPreview || member?.photoUrl;
  const roleLabel = formData.occupation || (profile.role?.replace(/_/g, ' ') ?? 'Member');
  const sp = { editingSection, setEditingSection, onSave: handleSave, onCancel: handleCancel };
  const divider = <div className="h-px bg-gray-100 dark:bg-white/5" />;

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
        <h1 className="text-[15px] font-bold text-gray-900 dark:text-white">Profile Information</h1>
      </div>
      <AvatarSection displayPhoto={displayPhoto} fullName={fullName} initials={initials} roleLabel={roleLabel} fileInputRef={fileInputRef} onAvatarChange={handleAvatarChange} />
      <PersonalSection formData={formData} onChange={handleChange} formatDob={formatDob} {...sp} />
      {divider}
      <AboutSection bio={formData.bio} onChange={handleChange} {...sp} />
      {divider}
      <AddressSection formData={formData} onChange={handleChange} {...sp} />
      {divider}
      <SocialSection formData={formData} onChange={handleChange} {...sp} />
    </div>
  );
}
