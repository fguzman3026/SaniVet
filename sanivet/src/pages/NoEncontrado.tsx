import { Link } from 'react-router-dom'
import Pantalla from '@/pages/Pantalla'

export default function NoEncontrado() {
  return (
    <Pantalla titulo="No encontramos esa página">
      <Link to="/" className="font-semibold text-primary underline">
        Volver al inicio
      </Link>
    </Pantalla>
  )
}
