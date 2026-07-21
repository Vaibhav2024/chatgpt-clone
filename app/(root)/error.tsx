"use client"

import { useEffect } from "react"

export default function RootError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    // If it's the transient Clerk race condition, auto-retry once after a short delay
    useEffect(() => {
        const isSetupError =
            error.message?.includes("Could not set up your account") ||
            error.message?.includes("Unauthorized")

        if (isSetupError) {
            const t = setTimeout(() => reset(), 1500)
            return () => clearTimeout(t)
        }
    }, [error, reset])

    const isSetupError =
        error.message?.includes("Could not set up your account") ||
        error.message?.includes("Unauthorized")

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
            {isSetupError ? (
                <>
                    <div style={{ fontSize: "32px" }}>⏳</div>
                    <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
                        Setting up your account…
                    </h2>
                    <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
                        Just a moment while we get everything ready for you.
                    </p>
                </>
            ) : (
                <>
                    <div style={{ fontSize: "32px" }}>⚠️</div>
                    <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
                        Something went wrong
                    </h2>
                    <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
                        {error.message ?? "An unexpected error occurred."}
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            marginTop: "8px",
                            padding: "10px 24px",
                            borderRadius: "8px",
                            border: "1px solid #333",
                            background: "#1a1a1a",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                    >
                        Try again
                    </button>
                </>
            )}
        </div>
    )
}
