// EditOnly — render gate for prep mode. In play mode, renders the optional
// fallback (default: nothing). Boring on purpose: no animations, no
// transitions, no className passthrough — see #033.
import type { ReactNode } from 'react'
import { useIsPlayMode } from '../../lib/mode'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

function EditOnly({ children, fallback = null }: Props) {
  const isPlay = useIsPlayMode()
  if (isPlay) return <>{fallback}</>
  return <>{children}</>
}

export default EditOnly
