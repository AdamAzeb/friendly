import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-screen-lg mx-auto w-full">{children}</main>
      </div>
    </AuthGuard>
  );
}
