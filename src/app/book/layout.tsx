import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">{children}</main>
      <Footer />
    </div>
  );
}
