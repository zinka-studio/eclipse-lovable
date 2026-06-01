'use client';
import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

interface BookingDrawerProps {
  open: boolean;
  onClose: () => void;
}

const reservationSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().trim().email('Please enter a valid email').max(254, 'Email is too long'),
  date: z.string().refine((d) => {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneYear = new Date();
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    return parsed >= today && parsed <= oneYear;
  }, 'Please choose a date within the next year'),
  guests: z.number().int().min(1, 'At least 1 guest').max(12, 'Maximum 12 guests'),
  special_requests: z.string().trim().max(500, 'Please keep requests under 500 characters').optional(),
});

export default function BookingDrawer({ open, onClose }: BookingDrawerProps) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    date: '',
    guests: '',
    special_requests: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    const guestsNum = parseInt(form.guests, 10);
    const parsed = reservationSchema.safeParse({
      full_name: form.full_name,
      email: form.email,
      date: form.date,
      guests: Number.isNaN(guestsNum) ? -1 : guestsNum,
      special_requests: form.special_requests || undefined,
    });

    if (!parsed.success) {
      setStatus('error');
      setErrorMsg(parsed.error.issues[0]?.message ?? 'Please check your details');
      return;
    }

    setStatus('loading');

    const { error } = await supabase.from('reservations').insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      date: parsed.data.date,
      guests: parsed.data.guests,
      special_requests: parsed.data.special_requests ?? null,
    });

    if (error) {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    } else {
      setStatus('success');
      setForm({ full_name: '', email: '', date: '', guests: '', special_requests: '' });
    }
  }

  function handleClose() {
    setStatus('idle');
    setErrorMsg('');
    onClose();
  }

  return (
    <>
      <div id="doverlay" className={open ? 'open' : ''} onClick={handleClose} />
      <div id="drawer" className={open ? 'open' : ''}>
        <div className="dr-handle-wrap" onClick={handleClose}>
          <div className="dr-handle" />
          <button className="dr-close" onClick={handleClose}>✕&nbsp;&nbsp;Close</button>
        </div>
        <div className="dr-header">
          <div className="dr-title">Reserve Your Seat</div>
        </div>

        {status === 'success' ? (
          <div className="dr-form" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', paddingTop: '3rem' }}>
            <div style={{ fontSize: '2.5rem' }}>✦</div>
            <div style={{ fontSize: '1.1rem', letterSpacing: '0.1em', color: 'var(--color-cream, #f5f0e8)' }}>Reservation Received</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted, #888)', textAlign: 'center', lineHeight: 1.6 }}>
              We'll be in touch shortly to confirm your table.
            </div>
            <button className="dr-submit" style={{ marginTop: '1rem' }} onClick={handleClose}>Close</button>
          </div>
        ) : (
          <form className="dr-form" onSubmit={handleSubmit} noValidate>
            <div className="dr-field">
              <div className="dr-label">Full Name</div>
              <input className="dr-input" type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Your name" maxLength={100} required />
            </div>
            <div className="dr-field">
              <div className="dr-label">Email</div>
              <input className="dr-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@email.com" maxLength={254} required />
            </div>
            <div className="dr-field">
              <div className="dr-label">Date</div>
              <input className="dr-input" type="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
            <div className="dr-field">
              <div className="dr-label">Guests</div>
              <input className="dr-input" type="number" name="guests" value={form.guests} onChange={handleChange} placeholder="2" min={1} max={12} required />
            </div>
            <div className="dr-field full">
              <div className="dr-label">Special Requests</div>
              <input className="dr-input" type="text" name="special_requests" value={form.special_requests} onChange={handleChange} placeholder="Allergies, occasions, preferences…" maxLength={500} />
            </div>
            {status === 'error' && errorMsg && (
              <div style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}
            <div className="dr-submit-wrap">
              <button className="dr-submit" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending…' : 'Confirm Reservation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
