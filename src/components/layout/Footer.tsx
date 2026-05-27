import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/90 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Zane Tutors. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Use
          </Link>
          <a href="https://zanetutors.com.ng" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Zane Home
          </a>
        </div>
      </div>
    </footer>
  );
}
