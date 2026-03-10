import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground">Miam</h1>
          <p className="mt-2 text-muted-foreground">
            Connectez-vous pour accéder à vos recettes
          </p>
        </div>

        <div className="flex justify-center">
          {isLoggingIn ? (
            <p className="text-sm text-muted-foreground">Connexion en cours...</p>
          ) : (
            <GoogleLogin
              onSuccess={async (response) => {
                if (!response.credential) return;
                setIsLoggingIn(true);
                try {
                  await loginWithGoogle(response.credential);
                  navigate('/', { replace: true });
                } catch {
                  setIsLoggingIn(false);
                  toast.error('Échec de la connexion. Veuillez réessayer.');
                }
              }}
              onError={() => {
                toast.error('Échec de la connexion Google.');
              }}
              theme="outline"
              size="large"
              text="signin_with"
              shape="pill"
            />
          )}
        </div>
      </div>
    </div>
  );
}
