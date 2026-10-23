'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 text-center mt-16 space-y-6">
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
        Project Submission & Evaluation Portal
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
        A structured platform for students to submit course assignments and mentors to evaluate and grade projects in real-time.
      </p>

      <div className="flex justify-center gap-4 pt-4">
        {user ? (
          <Link href={user.role === 'MENTOR' ? '/mentor' : '/student'}>
            <Button size="lg">Go to {user.role === 'MENTOR' ? 'Mentor Dashboard' : 'Student Portal'}</Button>
          </Link>
        ) : (
          <>
            <Link href="/login">
              <Button size="lg">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg">Student Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}