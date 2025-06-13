"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Brain,
  Plus,
  RotateCcw,
  Check,
  X,
  Eye,
  EyeOff,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Star,
  StarOff,
  Settings,
  Timer,
  BookOpen,
  TrendingUp,
} from "lucide-react"

interface Flashcard {
  id: string
  front: string
  back: string
  subject: string
  difficulty: "easy" | "medium" | "hard"
  lastReviewed: Date
  nextReview: Date
  confidence: number
  timesReviewed: number
  averageTime: number
  isStarred: boolean
  tags: string[]
}

const sampleFlashcards: Flashcard[] = [
  {
    id: "1",
    front: "What is the derivative of sin(x)?",
    back: "cos(x)",
    subject: "Calculus",
    difficulty: "easy",
    lastReviewed: new Date(),
    nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
    confidence: 0.8,
    timesReviewed: 5,
    averageTime: 3.2,
    isStarred: true,
    tags: ["derivatives", "trigonometry"],
  },
  {
    id: "2",
    front: "Define photosynthesis",
    back: "The process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen",
    subject: "Biology",
    difficulty: "medium",
    lastReviewed: new Date(),
    nextReview: new Date(Date.now() + 48 * 60 * 60 * 1000),
    confidence: 0.6,
    timesReviewed: 3,
    averageTime: 5.8,
    isStarred: false,
    tags: ["plants", "energy"],
  },
  {
    id: "3",
    front: "What is Newton's Second Law?",
    back: "F = ma (Force equals mass times acceleration)",
    subject: "Physics",
    difficulty: "easy",
    lastReviewed: new Date(),
    nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
    confidence: 0.9,
    timesReviewed: 8,
    averageTime: 2.1,
    isStarred: true,
    tags: ["mechanics", "laws"],
  },
]

export default function Flashcards() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>(sampleFlashcards)
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [newCard, setNewCard] = useState({ front: "", back: "", subject: "", tags: "" })
  const [studySettings, setStudySettings] = useState({
    autoFlip: false,
    autoFlipDelay: 3,
    shuffleCards: false,
    onlyStarred: false,
    difficultyFilter: "all",
    subjectFilter: "all",
    soundEnabled: false,
  })
  const [sessionStats, setSessionStats] = useState({
    cardsStudied: 0,
    correctAnswers: 0,
    totalTime: 0,
    streak: 0,
  })
  const [cardStartTime, setCardStartTime] = useState<number>(0)
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>(flashcards)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  // Filter cards based on settings
  useEffect(() => {
    let filtered = flashcards

    if (studySettings.onlyStarred) {
      filtered = filtered.filter((card) => card.isStarred)
    }

    if (studySettings.difficultyFilter !== "all") {
      filtered = filtered.filter((card) => card.difficulty === studySettings.difficultyFilter)
    }

    if (studySettings.subjectFilter !== "all") {
      filtered = filtered.filter((card) => card.subject === studySettings.subjectFilter)
    }

    if (studySettings.shuffleCards) {
      filtered = [...filtered].sort(() => Math.random() - 0.5)
    }

    setFilteredCards(filtered)
    setCurrentCard(0)
  }, [flashcards, studySettings])

  // Auto-flip functionality
  useEffect(() => {
    if (studyMode && studySettings.autoFlip && !showAnswer && isAutoPlaying) {
      const timer = setTimeout(() => {
        setShowAnswer(true)
      }, studySettings.autoFlipDelay * 1000)

      return () => clearTimeout(timer)
    }
  }, [studyMode, studySettings.autoFlip, studySettings.autoFlipDelay, showAnswer, currentCard, isAutoPlaying])

  // Auto-advance functionality
  useEffect(() => {
    if (studyMode && studySettings.autoFlip && showAnswer && isAutoPlaying) {
      const timer = setTimeout(() => {
        nextCard()
      }, studySettings.autoFlipDelay * 1000)

      return () => clearTimeout(timer)
    }
  }, [studyMode, studySettings.autoFlip, studySettings.autoFlipDelay, showAnswer, currentCard, isAutoPlaying])

  const startStudySession = () => {
    setStudyMode(true)
    setCurrentCard(0)
    setShowAnswer(false)
    setSessionStats({ cardsStudied: 0, correctAnswers: 0, totalTime: 0, streak: 0 })
    setCardStartTime(Date.now())
  }

  const nextCard = () => {
    if (currentCard < filteredCards.length - 1) {
      setCurrentCard(currentCard + 1)
      setShowAnswer(false)
      setCardStartTime(Date.now())
    } else {
      endStudySession()
    }
  }

  const previousCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setShowAnswer(false)
      setCardStartTime(Date.now())
    }
  }

  const endStudySession = () => {
    setStudyMode(false)
    setIsAutoPlaying(false)
    setCurrentCard(0)
    setShowAnswer(false)
  }

  const handleConfidence = (confidence: "low" | "medium" | "high") => {
    const confidenceValue = confidence === "low" ? 0.3 : confidence === "medium" ? 0.6 : 0.9
    const timeSpent = (Date.now() - cardStartTime) / 1000

    // Update card statistics
    const updatedCards = flashcards.map((card) => {
      if (card.id === filteredCards[currentCard].id) {
        return {
          ...card,
          confidence: confidenceValue,
          timesReviewed: card.timesReviewed + 1,
          averageTime: (card.averageTime * card.timesReviewed + timeSpent) / (card.timesReviewed + 1),
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + (confidenceValue > 0.6 ? 48 : 24) * 60 * 60 * 1000),
        }
      }
      return card
    })

    setFlashcards(updatedCards)

    // Update session stats
    setSessionStats((prev) => ({
      ...prev,
      cardsStudied: prev.cardsStudied + 1,
      correctAnswers: prev.correctAnswers + (confidence !== "low" ? 1 : 0),
      totalTime: prev.totalTime + timeSpent,
      streak: confidence !== "low" ? prev.streak + 1 : 0,
    }))

    // Play sound if enabled
    if (studySettings.soundEnabled) {
      // In a real app, you'd play actual sounds here
      console.log(`Playing ${confidence} sound`)
    }

    nextCard()
  }

  const toggleStar = (cardId: string) => {
    setFlashcards((prev) => prev.map((card) => (card.id === cardId ? { ...card, isStarred: !card.isStarred } : card)))
  }

  const addFlashcard = () => {
    if (newCard.front && newCard.back) {
      const card: Flashcard = {
        id: Date.now().toString(),
        front: newCard.front,
        back: newCard.back,
        subject: newCard.subject || "General",
        difficulty: "medium",
        lastReviewed: new Date(),
        nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
        confidence: 0.5,
        timesReviewed: 0,
        averageTime: 0,
        isStarred: false,
        tags: newCard.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }
      setFlashcards([...flashcards, card])
      setNewCard({ front: "", back: "", subject: "", tags: "" })
    }
  }

  const subjects = Array.from(new Set(flashcards.map((card) => card.subject)))

  if (studyMode && filteredCards.length > 0) {
    const card = filteredCards[currentCard]
    const progress = ((currentCard + 1) / filteredCards.length) * 100

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-4xl">
          {/* Study Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="mb-2">
                  {card.subject}
                </Badge>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(card.confidence * 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleStar(card.id)}
                  className={card.isStarred ? "text-yellow-500" : "text-gray-400"}
                >
                  {card.isStarred ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Card {currentCard + 1} of {filteredCards.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={previousCard} disabled={currentCard === 0}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={isAutoPlaying ? "text-green-600" : "text-gray-400"}
                  >
                    {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextCard}
                    disabled={currentCard === filteredCards.length - 1}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" onClick={endStudySession}>
                  End Session
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Progress value={progress} className="mb-2" />
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{sessionStats.cardsStudied}</div>
                  <div className="text-muted-foreground">Studied</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{sessionStats.correctAnswers}</div>
                  <div className="text-muted-foreground">Correct</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-600">{sessionStats.streak}</div>
                  <div className="text-muted-foreground">Streak</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-orange-600">{Math.round(sessionStats.totalTime)}s</div>
                  <div className="text-muted-foreground">Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Flashcard */}
          <Card
            className={`min-h-[400px] cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              showAnswer ? "bg-gradient-to-br from-green-50 to-blue-50" : "bg-gradient-to-br from-blue-50 to-purple-50"
            }`}
            onClick={() => setShowAnswer(!showAnswer)}
          >
            <CardContent className="flex items-center justify-center p-8 text-center min-h-[400px]">
              <div className="w-full">
                <div className="text-lg font-medium mb-4 text-muted-foreground">
                  {showAnswer ? "Answer:" : "Question:"}
                </div>
                <div className="text-2xl mb-6 leading-relaxed">{showAnswer ? card.back : card.front}</div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="text-sm">{showAnswer ? "Click to hide answer" : "Click to reveal answer"}</span>
                </div>
                {card.tags.length > 0 && (
                  <div className="flex justify-center gap-1 mt-4">
                    {card.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Confidence Buttons */}
          {showAnswer && (
            <div className="flex justify-center gap-4 mt-6">
              <Button
                variant="destructive"
                size="lg"
                onClick={() => handleConfidence("low")}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Hard
                <span className="text-xs opacity-75">Again</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleConfidence("medium")}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Good
                <span className="text-xs opacity-75">3 days</span>
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={() => handleConfidence("high")}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                Easy
                <span className="text-xs opacity-75">1 week</span>
              </Button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="mt-6 bg-white rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-muted-foreground">Times Reviewed</div>
                <div className="font-bold">{card.timesReviewed}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Avg. Time</div>
                <div className="font-bold">{card.averageTime.toFixed(1)}s</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Difficulty</div>
                <Badge
                  variant={
                    card.difficulty === "easy" ? "default" : card.difficulty === "medium" ? "secondary" : "destructive"
                  }
                  className="text-xs"
                >
                  {card.difficulty}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interactive Flashcards</h1>
          <p className="text-muted-foreground">Adaptive spaced repetition with advanced study features</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Study Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Study Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Auto-flip cards</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={studySettings.autoFlip}
                      onChange={(e) => setStudySettings((prev) => ({ ...prev, autoFlip: e.target.checked }))}
                    />
                    <span className="text-sm">Automatically flip cards</span>
                  </div>
                  {studySettings.autoFlip && (
                    <div className="space-y-2">
                      <Label>Auto-flip delay: {studySettings.autoFlipDelay}s</Label>
                      <Slider
                        value={[studySettings.autoFlipDelay]}
                        onValueChange={([value]) => setStudySettings((prev) => ({ ...prev, autoFlipDelay: value }))}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Filters</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Subject</Label>
                      <Select
                        value={studySettings.subjectFilter}
                        onValueChange={(value) => setStudySettings((prev) => ({ ...prev, subjectFilter: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subjects</SelectItem>
                          {subjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Difficulty</Label>
                      <Select
                        value={studySettings.difficultyFilter}
                        onValueChange={(value) => setStudySettings((prev) => ({ ...prev, difficultyFilter: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Difficulties</SelectItem>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={studySettings.shuffleCards}
                        onChange={(e) => setStudySettings((prev) => ({ ...prev, shuffleCards: e.target.checked }))}
                      />
                      <span className="text-sm">Shuffle cards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={studySettings.onlyStarred}
                        onChange={(e) => setStudySettings((prev) => ({ ...prev, onlyStarred: e.target.checked }))}
                      />
                      <span className="text-sm">Only starred cards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={studySettings.soundEnabled}
                        onChange={(e) => setStudySettings((prev) => ({ ...prev, soundEnabled: e.target.checked }))}
                      />
                      <span className="text-sm">Sound effects</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Flashcard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newCard.subject}
                    onChange={(e) => setNewCard({ ...newCard, subject: e.target.value })}
                    placeholder="e.g., Mathematics, Biology"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newCard.tags}
                    onChange={(e) => setNewCard({ ...newCard, tags: e.target.value })}
                    placeholder="e.g., derivatives, calculus"
                  />
                </div>
                <div>
                  <Label htmlFor="front">Question/Front</Label>
                  <Textarea
                    id="front"
                    value={newCard.front}
                    onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                    placeholder="Enter the question or front of the card"
                  />
                </div>
                <div>
                  <Label htmlFor="back">Answer/Back</Label>
                  <Textarea
                    id="back"
                    value={newCard.back}
                    onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                    placeholder="Enter the answer or back of the card"
                  />
                </div>
                <Button onClick={addFlashcard} className="w-full">
                  Create Flashcard
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {filteredCards.length > 0 && (
            <Button onClick={startStudySession} size="lg">
              <Brain className="h-4 w-4 mr-2" />
              Start Study Session ({filteredCards.length} cards)
            </Button>
          )}
        </div>
      </div>

      {/* Study Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Total Cards</div>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flashcards.length}</div>
            <p className="text-xs text-muted-foreground">{filteredCards.length} in current filter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Avg. Confidence</div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((flashcards.reduce((acc, card) => acc + card.confidence, 0) / flashcards.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Across all cards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Due for Review</div>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flashcards.filter((card) => card.nextReview <= new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">Cards ready to study</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Starred Cards</div>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flashcards.filter((card) => card.isStarred).length}</div>
            <p className="text-xs text-muted-foreground">Marked as important</p>
          </CardContent>
        </Card>
      </div>

      {/* Flashcards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((card) => (
          <Card key={card.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{card.subject}</Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStar(card.id)}
                    className={card.isStarred ? "text-yellow-500" : "text-gray-400"}
                  >
                    {card.isStarred ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                  </Button>
                  <Badge
                    variant={
                      card.difficulty === "easy"
                        ? "default"
                        : card.difficulty === "medium"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {card.difficulty}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm font-medium">Question:</div>
                <div className="text-sm text-muted-foreground line-clamp-2">{card.front}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Confidence</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < Math.round(card.confidence * 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Reviewed:</span> {card.timesReviewed}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg time:</span> {card.averageTime.toFixed(1)}s
                  </div>
                </div>
                {card.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {card.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No flashcards match your filters</h3>
          <p className="text-muted-foreground mb-4">Adjust your study settings or create new flashcards</p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setStudySettings({
                  ...studySettings,
                  subjectFilter: "all",
                  difficultyFilter: "all",
                  onlyStarred: false,
                })
              }
            >
              Clear Filters
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Flashcard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={newCard.subject}
                      onChange={(e) => setNewCard({ ...newCard, subject: e.target.value })}
                      placeholder="e.g., Mathematics, Biology"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newCard.tags}
                      onChange={(e) => setNewCard({ ...newCard, tags: e.target.value })}
                      placeholder="e.g., derivatives, calculus"
                    />
                  </div>
                  <div>
                    <Label htmlFor="front">Question/Front</Label>
                    <Textarea
                      id="front"
                      value={newCard.front}
                      onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                      placeholder="Enter the question or front of the card"
                    />
                  </div>
                  <div>
                    <Label htmlFor="back">Answer/Back</Label>
                    <Textarea
                      id="back"
                      value={newCard.back}
                      onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                      placeholder="Enter the answer or back of the card"
                    />
                  </div>
                  <Button onClick={addFlashcard} className="w-full">
                    Create Flashcard
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  )
}
