'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Camera, Save, User } from 'lucide-react'
import { updateProfile, uploadAvatar } from './actions'
import type { ProfileUpdateData } from './actions'

type ProfileFormProps = {
  profile: ProfileUpdateData & { email: string; avatar_url: string | null }
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileUpdateData>({
    name: profile.name ?? '',
    ic_number: profile.ic_number ?? '',
    phone: profile.phone ?? '',
    date_of_birth: profile.date_of_birth ?? '',
    address: profile.address ?? '',
    city: profile.city ?? '',
    state: profile.state ?? '',
    postcode: profile.postcode ?? '',
    emergency_contact: profile.emergency_contact ?? '',
    bank_account: profile.bank_account ?? '',
    bank_name: profile.bank_name ?? '',
    company_name: profile.company_name ?? '',
    company_reg_number: profile.company_reg_number ?? '',
    tax_id: profile.tax_id ?? '',
    avatar_url: profile.avatar_url ?? '',
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url ?? null)
  const [isPending, startTransition] = useTransition()
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function setField(key: keyof ProfileUpdateData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadAvatar(fd)
    setUploadingAvatar(false)
    if (result.error) {
      toast.error(`Avatar upload failed: ${result.error}`)
    } else if (result.url) {
      setForm((f) => ({ ...f, avatar_url: result.url! }))
      toast.success('Profile photo updated')
    }
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile(form)
      if (result.error) toast.error(result.error)
      else toast.success('Profile saved successfully')
    })
  }

  const initials = (form.name || profile.email || 'V')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Avatar */}
      <div className="bg-[#132A4D] rounded-2xl border border-white/8 p-6">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="size-20 rounded-full bg-[#FF6A00] flex items-center justify-center overflow-hidden border-2 border-[#FF6A00]/30">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar" className="size-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{initials}</span>
              )}
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[#F5F7FA]">{form.name || profile.email}</p>
            <p className="text-xs text-[#94A3B8]">{profile.email}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="flex items-center gap-1.5 text-xs text-[#FF6A00] hover:text-[#FF9B4D] transition-colors"
            >
              <Camera className="size-3.5" />
              {uploadingAvatar ? 'Uploading…' : 'Change photo'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-[#132A4D] rounded-2xl border border-white/8 p-6">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-5 flex items-center gap-2">
          <User className="size-4 text-[#FF6A00]" />
          Personal Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" value={form.name} onChange={setField('name')} placeholder="Your full name" />
          <Field label="IC Number" value={form.ic_number} onChange={setField('ic_number')} placeholder="e.g. 901231-14-1234" />
          <Field label="Phone Number" value={form.phone} onChange={setField('phone')} placeholder="+60 12-345 6789" />
          <Field label="Email" value={profile.email} disabled />
          <Field label="Date of Birth" value={form.date_of_birth} onChange={setField('date_of_birth')} type="date" />
          <Field label="Emergency Contact" value={form.emergency_contact} onChange={setField('emergency_contact')} placeholder="+60 12-345 6789" />
        </div>
      </div>

      {/* Address */}
      <div className="bg-[#132A4D] rounded-2xl border border-white/8 p-6">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-5">Address</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Street Address" value={form.address} onChange={setField('address')} placeholder="123 Jalan Merdeka" />
          </div>
          <Field label="City" value={form.city} onChange={setField('city')} placeholder="Langkawi" />
          <Field label="State" value={form.state} onChange={setField('state')} placeholder="Kedah" />
          <Field label="Postcode" value={form.postcode} onChange={setField('postcode')} placeholder="07000" />
        </div>
      </div>

      {/* Banking */}
      <div className="bg-[#132A4D] rounded-2xl border border-white/8 p-6">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-5">Banking Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Bank Name" value={form.bank_name} onChange={setField('bank_name')} placeholder="Maybank" />
          <Field label="Bank Account Number" value={form.bank_account} onChange={setField('bank_account')} placeholder="1234567890" />
        </div>
      </div>

      {/* Business */}
      <div className="bg-[#132A4D] rounded-2xl border border-white/8 p-6">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-5">Business Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Name" value={form.company_name} onChange={setField('company_name')} placeholder="ABC Sdn Bhd" />
          <Field label="Company Registration No." value={form.company_reg_number} onChange={setField('company_reg_number')} placeholder="123456-A" />
          <Field label="Tax ID (GST/SST)" value={form.tax_id} onChange={setField('tax_id')} placeholder="123456789012" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-[#FF6A00] hover:bg-[#e05e00] text-white gap-2 px-8"
        >
          <Save className="size-4" />
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string
  value: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[#94A3B8] text-xs font-medium">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8] focus-visible:ring-[#FF6A00]/50 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
    </div>
  )
}
