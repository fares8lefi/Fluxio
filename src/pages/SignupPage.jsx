import { useState } from 'react';

import { register, verifyAccount } from '@/services/authService';
import { SignupProgress } from '@/components/auth/SignupProgress';
import { SignupSidebar } from '@/components/auth/SignupSidebar';
import { StepPersonal } from '@/components/auth/StepPersonal';
import { StepCompany } from '@/components/auth/StepCompany';
import { StepVerify } from '@/components/auth/StepVerify';

const STEPS = ['Vos informations', 'Votre entreprise', 'Vérification'];

const INITIAL_DATA = {
  username: '',
  email: '',
  phone: '',
  password: '',
  company_name: '',
  matriculeFiscale: '',
};

/**
 * SignupPage Component
 * Manages a multi-step registration flow:
 * 1. Personal Information
 * 2. Company Information
 * 3. Email Verification (OTP)
 */
export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(INITIAL_DATA);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) =>
    setData((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  // Submits registration data to create a new account
  const handleRegister = async (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const body = await register(data);
      setMessage({ type: 'success', text: body.message });
      setStep(3);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Impossible de créer le compte.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Verifies the account using the OTP code sent to email
  const handleVerify = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await verifyAccount(data.email, code);
      setMessage({
        type: 'success',
        text: 'Votre compte est vérifié. Redirection vers la connexion...',
      });
      setTimeout(() => {
        window.location.hash = '#login';
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Code invalide ou expiré.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <SignupSidebar />

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg">
          <a
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
            href="#accueil"
          >
            ← Retour à l'accueil
          </a>

          <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
            <SignupProgress currentStep={step} steps={STEPS} />

            {message.text && (
              <p
                className={`mt-6 rounded-lg p-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-rose-50 text-rose-800'
                }`}
              >
                {message.text}
              </p>
            )}

            {step === 1 && (
              <StepPersonal
                data={data}
                onChange={handleChange}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <StepCompany
                data={data}
                onChange={handleChange}
                onBack={() => setStep(1)}
                onSubmit={handleRegister}
                loading={loading}
              />
            )}
            {step === 3 && (
              <StepVerify
                email={data.email}
                code={code}
                onCodeChange={setCode}
                onSubmit={handleVerify}
                loading={loading}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
