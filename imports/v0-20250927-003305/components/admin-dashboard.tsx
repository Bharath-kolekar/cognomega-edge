"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  MessageSquare,
  History,
  Mic,
  Settings,
  LogOut,
  Users,
  Download,
  Shield,
  Brain,
  TestTube,
  Code,
  Cpu,
  Zap,
} from "lucide-react"
import { adminAuth } from "@/lib/admin-auth"
import { AdminFeedbackHistory } from "@/components/admin-feedback-history"
import { AdminVoiceHistory } from "@/components/admin-voice-history"
import { VoiceTestingSuite } from "@/components/voice-testing-suite"
import { VoiceExportSystem } from "@/components/voice-export-system"
import { VoiceResearchProcessor } from "@/components/voice-research-processor"
import { VoiceCodeGenerator } from "@/components/voice-code-generator"
import { ContinuousListeningMode } from "@/components/continuous-listening-mode"
import { AICodeInterpreter } from "@/components/ai-code-interpreter"
import { SelfCodingSystem } from "@/components/self-coding-system"

interface AdminDashboardProps {
  onLogout: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const user = adminAuth.getCurrentUser()

  if (!user) {
    return null
  }

  const handleLogout = () => {
    adminAuth.logout()
    onLogout()
  }

  const stats = [
    {
      title: "Total Voice Commands",
      value: "1,247",
      change: "+12%",
      icon: Mic,
      color: "text-blue-600",
    },
    {
      title: "Feedback Entries",
      value: "89",
      change: "+5%",
      icon: MessageSquare,
      color: "text-green-600",
    },
    {
      title: "Active Sessions",
      value: "23",
      change: "+8%",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "System Uptime",
      value: "99.9%",
      change: "stable",
      icon: Shield,
      color: "text-orange-600",
    },
  ]

  const quickActions = [
    {
      title: "View Feedback History",
      description: "Access all user feedback and responses",
      icon: MessageSquare,
      action: () => setActiveTab("feedback"),
      permission: "view_feedback",
    },
    {
      title: "Voice Command History",
      description: "Review voice command logs and analytics",
      icon: History,
      action: () => setActiveTab("history"),
      permission: "view_history",
    },
    {
      title: "Voice Settings",
      description: "Configure voice recognition parameters",
      icon: Settings,
      action: () => setActiveTab("voice-settings"),
      permission: "manage_voice",
    },
    {
      title: "Export Data",
      description: "Download system data and reports",
      icon: Download,
      action: () => setActiveTab("export"),
      permission: "export_data",
    },
    {
      title: "AI Capabilities",
      description: "Manage voice-enabled AI features",
      icon: Brain,
      action: () => setActiveTab("ai-features"),
      permission: "manage_voice",
    },
    {
      title: "Testing Suite",
      description: "Voice testing and code analysis tools",
      icon: TestTube,
      action: () => setActiveTab("testing"),
      permission: "system_config",
    },
    {
      title: "AI Code Platform",
      description: "Advanced AI coding and interpretation tools",
      icon: Cpu,
      action: () => setActiveTab("ai-coding"),
      permission: "system_config",
    },
    {
      title: "Self-Coding System",
      description: "Autonomous AI system management",
      icon: Zap,
      action: () => setActiveTab("self-coding"),
      permission: "system_config",
    },
  ]

  const filteredActions = quickActions.filter((action) => adminAuth.hasPermission(action.permission))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold">Cognomega Admin</h1>
            </div>
            <Badge variant="outline" className="text-xs">
              {user.role === "super_admin" ? "Super Admin" : "Admin"}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium">{user.username}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="voice-settings">Voice</TabsTrigger>
            <TabsTrigger value="ai-features">AI Features</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="ai-coding">AI Coding</TabsTrigger>
            <TabsTrigger value="self-coding">Self-Coding</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
                      </div>
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2 bg-transparent"
                      onClick={action.action}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <action.icon className="w-5 h-5" />
                        <span className="font-medium">{action.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-left">{action.description}</p>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">Voice Recognition Engine</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">AI Processing System</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">Feedback Collection</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">AI Code Interpreter</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm">Self-Coding System</span>
                    </div>
                    <Badge variant="outline" className="text-blue-600">
                      Learning
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-sm">Export Services</span>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">
                      Maintenance
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <AdminFeedbackHistory />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <AdminVoiceHistory />
          </TabsContent>

          {/* Voice Settings Tab */}
          <TabsContent value="voice-settings">
            <Card>
              <CardHeader>
                <CardTitle>Voice Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Voice settings and configuration options</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Features Tab */}
          <TabsContent value="ai-features">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Voice Code Generation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Voice Code Generation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VoiceCodeGenerator />
                  </CardContent>
                </Card>

                {/* Voice Research */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Voice Research Processor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VoiceResearchProcessor />
                  </CardContent>
                </Card>
              </div>

              {/* Voice Export System */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Voice Export System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VoiceExportSystem />
                </CardContent>
              </Card>

              {/* Continuous Listening */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Continuous Listening Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ContinuousListeningMode />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing">
            <VoiceTestingSuite />
          </TabsContent>

          <TabsContent value="ai-coding">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  AI Code Interpreter Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AICodeInterpreter />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="self-coding">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Autonomous Self-Coding System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SelfCodingSystem />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
