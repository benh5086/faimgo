/*
  Faimgo — /admin (back-office activity dashboard, Ben-only).

  Server wrapper: its only jobs are to mark the route noindex/nofollow (so the
  login shell never shows up in search) and to render the client dashboard.
  All the real logic lives in AdminDashboard.js so the interactive bits stay a
  single-file change. Access is gated by the ADMIN_TOKEN check in
  api/admin/stats — this page renders an empty token prompt until that passes.
*/

import AdminDashboard from "./AdminDashboard";

export const metadata = {
  title: "Faimgo · Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
