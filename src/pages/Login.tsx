import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('No credential received from Google');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send ID token to backend for verification
      const response = await authApi.googleLogin(credentialResponse.credential);
      const { access_token, refresh_token, user } = response.data;

      setAuth(user, access_token, refresh_token);
      navigate('/');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login error');
    setError('Google sign-in failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full shadow-xl border border-white/20">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏏</div>
          <h1 className="text-3xl font-bold text-white mb-2">Willow & Leather</h1>
          <p className="text-emerald-200">Cricket Management Simulation</p>
        </div>

        {/* Description */}
        <div className="text-center mb-8">
          <p className="text-emerald-100 text-sm">
            Build your dream cricket team, compete in auctions,
            and lead your franchise to glory.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Sign in button */}
        {isLoading ? (
          <div className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-3 px-4 rounded-lg">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
            <span>Signing in...</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_blue"
              size="large"
              width="300"
              text="signin_with"
            />
          </div>
        )}

        {/* Features */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">🏆</div>
              <p className="text-emerald-200 text-xs">Win Trophies</p>
            </div>
            <div>
              <div className="text-2xl mb-1">💰</div>
              <p className="text-emerald-200 text-xs">Build Squad</p>
            </div>
            <div>
              <div className="text-2xl mb-1">📊</div>
              <p className="text-emerald-200 text-xs">Track Stats</p>
            </div>
          </div>
        </div>

        {/* Career limit info */}
        <p className="text-center text-emerald-300/60 text-xs mt-6">
          Each account can manage up to 3 careers
        </p>
      </div>
    </div>
  );
}
