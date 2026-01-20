"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  UserPlus, 
  Linkedin, 
  MapPin, 
  DollarSign, 
  ShieldCheck,
  Briefcase,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";
import { syncJobsAction } from "@/app/actions/sync-jobs";

type Job = Tables<'jobs'>;

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [syncing, setSyncing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const toggleApplied = async (id: string, currentStatus: boolean | null) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('jobs')
      .update({ is_applied: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating applied status:', error);
    } else {
      setJobs(jobs.map(job => 
        job.id === id ? { ...job, is_applied: newStatus } : job
      ));
    }
  };

  const toggleReferral = async (id: string, currentStatus: boolean | null) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('jobs')
      .update({ referral_status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating referral status:', error);
    } else {
      setJobs(jobs.map(job => 
        job.id === id ? { ...job, referral_status: newStatus } : job
      ));
    }
  };

  const updateReferrer = async (id: string, field: 'referrer_name' | 'referrer_linkedin', value: string) => {
    // Optimistic update
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, [field]: value } : job
    ));

    const { error } = await supabase
      .from('jobs')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      console.error(`Error updating ${field}:`, error);
      // Revert on error if needed, but for simple text inputs we can just log
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncJobsAction();
      if (result.success) {
        console.log(`Sync complete. Added ${result.newJobsAdded} new jobs.`);
        await fetchJobs();
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.job_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Briefcase className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              H1B Data <span className="text-blue-600">Career Agent</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? "Syncing..." : "Sync Jobs"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Verified Leads</p>
            <h3 className="text-3xl font-bold text-slate-900">{jobs.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Applied</p>
            <h3 className="text-3xl font-bold text-blue-600">
              {jobs.filter(j => j.is_applied).length}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Referrals Pending</p>
            <h3 className="text-3xl font-bold text-emerald-600">
              {jobs.filter(j => j.referral_status && !j.is_applied).length}
            </h3>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search companies or roles..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Jobs Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-medium">Loading your career leads...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="bg-slate-100 p-4 rounded-full">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No jobs found. Try syncing or adjusting your search.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sponsorship Proof</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Referral</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-900">{job.job_title}</span>
                          <span className="text-sm text-slate-600 font-medium">{job.company_name}</span>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="w-3 h-3" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <DollarSign className="w-3 h-3" /> {job.salary_range}
                            </span>
                          </div>
                          {job.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 mt-2 w-fit">
                              {job.category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-start gap-2 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            {job.sponsorship_proof}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleApplied(job.id, job.is_applied)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            job.is_applied 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${job.is_applied ? "fill-blue-700 text-white" : ""}`} />
                          {job.is_applied ? "Applied" : "Mark Applied"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => toggleReferral(job.id, job.referral_status)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all w-fit ${
                              job.referral_status 
                                ? "bg-emerald-100 text-emerald-700" 
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            <UserPlus className="w-4 h-4" />
                            {job.referral_status ? "Referral Secured" : "Add Referral"}
                          </button>
                          
                          {job.referral_status && (
                            <div className="flex flex-col gap-2 mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-1">
                              <input 
                                type="text" 
                                placeholder="Referrer Name"
                                className="text-xs p-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={job.referrer_name || ""}
                                onChange={(e) => updateReferrer(job.id, 'referrer_name', e.target.value)}
                              />
                              <div className="relative">
                                <Linkedin className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                <input 
                                  type="text" 
                                  placeholder="LinkedIn URL"
                                  className="text-xs p-1.5 pl-6 border border-slate-200 rounded bg-white w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  value={job.referrer_linkedin || ""}
                                  onChange={(e) => updateReferrer(job.id, 'referrer_linkedin', e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a 
                          href={job.job_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          View Job <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
