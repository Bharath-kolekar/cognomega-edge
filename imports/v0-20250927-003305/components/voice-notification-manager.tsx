"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Clock, Calendar, Trash2, Plus, Volume2, VolumeX } from "lucide-react"

interface VoiceNotification {
  id: string
  title: string
  message: string
  type: "reminder" | "update" | "achievement" | "system" | "custom"
  scheduledTime?: Date
  recurring?: "none" | "daily" | "weekly" | "monthly"
  voiceEnabled: boolean
  priority: "low" | "medium" | "high"
  completed: boolean
  createdAt: Date
}

interface NotificationSettings {
  globalVoiceEnabled: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  voiceStyle: string
  autoSpeak: boolean
  maxNotificationsPerHour: number
}

export function VoiceNotificationManager() {
  const [notifications, setNotifications] = useState<VoiceNotification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    globalVoiceEnabled: true,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
    },
    voiceStyle: "friendly",
    autoSpeak: true,
    maxNotificationsPerHour: 5,
  })
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "reminder" as const,
    scheduledTime: "",
    recurring: "none" as const,
    priority: "medium" as const,
  })
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    loadNotifications()
    loadSettings()
    setupNotificationScheduler()
  }, [])

  const loadNotifications = () => {
    const stored = localStorage.getItem("voiceNotifications")
    if (stored) {
      const parsed = JSON.parse(stored)
      setNotifications(
        parsed.map((n: any) => ({
          ...n,
          scheduledTime: n.scheduledTime ? new Date(n.scheduledTime) : undefined,
          createdAt: new Date(n.createdAt),
        })),
      )
    }
  }

  const loadSettings = () => {
    const stored = localStorage.getItem("voiceNotificationSettings")
    if (stored) {
      setSettings(JSON.parse(stored))
    }
  }

  const saveNotifications = (notifications: VoiceNotification[]) => {
    localStorage.setItem("voiceNotifications", JSON.stringify(notifications))
    setNotifications(notifications)
  }

  const saveSettings = (settings: NotificationSettings) => {
    localStorage.setItem("voiceNotificationSettings", JSON.stringify(settings))
    setSettings(settings)
  }

  const setupNotificationScheduler = () => {
    // Check for due notifications every minute
    const interval = setInterval(() => {
      checkDueNotifications()
    }, 60000)

    return () => clearInterval(interval)
  }

  const checkDueNotifications = () => {
    const now = new Date()
    const dueNotifications = notifications.filter(
      (n) => n.scheduledTime && n.scheduledTime <= now && !n.completed && n.voiceEnabled,
    )

    dueNotifications.forEach((notification) => {
      if (shouldPlayNotification(notification)) {
        playVoiceNotification(notification)

        // Mark as completed if not recurring
        if (notification.recurring === "none") {
          markNotificationCompleted(notification.id)
        } else {
          scheduleNextRecurrence(notification)
        }
      }
    })
  }

  const shouldPlayNotification = (notification: VoiceNotification): boolean => {
    if (!settings.globalVoiceEnabled) return false

    // Check quiet hours
    if (settings.quietHours.enabled) {
      const now = new Date()
      const currentTime =
        now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0")

      if (currentTime >= settings.quietHours.start || currentTime <= settings.quietHours.end) {
        return notification.priority === "high"
      }
    }

    return true
  }

  const playVoiceNotification = (notification: VoiceNotification) => {
    if (!window.speechSynthesis) return

    const utterance = new SpeechSynthesisUtterance()

    // Customize message based on type
    let spokenMessage = ""
    switch (notification.type) {
      case "reminder":
        spokenMessage = `Reminder: ${notification.title}. ${notification.message}`
        break
      case "achievement":
        spokenMessage = `Congratulations! ${notification.title}. ${notification.message}`
        break
      case "update":
        spokenMessage = `Update: ${notification.title}. ${notification.message}`
        break
      case "system":
        spokenMessage = `System notification: ${notification.title}. ${notification.message}`
        break
      default:
        spokenMessage = `${notification.title}. ${notification.message}`
    }

    utterance.text = spokenMessage

    // Adjust voice based on priority and style
    switch (notification.priority) {
      case "high":
        utterance.rate = 0.9
        utterance.pitch = 1.1
        utterance.volume = 1.0
        break
      case "medium":
        utterance.rate = 1.0
        utterance.pitch = 1.0
        utterance.volume = 0.8
        break
      case "low":
        utterance.rate = 1.1
        utterance.pitch = 0.9
        utterance.volume = 0.6
        break
    }

    // Apply voice style
    switch (settings.voiceStyle) {
      case "professional":
        utterance.pitch = Math.max(utterance.pitch * 0.9, 0.5)
        break
      case "friendly":
        utterance.pitch = Math.min(utterance.pitch * 1.1, 2.0)
        break
      case "urgent":
        utterance.rate = Math.min(utterance.rate * 1.2, 2.0)
        utterance.pitch = Math.min(utterance.pitch * 1.2, 2.0)
        break
    }

    window.speechSynthesis.speak(utterance)

    // Show visual notification as well
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
      })
    }
  }

  const scheduleNextRecurrence = (notification: VoiceNotification) => {
    if (!notification.scheduledTime) return

    const nextTime = new Date(notification.scheduledTime)

    switch (notification.recurring) {
      case "daily":
        nextTime.setDate(nextTime.getDate() + 1)
        break
      case "weekly":
        nextTime.setDate(nextTime.getDate() + 7)
        break
      case "monthly":
        nextTime.setMonth(nextTime.getMonth() + 1)
        break
    }

    const updatedNotifications = notifications.map((n) =>
      n.id === notification.id ? { ...n, scheduledTime: nextTime, completed: false } : n,
    )

    saveNotifications(updatedNotifications)
  }

  const addNotification = () => {
    if (!newNotification.title.trim()) return

    const notification: VoiceNotification = {
      id: Date.now().toString(),
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type,
      scheduledTime: newNotification.scheduledTime ? new Date(newNotification.scheduledTime) : undefined,
      recurring: newNotification.recurring,
      voiceEnabled: true,
      priority: newNotification.priority,
      completed: false,
      createdAt: new Date(),
    }

    saveNotifications([...notifications, notification])

    setNewNotification({
      title: "",
      message: "",
      type: "reminder",
      scheduledTime: "",
      recurring: "none",
      priority: "medium",
    })
    setShowAddForm(false)
  }

  const deleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id)
    saveNotifications(updated)
  }

  const toggleNotificationVoice = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, voiceEnabled: !n.voiceEnabled } : n))
    saveNotifications(updated)
  }

  const markNotificationCompleted = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, completed: true } : n))
    saveNotifications(updated)
  }

  const testNotification = (notification: VoiceNotification) => {
    playVoiceNotification(notification)
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission()
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return "⏰"
      case "achievement":
        return "🏆"
      case "update":
        return "📢"
      case "system":
        return "⚙️"
      default:
        return "📝"
    }
  }

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Voice Notifications</label>
              <p className="text-sm text-muted-foreground">Enable spoken notifications</p>
            </div>
            <Switch
              checked={settings.globalVoiceEnabled}
              onCheckedChange={(checked) => saveSettings({ ...settings, globalVoiceEnabled: checked })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice Style</label>
              <Select
                value={settings.voiceStyle}
                onValueChange={(value) => saveSettings({ ...settings, voiceStyle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max per Hour</label>
              <Input
                type="number"
                value={settings.maxNotificationsPerHour}
                onChange={(e) =>
                  saveSettings({
                    ...settings,
                    maxNotificationsPerHour: Number.parseInt(e.target.value) || 5,
                  })
                }
                min="1"
                max="20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium">Quiet Hours</label>
              <Switch
                checked={settings.quietHours.enabled}
                onCheckedChange={(checked) =>
                  saveSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, enabled: checked },
                  })
                }
              />
            </div>
            {settings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Start</label>
                  <Input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) =>
                      saveSettings({
                        ...settings,
                        quietHours: { ...settings.quietHours, start: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">End</label>
                  <Input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) =>
                      saveSettings({
                        ...settings,
                        quietHours: { ...settings.quietHours, end: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <Button onClick={requestNotificationPermission} variant="outline" size="sm">
            Enable Browser Notifications
          </Button>
        </CardContent>
      </Card>

      {/* Add Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Notification
            </span>
            <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" size="sm">
              {showAddForm ? "Cancel" : "New"}
            </Button>
          </CardTitle>
        </CardHeader>
        {showAddForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="Notification title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={newNotification.type}
                  onValueChange={(value: any) => setNewNotification({ ...newNotification, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Input
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                placeholder="Notification message"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduled Time</label>
                <Input
                  type="datetime-local"
                  value={newNotification.scheduledTime}
                  onChange={(e) => setNewNotification({ ...newNotification, scheduledTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Recurring</label>
                <Select
                  value={newNotification.recurring}
                  onValueChange={(value: any) => setNewNotification({ ...newNotification, recurring: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={newNotification.priority}
                  onValueChange={(value: any) => setNewNotification({ ...newNotification, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={addNotification} className="w-full">
              Add Notification
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Active Notifications ({notifications.filter((n) => !n.completed).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications
              .filter((n) => !n.completed)
              .map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getTypeIcon(notification.type)}</span>
                      <h4 className="font-medium">{notification.title}</h4>
                      <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                      {notification.recurring !== "none" && <Badge variant="secondary">{notification.recurring}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    {notification.scheduledTime && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {notification.scheduledTime.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => toggleNotificationVoice(notification.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      {notification.voiceEnabled ? (
                        <Volume2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      onClick={() => testNotification(notification)}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                    >
                      Test
                    </Button>
                    <Button
                      onClick={() => deleteNotification(notification.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

            {notifications.filter((n) => !n.completed).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active notifications</p>
                <p className="text-sm">Add a notification to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
