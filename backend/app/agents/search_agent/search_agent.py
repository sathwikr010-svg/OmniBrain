def search_agent(query: str):
    if not query:
        return {
            "status": "error",
            "message": "Please provide a search query."
        }

    return {
        "status": "success",
        "agent": "Search Agent",
        "query": query,
        "response": f"Search Agent received: {query}"
    }