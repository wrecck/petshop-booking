import BookingPage from "@/components/booking-page";

export default async function TenantBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BookingPage shopSlug={slug} />;
}
