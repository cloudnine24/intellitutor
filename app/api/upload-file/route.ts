import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { extractTextFromPDF, extractTextFromImage, storeDocumentChunks } from "@/lib/pdf-processor"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - simulate file processing without database
      const extractedText = await extractTextFromPDF(file)
      const tags = generateTags(extractedText, file.name)

      return Response.json({
        success: true,
        file: {
          id: `demo-${Date.now()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          status: "completed",
          progress: 100,
          extracted_text: extractedText,
          tags: tags,
          subject: tags[0] || "General",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        warning: "Demo mode: File not saved to database. Configure Supabase to enable persistence.",
      })
    }

    // Create file record in database with default empty tags array
    const { data: fileRecord, error: insertError } = await supabase
      .from("files")
      .insert({
        name: file.name,
        type: file.type,
        size: file.size,
        status: "processing",
        progress: 0,
        tags: [], // Explicitly set empty array
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating file record:", insertError)
      return Response.json({ error: "Failed to create file record" }, { status: 500 })
    }

    // Extract text from file
    let extractedText = ""
    try {
      if (file.type === "application/pdf") {
        extractedText = await extractTextFromPDF(file)
      } else if (file.type.startsWith("image/")) {
        extractedText = await extractTextFromImage(file)
      } else {
        extractedText = "Text extraction not yet implemented for this file type."
      }

      // Generate tags based on content
      const tags = generateTags(extractedText, file.name)

      // Update file record with extracted text and tags
      const { error: updateError } = await supabase
        .from("files")
        .update({
          extracted_text: extractedText,
          tags: tags || [], // Ensure tags is always an array
          status: "completed",
          progress: 100,
        })
        .eq("id", fileRecord.id)

      if (updateError) {
        console.error("Error updating file record:", updateError)
        return Response.json(
          {
            error: "Failed to update file record",
            details: updateError.message,
          },
          { status: 500 },
        )
      }

      try {
        // Store document chunks for RAG
        await storeDocumentChunks(fileRecord.id, extractedText)
      } catch (chunkError) {
        console.error("Error storing document chunks:", chunkError)
        // Continue even if chunking fails
      }

      return Response.json({
        success: true,
        file: {
          id: fileRecord.id,
          name: file.name,
          type: file.type,
          size: file.size,
          status: "completed",
          progress: 100,
          extracted_text: extractedText,
          tags: tags || [],
        },
      })
    } catch (processingError) {
      console.error("Error processing file:", processingError)

      // Update file status to error
      await supabase
        .from("files")
        .update({
          status: "error",
          progress: 0,
        })
        .eq("id", fileRecord.id)

      return Response.json(
        {
          error: "Failed to process file",
          details: processingError instanceof Error ? processingError.message : String(processingError),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Upload error:", error)
    return Response.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

function generateTags(text: string, fileName: string): string[] {
  // Initialize with empty array
  const tags: string[] = []

  try {
    const keywords = {
      Mathematics: ["math", "equation", "formula", "calculus", "algebra", "geometry", "derivative", "integral"],
      Physics: ["physics", "force", "energy", "motion", "quantum", "thermodynamics", "newton", "wave"],
      Chemistry: ["chemistry", "molecule", "reaction", "compound", "element", "organic", "atom", "bond"],
      Biology: ["biology", "cell", "organism", "DNA", "evolution", "genetics", "protein", "enzyme"],
      "Computer Science": ["programming", "algorithm", "code", "software", "computer", "data", "function"],
    }

    const lowerText = text.toLowerCase()
    const lowerFileName = fileName.toLowerCase()

    for (const [subject, words] of Object.entries(keywords)) {
      if (words.some((word) => lowerText.includes(word) || lowerFileName.includes(word))) {
        tags.push(subject)
      }
    }

    if (lowerFileName.includes("exam") || lowerFileName.includes("test")) tags.push("Exam")
    if (lowerFileName.includes("lab") || lowerFileName.includes("experiment")) tags.push("Lab")
    if (lowerFileName.includes("homework") || lowerFileName.includes("assignment")) tags.push("Assignment")

    return tags.length > 0 ? tags : ["General"]
  } catch (error) {
    console.error("Error generating tags:", error)
    return ["General"] // Return default tag if there's an error
  }
}
