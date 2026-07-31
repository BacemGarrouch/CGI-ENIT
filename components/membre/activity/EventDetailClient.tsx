'use client'
import { Database } from '@/lib/supabase/database.types'
import RegistrationButton from './RegistrationButton'

type Activity = Database['public']['Tables']['activities']['Row']
type Registration = Database['public']['Tables']['event_registrations']['Row']

type Props = {
  activity: Activity
  initialRegistration: Registration | null
  initialRegisteredCount: number
}

export default function EventDetailClient({ activity, initialRegistration, initialRegisteredCount }: Props) {
  const isFull = activity.capacity ? initialRegisteredCount >= activity.capacity : false

  return (
    <RegistrationButton
      activityId={activity.id}
      initialRegistration={initialRegistration}
      isFull={isFull}
    />
  )
}