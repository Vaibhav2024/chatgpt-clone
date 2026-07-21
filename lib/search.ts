interface SearchResult {
    title: string;
    url: string;
    content: string;
}

interface SearchResponse {
    query: string;
    results: SearchResult[];
}

export async function webSearch(query: string): Promise<SearchResponse> {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
        console.warn("[search] TAVILY_API_KEY not set, returning mock results");
        return {
            query,
            results: [
                {
                    title: "Mock result (no TAVILY_API_KEY configured)",
                    url: "https://example.com",
                    content: `This is a placeholder result for "${query}". Set TAVILY_API_KEY in .env.local to enable real search.`,
                },
            ],
        };
    }

    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                search_depth: "basic",
                max_results: 5,
                include_answer: false,
            }),
        });

        if (!res.ok) {
            throw new Error(`Tavily API error: ${res.status}`);
        }

        const data = await res.json();

        return {
            query,
            results: (data.results ?? []).map((r: any) => ({
                title: r.title,
                url: r.url,
                content: r.content?.slice(0, 500) ?? "",
            })),
        };
    } catch (err) {
        console.error("[search] webSearch failed:", err);
        return { query, results: [] };
    }
}
