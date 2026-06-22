export function AuthErrorBanner({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      {message}
    </p>
  );
}
