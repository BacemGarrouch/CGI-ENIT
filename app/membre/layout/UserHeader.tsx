'use client'
import { motion } from 'framer-motion'
import { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  poles: { name: string } | null
}

export default function UserHeader({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-accent/15 bg-bg/80 px-4 backdrop-blur-md lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted/20 bg-card">
           <span className="font-display font-bold text-accent">
            {profile.first_name?.[0] || 'X'}{profile.last_name?.[0] || 'X'}
           </span>
        </div>
        <div>
          <p className="text-sm font-medium text-text leading-none">
            {profile.first_name} {profile.last_name}
          </p>
          <p className="text-xs text-muted leading-none mt-1">
            {profile.poles?.name || 'Membre'} {profile.role === 'pole_lead' && '· Pole Lead'}
          </p>
        </div>
      </div>

      <div className="panel-surface flex items-center gap-2 rounded-md px-3 py-1.5">
        <span className="text-xs text-muted font-mono uppercase tracking-wider hidden sm:block">Points</span>
        <motion.span 
          className="font-mono text-lg font-bold text-accent"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {profile.points_total || 0}
        </motion.span>
      </div>
    </header>
  )
}