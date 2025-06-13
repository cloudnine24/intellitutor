"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  UploadIcon,
  FileText,
  ImageIcon,
  Camera,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Brain,
  MessageSquare,
  Settings,
  RefreshCwIcon as Refresh,
  AlertTriangle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { DatabaseFile } from "@/lib/supabase"

interface AnalysisResult {
  analysis: string
  model: string
  modelKey: string
  warning?: string
  cached?: boolean
}

const GROQ_MODELS = {
  "llama-3.1-8b-instant": {
    name: "Llama 3.1 8B Instant",
    description: "Fast and efficient for document analysis",
    recommended: true,
  },
} as const

export default function FileUploader() {
  const [files, setFiles] = useState<DatabaseFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<DatabaseFile | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)
  const [actionType, setActionType] = useState<"quiz" | "flashcards" | "chat" | null>(null)
  const [chatQuery, setChatQuery] = useState("")
  const [configurationWarning, setConfigurationWarning] = useState<string | null>(null)

  // Load files from Supabase on component mount
  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setIsLoading(true)
    setConfigurationWarning(null)

    try {
      const response = await fetch("/api/files")
      const data = await response.json()

      if (data.files) {
        setFiles(data.files)
        if (data.error && data.error.includes("not configured")) {
          setConfigurationWarning(data.details)
        }
      } else if (data.error) {
        setConfigurationWarning(data.details || data.error)
        setFiles([])
      }
    } catch (error) {
      console.error("Error loading files:", error)
      setConfigurationWarning("Failed to connect to the database. Please check your configuration.")
      toast({
        title: "Configuration Issue",
        description: "Database connection failed. Check environment variables.",
        variant: "destructive",
      })
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFiles = async (fileList: File[]) => {
    for (const file of fileList) {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload-file", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Upload failed with status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          // Add the new file to the list
          setFiles((prev) => [result.file, ...prev])

          toast({
            title: "File uploaded",
            description: `${file.name} has been processed successfully${result.warning ? " (Demo mode)" : ""}`,
            variant: result.warning ? "default" : "default",
          })

          if (result.warning) {
            setConfigurationWarning(result.warning)
          }
        } else {
          throw new Error(result.error || "Failed to upload file")
        }
      } catch (error) {
        console.error("Upload error:", error)
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : `Failed to upload ${file.name}`,
          variant: "destructive",
        })
      }
    }
  }

  const removeFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files?id=${fileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFiles((prev) => prev.filter((file) => file.id !== fileId))
        toast({
          title: "File deleted",
          description: "File has been removed successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete file")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const analyzeFile = async (file: DatabaseFile, action: "quiz" | "flashcards" | "chat") => {
    setSelectedFile(file)
    setActionType(action)
    setIsAnalyzing(true)
    setShowAnalysisDialog(true)
    setAnalysisResult(null)

    try {
      const requestBody = {
        fileName: file.name,
        fileId: file.id,
        action: action,
        model: "llama-3.1-8b-instant",
        ...(action === "chat" && chatQuery ? { query: chatQuery } : {}),
        // Add document context for better quiz generation
        ...(action === "quiz"
          ? {
              query:
                "Analyze this document comprehensively and create questions that test understanding of key concepts, relationships, and applications",
            }
          : {}),
      }

      const response = await fetch("/api/analyze-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (result.success) {
        setAnalysisResult({
          analysis: result.analysis,
          model: result.model,
          modelKey: result.modelKey,
          warning: result.warning,
          cached: result.cached,
        })
      } else {
        setAnalysisResult({
          analysis: `Analysis failed: ${result.error}\n\nDetails: ${result.details}`,
          model: "Error",
          modelKey: "error",
        })
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalysisResult({
        analysis: "Analysis failed. Please try again.",
        model: "Error",
        modelKey: "error",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upload System</h1>
          <p className="text-muted-foreground">Universal content ingestion with persistent storage and RAG</p>
        </div>
        <Button onClick={loadFiles} variant="outline">
          <Refresh className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {configurationWarning && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-800">Configuration Notice</h3>
                <p className="text-sm text-orange-600">{configurationWarning}</p>
                <div className="mt-2 text-xs text-orange-500">
                  <p>To enable full functionality, please set these environment variables:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>NEXT_PUBLIC_SUPABASE_URL</li>
                    <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                    <li>GROQ_API_KEY (for AI analysis)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Model Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>AI Model</Label>
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
              <span className="font-medium">Llama 3.1 8B Instant</span>
              <Badge variant="secondary" className="text-xs">
                Recommended
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Fast and efficient AI model optimized for document analysis</p>
          </div>
          <div>
            <Label htmlFor="chat-query">Chat Query (for AI interaction)</Label>
            <Input
              id="chat-query"
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              placeholder="Ask a specific question about the document..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              Optional: Ask specific questions when using "Talk to AI"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <UploadIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Drop files here or click to upload</h3>
            <p className="text-muted-foreground mb-4">Supports PDF, DOCX, PPT, JPG, PNG and more</p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => document.getElementById("file-input")?.click()}>
                <FileText className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
              <Button variant="outline">
                <Camera className="h-4 w-4 mr-2" />
                Camera Capture
              </Button>
            </div>
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.txt"
            />
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {file.subject || "General"} •{" "}
                          {new Date(file.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === "completed" && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {file.status === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
                      <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {file.status === "processing" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing...</span>
                        <span>{file.progress}%</span>
                      </div>
                      <Progress value={file.progress} />
                    </div>
                  )}

                  {file.status === "completed" && (
                    <div className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        {Array.isArray(file.tags) && file.tags.length > 0 ? (
                          file.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            General
                          </Badge>
                        )}
                      </div>
                      {file.extracted_text && (
                        <div className="bg-gray-50 rounded p-2 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Eye className="h-3 w-3" />
                            <span className="text-xs font-medium">Extracted Text Preview</span>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">{file.extracted_text}</p>
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => analyzeFile(file, "flashcards")}>
                          <Brain className="h-3 w-3 mr-1" />
                          Generate Flashcards
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => analyzeFile(file, "quiz")}>
                          <FileText className="h-3 w-3 mr-1" />
                          Generate Quiz
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => analyzeFile(file, "chat")}>
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Talk to AI
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
            <p className="text-xs text-muted-foreground">
              {files.filter((f) => f.status === "completed").length} processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <UploadIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}</div>
            <p className="text-xs text-muted-foreground">Across all uploads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.length > 0
                ? Math.round((files.filter((f) => f.status === "completed").length / files.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Processing success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "quiz" && "Generated Quiz"}
              {actionType === "flashcards" && "Generated Flashcards"}
              {actionType === "chat" && "AI Analysis"}
              {selectedFile && ` - ${selectedFile.name}`}
            </DialogTitle>
            {analysisResult && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{analysisResult.model}</Badge>
                {analysisResult.cached && (
                  <Badge variant="secondary" className="text-xs">
                    Cached Result
                  </Badge>
                )}
                {analysisResult.warning && (
                  <Badge variant="secondary" className="text-xs">
                    Demo Mode
                  </Badge>
                )}
              </div>
            )}
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>
                    Analyzing document with {GROQ_MODELS["llama-3.1-8b-instant" as keyof typeof GROQ_MODELS]?.name}...
                  </p>
                </div>
              </div>
            ) : (
              analysisResult && (
                <div className="space-y-4">
                  <Textarea value={analysisResult.analysis} readOnly className="min-h-[400px] font-mono text-sm" />
                  <div className="flex gap-2">
                    {actionType === "quiz" && (
                      <Button onClick={() => (window.location.href = "/quizzes")}>Take Quiz</Button>
                    )}
                    {actionType === "flashcards" && (
                      <Button onClick={() => (window.location.href = "/flashcards")}>Study Flashcards</Button>
                    )}
                    {actionType === "chat" && (
                      <Button onClick={() => (window.location.href = "/tutor")}>Continue in AI Tutor</Button>
                    )}
                    <Button variant="outline" onClick={() => setShowAnalysisDialog(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
