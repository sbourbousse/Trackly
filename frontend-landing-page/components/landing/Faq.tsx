import { faqItems } from "@/lib/faq";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export function Faq() {
  return (
    <section
      id="faq"
      className="border-t border-stone-200 py-16 sm:py-20"
      aria-labelledby="faq-title"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container mx-auto max-w-3xl px-4">
        <h2
          id="faq-title"
          className="text-center text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
        >
          Questions fréquentes
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-stone-600 sm:text-lg">
          Tout ce que vous devez savoir sur Arrivo.
        </p>
        <dl className="mt-12 space-y-6">
          {faqItems.map((item) => (
            <div
              key={item.question}
              className="rounded-xl border border-stone-200 bg-stone-50/50 p-5"
            >
              <dt className="text-base font-semibold text-stone-900">
                {item.question}
              </dt>
              <dd className="mt-2 text-sm text-stone-600 leading-relaxed">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
