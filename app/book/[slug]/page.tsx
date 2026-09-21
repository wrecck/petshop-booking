import BookingPage from "@/app/page";

export default async function ShopBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BookingPage shopSlug={slug} />;
}
