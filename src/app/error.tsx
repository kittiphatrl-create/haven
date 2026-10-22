"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="fallback-page">
      <h1>Haven couldn’t load this view.</h1>
      <p>Your demo has no external messaging. Try loading the view again.</p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
