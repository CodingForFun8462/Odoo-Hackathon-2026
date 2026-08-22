import { useState } from 'react';
import './Auth.css';

export default function Auth({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (mode !== 'forgot') {
      if (!formData.password) {
        newErrors.password = 'Password is required.';
      } else if (mode === 'signup' && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
      }
    }

    if (mode === 'signup') {
      if (!formData.name.trim()) {
        newErrors.name = 'Full name is required.';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (!validate()) {
      return;
    }

    if (mode === 'login') {
      setMessage('Logging in...');
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess({ email: formData.email, name: formData.email.split('@')[0] });
        } else {
          setMessage(`Welcome back, ${formData.email}! (Simulated login successful)`);
        }
      }, 400);
    } else if (mode === 'signup') {
      setMessage('Creating account...');
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess({ email: formData.email, name: formData.name });
        } else {
          setMessage(`Account created successfully for ${formData.name}! (Simulated signup)`);
        }
      }, 400);
    } else if (mode === 'forgot') {
      setMessage(`Password reset link sent to ${formData.email} (Simulated).`);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrors({});
    setMessage('');
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="brand-badge">✈️ GlobeTrotter</div>
        <h2>
          {mode === 'login' && 'Welcome Back'}
          {mode === 'signup' && 'Create an Account'}
          {mode === 'forgot' && 'Reset Password'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'login' && 'Log in to access and manage your travel itineraries.'}
          {mode === 'signup' && 'Start planning and sharing multi-city trips in minutes.'}
          {mode === 'forgot' && 'Enter your registered email to receive reset instructions.'}
        </p>
      </div>

      <div className="auth-tabs">
        {mode !== 'forgot' ? (
          <>
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Log In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign Up
            </button>
          </>
        ) : (
          <button
            type="button"
            className="auth-tab active"
            onClick={() => switchMode('forgot')}
          >
            Password Recovery
          </button>
        )}
      </div>

      {message && <div className="auth-alert success">{message}</div>}

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        {mode === 'signup' && (
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="e.g. Alex Johnson"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'input-error' : ''}
              autoComplete="name"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'input-error' : ''}
            autoComplete="email"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        {mode !== 'forgot' && (
          <div className="form-group">
            <div className="label-with-link">
              <label htmlFor="password">Password</label>
              {mode === 'login' && (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => switchMode('forgot')}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
        )}

        {mode === 'signup' && (
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}
          </div>
        )}

        <button type="submit" className="submit-button">
          {mode === 'login' && 'Log In'}
          {mode === 'signup' && 'Sign Up'}
          {mode === 'forgot' && 'Send Reset Link'}
        </button>

        <div className="auth-footer">
          {mode === 'login' && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="link-button highlight"
                onClick={() => switchMode('signup')}
              >
                Sign up
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="link-button highlight"
                onClick={() => switchMode('login')}
              >
                Log in
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              Remembered your password?{' '}
              <button
                type="button"
                className="link-button highlight"
                onClick={() => switchMode('login')}
              >
                Back to login
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
