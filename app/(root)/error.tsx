"use client"

import { useEffect, useRef } from "react"

export default function RootError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const hasAutoRetried = useRef(false)

    // Always auto-retry once on first render.
    // On the very first request after sign-up, Clerk's session token hasn't
    // propagated yet, causing a transient server error. By the time this
    // component renders and the timeout fires (~1.5s), the token is ready.
    useEffect(() => {
        if (hasAutoRetried.current) return
        hasAutoRetried.current = true

        const t = setTimeout(() => reset(), 1500)
        return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                background: "#0a0a0a",
                color: "#ffffff",
                fontFamily: "system-ui, sans-serif",
                gap: "16px",
                textAlign: "center",
                padding: "24px",
            }}
        >
            <div style={{ fontSize: "32px" }}>⏳</div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
                Setting up your account…
            </h2>
            <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
                Just a moment while we get everything ready for you.
            </p>
        </div>
    )
}
