import AuthScreen from '../pages/AuthScreen';
import { getAuthenticatedUser } from '@/src/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  if (await getAuthenticatedUser()) redirect('/');
  return <AuthScreen mode="signin" />;
}
