"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  FileText,
  Plus,
  Play,
  Clock,
  CheckCircle,
  X,
  Upload,
  Camera,
  Target,
  BarChart3,
  Brain,
  TrendingUp,
  Lightbulb,
} from "lucide-react"

interface Question {
  id: string
  type: "multiple-choice" | "true-false" | "short-answer" | "essay"
  question: string
  options?: string[]
  correctAnswer: number | string | boolean
  explanation: string
  difficulty: "easy" | "medium" | "hard"
  keyPoints?: string[]
  gradingCriteria?: string
}

interface Quiz {
  id: string
  title: string
  subject: string
  documentAnalysis?: {
    mainTopics: string[]
    difficultyLevel: string
    keyConcepts: string[]
  }
  questions: Question[]
  timeLimit: number
  difficulty: "easy" | "medium" | "hard"
  createdAt: Date
  attempts: number
  bestScore: number
  averageScore: number
}

const sampleQuizzes: Quiz[] = [
  {
    id: "1",
    title: "Calculus Integration Techniques",
    subject: "Mathematics",
    documentAnalysis: {
      mainTopics: ["Integration by parts", "Substitution method", "Partial fractions"],
      difficultyLevel: "Intermediate",
      keyConcepts: ["Fundamental theorem of calculus", "Integration techniques", "Applications"],
    },
    questions: [
      {
        id: "1",
        type: "multiple-choice",
        question: "What is the integral of x²?",
        options: ["x³/3 + C", "x³ + C", "2x + C", "x³/2 + C"],
        correctAnswer: 0,
        explanation: "Using the power rule: ∫x^n dx = x^(n+1)/(n+1) + C. For x², we get x³/3 + C.",
        difficulty: "easy",
      },
      {
        id: "2",
        type: "true-false",
        question: "Integration by parts is derived from the product rule of differentiation.",
        correctAnswer: true,
        explanation:
          "Yes, integration by parts (∫u dv = uv - ∫v du) is indeed derived from the product rule by integrating both sides of d/dx(uv) = u dv/dx + v du/dx.",
        difficulty: "medium",
      },
      {
        id: "3",
        type: "short-answer",
        question: "Explain when you would use the substitution method for integration.",
        correctAnswer: "When the integrand contains a function and its derivative",
        explanation:
          "The substitution method is used when you can identify a function u and its derivative du within the integrand, allowing you to simplify the integral.",
        keyPoints: [
          "Identify function and its derivative",
          "Substitute u = f(x)",
          "Replace dx with du",
          "Integrate in terms of u",
          "Substitute back",
        ],
        difficulty: "medium",
      },
    ],
    timeLimit: 15,
    difficulty: "medium",
    createdAt: new Date("2024-01-15"),
    attempts: 3,
    bestScore: 85,
    averageScore: 78,
  },
]

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>(sampleQuizzes)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: any }>({})
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showExplanations, setShowExplanations] = useState(false)
  const [detailedResults, setDetailedResults] = useState<any[]>([])

  // Timer effect
  useEffect(() => {
    if (activeQuiz && !quizCompleted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && activeQuiz && !quizCompleted) {
      completeQuiz()
    }
  }, [timeLeft, activeQuiz, quizCompleted])

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz)
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setQuizCompleted(false)
    setScore(0)
    setTimeLeft(quiz.timeLimit * 60)
    setShowExplanations(false)
    setDetailedResults([])
  }

  const handleAnswerSelect = (questionId: string, answer: any) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const nextQuestion = () => {
    if (activeQuiz && currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      completeQuiz()
    }
  }

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const completeQuiz = () => {
    if (!activeQuiz) return

    let correctAnswers = 0
    const results: any[] = []

    activeQuiz.questions.forEach((question) => {
      const userAnswer = selectedAnswers[question.id]
      let isCorrect = false

      if (question.type === "multiple-choice") {
        isCorrect = userAnswer === question.correctAnswer
      } else if (question.type === "true-false") {
        isCorrect = userAnswer === question.correctAnswer
      } else if (question.type === "short-answer" || question.type === "essay") {
        // For short answer and essay, we'll mark as correct if answered (in real app, would need manual grading)
        isCorrect = userAnswer && userAnswer.trim().length > 10
      }

      if (isCorrect) correctAnswers++

      results.push({
        question,
        userAnswer,
        isCorrect,
        pointsEarned: isCorrect ? (question.difficulty === "hard" ? 3 : question.difficulty === "medium" ? 2 : 1) : 0,
        maxPoints: question.difficulty === "hard" ? 3 : question.difficulty === "medium" ? 2 : 1,
      })
    })

    const totalPoints = results.reduce((sum, result) => sum + result.pointsEarned, 0)
    const maxPoints = results.reduce((sum, result) => sum + result.maxPoints, 0)
    const finalScore = Math.round((totalPoints / maxPoints) * 100)

    setScore(finalScore)
    setDetailedResults(results)
    setQuizCompleted(true)

    // Update quiz statistics
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === activeQuiz.id
          ? {
              ...quiz,
              attempts: quiz.attempts + 1,
              bestScore: Math.max(quiz.bestScore, finalScore),
              averageScore: Math.round((quiz.averageScore * quiz.attempts + finalScore) / (quiz.attempts + 1)),
            }
          : quiz,
      ),
    )
  }

  const exitQuiz = () => {
    setActiveQuiz(null)
    setQuizCompleted(false)
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setDetailedResults([])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600 bg-green-100"
      case "medium":
        return "text-yellow-600 bg-yellow-100"
      case "hard":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  // Quiz Taking Interface
  if (activeQuiz && !quizCompleted) {
    const question = activeQuiz.questions[currentQuestion]
    const progress = ((currentQuestion + 1) / activeQuiz.questions.length) * 100

    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto">
          {/* Quiz Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{activeQuiz.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{activeQuiz.subject}</Badge>
                  {activeQuiz.documentAnalysis && (
                    <Badge variant="secondary">{activeQuiz.documentAnalysis.difficultyLevel}</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className={`font-mono ${timeLeft < 300 ? "text-red-600" : ""}`}>{formatTime(timeLeft)}</span>
                </div>
                <Button variant="outline" onClick={exitQuiz}>
                  Exit Quiz
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Question {currentQuestion + 1} of {activeQuiz.questions.length}
                </span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} />
            </div>
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {question.type.replace("-", " ").toUpperCase()}
                  </Badge>
                  <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                    {question.difficulty.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Points: {question.difficulty === "hard" ? 3 : question.difficulty === "medium" ? 2 : 1}
                </div>
              </div>
              <CardTitle className="text-xl leading-relaxed">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
              {question.type === "multiple-choice" && (
                <RadioGroup
                  value={selectedAnswers[question.id]?.toString()}
                  onValueChange={(value) => handleAnswerSelect(question.id, Number.parseInt(value))}
                >
                  {question.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 border">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "true-false" && (
                <RadioGroup
                  value={selectedAnswers[question.id]?.toString()}
                  onValueChange={(value) => handleAnswerSelect(question.id, value === "true")}
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 border">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 border">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">
                      False
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {(question.type === "short-answer" || question.type === "essay") && (
                <div className="space-y-2">
                  <Textarea
                    value={selectedAnswers[question.id] || ""}
                    onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                    placeholder={question.type === "essay" ? "Write a comprehensive answer..." : "Enter your answer..."}
                    rows={question.type === "essay" ? 8 : 4}
                    className="w-full"
                  />
                  {question.keyPoints && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Hint:</strong> Consider including points about: {question.keyPoints.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button variant="outline" disabled={currentQuestion === 0} onClick={previousQuestion}>
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              {Object.keys(selectedAnswers).length} of {activeQuiz.questions.length} answered
            </div>

            <Button
              onClick={nextQuestion}
              disabled={selectedAnswers[question.id] === undefined}
              className={currentQuestion === activeQuiz.questions.length - 1 ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {currentQuestion === activeQuiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Quiz Results
  if (quizCompleted && activeQuiz) {
    const totalPoints = detailedResults.reduce((sum, result) => sum + result.pointsEarned, 0)
    const maxPoints = detailedResults.reduce((sum, result) => sum + result.maxPoints, 0)

    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <Card className="text-center p-8 mb-6">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl">Quiz Completed!</CardTitle>
              <div className="text-muted-foreground">{activeQuiz.title}</div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-6xl font-bold text-green-600">{score}%</div>
              <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalPoints}</div>
                  <div className="text-sm text-muted-foreground">Points Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{maxPoints}</div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{detailedResults.filter((r) => r.isCorrect).length}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{activeQuiz.questions.length}</div>
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={() => setShowExplanations(!showExplanations)}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {showExplanations ? "Hide" : "Show"} Explanations
                </Button>
                <Button onClick={() => startQuiz(activeQuiz)}>Retake Quiz</Button>
                <Button variant="outline" onClick={exitQuiz}>
                  Back to Quizzes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="space-y-4">
            {detailedResults.map((result, index) => (
              <Card key={result.question.id} className="overflow-hidden">
                <CardHeader className={`${result.isCorrect ? "bg-green-50" : "bg-red-50"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          result.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {result.isCorrect ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">Question {index + 1}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {result.question.type.replace("-", " ").toUpperCase()}
                          </Badge>
                          <Badge className={`text-xs ${getDifficultyColor(result.question.difficulty)}`}>
                            {result.question.difficulty.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {result.pointsEarned}/{result.maxPoints} points
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium mb-2">{result.question.question}</div>
                    </div>

                    {result.question.type === "multiple-choice" && (
                      <div className="space-y-2">
                        <div
                          className={`p-2 rounded ${result.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          <strong>Your answer:</strong> {result.question.options?.[result.userAnswer] || "No answer"}
                        </div>
                        {!result.isCorrect && (
                          <div className="p-2 rounded bg-green-100 text-green-800">
                            <strong>Correct answer:</strong>{" "}
                            {result.question.options?.[result.question.correctAnswer as number]}
                          </div>
                        )}
                      </div>
                    )}

                    {result.question.type === "true-false" && (
                      <div className="space-y-2">
                        <div
                          className={`p-2 rounded ${result.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          <strong>Your answer:</strong> {result.userAnswer?.toString() || "No answer"}
                        </div>
                        {!result.isCorrect && (
                          <div className="p-2 rounded bg-green-100 text-green-800">
                            <strong>Correct answer:</strong> {result.question.correctAnswer?.toString()}
                          </div>
                        )}
                      </div>
                    )}

                    {(result.question.type === "short-answer" || result.question.type === "essay") && (
                      <div className="space-y-2">
                        <div className="p-2 rounded bg-gray-100">
                          <strong>Your answer:</strong>
                          <div className="mt-1 text-sm">{result.userAnswer || "No answer provided"}</div>
                        </div>
                        <div className="p-2 rounded bg-blue-100 text-blue-800">
                          <strong>Sample answer:</strong>
                          <div className="mt-1 text-sm">{result.question.correctAnswer}</div>
                        </div>
                        {result.question.keyPoints && (
                          <div className="p-2 rounded bg-yellow-100 text-yellow-800">
                            <strong>Key points to include:</strong>
                            <ul className="mt-1 text-sm list-disc list-inside">
                              {result.question.keyPoints.map((point, i) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {showExplanations && (
                      <div className="p-3 rounded bg-blue-50 border-l-4 border-blue-400">
                        <div className="font-medium text-blue-800 mb-1">Explanation:</div>
                        <div className="text-blue-700 text-sm">{result.question.explanation}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Main Quizzes Page
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI-Generated Quiz System</h1>
          <p className="text-muted-foreground">
            Intelligent assessment with document analysis and adaptive questioning
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Quiz from Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Document for AI Analysis</h3>
                  <p className="text-muted-foreground mb-4">AI will analyze content and generate targeted questions</p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => (window.location.href = "/upload")}>
                      <Upload className="h-4 w-4 mr-2" />
                      Go to Upload
                    </Button>
                    <Button variant="outline">
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Quiz
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Quizzes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.length}</div>
            <p className="text-xs text-muted-foreground">Ready to take</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(quizzes.reduce((sum, quiz) => sum + quiz.averageScore, 0) / quizzes.length) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Across all quizzes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.reduce((sum, quiz) => sum + quiz.attempts, 0)}</div>
            <p className="text-xs text-muted-foreground">Quiz attempts made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.max(...quizzes.map((quiz) => quiz.bestScore), 0)}%</div>
            <p className="text-xs text-muted-foreground">Highest score achieved</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Quizzes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{quiz.subject}</Badge>
                <Badge
                  variant={
                    quiz.difficulty === "easy" ? "default" : quiz.difficulty === "medium" ? "secondary" : "destructive"
                  }
                >
                  {quiz.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-lg">{quiz.title}</CardTitle>
              {quiz.documentAnalysis && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <strong>Topics:</strong> {quiz.documentAnalysis.mainTopics.join(", ")}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {quiz.documentAnalysis.keyConcepts.slice(0, 3).map((concept, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Questions</div>
                    <div className="font-medium">{quiz.questions.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Time Limit</div>
                    <div className="font-medium">{quiz.timeLimit} min</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Attempts</div>
                    <div className="font-medium">{quiz.attempts}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Best Score</div>
                    <div className="font-medium text-green-600">{quiz.bestScore}%</div>
                  </div>
                </div>
                <Button onClick={() => startQuiz(quiz)} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No quizzes available</h3>
          <p className="text-muted-foreground mb-4">Upload a document to generate your first AI-powered quiz</p>
          <Button onClick={() => (window.location.href = "/upload")}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      )}
    </div>
  )
}
