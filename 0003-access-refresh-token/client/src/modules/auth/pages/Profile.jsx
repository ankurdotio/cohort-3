import { useAuth } from '../context/AuthContext'

const Profile = () => {
  const { user, loading, isAuthenticated, logout } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Not logged in</div>
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

export default Profile