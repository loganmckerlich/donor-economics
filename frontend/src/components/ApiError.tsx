/** Shown when the FastAPI backend cannot be reached. */
export default function ApiError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-series-2 bg-surface p-4 text-sm text-ink">
      Could not reach the API ({message}). Start it with{" "}
      <code className="font-mono">uvicorn app.main:app --port 8000</code> from <code className="font-mono">backend/</code>.
    </div>
  );
}
