"use client"
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function AppContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const appId: string | null | undefined = searchParams?.get("appId");
    const pathname = usePathname();

    if (appId) {
        router.push(`/playground?appId=${appId}`);
    }

    if (pathname === "/" && !appId) {
        router.push("/apps");
    }

    return (
        <>
        </>
    );
}
