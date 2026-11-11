"use client"

import React, { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Plus, Trash2, Edit2, Check, Trophy, Sparkles, Volume2, Coffee } from "lucide-react"

interface Task {
  id: string
  title: string
  points: number
  completed: boolean
  timer: number // em segundos
  isRunning: boolean
}

interface Reward {
  id: string
  title: string
  cost: number
}

const EVOLUTION_STAGES = [
  { level: 1, name: "Recruta", minPoints: 0, avatar: "🐣" },
  { level: 2, name: "Soldado", minPoints: 50, avatar: "🛡️" },
  { level: 3, name: "Guerreiro", minPoints: 150, avatar: "⚔️" },
  { level: 4, name: "Mestre", minPoints: 300, avatar: "👑" },
  { level: 5, name: "Lenda", minPoints: 600, avatar: "🔥" },
]

export default function QuartelApp() {
  const [points, setPoints] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  
  // Modais e edição
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState("")
  
  const [newRewardTitle, setNewRewardTitle] = useState("")
  const [newRewardCost, setNewRewardCost] = useState(50)

  // Timer de descanso
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)

  // Wake Lock API
  const wakeLockRef = useRef<any>(null)

  // Ativar Wake Lock quando houver algum timer rodando
  useEffect(() => {
    const hasRunningTask = tasks.some(t => t.isRunning) || isResting

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && !wakeLockRef.current) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen")
        }
      } catch (err) {
        console.error("Wake Lock error:", err)
      }
    }

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    }

    if (hasRunningTask) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }

    return () => {
      releaseWakeLock()
    }
  }, [tasks, isResting])

  // Efeito dos Timers de Tarefas
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.isRunning && task.timer > 0) {
            return { ...task, timer: task.timer - 1 }
          } else if (task.isRunning && task.timer === 0) {
            playAlarm()
            alert(`Tempo esgotado para a tarefa: ${task.title}`)
            return { ...task, isRunning: false }
          }
          return task
        })
      )

      if (isResting && restTimer > 0) {
        setRestTimer(prev => prev - 1)
      } else if (isResting && restTimer === 0) {
        setIsResting(false)
        playAlarm()
        alert("O tempo de descanso acabou! Hora da próxima missão.")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isResting, restTimer])

  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 1.5)
    } catch (e) {
      console.log("Audio not supported or blocked")
    }
  }

  // Ações de Tarefa
  const addTask = () => {
    if (!newTaskTitle.trim()) return
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      points: 10,
      completed: false,
      timer: 20 * 60, // 20 minutos
      isRunning: false
    }
    setTasks([...tasks, newTask])
    setNewTaskTitle("")
  }

  const toggleTimer = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, isRunning: !t.isRunning } : t))
  }

  const resetTimer = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, timer: 20 * 60, isRunning: false } : t))
  }

  const completeTask = (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    setPoints(prev => prev + task.points)
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: true, isRunning: false } : t))
    
    // Inicia descanso de 15 minutos
    setRestTimer(15 * 60)
    setIsResting(true)
  }

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTaskTitle(task.title)
  }

  const saveEditTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, title: editingTaskTitle } : t))
    setEditingTaskId(null)
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  // Ações de Recompensa
  const addReward = () => {
    if (!newRewardTitle.trim()) return
    const reward: Reward = {
      id: Date.now().toString(),
      title: newRewardTitle,
      cost: Number(newRewardCost) || 10
    }
    setRewards([...rewards, reward])
    setNewRewardTitle("")
    setNewRewardCost(50)
  }

  const redeemReward = (reward: Reward) => {
    if (points < reward.cost) {
      alert("Pontos insuficientes para esta recompensa!")
      return
    }
    setPoints(prev => prev - reward.cost)
    alert(`Recompensa "${reward.title}" resgatada!`)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const currentStage = [...EVOLUTION_STAGES].reverse().find(s => points >= s.minPoints) || EVOLUTION_STAGES[0]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Painel do Personagem / Gamificação */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-3 py-1 rounded-full text-sm">
            <Trophy className="w-4 h-4" /> {points} pts
          </div>
          <div className="text-6xl my-3 animate-bounce">{currentStage.avatar}</div>
          <h2 className="text-xl font-bold text-slate-100">{currentStage.name}</h2>
          <p className="text-xs text-slate-400 mt-1">Evolução do Quartel</p>
        </div>

        {/* Banner do Timer de Descanso */}
        {isResting && (
          <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-400 font-semibold mb-1">
              <Coffee className="w-5 h-5" /> Intervalo de Descanso
            </div>
            <div className="text-3xl font-mono font-bold text-indigo-200">{formatTime(restTimer)}</div>
          </div>
        )}

        {/* Seção de Missões / Microtarefas */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Missões
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nova microtarefa..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={addTask}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {editingTaskId === task.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingTaskTitle}
                        onChange={e => setEditingTaskTitle(e.target.value)}
                        className="bg-slate-800 text-sm rounded px-2 py-1 flex-1 text-slate-100"
                      />
                      <button onClick={() => saveEditTask(task.id)} className="text-emerald-400">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-sm flex-1 ${task.completed ? "line-through text-slate-500" : ""}`}>
                      {task.title}
                    </span>
                  )}

                  {!task.completed && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEditTask(task)} className="text-slate-400 hover:text-slate-200 p-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="text-rose-400 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {!task.completed && (
                  <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg">
                    <span className="font-mono text-sm text-slate-300">{formatTime(task.timer)}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleTimer(task.id)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >
                        {task.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => resetTimer(task.id)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => completeTask(task.id)}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Seção da Vitrine de Recompensas */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Vitrine de Recompensas
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Recompensa..."
              value={newRewardTitle}
              onChange={e => setNewRewardTitle(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
            <input
              type="number"
              placeholder="Pts"
              value={newRewardCost}
              onChange={e => setNewRewardCost(Number(e.target.value))}
              className="w-20 bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-sm text-slate-100 text-center focus:outline-none"
            />
            <button
              onClick={addReward}
              className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-xl"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {rewards.map(reward => (
              <div key={reward.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{reward.title}</div>
                  <div className="text-xs text-amber-400 font-bold">{reward.cost} pontos</div>
                </div>
                <button
                  onClick={() => redeemReward(reward)}
                  className="bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 px-3 py-1 rounded-lg text-xs font-bold"
                >
                  Resgatar
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
