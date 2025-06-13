import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { retrieveRelevantChunks } from "@/lib/pdf-processor"
import { errorResponse, successResponse } from "@/lib/api-utils"
import { validateEnvironment } from "@/lib/env-validation"

const GROQ_MODELS = {
  "llama-3.1-8b-instant": {
    name: "Llama 3.1 8B Instant",
    description: "Fast and efficient for document analysis",
    maxTokens: 4000,
    temperature: 0.7,
  },
} as const

type ModelKey = keyof typeof GROQ_MODELS

export async function POST(req: Request) {
  try {
    // Validate environment
    const env = validateEnvironment()
    if (!env.groq.isConfigured) {
      return errorResponse(
        "GROQ API key not configured",
        "Please set GROQ_API_KEY environment variable to enable AI analysis",
        400,
      )
    }

    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (e) {
      return errorResponse("Invalid JSON in request body", undefined, 400)
    }

    const { fileName, fileId, action, query, model = "llama-3.1-8b-instant" } = body

    // Validate required fields
    if (!fileName) {
      return errorResponse("fileName is required", undefined, 400)
    }

    if (!action || !["quiz", "flashcards", "chat"].includes(action)) {
      return errorResponse("Valid action type (quiz, flashcards, chat) is required", undefined, 400)
    }

    // Validate model
    if (!GROQ_MODELS[model as ModelKey]) {
      return errorResponse(`Unsupported model: ${model}`, "Please use one of the supported models", 400)
    }

    let cachedResult = null
    let relevantContent = ""

    // Only check cache and retrieve content if Supabase is configured
    if (isSupabaseConfigured() && fileId) {
      try {
        // Check if we have a cached result
        const { data, error } = await supabase
          .from("analysis_results")
          .select("*")
          .eq("file_id", fileId)
          .eq("action_type", action)
          .eq("model_used", model)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "no rows returned" which is fine
          console.warn("Cache lookup error:", error)
        } else {
          cachedResult = data
        }

        if (cachedResult && action !== "chat") {
          // Return cached result for quiz and flashcards (but not for chat which might have different queries)
          return successResponse({
            analysis: cachedResult.analysis_text,
            action: action,
            fileName: fileName,
            model: GROQ_MODELS[model as ModelKey]?.name || model,
            modelKey: model,
            cached: true,
          })
        }

        // Retrieve relevant document chunks using RAG
        if (fileId && query) {
          const chunks = await retrieveRelevantChunks(fileId, query, 5)
          relevantContent = chunks.join("\n\n")
        } else if (fileId) {
          // Get the full document text if no specific query
          const { data: fileData, error: fileError } = await supabase
            .from("files")
            .select("extracted_text")
            .eq("id", fileId)
            .single()

          if (fileError) {
            console.error("Error retrieving file content:", fileError)
          } else {
            relevantContent = fileData?.extracted_text || ""
          }
        }
      } catch (dbError) {
        console.error("Database error:", dbError)
        // Continue with empty content if database operations fail
      }
    } else {
      // Demo mode - use sample content
      relevantContent = `Sample document content for ${fileName}. This is demo content since Supabase is not configured or fileId is missing.`
    }

    // Prepare prompts based on action type
    let systemPrompt = ""
    let userPrompt = ""

    switch (action) {
      case "quiz":
        systemPrompt = `You are an expert educational assessment creator with deep knowledge across academic disciplines. Your task is to analyze the provided document content and create a comprehensive, well-structured quiz that tests genuine understanding.

ANALYSIS REQUIREMENTS:
1. Identify key concepts, theories, formulas, and facts
2. Determine relationships between ideas
3. Assess the complexity level of the material
4. Extract specific details that demonstrate comprehension

QUESTION CREATION GUIDELINES:
- Create questions that test understanding, not just memorization
- Include questions that require application of concepts
- Vary difficulty levels (30% easy, 50% medium, 20% hard)
- Ensure all questions are directly answerable from the document
- Create realistic distractors for multiple choice questions
- Include questions that test relationships between concepts

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

**COMPREHENSIVE QUIZ: ${fileName}**

**DOCUMENT ANALYSIS:**
- Main topics covered: [list 3-5 key topics]
- Difficulty level: [Beginner/Intermediate/Advanced]
- Key concepts: [list important concepts]

**MULTIPLE CHOICE QUESTIONS:**

1. [Question testing basic understanding]
   a) [Correct answer]
   b) [Plausible distractor]
   c) [Plausible distractor]
   d) [Plausible distractor]
   **Answer: a**
   **Explanation:** [Detailed explanation with reference to document content]
   **Difficulty: Easy**

2. [Question testing application/analysis]
   a) [Option]
   b) [Option]
   c) [Correct answer]
   d) [Option]
   **Answer: c**
   **Explanation:** [Detailed explanation]
   **Difficulty: Medium**

[Continue with 6-8 multiple choice questions]

**TRUE/FALSE QUESTIONS:**

1. [Statement that requires careful reading to verify]
   **Answer: True/False**
   **Explanation:** [Why this is true/false based on document]
   **Difficulty: Easy/Medium/Hard**

[Continue with 4-5 true/false questions]

**SHORT ANSWER QUESTIONS:**

1. [Question requiring explanation or analysis]
   **Sample Answer:** [Comprehensive answer with key points]
   **Key Points:** [Bullet points of what should be included]
   **Difficulty: Medium/Hard**

[Continue with 3-4 short answer questions]

**ESSAY QUESTION:**

1. [Comprehensive question requiring synthesis of multiple concepts]
   **Sample Answer:** [Detailed response outline]
   **Grading Criteria:** [What to look for in a good answer]
   **Difficulty: Hard**

Create questions that genuinely test comprehension and application of the material.`

        userPrompt = `Analyze this document content from "${fileName}" and create a comprehensive quiz that tests deep understanding of the material. Focus on the key concepts, relationships, and applications presented in the document.

DOCUMENT CONTENT:
${relevantContent}

Create questions that:
1. Test understanding of main concepts
2. Require application of knowledge
3. Check comprehension of relationships between ideas
4. Verify grasp of important details
5. Challenge students to think critically about the material

Ensure all questions are directly based on the content provided and can be answered using information from the document.`
        break

      case "flashcards":
        systemPrompt = `You are an expert educational content creator. Generate flashcards based on the provided document content.

Format your response as structured flashcards:

**FLASHCARDS: ${fileName}**

**Card 1:**
FRONT: Clear, concise question or term
BACK: Comprehensive answer or definition

**Card 2:**
FRONT: Another question or concept
BACK: Detailed explanation

Continue this format for all key concepts. Cover definitions, formulas, important facts, and relationships between concepts. Create at least 10 flashcards covering the most important topics.`

        userPrompt = `Create educational flashcards based on this document content from "${fileName}":\n\n${relevantContent}`
        break

      case "chat":
        systemPrompt = `You are an AI tutor with expertise in analyzing academic documents. You have access to the content of "${fileName}" and can answer questions about it.

Provide helpful, accurate responses based on the document content. If the user asks about something not covered in the document, let them know and offer to help with what is available.

Always cite specific parts of the document when relevant and provide clear, educational explanations.`

        userPrompt = query
          ? `Based on the document "${fileName}", please answer this question: ${query}\n\nRelevant document content:\n${relevantContent}`
          : `Analyze this document "${fileName}" and provide educational insights:\n\n${relevantContent}`
        break

      default:
        return errorResponse("Invalid action type", "Action must be one of: quiz, flashcards, chat", 400)
    }

    const modelConfig = GROQ_MODELS[model as ModelKey]
    console.log(`Using model: ${modelConfig.name} for ${action} analysis`)

    try {
      const { text } = await generateText({
        model: groq(model),
        system: systemPrompt,
        prompt: userPrompt,
        maxTokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
      })

      // Cache the result in Supabase (except for chat which is query-specific) - only if configured
      if (action !== "chat" && isSupabaseConfigured() && fileId) {
        try {
          await supabase.from("analysis_results").insert({
            file_id: fileId,
            action_type: action,
            model_used: model,
            analysis_text: text,
          })
        } catch (cacheError) {
          console.error("Error caching analysis result:", cacheError)
          // Continue even if caching fails
        }
      }

      return successResponse({
        analysis: text,
        action: action,
        fileName: fileName,
        model: modelConfig.name,
        modelKey: model,
        cached: false,
        warning:
          !isSupabaseConfigured() || !fileId
            ? "Demo mode: Results not cached due to missing Supabase configuration or fileId"
            : undefined,
      })
    } catch (aiError) {
      console.error("AI generation error:", aiError)
      return errorResponse(
        "Failed to generate analysis",
        aiError instanceof Error ? aiError.message : "Unknown AI error",
        500,
      )
    }
  } catch (error) {
    console.error("Document analysis error:", error)
    return errorResponse("Failed to analyze document", error instanceof Error ? error.message : "Unknown error", 500)
  }
}
