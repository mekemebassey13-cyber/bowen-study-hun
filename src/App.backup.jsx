
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

    if (data.session) {
      setUser(data.user)
      setPage('dashboard')
      setFullName('')
      setDepartment('')
      setEmail('')
      setPassword('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setAuthMessage(
        'Account created! Check your email for a confirmation link, then log in to continue.'
      )
      setPage('login')
      setPassword('')
    }
  } else {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

    if (error) throw error

    setUser(data.user)
    setPage('dashboard')
    setPassword('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
} catch (error) {
  setAuthError(
    error?.message || 'Something went wrong. Please try again.'
  )
} finally {
  setIsSubmitting(false)
}
} // Closes handleAuthSubmit

async function logout() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    setAuthError(error.message)
    return
  }

  setUser(null)
  setSearch('')
  setAuthError('')
  setAuthMessage('')
  setPage('about')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const Logo = () => (
  <a
    className="logo"
    href="#"
    onClick={(event) => {
      event.preventDefault()
      setPage('about')
    }}
  >
    <span className="logo-icon">
      <img src="/bulogo.jpg" alt="Bowen University logo" />
    </span>
    Bowen Study Hub
  </a>
)

if (authLoading) {
  return (
    <div className="auth-page" role="status" aria-live="polite">
      <p>Loading Bowen Study Hub...</p>
    </div>
  )
}

// ABOUT PAGE
if (page === 'about' || (page === 'dashboard' && !user)) {
  return (
    <div className="app">
      <header className="navbar">
        <Logo />

        <nav>
          <a href="#about">About</a>
          <a href="#about-features">Features</a>

          <button className="login-btn" onClick={openLogin}>
            Log in
          </button>

          <button className="primary-btn" onClick={openSignup}>
            Get started
          </button>
        </nav>
      </header>

      <main>
        <section className="hero" id="about">
          <span className="eyebrow">
            BUILT FOR BOWEN UNIVERSITY 100LVL STUDENTS
          </span>

          <h1>
            Your studies.
            <br />
            <span>Made simpler.</span>
          </h1>

          <p>
            Bowen Study Hub is a student learning platform designed to
            bring course materials, lecture PDFs, study resources, and
            AI-powered practice quizzes together in one place.
          </p>

          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="What would you like to study?"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') openSignup()
              }}
            />

            <button onClick={openSignup}>Get started</button>
          </div>

          <div className="hero-note">
            <span>✓</span> One hub for a better study experience
          </div>
        </section>

        <section className="features" id="about-features">
          <div className="section-heading">
            <div>
              <span className="eyebrow">WHAT WE OFFER</span>
              <h2>A better way to study</h2>
            </div>

            <p>Everything organised around your learning.</p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon pdf">PDF</div>

              {/* Restore your original PDF feature content here. */}
            </article>

            {/* Restore your other original feature cards here. */}
          </div>
        </section>
      </main>
    </div>
  )
}

// Keep the rest of your existing page-rendering code below.
// Do not close function App() until all its return statements are finished.
