import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("ffi");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
