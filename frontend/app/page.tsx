
"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "";

type Job = {
  id: string;
  task: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: string | null;
  created_at?: string;
};

export default function Home() {
  const [task, setTask] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Submit a new background job
  async function submitJob(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!task.trim()) return;

    setLoading(true);
    setError("");
    setJob(null);

    try {
      const response = await fetch(`${API_URL}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task: task.trim() }),
      });

      if (!response.ok) {
        throw new Error("Unable to submit job");
      }

      const data = await response.json();

      setJob({
        id: data.id,
        task: data.task,
        status: data.status,
      });

      setTask("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  // Poll the backend for job status
  useEffect(() => {
    if (
      !job?.id ||
      job.status === "completed" ||
      job.status === "failed"
    ) {
      return;
    }

    let active = true;
    let inFlight = false;

    const interval = setInterval(async () => {
      if (inFlight) return;

      inFlight = true;

      try {
        const response = await fetch(
          `${API_URL}/api/jobs/${job.id}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Unable to retrieve job status");
        }

        const data = await response.json();

        if (active) {
          setJob(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to retrieve job status"
          );
        }
      } finally {
        inFlight = false;
      }
    }, 1500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [job?.id, job?.status]);

  function statusColor(status: string) {
    switch (status) {
      case "completed":
        return "text-green-700 bg-green-100";
      case "processing":
        return "text-blue-700 bg-blue-100";
      case "failed":
        return "text-red-700 bg-red-100";
      default:
        return "text-yellow-800 bg-yellow-100";
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">

        <header className="mb-12">
          <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase">
            DevOps Assessment Project
          </p>

          <h1 className="text-4xl font-bold mt-3">
            Vegah JobFlow
          </h1>

          <p className="text-slate-400 mt-3">
            Asynchronous job processing powered by NestJS,
            PostgreSQL, Redis and BullMQ.
          </p>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-7">

          <h2 className="text-xl font-semibold mb-2">
            Submit a background task
          </h2>

          <p className="text-slate-400 text-sm mb-6">
            Your task will be processed asynchronously
            by an independent worker.
          </p>

          <form onSubmit={submitJob} className="space-y-4">

            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Example: Generate customer report for ABC Corporation"
              rows={4}
              maxLength={500}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500 resize-none"
              required
            />

            <button
              type="submit"
              disabled={loading || !task.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3 font-semibold transition"
            >
              {loading ? "Submitting..." : "Submit Job"}
            </button>

          </form>
        </section>

        {error && (
          <div className="mt-6 bg-red-950 border border-red-800 rounded-xl p-4 text-red-300">
            {error}
          </div>
        )}

        {job && (
          <section className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-7">

            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold">
                Job Details
              </h2>

              <span className={`text-xs font-semibold px-3 py-2 rounded-full uppercase ${statusColor(job.status)}`}>
                {job.status}
              </span>
            </div>

            <div className="space-y-5">

              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Job ID
                </p>

                <p className="text-sm break-all font-mono text-blue-300">
                  {job.id}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Submitted Task
                </p>

                <p className="text-slate-200">
                  {job.task}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Processing Status
                </p>

                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      job.status === "completed"
                        ? "w-full bg-green-500"
                        : job.status === "processing"
                        ? "w-2/3 bg-blue-500"
                        : job.status === "failed"
                        ? "w-full bg-red-500"
                        : "w-1/3 bg-yellow-500"
                    }`}
                  />
                </div>
              </div>

              {job.result && (
                <div className="bg-green-950 border border-green-800 rounded-xl p-5">
                  <p className="text-green-400 text-sm font-semibold mb-2">
                    Processing Result
                  </p>

                  <p className="text-green-200 text-sm break-words">
                    {job.result}
                  </p>
                </div>
              )}

              {job.status === "processing" && (
                <p className="text-blue-400 text-sm">
                  Your job is currently being processed...
                </p>
              )}

              {job.status === "pending" && (
                <p className="text-yellow-400 text-sm">
                  Your job is waiting in the queue...
                </p>
              )}

              {job.status === "failed" && (
                <p className="text-red-400 text-sm">
                  Job processing failed. Check the backend worker logs.
                </p>
              )}

            </div>
          </section>
        )}

        <footer className="mt-12 text-center text-slate-600 text-xs">
          Vega JobFlow · Distributed Background Processing Demo
        </footer>

      </div>
    </main>
  );
}
