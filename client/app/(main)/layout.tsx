import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
