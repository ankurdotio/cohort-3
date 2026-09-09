import { createContext, useCallback, useContext, useEffect, useState } from "react"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [ user, setUser ] = useState(null)
    const [ accessToken, setAccessToken ] = useState(null)
    const [ loading, setLoading ] = useState(true)

    const value = {
        user,
        accessToken,
        loading,
        isAuthenticated: !!user,
        setUser,
        setAccessToken,
        setLoading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }

    return context
}

export default AuthContext
