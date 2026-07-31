'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { motion, AnimatePresence } from 'framer-motion'

type Task = Database['public']['Tables']['project_tasks']['Row']

type Props = {
  projectId: string
  initialTasks: Task[]
  isMember: boolean
}

const COLUMNS = [
  { id: 'todo', label: 'À faire' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'done', label: 'Terminé' },
] as const

export default function KanbanBoard({ projectId, initialTasks, isMember }: Props) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Realtime: écouter les changements de tâches
  useEffect(() => {
    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_tasks', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t))
          } else if (payload.eventType === 'INSERT') {
            setTasks(prev => prev.some(t => t.id === payload.new.id) ? prev : [...prev, payload.new as Task])
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId, supabase])

  const handleDrop = async (taskId: string, newStatus: string) => {
    setDraggingId(null)
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistic UI
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t))

    // Persistance
    const { error } = await supabase
      .from('project_tasks')
      .update({ status: newStatus as Task['status'] })
      .eq('id', taskId)

    if (error) {
      // Rollback
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t))
      console.error('Erreur de déplacement', error)
    }
  }

  return (
    <div className="flex flex-col md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none pb-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter(t => t.status === col.id)
        
        return (
          <div 
            key={col.id} 
            className="bg-card/50 border border-card rounded-md p-3 min-w-[80vw] md:min-w-0 snap-center md:snap-none flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const taskId = e.dataTransfer.getData('taskId')
              if (taskId) handleDrop(taskId, col.id)
            }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-muted/10">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted">{col.label}</h3>
              <span className="text-xs font-mono text-muted bg-bg px-2 py-0.5 rounded-sm">{colTasks.length}</span>
            </div>

            <div className="space-y-2 flex-1 min-h-[100px]">
              <AnimatePresence>
                {colTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    draggable={isMember}
                    onDragStart={(e: unknown) => {
                      const event = e as React.DragEvent<HTMLDivElement>
                      event.dataTransfer.setData('taskId', task.id)
                      setDraggingId(task.id)
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={`bg-bg border border-card p-3 rounded-sm cursor-grab active:cursor-grabbing hover:border-accent/30 transition-colors ${
                      draggingId === task.id ? 'opacity-50' : ''
                    }`}
                  >
                    <p className="text-sm text-text font-body">{task.title}</p>
                    {task.assignee_id && (
                      <div className="mt-2 flex justify-end">
                        <span className="text-xs text-muted font-mono">Assigné</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {colTasks.length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-muted/50 italic py-4">
                  Glisse une tâche ici
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}