export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-8">
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Larry - AI Agent Open Source Forum &copy; {new Date().getFullYear()}
      </p>
    </footer>
  );
}
