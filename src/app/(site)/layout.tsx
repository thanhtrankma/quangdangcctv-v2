import { CartProvider } from "@/components/site/cart";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { getSettings } from "@/lib/data";

// Content is edited in the admin; admin saves call revalidatePath, and this is the fallback.
export const revalidate = 300;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { general } = await getSettings();
  return (
    <CartProvider quote={general.price_mode === "contact"}>
      <SiteHeader />
      <main id="main" className="min-h-[50vh]">
        {children}
      </main>
      <SiteFooter />
    </CartProvider>
  );
}
