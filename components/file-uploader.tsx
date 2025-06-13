"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { UploadIcon, X, AlertCircle } from "lucide-react"
import type { DatabaseFile } from "@/lib/supabase"

interface FileUploaderProps {
  onFileUploaded?: (file: DatabaseFile) => void
  maxSizeMB?: number
  allowedTypes?: string[]
}

export function FileUploader({
  onFileUploaded,
  maxSizeMB = 10,
  allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const validateFile = (file: File): string | null => {
    if (!file) return "No file provided"

    if (!allowedTypes.includes(file.type)) {
      return `File type not supported. Please upload: ${allowedTypes.join(", ")}`
    }

    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size is ${maxSizeMB}MB`
    }

    return null
  }

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      toast({
        title: "Upload Error",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + 5
        return newProgress < 90 ? newProgress : prev
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-file", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`)
      }

      const result = await response.json()
      setUploadProgress(100)

      if (result.success) {
        toast({
          title: "File uploaded",
          description: `${file.name} has been processed successfully`,
        })

        if (onFileUploaded && result.file) {
          onFileUploaded(result.file)
        }
      } else {
        throw new Error(result.error || "Failed to upload file")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError(error instanceof Error ? error.message : "Failed to upload file")
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : `Failed to upload ${file.name}`,
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setUploading(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadFile(e.dataTransfer.files[0])
      }
    },
    [], // Removed uploadFile from dependencies
  )

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0])
    }
  }, []) // Added useCallback to handleFileChange

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {uploading ? "Uploading..." : "Drop files here or click to upload"}
        </h3>
        <p className="text-muted-foreground mb-4">
          Supports {allowedTypes.map((t) => t.replace("application/", "").replace("image/", "")).join(", ")}
          (Max {maxSizeMB}MB)
        </p>

        {!uploading && (
          <Button onClick={() => document.getElementById("file-input")?.click()}>
            <UploadIcon className="h-4 w-4 mr-2" />
            Choose File
          </Button>
        )}

        <input
          id="file-input"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={allowedTypes.join(",")}
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Upload Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
