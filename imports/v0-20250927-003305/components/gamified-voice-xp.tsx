"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Zap, Target, Award, Gift } from "lucide-react"

interface XPData {
  totalXP: number
  level: number
  currentLevelXP: number
  nextLevelXP: number
  streak: number
  achievements: Achievement[]
  dailyGoal: number
  dailyProgress: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  xpReward: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

export function GamifiedVoiceXP() {
  const [xpData, setXpData] = useState<XPData>({
    totalXP: 0,
    level: 1,
    currentLevelXP: 0,
    nextLevelXP: 100,
    streak: 0,
    achievements: [],
    dailyGoal: 10,
    dailyProgress: 0,
  })

  const [showLevelUp, setShowLevelUp] = useState(false)
  const [recentXP, setRecentXP] = useState<Array<{ amount: number; reason: string; timestamp: number }>>([])

  useEffect(() => {
    loadXPData()
    initializeAchievements()

    // Listen for voice command events
    window.addEventListener("voiceCommandExecuted", handleVoiceCommand as EventListener)

    return () => {
      window.removeEventListener("voiceCommandExecuted", handleVoiceCommand as EventListener)
    }
  }, [])

  const loadXPData = () => {
    const stored = localStorage.getItem("voiceXPData")
    if (stored) {
      setXpData(JSON.parse(stored))
    }
  }

  const saveXPData = (data: XPData) => {
    localStorage.setItem("voiceXPData", JSON.stringify(data))
    setXpData(data)
  }

  const initializeAchievements = () => {
    const achievements: Achievement[] = [
      {
        id: "first_command",
        name: "First Steps",
        description: "Execute your first voice command",
        icon: "🎤",
        unlocked: false,
        xpReward: 50,
        rarity: "common",
      },
      {
        id: "streak_7",
        name: "Week Warrior",
        description: "Use voice commands for 7 days in a row",
        icon: "🔥",
        unlocked: false,
        xpReward: 200,
        rarity: "rare",
      },
      {
        id: "multilingual",
        name: "Polyglot",
        description: "Use voice commands in 3 different languages",
        icon: "🌍",
        unlocked: false,
        xpReward: 300,
        rarity: "epic",
      },
      {
        id: "speed_demon",
        name: "Speed Demon",
        description: "Execute 10 commands in under 2 minutes",
        icon: "⚡",
        unlocked: false,
        xpReward: 150,
        rarity: "rare",
      },
      {
        id: "voice_master",
        name: "Voice Master",
        description: "Reach level 10",
        icon: "👑",
        unlocked: false,
        xpReward: 1000,
        rarity: "legendary",
      },
    ]

    setXpData((prev) => ({ ...prev, achievements }))
  }

  const handleVoiceCommand = useCallback(
    (event: CustomEvent) => {
      const { command, success, type } = event.detail

      if (success) {
        let xpGain = 10 // Base XP
        let reason = "Voice command executed"

        // Bonus XP based on command type
        switch (type) {
          case "dataVisualization":
            xpGain = 25
            reason = "Data visualization created"
            break
          case "translation":
            xpGain = 20
            reason = "Text translated"
            break
          case "visionAnalysis":
            xpGain = 30
            reason = "Image analyzed"
            break
          case "reportGeneration":
            xpGain = 35
            reason = "Report generated"
            break
          case "complexCommand":
            xpGain = 40
            reason = "Complex command executed"
            break
        }

        // Streak bonus
        const streakBonus = Math.min(xpData.streak * 2, 20)
        xpGain += streakBonus

        addXP(xpGain, reason)
        updateStreak()
        checkAchievements(command, type)
      }
    },
    [xpData],
  )

  const addXP = (amount: number, reason: string) => {
    setXpData((prev) => {
      const newTotalXP = prev.totalXP + amount
      const newCurrentLevelXP = prev.currentLevelXP + amount

      let newLevel = prev.level
      let levelXP = newCurrentLevelXP
      let nextLevelXP = prev.nextLevelXP

      // Check for level up
      if (newCurrentLevelXP >= prev.nextLevelXP) {
        newLevel += 1
        levelXP = newCurrentLevelXP - prev.nextLevelXP
        nextLevelXP = calculateNextLevelXP(newLevel)

        setShowLevelUp(true)
        setTimeout(() => setShowLevelUp(false), 3000)

        // Speak level up notification
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(
            `Congratulations! You've reached level ${newLevel}! Keep up the great work with your voice commands.`,
          )
          utterance.rate = 0.9
          utterance.pitch = 1.2
          window.speechSynthesis.speak(utterance)
        }
      }

      const newData = {
        ...prev,
        totalXP: newTotalXP,
        level: newLevel,
        currentLevelXP: levelXP,
        nextLevelXP,
        dailyProgress: prev.dailyProgress + 1,
      }

      saveXPData(newData)
      return newData
    })

    // Add to recent XP
    setRecentXP((prev) => [{ amount, reason, timestamp: Date.now() }, ...prev.slice(0, 4)])
  }

  const calculateNextLevelXP = (level: number) => {
    return Math.floor(100 * Math.pow(1.5, level - 1))
  }

  const updateStreak = () => {
    const today = new Date().toDateString()
    const lastActive = localStorage.getItem("lastVoiceActivity")

    if (lastActive !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      if (lastActive === yesterday.toDateString()) {
        setXpData((prev) => ({ ...prev, streak: prev.streak + 1 }))
      } else {
        setXpData((prev) => ({ ...prev, streak: 1 }))
      }

      localStorage.setItem("lastVoiceActivity", today)
    }
  }

  const checkAchievements = (command: string, type: string) => {
    setXpData((prev) => {
      const updatedAchievements = prev.achievements.map((achievement) => {
        if (achievement.unlocked) return achievement

        let shouldUnlock = false

        switch (achievement.id) {
          case "first_command":
            shouldUnlock = true
            break
          case "streak_7":
            shouldUnlock = prev.streak >= 7
            break
          case "voice_master":
            shouldUnlock = prev.level >= 10
            break
        }

        if (shouldUnlock) {
          // Speak achievement notification
          if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(
              `Achievement unlocked: ${achievement.name}! You earned ${achievement.xpReward} bonus XP.`,
            )
            utterance.rate = 0.9
            utterance.pitch = 1.1
            window.speechSynthesis.speak(utterance)
          }

          return { ...achievement, unlocked: true }
        }

        return achievement
      })

      return { ...prev, achievements: updatedAchievements }
    })
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500"
      case "rare":
        return "bg-blue-500"
      case "epic":
        return "bg-purple-500"
      case "legendary":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Level Up Animation */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <Card className="p-8 text-center animate-scale-up">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-2">Level Up!</h2>
            <p className="text-xl text-muted-foreground">You've reached level {xpData.level}!</p>
          </Card>
        </div>
      )}

      {/* XP Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Voice Command Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">Level {xpData.level}</div>
              <div className="text-sm text-muted-foreground">{xpData.totalXP} total XP</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {xpData.currentLevelXP} / {xpData.nextLevelXP} XP
              </div>
              <div className="text-sm text-muted-foreground">to next level</div>
            </div>
          </div>

          <Progress value={(xpData.currentLevelXP / xpData.nextLevelXP) * 100} className="h-3" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-500">{xpData.streak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{xpData.dailyProgress}</div>
              <div className="text-sm text-muted-foreground">Today's Commands</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {xpData.achievements.filter((a) => a.unlocked).length}
              </div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent XP Gains */}
      {recentXP.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Recent XP Gains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentXP.map((xp, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">{xp.reason}</span>
                  <Badge variant="secondary">+{xp.amount} XP</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {xpData.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border ${
                  achievement.unlocked ? "bg-muted/50 border-primary/20" : "bg-muted/20 border-muted opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{achievement.name}</h4>
                      <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity)} text-white`}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <div className="text-xs text-primary">+{achievement.xpReward} XP</div>
                  </div>
                  {achievement.unlocked && (
                    <div className="text-green-500">
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Daily Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Voice commands today</span>
              <span>
                {xpData.dailyProgress} / {xpData.dailyGoal}
              </span>
            </div>
            <Progress value={(xpData.dailyProgress / xpData.dailyGoal) * 100} className="h-2" />
            {xpData.dailyProgress >= xpData.dailyGoal && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Gift className="h-4 w-4" />
                Daily goal completed! Bonus XP earned.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
