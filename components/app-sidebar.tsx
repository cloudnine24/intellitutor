import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Home,
  MessageSquare,
  Calendar,
  BarChart3,
  Brain,
  FileText,
  Upload,
  BookOpen,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "AI Tutor", url: "/tutor", icon: MessageSquare },
  { title: "Smart Calendar", url: "/calendar", icon: Calendar },
  { title: "Insights", url: "/insights", icon: BarChart3 },
  { title: "Flashcards", url: "/flashcards", icon: Brain },
  { title: "Tests & Quizzes", url: "/quizzes", icon: FileText },
  { title: "Notes & Materials", url: "/notes", icon: BookOpen },
  { title: "Upload", url: "/upload", icon: Upload },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold">StudyAI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-sm text-muted-foreground">Your Academic Command Center</div>
      </SidebarFooter>
    </Sidebar>
  )
}
