import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <section className="flex min-h-screen flex-col items-center justify-center bg-background">
            <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
                {children}
            </div>
        </section>
    )
}

export default AuthLayout;