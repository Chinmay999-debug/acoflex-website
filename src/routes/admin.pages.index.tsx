import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/pages/")({
  component: () => <Navigate to="/admin" replace />,
});
