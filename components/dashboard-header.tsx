import Link from "next/link";
import {
  ExternalLink,
  LayoutDashboard,
  PawPrint,
  Settings,
  UsersRound,
} from "lucide-react";
import { signOut } from "@/app/dashboard/actions";

export function DashboardHeader({
  shopName,
  shopSlug,
}: {
  shopName: string;
  shopSlug: string;
}) {
  return (
    <header className="dashboard-header">
      <Link className="brand" href="/dashboard">
        <span className="brand-mark">
          <PawPrint size={20} fill="currentColor" />
        </span>
        <span>{shopName}</span>
      </Link>
      <nav aria-label="Dashboard navigation">
        <Link href="/dashboard">
          <LayoutDashboard size={15} /> Overview
        </Link>
        <Link href="/dashboard/groomers">
          <UsersRound size={15} /> Groomers
        </Link>
        <Link href="/dashboard/settings">
          <Settings size={15} /> Settings
        </Link>
        <Link href={`/${shopSlug}`} target="_blank">
          Booking page <ExternalLink size={14} />
        </Link>
        <form action={signOut}>
          <button>Sign out</button>
        </form>
      </nav>
    </header>
  );
}
