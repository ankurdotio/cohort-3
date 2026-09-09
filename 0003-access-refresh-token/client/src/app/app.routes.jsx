import { createBrowserRouter } from "react-router"
import Profile from "../modules/auth/pages/Profile"
import Register from "../modules/auth/pages/Register"


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