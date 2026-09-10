import { createBrowserRouter } from "react-router"
import Register from "../modules/auth/pages/Register"
import Profile from "../modules/auth/pages/Profile"


const router = createBrowserRouter([
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/profile",
        element: <Profile />
    }
])

export default router