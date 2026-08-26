"use client";

import dynamic from "next/dynamic";
import { AdminLoginLoading } from "./page-client";

const AdminLoginForm = dynamic(() => import("./page-client"), {
  ssr: false,
  loading: () => <AdminLoginLoading />,
});

export default function AdminLoginPageLoader() {
  return <AdminLoginForm />;
}
