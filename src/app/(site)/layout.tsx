import { CartProvider } from "@/components/site/cart";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

// Content is edited in the admin; admin saves call revalidatePath, and this is the fallback.
export const revalidate = 300;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <SiteHeader />
      <main id="main" className="min-h-[50vh]">
        {children}
      </main>
      <SiteFooter />
    </CartProvider>
  );
}
