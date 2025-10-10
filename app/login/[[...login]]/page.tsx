import Image from "next/image";
import { SignIn } from "@clerk/nextjs";
export default function Login() {
    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">
                            Welcome to <br /> ViewComfy Cloud
                        </h1>
                        <p className="text-balance text-muted-foreground">
                            Login or Sign up to access the dashboard
                        </p>
                    </div>
                    <div className="grid gap-4">
                        <SignIn />
                    </div>
                </div>
            </div>
            <div className="hidden lg:block lg:relative lg:overflow-hidden">
                <Image
                    src="/view_comfy_logo.svg"
                    alt="ViewComfy Logo"
                    width={1920}
                    height={1080}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-h-full w-auto object-contain"
                />
            </div>
        </div>
    );
}
