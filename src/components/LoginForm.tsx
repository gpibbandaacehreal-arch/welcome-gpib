import React, { useState } from 'react';
import { authService, type AdminProfile } from '../services/auth';

interface LoginFormProps {
  onLoginSuccess: (profile?: AdminProfile | null) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        onLoginSuccess(response.profile);
      } else {
        setError(response.message || 'Terjadi kesalahan saat login.');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menghubungkan ke server. Periksa koneksi internet Anda.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login Super Admin</h2>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '12px 16px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          fontSize: '0.9rem',
          textAlign: 'left',
          border: '1px solid #ffcdd2',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ marginBottom: '6px', fontSize: '0.95rem', fontWeight: 600, display: 'block', textAlign: 'left' }}>Username / Email</label>
          <input 
            type="text" 
            placeholder="Masukkan Username" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required 
            autoComplete="username"
            style={{ width: '100%', boxSizing: 'border-box', height: '48px', padding: '12px 15px', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ddd' }}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '16px', width: '100%' }}>
          <label style={{ marginBottom: '6px', fontSize: '0.95rem', fontWeight: 600, display: 'block', textAlign: 'left' }}>Password</label>
          <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Masukkan Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required 
              autoComplete="current-password"
              style={{ width: '100%', boxSizing: 'border-box', height: '48px', padding: '12px 45px 12px 15px', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ddd' }}
            />
            <button 
              type="button" 
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                width: 'auto',
                height: 'auto',
                marginTop: 0
              }}
              title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
              disabled={isLoading}
            >
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>
        </div>
        
        <button type="submit" disabled={isLoading} style={{ width: '100%', height: '48px', marginTop: '10px', fontSize: '1rem', fontWeight: 600 }}>
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="loader-small"></span> Memproses...
            </span>
          ) : 'Masuk'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
