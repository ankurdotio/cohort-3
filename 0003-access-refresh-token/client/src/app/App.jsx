import routes from "./app.routes"
import { RouterProvider } from "react-router"
import { AuthProvider } from "../modules/auth/context/AuthContext"
import './App.css'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={routes} />
    </AuthProvider>
  )
}

export default App
