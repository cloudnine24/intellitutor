import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return Response.json(
        {
          error: "Supabase not configured",
          details: "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables",
          files: [], // Return empty array for demo mode
        },
        { status: 200 }, // Return 200 to allow the app to continue working
      )
    }

    const { data, error } = await supabase.from("files").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching files:", error)
      return Response.json(
        {
          error: "Failed to fetch files",
          details: error.message,
          files: [], // Return empty array as fallback
        },
        { status: 200 }, // Return 200 to allow the app to continue working
      )
    }

    return Response.json({ files: data || [] })
  } catch (error) {
    console.error("Fetch files error:", error)
    return Response.json(
      {
        error: "Failed to fetch files",
        details: error instanceof Error ? error.message : "Unknown error",
        files: [], // Return empty array as fallback
      },
      { status: 200 }, // Return 200 to allow the app to continue working
    )
  }
}

export async function DELETE(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return Response.json(
        {
          error: "Supabase not configured",
          details: "Database operations require Supabase configuration",
        },
        { status: 400 },
      )
    }

    const { searchParams } = new URL(req.url)
    const fileId = searchParams.get("id")

    if (!fileId) {
      return Response.json({ error: "File ID required" }, { status: 400 })
    }

    const { error } = await supabase.from("files").delete().eq("id", fileId)

    if (error) {
      console.error("Error deleting file:", error)
      return Response.json(
        {
          error: "Failed to delete file",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete file error:", error)
    return Response.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
