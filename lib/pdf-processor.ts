import { supabase } from "./supabase"

// Text chunking for RAG
export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  if (!text) return []

  const chunks: string[] = []
  let start = 0

  try {
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      const chunk = text.slice(start, end)
      chunks.push(chunk.trim())
      start = end - overlap
    }

    return chunks.filter((chunk) => chunk.length > 50) // Filter out very small chunks
  } catch (error) {
    console.error("Error chunking text:", error)
    return [text.slice(0, 1000)] // Return first 1000 chars as fallback
  }
}

// Store document chunks in Supabase (without embeddings for now)
export async function storeDocumentChunks(fileId: string, text: string): Promise<void> {
  if (!fileId || !text) {
    console.warn("Missing fileId or text for document chunking")
    return
  }

  try {
    const chunks = chunkText(text)

    // Process in batches to avoid overwhelming the database
    const batchSize = 5
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)

      const chunkData = batch.map((chunk, index) => ({
        file_id: fileId,
        chunk_text: chunk,
        chunk_index: i + index,
        metadata: {
          chunk_length: chunk.length,
          word_count: chunk.split(/\s+/).length,
        },
      }))

      const { error } = await supabase.from("document_chunks").insert(chunkData)

      if (error) {
        console.error("Error storing chunks batch:", error)
      }
    }
  } catch (error) {
    console.error("Error in storeDocumentChunks:", error)
    // Don't throw, just log the error to prevent upload failure
  }
}

// Retrieve relevant chunks for RAG using text search
export async function retrieveRelevantChunks(fileId: string, query: string, limit = 5): Promise<string[]> {
  if (!fileId) return []

  try {
    // Use PostgreSQL text search instead of vector similarity
    const { data, error } = await supabase
      .from("document_chunks")
      .select("chunk_text")
      .eq("file_id", fileId)
      .ilike("chunk_text", `%${query}%`)
      .order("chunk_index")
      .limit(limit)

    if (error) {
      console.error("Error retrieving chunks:", error)
      // Fallback: get first few chunks if search fails
      const { data: fallbackData } = await supabase
        .from("document_chunks")
        .select("chunk_text")
        .eq("file_id", fileId)
        .order("chunk_index")
        .limit(limit)

      return fallbackData?.map((chunk) => chunk.chunk_text) || []
    }

    return data?.map((chunk) => chunk.chunk_text) || []
  } catch (error) {
    console.error("Error in retrieveRelevantChunks:", error)
    return []
  }
}

// Extract text from PDF (simplified - in production use pdf-parse)
export async function extractTextFromPDF(file: File): Promise<string> {
  if (!file) return "No file provided"

  // For demo purposes, return sample text based on filename
  // In production, you'd use pdf-parse or similar:
  /*
  import pdf from 'pdf-parse'
  const buffer = await file.arrayBuffer()
  const data = await pdf(Buffer.from(buffer))
  return data.text
  */

  const fileName = file.name.toLowerCase()

  if (fileName.includes("math") || fileName.includes("calculus")) {
    return `Mathematical Analysis Document: ${file.name}

Chapter 1: Introduction to Calculus
Calculus is the mathematical study of continuous change. It has two major branches: differential calculus and integral calculus.

1.1 Limits and Continuity
A limit describes the behavior of a function as its input approaches a particular value. The formal definition of a limit is:
lim(x→a) f(x) = L if for every ε > 0, there exists δ > 0 such that |f(x) - L| < ε whenever 0 < |x - a| < δ.

1.2 Derivatives
The derivative of a function f(x) at point x is defined as:
f'(x) = lim(h→0) [f(x+h) - f(x)]/h

Common derivative rules:
- Power rule: d/dx(x^n) = nx^(n-1)
- Product rule: d/dx(uv) = u'v + uv'
- Chain rule: d/dx(f(g(x))) = f'(g(x))g'(x)

1.3 Integration
Integration is the reverse process of differentiation. The fundamental theorem of calculus states:
∫[a to b] f'(x)dx = f(b) - f(a)

Integration techniques:
- Substitution method
- Integration by parts: ∫udv = uv - ∫vdu
- Partial fractions
- Trigonometric substitution

Chapter 2: Applications of Calculus
2.1 Optimization Problems
Finding maximum and minimum values of functions using derivatives.

2.2 Related Rates
Problems involving rates of change of related quantities.

2.3 Area and Volume Calculations
Using definite integrals to calculate areas under curves and volumes of solids of revolution.

Practice Problems:
1. Find the derivative of f(x) = x³ + 2x² - 5x + 1
2. Evaluate ∫(2x + 3)dx
3. Find the critical points of g(x) = x⁴ - 4x³ + 6x²
4. Calculate the area under the curve y = x² from x = 0 to x = 2

This document provides a comprehensive introduction to calculus concepts essential for advanced mathematics courses.`
  }

  if (fileName.includes("physics")) {
    return `Physics Fundamentals: ${file.name}

Chapter 1: Classical Mechanics
Classical mechanics describes the motion of macroscopic objects, from projectiles to parts of machinery.

1.1 Newton's Laws of Motion
First Law (Law of Inertia): An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.

Second Law: The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.
F = ma

Third Law: For every action, there is an equal and opposite reaction.

1.2 Kinematics
Motion in one dimension:
- Position: x(t)
- Velocity: v(t) = dx/dt
- Acceleration: a(t) = dv/dt = d²x/dt²

Kinematic equations for constant acceleration:
- v = v₀ + at
- x = x₀ + v₀t + ½at²
- v² = v₀² + 2a(x - x₀)

1.3 Energy and Work
Work: W = F·d = Fd cos θ
Kinetic Energy: KE = ½mv²
Potential Energy: PE = mgh (gravitational)
Conservation of Energy: Total energy remains constant in isolated systems.

Chapter 2: Thermodynamics
2.1 Laws of Thermodynamics
First Law: Energy cannot be created or destroyed, only transferred or converted.
ΔU = Q - W

Second Law: The entropy of an isolated system never decreases.

2.2 Heat Transfer
- Conduction: Heat transfer through direct contact
- Convection: Heat transfer through fluid motion
- Radiation: Heat transfer through electromagnetic waves

Chapter 3: Waves and Oscillations
3.1 Simple Harmonic Motion
x(t) = A cos(ωt + φ)
where A is amplitude, ω is angular frequency, φ is phase constant.

3.2 Wave Properties
- Wavelength (λ): Distance between consecutive peaks
- Frequency (f): Number of oscillations per second
- Wave speed: v = fλ

This comprehensive physics text covers fundamental concepts essential for understanding the physical world.`
  }

  // Default sample text for other files
  return `Document Analysis: ${file.name}

This is extracted text content from the uploaded document. In a production environment, this would contain the actual text extracted from the PDF using libraries like pdf-parse.

Key concepts and topics covered in this document include:
- Fundamental principles and theories
- Mathematical formulations and equations
- Practical applications and examples
- Problem-solving methodologies
- Historical context and development

The document provides comprehensive coverage of the subject matter with detailed explanations, examples, and practice exercises. Students can use this material for:
- Understanding core concepts
- Preparing for examinations
- Completing assignments and projects
- Developing problem-solving skills

Important formulas and definitions are highlighted throughout the text to aid in learning and retention. The content is structured to build upon previous knowledge and gradually introduce more complex topics.

This extracted text would normally be much longer and contain the complete content of the original document, including all text, formulas, tables, and other textual elements that can be processed from the PDF file.`
}

export async function extractTextFromImage(file: File): Promise<string> {
  if (!file) return "No file provided"

  // For demo purposes - in production, use Tesseract.js or Google Vision API
  return `OCR Extracted Text from ${file.name}:

This text was extracted from an image using Optical Character Recognition (OCR) technology. In a production environment, this would use services like:
- Tesseract.js for client-side OCR
- Google Cloud Vision API for server-side processing
- AWS Textract for document analysis

The extracted text would include:
- Printed text recognition
- Handwritten text detection
- Mathematical equations and formulas
- Table and structure recognition
- Multi-language support

OCR accuracy depends on:
- Image quality and resolution
- Text clarity and font type
- Lighting conditions
- Document orientation
- Language and character set

This sample demonstrates how image-based documents can be converted to searchable, analyzable text for further processing by AI systems.`
}
