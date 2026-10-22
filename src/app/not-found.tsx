import Link from "next/link";
export default function NotFound() {
  return (
    <main className="fallback-page">
      <h1>This page isn’t at home.</h1>
      <p>Return to the Haven demo to start a new moment.</p>
      <Link className="button button-primary" href="/">
        Back to Haven
      </Link>
    </main>
  );
}
