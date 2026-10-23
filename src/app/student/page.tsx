'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader,沉, TableRow } from '@/components/ui/table';
import { ExternalLink, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const formSchema = z.object({
  projectName: z.string().min(3, 'Project name must be at least 3 characters'),
  repoUrl: z.string().url('Invalid repository URL (must start with https://)'),
  liveLink: z.string().url('Invalid live link URL (must start with https://)'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export default function StudentPortal() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    projectName: '',
    repoUrl: '',
    liveLink: '',
    description: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverMsg, setServerMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadHistory = async () => {
    try {
      const data = await fetchWithAuth('/submissions/my-submissions');
      setMySubmissions(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      loadHistory();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerMsg(null);
    setFormErrors({});

    // Client-side Zod validation
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await fetchWithAuth('/submissions', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setServerMsg({ text: 'Project submitted successfully for review!', isError: false });
      setFormData({ projectName: '', repoUrl: '', liveLink: '', description: '' });
      loadHistory();
    } catch (err: any) {
      setServerMsg({ text: err.message, isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="text-center p-12">Loading portal...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Submission Portal</h1>
        <p className="text-slate-500">Submit your project details for mentor review.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit New Assignment</CardTitle>
          <CardDescription>All fields are strictly validated. Ensure GitHub and Live links are public.</CardDescription>
        </CardHeader>
        <CardContent>
          {serverMsg && (
            <div
              className={`p-3 rounded-md mb-4 flex items-center gap-2 text-sm ${
                serverMsg.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              {serverMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {serverMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Project Name</label>
              <Input
                placeholder="e.g., E-Commerce Management System"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              />
              {formErrors.projectName && <p className="text-xs text-red-500 mt-1">{formErrors.projectName}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Repository URL</label>
                <Input
                  placeholder="https://github.com/..."
                  value={formData.repoUrl}
                  onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                />
                {formErrors.repoUrl && <p className="text-xs text-red-500 mt-1">{formErrors.repoUrl}</p>}
              </div>

              <div>
                <label className="text-sm font-semibold">Live Demo Link</label>
                <Input
                  placeholder="https://..."
                  value={formData.liveLink}
                  onChange={(e) => setFormData({ ...formData, liveLink: e.target.value })}
                />
                {formErrors.liveLink && <p className="text-xs text-red-500 mt-1">{formErrors.liveLink}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold">Description</label>
              <Textarea
                rows={4}
                placeholder="Summarize the core features, architecture, and technology stack used..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                </>
              ) : (
                'Submit Project'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Submission History */}
      <Card>
        <CardHeader>
          <CardTitle>My Submissions</CardTitle>
          <CardDescription>Status of your previous submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {fetchingHistory ? (
            <div className="text-center py-6 text-sm text-slate-500">Loading history...</div>
          ) : mySubmissions.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">No projects submitted yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mySubmissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.projectName}</TableCell>
                    <TableCell className="space-x-2">
                      <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center text-xs gap-1">
                        Repo <ExternalLink className="w-3 h-3" />
                      </a>
                      <a href={sub.liveLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center text-xs gap-1">
                        Live <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sub.status === 'APPROVED' ? 'default' : sub.status === 'REJECTED' ? 'destructive' : 'secondary'
                        }
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}