import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, AlertCircle, CheckCircle, BookOpen, Brain } from "lucide-react"

export default function SmartCalendar() {
  const today = new Date()
  const currentMonth = today.toLocaleString("default", { month: "long", year: "numeric" })

  // Sample calendar data
  const events = [
    { id: 1, title: "Physics Exam", date: "2024-01-20", type: "exam", priority: "high" },
    { id: 2, title: "Chemistry Lab Report Due", date: "2024-01-18", type: "assignment", priority: "medium" },
    { id: 3, title: "Calculus Review Session", date: "2024-01-17", type: "study", priority: "low" },
    { id: 4, title: "Biology Quiz", date: "2024-01-22", type: "quiz", priority: "medium" },
  ]

  const upcomingDeadlines = [
    { subject: "Physics", task: "Final Exam", daysLeft: 5, priority: "high" },
    { subject: "Chemistry", task: "Lab Report", daysLeft: 3, priority: "medium" },
    { subject: "Mathematics", task: "Problem Set 5", daysLeft: 7, priority: "low" },
  ]

  const studySessions = [
    { time: "09:00", subject: "Calculus Integration", duration: "2h", type: "focus" },
    { time: "14:00", subject: "Chemistry Review", duration: "1h", type: "review" },
    { time: "16:00", subject: "Physics Problems", duration: "1.5h", type: "practice" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Calendar</h1>
          <p className="text-muted-foreground">AI-enhanced academic scheduler with intelligent optimization</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {currentMonth}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Simple calendar grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium p-2 text-muted-foreground">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const dayNumber = i - 6 // Adjust for month start
                  const isCurrentMonth = dayNumber > 0 && dayNumber <= 31
                  const isToday = dayNumber === today.getDate()
                  const hasEvent = events.some((event) => {
                    const eventDate = new Date(event.date)
                    return eventDate.getDate() === dayNumber
                  })

                  return (
                    <div
                      key={i}
                      className={`aspect-square p-1 text-sm border rounded ${
                        isCurrentMonth
                          ? isToday
                            ? "bg-blue-600 text-white font-bold"
                            : hasEvent
                              ? "bg-blue-50 border-blue-200"
                              : "hover:bg-gray-50"
                          : "text-gray-300"
                      }`}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        {isCurrentMonth ? dayNumber : ""}
                      </div>
                      {hasEvent && isCurrentMonth && (
                        <div className="w-1 h-1 bg-blue-600 rounded-full mx-auto mt-1"></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Today's AI-Optimized Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studySessions.map((session, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="text-sm font-mono w-16">{session.time}</div>
                    <div className="flex-1">
                      <div className="font-medium">{session.subject}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {session.duration}
                        <Badge variant="outline" className="text-xs">
                          {session.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{deadline.subject}</div>
                      <div className="text-xs text-muted-foreground">{deadline.task}</div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-bold ${
                          deadline.daysLeft <= 3
                            ? "text-red-600"
                            : deadline.daysLeft <= 7
                              ? "text-orange-600"
                              : "text-green-600"
                        }`}
                      >
                        {deadline.daysLeft}d
                      </div>
                      <Badge
                        variant={
                          deadline.priority === "high"
                            ? "destructive"
                            : deadline.priority === "medium"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {deadline.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Streak */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Study Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">14</div>
                <div className="text-sm text-muted-foreground mb-4">Days in a row</div>
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < 6 ? "bg-green-500" : "bg-green-200"}`} />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Keep it up! You're on fire 🔥</div>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Schedule extra Physics review</div>
                    <div className="text-muted-foreground">Exam in 5 days, current mastery: 68%</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Move Chemistry to morning</div>
                    <div className="text-muted-foreground">You perform 23% better in AM sessions</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Add 30min break after Calculus</div>
                    <div className="text-muted-foreground">Prevent cognitive overload</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add Study Session
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Sync LMS Calendar
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Brain className="h-4 w-4 mr-2" />
                Optimize Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
