import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-6xl font-bold text-teal-navy">404</p>
        <p className="mt-2 text-ink-soft">Trang bạn tìm không tồn tại hoặc đã được chuyển.</p>
        <Link href="/" className="mt-4 inline-block rounded bg-teal-navy px-5 py-2 font-bold text-white">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
