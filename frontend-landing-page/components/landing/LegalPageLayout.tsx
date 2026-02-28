import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            {title}
          </h1>
          <article className="mt-8 prose prose-stone max-w-none text-stone-600 [&>h2]:mt-10 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:text-stone-900 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6">
            {children}
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
