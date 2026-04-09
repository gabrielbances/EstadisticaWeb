import { Link } from 'react-router-dom'

export function Brand() {
  return (
    <Link className="flex flex-col" to="/">
      <span className="font-headline text-2xl font-extrabold tracking-[-0.06em] text-[#002c98]">
        EstadisticaWeb
      </span>
      <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6c6d78]">
        Academic Atelier
      </span>
    </Link>
  )
}
