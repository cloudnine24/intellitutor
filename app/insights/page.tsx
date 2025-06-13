import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Target, Clock, Brain, AlertTriangle, Trophy, Calendar } from "lucide-react"

export default function Insights() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Insights Analytics</h1>
        <p className="text-muted-foreground">Performance intelligence hub with predictive analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Effectiveness</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">87%</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted GPA</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">3.7</div>
            <p className="text-xs text-muted-foreground">Based on current performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">14</div>
            <p className="text-xs text-muted-foreground">Days consecutive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">4.2h</div>
            <p className="text-xs text-muted-foreground">Daily average</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Study Effectiveness Heatmap</CardTitle>
          <CardDescription>Visual representation of your learning patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="text-center text-sm font-medium p-2">
                {day}
              </div>
            ))}
            {Array.from({ length: 28 }, (_, i) => (
              <div
                key={i}
                className={`aspect-square rounded ${
                  Math.random() > 0.7
                    ? "bg-green-500"
                    : Math.random() > 0.4
                      ? "bg-green-300"
                      : Math.random() > 0.2
                        ? "bg-green-100"
                        : "bg-gray-100"
                }`}
                title={`Day ${i + 1}: ${Math.round(Math.random() * 100)}% effectiveness`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Less effective</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <div className="w-3 h-3 bg-green-300 rounded"></div>
              <div className="w-3 h-3 bg-green-500 rounded"></div>
            </div>
            <span>More effective</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weakest Topics Alert */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Attention Required
            </CardTitle>
            <CardDescription>Topics that need immediate focus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Organic Chemistry - Reactions</span>
                <Badge variant="destructive">Critical</Badge>
              </div>
              <Progress value={45} className="h-2" />
              <p className="text-xs text-muted-foreground">45% mastery • Last studied 3 days ago</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calculus - Integration by Parts</span>
                <Badge variant="secondary">Needs Work</Badge>
              </div>
              <Progress value={62} className="h-2" />
              <p className="text-xs text-muted-foreground">62% mastery • Last studied yesterday</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Physics - Thermodynamics</span>
                <Badge variant="outline">Review</Badge>
              </div>
              <Progress value={78} className="h-2" />
              <p className="text-xs text-muted-foreground">78% mastery • Last studied 2 days ago</p>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Your learning milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium">Flashcard Master</div>
                <div className="text-sm text-muted-foreground">Completed 100 flashcards this week</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium">Quiz Champion</div>
                <div className="text-sm text-muted-foreground">Scored 90%+ on 5 consecutive quizzes</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium">Consistency King</div>
                <div className="text-sm text-muted-foreground">14-day study streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance Comparison</CardTitle>
          <CardDescription>How you're performing across different subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { subject: "Mathematics", score: 92, trend: "up", color: "bg-blue-500" },
              { subject: "Physics", score: 87, trend: "up", color: "bg-green-500" },
              { subject: "Chemistry", score: 74, trend: "down", color: "bg-yellow-500" },
              { subject: "Biology", score: 89, trend: "up", color: "bg-purple-500" },
              { subject: "Computer Science", score: 95, trend: "up", color: "bg-indigo-500" },
            ].map((item) => (
              <div key={item.subject} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium">{item.subject}</div>
                <div className="flex-1">
                  <Progress value={item.score} className="h-3" />
                </div>
                <div className="flex items-center gap-2 w-16">
                  <span className="text-sm font-medium">{item.score}%</span>
                  {item.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
