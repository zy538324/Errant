export default function RefundsReturnsPage() {
  return (
    <main className="content-shell py-16 text-stone-300">
      <h1 className="font-serif text-5xl text-stone-50">Refunds &amp; Returns</h1>

      <section className="mt-8 max-w-3xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-stone-50">Digital downloads</h2>
          <p className="mt-2 text-base leading-7">
            Online checkout currently sells digital downloads only. Due to the instant and irrevocable nature of digital content, all digital sales are final once the download is made available.
          </p>
          <p className="mt-2 text-base leading-7">
            If your file is defective, corrupted, inaccessible or clearly not the file purchased, we will investigate and provide a replacement where the issue is verified.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-stone-50">Need help with an order?</h2>
          <p className="mt-2 text-base leading-7">
            Please contact us with your order email address, order reference and a short description of the issue so we can help locate and resolve the problem.
          </p>
        </div>
      </section>
    </main>
  );
}
