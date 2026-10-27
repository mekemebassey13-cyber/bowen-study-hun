
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import CourseMaterial from './CourseMaterial'
import Assignments from './Assignments'
import AIQuizGenerator from './AIQuizGenerator'
import './App.css'

function App() {
  const [page, setPage] = useState('about')
  const [dashboardSection, setDashboardSection] = useState('home')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [fullName, setFullName] = useState('')
  const [department, setDepartment] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [isAdmin, setIsAdmin] = useState(false)
  const [adminStudents, setAdminStudents] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')

  useEffect(() => {
    let active = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!active) return

      if (error) setAuthError(error.message)

      const currentUser = data?.session?.user ?? null
      setUser(currentUser)
      setPage(currentUser ? 'dashboard' : 'about')
      setDashboardSection('home')
      setAuthLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return

      const currentUser = session?.user ?? null
      setUser(currentUser)
      setPage(currentUser ? 'dashboard' : 'about')
      setDashboardSection('home')
      setAuthLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false)
        setAdminStudents([])
        return
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!active) return

      if (error) {
        console.error('Admin check failed:', error.message)
        setIsAdmin(false)
        return
      }

      setIsAdmin(Boolean(data))
    }

    checkAdmin()

    return () => {
      active = false
    }
  }, [user])

  async function loadAdminStudents() {
    setAdminLoading(true)
    setAdminError('')

    const { data, error } = await supabase.rpc('get_admin_students')

    if (error) {
      setAdminError(error.message)
      setAdminStudents([])
    } else {
      setAdminStudents(data || [])
    }

    setAdminLoading(false)
  }

  function openPage(nextPage) {
    setAuthError('')
    setAuthMessage('')
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openDashboardSection(section) {
    if (!user) {
      openPage('login')
      return
    }

    if (section === 'admin' && !isAdmin) {
      setAuthError('You do not have permission to access the admin dashboard.')
      return
    }

    setAuthError('')
    setAuthMessage('')
    setDashboardSection(section)
    setPage('dashboard')
    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (section === 'admin') {
      loadAdminStudents()
    }
  }

  async function handleAuth(event) {
    event.preventDefault()
    setAuthError('')
    setAuthMessage('')
    setIsSubmitting(true)

    try {
      if (page === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              department,
            },
          },
        })

        if (error) throw error

        setPassword('')

        if (data.session && data.user) {
          setUser(data.user)
          setPage('dashboard')
          setDashboardSection('home')
          setFullName('')
          setDepartment('')
          setEmail('')
        } else {
          setAuthMessage(
            'Account created! Check your email for a confirmation link, then log in.'
          )
          setPage('login')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) throw error

        setUser(data.user)
        setPage('dashboard')
        setDashboardSection('home')
        setPassword('')
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setAuthError(error?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function logout() {
    setAuthError('')

    const { error } = await supabase.auth.signOut()

    if (error) {
      setAuthError(error.message)
      return
    }

    setUser(null)
    setIsAdmin(false)
    setAdminStudents([])
    setPage('about')
    setDashboardSection('home')
    setEmail('')
    setPassword('')
    setAuthMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function Logo() {
    return (
      <button
        className="logo"
        type="button"
        onClick={() => {
          if (user) {
            openDashboardSection('home')
          } else {
            openPage('about')
          }
        }}
        aria-label="Bowen Study Hub home"
      >
        <span className="logo-icon">
          <img src="/bulogo.jpg" alt="" />
        </span>
        <span>Bowen Study Hub</span>
      </button>
    )
  }

  function FeatureCard({
    icon,
    iconClass,
    title,
    description,
    buttonText,
    onClick,
  }) {
    return (
      <article className="feature-card">
        <div className={`feature-icon ${iconClass}`}>{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
        <button className="text-link" type="button" onClick={onClick}>
          {buttonText} ↗
        </button>
      </article>
    )
  }

  if (authLoading) {
    return (
      <div className="auth-page" role="status">
        <p>Loading Bowen Study Hub...</p>
      </div>
    )
  }

  if (page === 'about' || (page === 'dashboard' && !user)) {
    return (
      <div className="app">
        <header className="navbar">
          <Logo />
          <nav>
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <button
              type="button"
              className="login-btn"
              onClick={() => openPage('login')}
            >
              Log in
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => openPage('signup')}
            >
              Get started
            </button>
          </nav>
        </header>

        <main>
          <section className="hero" id="about">
            <span className="eyebrow">
              BUILT FOR BOWEN UNIVERSITY COCS STUDENTS
            </span>
            <h1>
              Your studies.
              <br />
              <span>Made simpler.</span>
            </h1>
            <p>
              Find course materials, lecture PDFs, assignments and learning
              tools in one place.
            </p>

            <div className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                placeholder="What would you like to study?"
                aria-label="What would you like to study?"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') openPage('signup')
                }}
              />
              <button type="button" onClick={() => openPage('signup')}>
                Get started
              </button>
            </div>
          </section>

          <section className="features" id="features">
            <div className="section-heading">
              <div>
                <span className="eyebrow">WHAT WE OFFER</span>
                <h2>A better way to study</h2>
              </div>
              <p>Everything organised around your learning.</p>
            </div>

            <div className="feature-grid">
              <FeatureCard
                icon="PDF"
                iconClass="pdf"
                title="Course Materials"
                description="Find lecture notes and course PDFs for your semester."
                buttonText="Explore materials"
                onClick={() => openPage('signup')}
              />
              <FeatureCard
                icon="✳"
                iconClass="quiz"
                title="AI Quiz Generator"
                description="Practise with revision questions from your course materials."
                buttonText="Get started"
                onClick={() => openPage('signup')}
              />
              <FeatureCard
                icon="▤"
                iconClass="library"
                title="Assignments"
                description="Find course assignments and available PDF resources."
                buttonText="Explore assignments"
                onClick={() => openPage('signup')}
              />
            </div>
          </section>

          <section className="materials">
            <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <h2>Make every study session count.</h2>
            <p>Join Bowen Study Hub and organise your learning.</p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => openPage('signup')}
            >
              Create your account →
            </button>
          </section>
        </main>

        <footer>
          <Logo />
          <p>Made for students, built for better learning.</p>
        </footer>
      </div>
    )
  }

  if (page === 'signup' || page === 'login') {
    const isSignup = page === 'signup'

    return (
      <div className="auth-page">
        <Logo />

        <form className="auth-card" onSubmit={handleAuth}>
          <span className="eyebrow">BOWEN STUDY HUB</span>
          <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p>
            {isSignup
              ? 'Join Bowen Study Hub and organise your learning.'
              : 'Continue your learning journey.'}
          </p>

          {isSignup && (
            <>
              <label htmlFor="full-name">Full name</label>
              <input
                id="full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />

              <label htmlFor="department">Department (COCS)</label>
              <select
                id="department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                required
              >
                <option value="">Select your department</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </>
          )}

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {authError && (
            <p className="auth-error" role="alert">{authError}</p>
          )}
          {authMessage && (
            <p className="auth-message" role="status">{authMessage}</p>
          )}

          <button
            className="primary-btn"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Please wait...'
              : isSignup
                ? 'Create account'
                : 'Log in'}
          </button>

          <p className="auth-switch">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setAuthError('')
                setAuthMessage('')
                setPassword('')
                setPage(isSignup ? 'login' : 'signup')
              }}
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </p>

          <p className="auth-switch">
            <button type="button" onClick={() => openPage('about')}>
              ← Back to About
            </button>
          </p>
        </form>
      </div>
    )
  }

  if (page === 'dashboard' && user) {
    return (
      <div className="app">
        <header className="navbar">
          <Logo />
          <nav>
            <button
              type="button"
              className="login-btn"
              onClick={() => openDashboardSection('home')}
            >
              Dashboard
            </button>
            <button type="button" className="login-btn" onClick={logout}>
              Log out
            </button>
          </nav>
        </header>

        <nav className="dashboard-sections" aria-label="Study sections">
          <button
            type="button"
            className={dashboardSection === 'home' ? 'active' : ''}
            onClick={() => openDashboardSection('home')}
          >
            Overview
          </button>
          <button
            type="button"
            className={dashboardSection === 'materials' ? 'active' : ''}
            onClick={() => openDashboardSection('materials')}
          >
            Course Materials
          </button>
          <button
            type="button"
            className={dashboardSection === 'assignments' ? 'active' : ''}
            onClick={() => openDashboardSection('assignments')}
          >
            Assignments
          </button>
          <button
            type="button"
            className={dashboardSection === 'quiz' ? 'active' : ''}
            onClick={() => openDashboardSection('quiz')}
          >
            AI Quiz Generator
          </button>

          {isAdmin && (
            <button
              type="button"
              className={dashboardSection === 'admin' ? 'active' : ''}
              onClick={() => openDashboardSection('admin')}
            >
              Admin Dashboard
            </button>
          )}
        </nav>

        {dashboardSection === 'materials' ? (
          <main><CourseMaterial user={user} /></main>
        ) : dashboardSection === 'assignments' ? (
          <main><Assignments user={user} /></main>
        ) : dashboardSection === 'quiz' ? (
          <main><AIQuizGenerator /></main>
        ) : dashboardSection === 'admin' && isAdmin ? (
          <main className="features">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ADMINISTRATION</span>
                <h2>Registered students</h2>
              </div>
              <button
                type="button"
                className="primary-btn"
                onClick={loadAdminStudents}
                disabled={adminLoading}
              >
                {adminLoading ? 'Loading...' : 'Refresh list'}
              </button>
            </div>

            {adminError && (
              <p className="auth-error" role="alert">{adminError}</p>
            )}

            {adminLoading ? (
              <p>Loading student records...</p>
            ) : adminStudents.length === 0 ? (
              <p>No student profiles were returned.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Full name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminStudents.map((student) => (
                      <tr key={student.id}>
                        <td>{student.full_name || 'Not provided'}</td>
                        <td>{student.email || 'Not provided'}</td>
                        <td>{student.department || 'Not provided'}</td>
                        <td>
                          {student.created_at
                            ? new Date(student.created_at).toLocaleDateString()
                            : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        ) : (
          <main>
            <section className="hero dashboard-home">
              <span className="eyebrow">YOUR CAMPUS. YOUR KNOWLEDGE.</span>
              <h1>
                Study smarter.
                <br />
                <span>Achieve more.</span>
              </h1>
              <p>
                Welcome to your study space. Find course PDFs and organise
                your learning in one place.
              </p>

              {user?.email && (
                <p className="hero-note">Signed in as {user.email}</p>
              )}

              <div className="dashboard-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => openDashboardSection('materials')}
                >
                  Open Course Materials →
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => openDashboardSection('assignments')}
                >
                  View Assignments →
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => openDashboardSection('quiz')}
                >
                  Generate an AI Quiz →
                </button>
              </div>
            </section>

            <section className="features">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR LEARNING TOOLKIT</span>
                  <h2>Everything you need to study</h2>
                </div>
              </div>

              <div className="feature-grid">
                <FeatureCard
                  icon="PDF"
                  iconClass="pdf"
                  title="Course Materials"
                  description="Browse course notes and open lecture PDFs."
                  buttonText="Explore materials"
                  onClick={() => openDashboardSection('materials')}
                />
                <FeatureCard
                  icon="✳"
                  iconClass="quiz"
                  title="AI Quiz Generator"
                  description="Generate multiple-choice practice questions from your course PDFs."
                  buttonText="Create a quiz"
                  onClick={() => openDashboardSection('quiz')}
                />
                <FeatureCard
                  icon="▤"
                  iconClass="library"
                  title="Assignments"
                  description="Open assignments and available PDF resources."
                  buttonText="View assignments"
                  onClick={() => openDashboardSection('assignments')}
                />
              </div>
            </section>
          </main>
        )}

        <footer>
          <Logo />
          <p>Made for students, built for better learning.</p>
        </footer>
      </div>
    )
  }

  return null
}

export default App
