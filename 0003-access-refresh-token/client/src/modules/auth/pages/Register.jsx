import React, { useState } from 'react'
import useApi from "../../shared/useApi"
import { useAuthContext } from "../context/AuthProvider"
import { useNavigate } from "react-router"


const Register = () => {

    const api = useApi()
    const authContext = useAuthContext()

    const navigate = useNavigate()


    const [ name, setName ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")

    async function handleSubmit(event) {
        event.preventDefault()

        /**
         * http://localhost:5173/api/auth/register
         */
        const response = await api.post('/auth/register', {
            name,
            email,
            password
        })

        console.log(response.data)

        authContext.setAccessToken(response.data.accessToken)
        authContext.setUser(response.data.data.user)

        navigate("/profile")
    }


    return (
        <main>

            <form
                className='flex-col gap-4'
                onSubmit={handleSubmit}>
                <input type="text"
                    className='border p-2 rounded-sm'
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder='Name'
                />
                <input type="email"
                    className='border p-2 rounded-sm'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder='Email'
                />
                <input type="password"
                    className='border p-2 rounded-sm'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder='Password'
                />
                <button type="submit" className='border p-2 bg-blue-200 rounded-sm'>Register</button>
            </form>

        </main>
    )
}

export default Register