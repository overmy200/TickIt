"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Trash2, Check, Plus, Calendar, AlertCircle, Search, Moon, Sun, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: number
  dueDate: number
  category: "work" | "personal" | "exercise" | "other"
}

interface Goal {
  id: string
  name: string
  target: number
  current: number
}

const categoryColors = {
  work: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300", label: "Work" },
  personal: { bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-700 dark:text-purple-300", label: "Personal" },
  exercise: { bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300", label: "Exercise" },
  other: { bg: "bg-gray-100 dark:bg-gray-900", text: "text-gray-700 dark:text-gray-300", label: "Other" },
}

const playSound = (type: "add" | "complete" | "delete") => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  switch (type) {
    case "add":
      oscillator.frequency.value = 800
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
      break
    case "complete":
      oscillator.frequency.value = 1000
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.15)
      break
    case "delete":
      oscillator.frequency.value = 400
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
      break
  }
}

const getRelativeTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = timestamp - now
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (Math.abs(days) > 365) {
    const years = Math.floor(Math.abs(days) / 365)
    return days > 0 ? `in ${years} year${years > 1 ? "s" : ""}` : `${years} year${years > 1 ? "s" : ""} ago`
  }

  if (Math.abs(days) >= 1) {
    if (days === 0 && diff < 0) return "overdue"
    if (days === 1) return "Tomorrow"
    if (days === -1) return "Yesterday"
    if (days > 0) return `in ${days} days`
    return `${Math.abs(days)} days ago`
  }

  if (hours > 0) return `in ${hours} hour${hours > 1 ? "s" : ""}`
  if (hours < 0) return `${Math.abs(hours)} hour${Math.abs(hours) > 1 ? "s" : ""} ago`

  return "today"
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<"work" | "personal" | "exercise" | "other">("work")
  const [overdueWarning, setOverdueWarning] = useState<string | null>(null)
  const [showCategoryMenu, setShowCategoryMenu] = useState<string | null>(null)
  const [showDueDateMenu, setShowDueDateMenu] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalInput, setGoalInput] = useState("")

  useEffect(() => {
    const savedTodos = localStorage.getItem("todos")
    const savedGoals = localStorage.getItem("goals")
    const savedDarkMode = localStorage.getItem("darkMode")

    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos))
      } catch (error) {
        console.error("Failed to parse todos:", error)
      }
    }
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals))
      } catch (error) {
        console.error("Failed to parse goals:", error)
      }
    }
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("todos", JSON.stringify(todos))
    }
  }, [todos, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("goals", JSON.stringify(goals))
    }
  }, [goals, isLoaded])

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode))
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const now = Date.now()
    const tomorrow = now + 86400000

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: input.trim(),
      completed: false,
      createdAt: now,
      dueDate: tomorrow,
      category: selectedCategory,
    }

    setTodos([newTodo, ...todos])
    setInput("")
    playSound("add")
  }

  const toggleTodo = (id: string) => {
    playSound("complete")
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: string) => {
    playSound("delete")
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const updateDueDate = (id: string, days: number) => {
    const newDueDate = Date.now() + days * 86400000
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, dueDate: newDueDate } : todo)))
    setShowDueDateMenu(null)
  }

  const updateCategory = (id: string, category: Todo["category"]) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, category } : todo)))
    setShowCategoryMenu(null)
  }

  const filteredTodos = todos.filter((todo) => todo.text.toLowerCase().includes(searchQuery.toLowerCase()))

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    overdue: todos.filter((t) => !t.completed && t.dueDate < Date.now()).length,
    today: todos.filter((t) => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return t.dueDate >= now.getTime() && t.dueDate < tomorrow.getTime()
    }).length,
  }

  const addGoal = () => {
    if (!goalInput.trim()) return
    const newGoal: Goal = {
      id: Date.now().toString(),
      name: goalInput.trim(),
      target: 10,
      current: 0,
    }
    setGoals([...goals, newGoal])
    setGoalInput("")
    setShowGoalModal(false)
  }

  const updateGoal = (id: string, current: number) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, current: Math.min(current, g.target) } : g)))
  }

  const deleteGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id))
  }

  const completedCount = todos.filter((todo) => todo.completed).length
  const overdueTodo = overdueWarning ? todos.find((t) => t.id === overdueWarning) : null

  return (
    <main
      className={`min-h-screen transition-colors ${
        isDarkMode ? "bg-gradient-to-br from-slate-900 to-slate-800" : "bg-gradient-to-br from-slate-50 to-slate-100"
      } py-8 px-4`}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>My Tasks</h1>
            <p className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
              {completedCount} of {todos.length} completed
            </p>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg transition-all ${
              isDarkMode
                ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {[
            { label: "Total", value: stats.total, color: "blue" },
            { label: "Completed", value: stats.completed, color: "green" },
            { label: "Overdue", value: stats.overdue, color: "red" },
            { label: "Today", value: stats.today, color: "purple" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`p-4 rounded-lg ${
                isDarkMode ? "bg-slate-800" : "bg-white"
              } shadow transition-transform hover:scale-105`}
            >
              <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 text-${stat.color}-600`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence>
              {overdueTodo && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? "bg-red-900/30 border-red-800" : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className={`${isDarkMode ? "text-red-400" : "text-red-600"} flex-shrink-0 mt-0.5`}
                      size={20}
                    />
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-2 ${isDarkMode ? "text-red-300" : "text-red-900"}`}>
                        Task Overdue!
                      </h3>
                      <p className={`text-sm mb-3 ${isDarkMode ? "text-red-400" : "text-red-800"}`}>
                        "{overdueTodo.text}" is overdue
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => updateDueDate(overdueTodo.id, 1)}
                          className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        >
                          Tomorrow
                        </button>
                        <button
                          onClick={() => updateDueDate(overdueTodo.id, 3)}
                          className="text-xs px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                        >
                          3 Days
                        </button>
                        <button
                          onClick={() => updateDueDate(overdueTodo.id, 7)}
                          className="text-xs px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                        >
                          1 Week
                        </button>
                        <button
                          onClick={() => setOverdueWarning(null)}
                          className="text-xs px-3 py-1 bg-slate-400 hover:bg-slate-500 text-white rounded transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Card className={`shadow-lg ${isDarkMode ? "bg-slate-800 border-slate-700" : ""}`}>
              <div className="p-6 space-y-6">
                <form onSubmit={addTodo} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Add a new task..."
                      className={`flex-1 px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-700 text-white placeholder-slate-500"
                          : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Plus size={20} />
                      Add
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {(Object.keys(categoryColors) as Array<keyof typeof categoryColors>).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          selectedCategory === cat
                            ? `${categoryColors[cat].bg} ${categoryColors[cat].text} ring-2 ring-offset-0`
                            : isDarkMode
                              ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        {categoryColors[cat].label}
                      </button>
                    ))}
                  </div>
                </form>

                <div className="relative">
                  <Search
                    size={20}
                    className={`absolute left-3 top-2.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-700 text-white placeholder-slate-500"
                        : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                {/* Todo List */}
                {filteredTodos.length === 0 ? (
                  <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className={isDarkMode ? "text-slate-500" : "text-slate-400"}>
                      {searchQuery ? "No tasks match your search" : "No tasks yet. Add one to get started!"}
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filteredTodos.map((todo) => (
                        <motion.div
                          key={todo.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                          className={`flex items-start gap-3 p-4 rounded-lg transition-colors group cursor-move ${
                            isDarkMode ? "bg-slate-900 hover:bg-slate-700" : "bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          <motion.button
                            onClick={() => toggleTodo(todo.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-1 ${
                              todo.completed
                                ? "bg-green-500 border-green-500"
                                : isDarkMode
                                  ? "border-slate-600 hover:border-green-500"
                                  : "border-slate-300 hover:border-green-500"
                            }`}
                          >
                            {todo.completed && <Check size={16} className="text-white" />}
                          </motion.button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`flex-1 transition-all ${
                                  todo.completed
                                    ? isDarkMode
                                      ? "line-through text-slate-500"
                                      : "line-through text-slate-400"
                                    : isDarkMode
                                      ? "text-white"
                                      : "text-slate-900"
                                }`}
                              >
                                {todo.text}
                              </span>

                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${categoryColors[todo.category].bg} ${categoryColors[todo.category].text}`}
                              >
                                {categoryColors[todo.category].label}
                              </span>
                            </div>

                            <div
                              className={`flex items-center gap-2 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                            >
                              <Calendar size={12} />
                              <span>{getRelativeTime(todo.dueDate)}</span>
                              {!todo.completed && todo.dueDate < Date.now() && (
                                <span
                                  className={`ml-auto font-semibold ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                                >
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="relative">
                              <button
                                onClick={() => setShowDueDateMenu(showDueDateMenu === todo.id ? null : todo.id)}
                                className={`p-1.5 rounded transition-colors ${
                                  isDarkMode
                                    ? "text-slate-400 hover:text-blue-400 hover:bg-blue-900/20"
                                    : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"
                                }`}
                                aria-label="Change due date"
                              >
                                <Calendar size={16} />
                              </button>
                              <AnimatePresence>
                                {showDueDateMenu === todo.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-10 border ${
                                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                                    }`}
                                  >
                                    {[
                                      { label: "Tomorrow", days: 1 },
                                      { label: "3 Days", days: 3 },
                                      { label: "1 Week", days: 7 },
                                      { label: "2 Weeks", days: 14 },
                                    ].map(({ label, days }) => (
                                      <button
                                        key={days}
                                        onClick={() => updateDueDate(todo.id, days)}
                                        className={`block w-full text-left px-3 py-2 text-sm first:rounded-t-lg last:rounded-b-lg transition-colors ${
                                          isDarkMode
                                            ? "hover:bg-slate-700 text-slate-300"
                                            : "hover:bg-slate-100 text-slate-700"
                                        }`}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="relative">
                              <button
                                onClick={() => setShowCategoryMenu(showCategoryMenu === todo.id ? null : todo.id)}
                                className={`p-1.5 rounded transition-colors ${
                                  isDarkMode
                                    ? "text-slate-400 hover:text-purple-400 hover:bg-purple-900/20"
                                    : "text-slate-400 hover:text-purple-500 hover:bg-purple-50"
                                }`}
                                aria-label="Change category"
                              >
                                <span className="text-xs font-bold">#</span>
                              </button>
                              <AnimatePresence>
                                {showCategoryMenu === todo.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-10 border ${
                                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                                    }`}
                                  >
                                    {(Object.keys(categoryColors) as Array<keyof typeof categoryColors>).map((cat) => (
                                      <button
                                        key={cat}
                                        onClick={() => updateCategory(todo.id, cat)}
                                        className={`block w-full text-left px-3 py-2 text-sm first:rounded-t-lg last:rounded-b-lg transition-colors ${
                                          todo.category === cat
                                            ? `${categoryColors[cat].bg} ${categoryColors[cat].text}`
                                            : isDarkMode
                                              ? "hover:bg-slate-700 text-slate-300"
                                              : "hover:bg-slate-100 text-slate-700"
                                        }`}
                                      >
                                        {categoryColors[cat].label}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <motion.button
                              onClick={() => deleteTodo(todo.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className={`p-1.5 rounded transition-colors ${
                                isDarkMode
                                  ? "text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                                  : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                              }`}
                              aria-label="Delete task"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className={`shadow-lg ${isDarkMode ? "bg-slate-800 border-slate-700" : ""}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target size={24} className="text-purple-600" />
                    <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Goals</h2>
                  </div>
                  <button
                    onClick={() => setShowGoalModal(!showGoalModal)}
                    className="text-xl hover:scale-110 transition-transform"
                  >
                    +
                  </button>
                </div>

                <AnimatePresence>
                  {showGoalModal && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 space-y-2"
                    >
                      <input
                        type="text"
                        value={goalInput}
                        onChange={(e) => setGoalInput(e.target.value)}
                        placeholder="New goal..."
                        className={`w-full px-3 py-2 rounded text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          isDarkMode
                            ? "bg-slate-950 border-slate-700 text-white placeholder-slate-500"
                            : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                        }`}
                      />
                      <button
                        onClick={addGoal}
                        className="w-full px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                      >
                        Add Goal
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  {goals.length === 0 ? (
                    <p className={`text-sm text-center py-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      No goals yet
                    </p>
                  ) : (
                    goals.map((goal) => {
                      const progress = (goal.current / goal.target) * 100
                      return (
                        <motion.div key={goal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                              {goal.name}
                            </h3>
                            <button
                              onClick={() => deleteGoal(goal.id)}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                isDarkMode
                                  ? "bg-slate-700 text-slate-400 hover:text-red-400"
                                  : "bg-slate-200 text-slate-600 hover:text-red-600"
                              }`}
                            >
                              ✕
                            </button>
                          </div>
                          <div
                            className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}
                          >
                            <motion.div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                              {goal.current}/{goal.target}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => updateGoal(goal.id, goal.current - 1)}
                                disabled={goal.current === 0}
                                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                  isDarkMode
                                    ? "bg-slate-700 text-slate-400 hover:bg-slate-600 disabled:opacity-50"
                                    : "bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:opacity-50"
                                }`}
                              >
                                −
                              </button>
                              <button
                                onClick={() => updateGoal(goal.id, goal.current + 1)}
                                disabled={goal.current === goal.target}
                                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                  isDarkMode
                                    ? "bg-slate-700 text-slate-400 hover:bg-slate-600 disabled:opacity-50"
                                    : "bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:opacity-50"
                                }`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
