import React, { useState } from 'react';
import { KeyRound, Mail, UserRound, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { registerWithEmail, signInWithEmail, resendVerification, sendPasswordReset } from '../services/firebaseAuth';
import './AuthPanel.css';

export default function AuthPanel({ language = 'en', onAuthenticated, onBack }) {
  const tamil = language === 'ta';
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const copy = {
    title: tamil ? 'LandStack AI-க்கு உள்நுழைக' : 'Sign in to LandStack AI',
    subtitle: tamil ? 'முகப்பு மற்றும் வரைபடத்தை உள்நுழையாமல் பார்க்கலாம்.' : 'Explore the home page and map without signing in.',
    login: tamil ? 'உள்நுழை' : 'Sign in',
    signup: tamil ? 'கணக்கு உருவாக்கு' : 'Create account',
    email: tamil ? 'மின்னஞ்சல்' : 'Email address',
    password: tamil ? 'கடவுச்சொல்' : 'Password',
    name: tamil ? 'முழுப் பெயர்' : 'Full name',
    confirm: tamil ? 'கடவுச்சொல்லை உறுதிப்படுத்து' : 'Confirm password',
    forgot: tamil ? 'கடவுச்சொல் மறந்துவிட்டதா?' : 'Forgot password?',
    need: tamil ? 'கணக்கு இல்லையா? பதிவு செய்யவும்' : "Don't have an account? Sign up",
    have: tamil ? 'ஏற்கெனவே கணக்கு உள்ளதா? உள்நுழைக' : 'Already have an account? Sign in',
    back: tamil ? 'திரும்பிச் செல்' : 'Back to public pages',
    verify: tamil ? 'மின்னஞ்சலைச் சரிபார்க்கவும்' : 'Verify your email',
    resend: tamil ? 'சரிபார்ப்பு மின்னஞ்சலை மீண்டும் அனுப்பு' : 'Resend verification email'
  };

  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('');
    if (mode === 'signup' && password !== confirmPassword) {
      setError(tamil ? 'கடவுச்சொற்கள் பொருந்தவில்லை.' : 'Passwords do not match.'); return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const account = await registerWithEmail(email.trim(), password, name.trim());
        setPending(account);
        setMode('verify');
        setMessage(tamil ? 'சரிபார்ப்பு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது.' : 'A verification link has been sent to your email. Verify it before signing in.');
      } else if (mode === 'login') {
        const user = await signInWithEmail(email.trim(), password);
        onAuthenticated(user);
      } else if (mode === 'reset') {
        await sendPasswordReset(email.trim());
        setMessage(tamil ? 'கடவுச்சொல் மீட்டமைப்பு மின்னஞ்சல் அனுப்பப்பட்டது.' : 'Password reset email sent. Check your inbox.');
      }
    } catch (e) { setError(e.message || 'Authentication failed.'); }
    finally { setBusy(false); }
  }

  async function resend() {
    if (!pending?.idToken) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await resendVerification(pending.idToken);
      setMessage(tamil ? 'சரிபார்ப்பு மின்னஞ்சல் மீண்டும் அனுப்பப்பட்டது.' : 'Verification email sent again. Check your inbox and spam folder.');
    } catch (e) { setError(e.message || 'Could not send verification email.'); }
    finally { setBusy(false); }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand-mark"><ShieldCheck size={28} /></div>
        <p className="auth-eyebrow">LANDSTACK AI</p>
        <h1>{mode === 'verify' ? copy.verify : mode === 'reset' ? (tamil ? 'கடவுச்சொல் மீட்டமைப்பு' : 'Reset password') : copy.title}</h1>
        <p className="auth-subtitle">{copy.subtitle}</p>

        {mode === 'verify' ? (
          <div className="auth-verify-box">
            <Mail size={28} />
            <p>{message || (tamil ? 'உங்கள் மின்னஞ்சலைத் திறந்து சரிபார்ப்பு இணைப்பைத் தேர்ந்தெடுக்கவும்.' : `Open the verification link sent to ${pending?.email || email}.` )}</p>
            <p className="auth-muted">{tamil ? 'சரிபார்த்த பிறகு மீண்டும் உள்நுழையவும்.' : 'After verifying, return here and sign in with your email and password.'}</p>
            <button className="auth-primary" disabled={busy} onClick={() => { setMode('login'); setMessage(''); setPending(null); }}>{tamil ? 'உள்நுழைவு பக்கத்திற்குச் செல்' : 'Return to sign in'}</button>
            <button className="auth-secondary" disabled={busy} onClick={resend}><RefreshCw size={16} /> {copy.resend}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="auth-form">
            {mode === 'signup' && <label><span>{copy.name}</span><div className="auth-input-wrap"><UserRound size={17}/><input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required maxLength={100}/></div></label>}
            <label><span>{copy.email}</span><div className="auth-input-wrap"><Mail size={17}/><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div></label>
            {mode !== 'reset' && <label><span>{copy.password}</span><div className="auth-input-wrap"><KeyRound size={17}/><input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}/></div></label>}
            {mode === 'signup' && <label><span>{copy.confirm}</span><div className="auth-input-wrap"><KeyRound size={17}/><input type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required minLength={6}/></div></label>}
            {error && <div className="auth-error" role="alert">{error}</div>}
            {message && <div className="auth-success" role="status">{message}</div>}
            <button className="auth-primary" disabled={busy} type="submit">{busy ? (tamil ? 'செயலாக்கப்படுகிறது…' : 'Please wait…') : mode === 'signup' ? copy.signup : mode === 'reset' ? (tamil ? 'மீட்டமைப்பு இணைப்பை அனுப்பு' : 'Send reset link') : copy.login}</button>
            {mode === 'login' && <button type="button" className="auth-text-button" onClick={()=>{setMode('reset');setError('');setMessage('');}}>{copy.forgot}</button>}
            <button type="button" className="auth-text-button" onClick={()=>{setMode(mode === 'signup' ? 'login' : 'signup');setError('');setMessage('');}}>{mode === 'signup' ? copy.have : copy.need}</button>
          </form>
        )}
        {mode !== 'verify' && <button className="auth-back" type="button" onClick={onBack}><ArrowLeft size={16}/>{copy.back}</button>}
      </div>
    </section>
  );
}
