'use client'

import { CreationErrorRecovery } from '@/components/CreationErrorRecovery'

export default function CharacterCreationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <CreationErrorRecovery error={error} reset={reset} />
}
