'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Check, X, Clock, CheckCircle, XCircle, FolderKanban } from 'lucide-react';

interface Submission {
  id: string;
  projectName: string;
  repoUrl: string;
  liveLink: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function MentorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'MENTOR')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchStats = async () => {
    try {
      const data = await fetchWithAuth<Stats>('/submissions/stats');
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '8',
      });
      if (filter !== 'ALL') {
        queryParams.set('status', filter);
      }

      const res = await fetchWithAuth<{ data: Submission[]; meta: { totalPages: number } }>(
        `/submissions?${queryParams.toString()}`
      );
      setSubmissions(res.data);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    if (user?.role === 'MENTOR') {
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'MENTOR') {
      fetchSubmissions();
    }
  }, [fetchSubmissions, user]);

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setActionLoadingId(id);
    try {
      await fetchWithAuth(`/submissions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await Promise.all([fetchSubmissions(), fetchStats()]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading) return <div className="text-center p-12">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentor Review Dashboard</h1>
          <p className="text-slate-500">Monitor submissions, inspect source repositories, and grade projects.</p>
        </div>

        {/* Server-side Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Filter Status:</span>
          <Select
            value={filter}
            onValueChange={(val) => {
              setFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Projects</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Aggregated Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Submissions</CardTitle>
              <FolderKanban className="w-5 h-5 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-600">Pending Review</CardTitle>
              <Clock className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
              <XCircle className="w-5 h-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Paginated Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Project Details</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Links</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    Loading submissions...
                  </TableCell>
                </TableRow>
              ) : submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    No submissions found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="max-w-xs">
                      <p className="font-semibold text-slate-900">{sub.projectName}</p>
                      <p className="text-xs text-slate-500 truncate" title={sub.description}>
                        {sub.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm text-slate-800">{sub.user.name}</div>
                      <div className="text-xs text-slate-400">{sub.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <a
                          href={sub.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs font-medium text-blue-600 hover:underline gap-1"
                        >
                          Repo <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href={sub.liveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs font-medium text-blue-600 hover:underline gap-1"
                        >
                          Live <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sub.status === 'APPROVED' ? 'default' : sub.status === 'REJECTED' ? 'destructive' : 'secondary'
                        }
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200"
                          disabled={sub.status === 'APPROVED' || actionLoadingId === sub.id}
                          onClick={() => handleUpdateStatus(sub.id, 'APPROVED')}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200"
                          disabled={sub.status === 'REJECTED' || actionLoadingId === sub.id}
                          onClick={() => handleUpdateStatus(sub.id, 'REJECTED')}
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <div>
          Showing page <span className="font-semibold text-slate-900">{page}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}