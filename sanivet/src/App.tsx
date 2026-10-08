import { BrowserRouter, Route, Routes } from 'react-router-dom'
import EditarMascota from '@/pages/EditarMascota'
import FichaMascota from '@/pages/FichaMascota'
import Inicio from '@/pages/Inicio'
import NoEncontrado from '@/pages/NoEncontrado'
import NuevaMascota from '@/pages/NuevaMascota'
import { HoyProvider } from '@/state/HoyProvider'
import { PetsProvider } from '@/state/PetsProvider'

export default function App() {
  return (
    <HoyProvider>
      <PetsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/mascotas/nueva" element={<NuevaMascota />} />
            <Route path="/mascotas/:id" element={<FichaMascota />} />
            <Route path="/mascotas/:id/editar" element={<EditarMascota />} />
            <Route path="*" element={<NoEncontrado />} />
          </Routes>
        </BrowserRouter>
      </PetsProvider>
    </HoyProvider>
  )
}
