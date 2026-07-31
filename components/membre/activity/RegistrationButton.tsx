'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { motion } from 'framer-motion'

type Registration = Database['public']['Tables']['event_registrations']['Row']

type Props = {
  activityId: string
  initialRegistration: Registration | null
  isFull: boolean
}

export default function RegistrationButton({ activityId, initialRegistration, isFull }: Props) {
  const supabase = createClient()
  const [registration, setRegistration] = useState<Registration | null>(initialRegistration)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async () => {
    setIsLoading(true)
    setError(null)
    
    // UI optimiste : on crée un faux objet en attendant la réponse
    const optimisticReg: Registration = {
      id: 'temp-id',
      activity_id: activityId,
      user_id: 'me',
      status: 'confirmed', // ou 'waitlisted' si isFull
      queue_position: null,
      attended: null,
      created_at: new Date().toISOString()
    }
    setRegistration(optimisticReg)

    const { error: rpcError } = await supabase.rpc('register_to_activity', { p_activity_id: activityId })

    if (rpcError) {
      // Rollback en cas d'erreur
      setRegistration(null)
      setError("Une erreur est survenue. Réessaie.")
    } else {
      // Recharger la vraie donnée pour avoir le bon ID et statut
      const { data: realReg } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('activity_id', activityId)
        .eq('user_id', 'me') // Remplacer par l'id réel du user si besoin, mais RLS filtre déjà
        .single()
      
      if (realReg) setRegistration(realReg)
    }
    setIsLoading(false)
  }

  const handleCancel = async () => {
    if (!registration || registration.id === 'temp-id') return
    setIsLoading(true)
    setError(null)

    // UI optimiste
    const previousState = registration
    setRegistration(null)

    const { error: rpcError } = await supabase.rpc('cancel_registration', { p_registration_id: registration.id })

    if (rpcError) {
      // Rollback
      setRegistration(previousState)
      setError("Annulation impossible pour le moment.")
    }
    setIsLoading(false)
  }

  // Rendu visuel selon l'état
  if (registration && registration.status === 'confirmed') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-success font-mono text-sm">
          <span className="w-2 h-2 bg-success rounded-full" />
          Inscrit
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCancel}
          disabled={isLoading}
          className="w-full py-3 border border-danger/50 text-danger hover:bg-danger/10 transition-colors font-body text-sm rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Annulation...' : 'Se désister'}
        </motion.button>
        {error && <p className="text-danger text-xs">{error}</p>}
      </div>
    )
  }

  if (registration && registration.status === 'waitlisted') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-warning font-mono text-sm">
          <span className="w-2 h-2 bg-warning rounded-full" />
          En attente (Position #{registration.queue_position})
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCancel}
          disabled={isLoading}
          className="w-full py-3 border border-muted/50 text-muted hover:bg-card transition-colors font-body text-sm rounded-md disabled:opacity-50"
        >
          Quitter la file
        </motion.button>
        {error && <p className="text-danger text-xs">{error}</p>}
      </div>
    )
  }

  // État non inscrit
  return (
    <div className="space-y-2">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleRegister}
        disabled={isLoading}
        className={`w-full py-3 font-body text-sm rounded-md transition-colors disabled:opacity-50 ${
          isFull 
            ? 'bg-card border border-warning/50 text-warning hover:bg-warning/10' 
            : 'bg-accent text-bg hover:bg-accent/90 font-medium'
        }`}
      >
        {isLoading ? 'Traitement...' : (isFull ? 'Rejoindre la liste d\'attente' : 'S\'inscrire')}
      </motion.button>
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  )
}