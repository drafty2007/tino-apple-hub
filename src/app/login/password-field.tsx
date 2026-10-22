'use client';
import { useState } from 'react';

export default function PasswordField() {
  const [visible, setVisible] = useState(false);
  return <div className="password-field">
    <label htmlFor="login-password">Password</label>
    <div className="password-input-row">
      <input id="login-password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required maxLength={128}/>
      <button type="button" className="password-toggle" aria-controls="login-password" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? 'Hide' : 'Show'}</button>
    </div>
  </div>;
}
