'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GoogleLogoIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  QuestionIcon,
  UserIcon,
  GitHubIcon,
} from '@/components/icons';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AgriTrackLogin() {
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error signing up',
        description: error.message,
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Check your email for a confirmation link.',
      });
    }
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error logging in',
        description: error.message,
      });
    } else {
      toast({
        title: 'Login successful!',
        description: 'You are now logged in.',
      });
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Google login failed',
        description: error.message,
      });
    }
  };
  
  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
       options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
     if (error) {
      toast({
        variant: 'destructive',
        title: 'GitHub login failed',
        description: error.message,
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email required',
        description: 'Please enter your email to reset your password.',
      });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Password reset email sent',
        description: 'Check your email for instructions to reset your password.',
      });
    }
  };

  return (
    <div className="relative mx-auto flex size-full min-h-screen max-w-sm flex-col justify-between bg-card font-body">
      <div className="flex flex-col">
        <header className="flex items-center bg-card p-4 pb-2">
          <div className="w-12"></div>
          <h2 className="flex-1 text-center text-lg font-bold tracking-tight text-foreground">
            EBAT
          </h2>
          <div className="flex w-12 items-center justify-end">
            <Button variant="ghost" size="icon" className="h-12 w-12">
              <QuestionIcon className="h-6 w-6 text-foreground" />
            </Button>
          </div>
        </header>

        <main className="px-4">
          <h1 className="pt-5 pb-3 text-center text-[22px] font-bold tracking-tight text-foreground">
            Welcome to Agrotron
          </h1>
          <p className="pb-3 pt-1 text-center text-base font-normal leading-normal text-muted-foreground">
            Monitor your crops, assess damage, and access research.
          </p>

          <div className="space-y-4 py-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-lg border-none bg-input p-4 text-base placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-lg border-none bg-input p-4 text-base placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="space-y-3 py-3">
            <Button
              className="h-12 w-full text-base font-bold tracking-wide"
              onClick={handleLogin}
            >
              Login
            </Button>
            <Button
              variant="secondary"
              className="h-12 w-full text-base font-bold tracking-wide"
              onClick={handleSignUp}
            >
              Sign Up
            </Button>
          </div>

          <p
            onClick={handleForgotPassword}
            className="cursor-pointer pb-3 pt-1 text-center text-sm font-normal leading-normal text-muted-foreground underline"
          >
            Forgot Password?
          </p>

          <div className="space-y-3 py-3">
            <Button
              variant="secondary"
              className="h-12 w-full gap-2 text-base font-bold tracking-wide"
              onClick={handleGoogleLogin}
            >
              <GoogleLogoIcon className="h-6 w-6" />
              <span>Continue with Google</span>
            </Button>
             <Button
              variant="secondary"
              className="h-12 w-full gap-2 text-base font-bold tracking-wide"
              onClick={handleGitHubLogin}
            >
              <GitHubIcon className="h-6 w-6" />
              <span>Continue with GitHub</span>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
