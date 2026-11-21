import AuthScreen from '../pages/AuthScreen';
import { getAuthenticatedUser } from '@/src/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SignupPage() {
  if (await getAuthenticatedUser()) redirect('/');
  return (
    <AuthScreen
      mode="signup"
      defaultEmail={process.env.BRIEFLY_ADMIN_EMAIL ?? ''}
    />
  );
}
