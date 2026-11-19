import React, { useEffect, useState } from "react";
import { supabase }from "./supabaseClient";
import StudyResources from "./StudyResources";
import CourseMaterial from "./CourseMaterial";
import AIQuizGenerator from "./AIQuizGenerator";

const departments = [
  "COCS",
  "SOFTWARE ENGINEERING",
  "COMPUTER SCIENCE",
  "CYBERSECURITY",
  "INFORMATION TECHNOLOGY",
];

function App() {
  const [page, setPage] = useState("loading");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState(departments[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // Check login session without blocking the website indefinitely
useEffect(() => {
  let mounted = true;

  // Allow public pages to load even if Supabase is slow
  const timeoutId = setTimeout(() => {
    if (mounted) {
      setAuthLoading(false);
    }
  }, 8000);

  const getInitialSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Session error:", error.message);
      } else {
        const currentUser = data?.session?.user ?? null;

        setUser(currentUser);
        setPage(currentUser ? "dashboard" : "about");
      }
    } catch (error) {
      console.error("Unable to check login session:", error);
    } finally {
      if (mounted) {
        setAuthLoading(false);
      }

      clearTimeout(timeoutId);
    }
  };

  getInitialSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (mounted) {
      setUser(session?.user ?? null);
    }
  });

  return () => {
    mounted = false;
    clearTimeout(timeoutId);
    subscription.unsubscribe();
  };
}, []);

  // Navigation
  const openPage = (selectedPage) => {
    setAuthError("");
    setAuthMessage("");
    setPassword("");
    setPage(selectedPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sign up
  const handleSignup = async (event) => {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");

    if (!fullName.trim() || !email.trim() || !password) {
      setAuthError("Please complete all the fields.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Your password must contain at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          department,
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    if (data.session) {
      setUser(data.user);
      setPage("dashboard");
    } else {
      setAuthMessage(
        "Your account has been created. Please check your email to confirm your account before logging in."
      );
    }
  };

  // Log in
  const handleLogin = async (event) => {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");
    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    setUser(data.user);
    setPage("dashboard");
  };

  // Log out
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      return;
    }

    setUser(null);
    setPage("about");
    setEmail("");
    setPassword("");
  };

  // Loading screen
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Bowen Study Hub...</p>
      </div>
    );
  }

  // Reusable public pages
  const publicPages = {
    about: {
      title: "About Bowen Study Hub",
      content: (
        <>
          <p>
            Bowen Study Hub is an independent educational platform created
            to help students organise their academic resources, access
            learning materials and develop better study habits.
          </p>
    
          <h3>Our Story</h3>
          <p>
            Finding, organising and revising academic materials can be
            challenging for university students. Bowen Study Hub was
            created to make that process easier by bringing useful
            educational resources and study tools together in one place.
          </p>
    
          <h3>Our Mission</h3>
          <p>
            Our mission is to make academic learning resources easier to
            discover and access while supporting students in their
            educational journey.
          </p>
    
          <h3>Who We Serve</h3>
          <p>
            The platform is designed primarily for Bowen University
            students, particularly students in computing-related
            disciplines. Other learners interested in the available
            educational resources may also find the platform useful.
          </p>
    
          <h3>What We Offer</h3>
          <ul>
            <li>Organised course materials and educational PDFs.</li>
            <li>Academic resources covering introductory subjects.</li>
            <li>AI-assisted practice quizzes, when available.</li>
            <li>Study support tools designed to encourage active learning.</li>
            <li>A convenient place to discover and organise learning resources.</li>
          </ul>
    
          <h3>Our Approach to Learning</h3>
          <p>
            We believe effective learning involves more than simply
            reading notes. Students benefit from regular revision,
            practising questions, understanding difficult concepts
            and developing consistent study habits.
          </p>
    
          <h3>Our Commitment</h3>
          <p>
            We aim to provide an organised and accessible learning
            experience. We also encourage users to verify academic
            information with their lecturers and official course materials.
          </p>
    
          <h3>Independent Educational Project</h3>
          <p>
            Bowen Study Hub is an independent student project. It is
            not an official website of Bowen University and is not
            affiliated with, endorsed by or operated by the University.
          </p>
        </>
      ),
    },

    privacy: {
      title: "Privacy Policy",
      content: (
        <>
          <p>
            This Privacy Policy explains how Bowen Study Hub handles
            information when visitors use the website.
          </p>

          <h3>1. Information We Collect</h3>
          <p>
            When you create an account, we may collect information such as
            your name, email address and selected department.
          </p>

          <h3>2. How We Use Information</h3>
          <p>
            Account information is used to create and manage accounts,
            provide access to platform features and maintain website security.
          </p>

          <h3>3. Data Storage</h3>
          <p>
            The website uses Supabase services for authentication and
            associated platform data. Information is handled according to
            the applicable service policies and our actual website practices.
          </p>

          <h3>4. Cookies and Advertising</h3>
          <p>
            The website may use cookies or similar technologies for essential
            functionality, analytics or advertising where these services are
            enabled.
          </p>

          <p>
            If Google AdSense is enabled, Google and its partners may use
            cookies or similar technologies to provide and measure
            advertisements. Visitors should be able to review Google's
            advertising and privacy information.
          </p>

          <h3>5. Information Sharing</h3>
          <p>
            We do not intend to sell users' personal information. Information
            may be processed by service providers that help operate the
            website, subject to their applicable policies.
          </p>

          <h3>6. Data Security</h3>
          <p>
            We take reasonable steps to protect information. However, no
            online service can guarantee absolute security.
          </p>

          <h3>7. Contact</h3>
          <p>
            For questions about this policy or personal information, please
            use the Contact page.
          </p>

          <p>
            Last updated: November 2026.
          </p>
        </>
      ),
    },

    terms: {
      title: "Terms of Use",
      content: (
        <>
          <p>
            By accessing Bowen Study Hub, you agree to use the website
            responsibly and in accordance with these terms.
          </p>

          <h3>1. Acceptable Use</h3>
          <p>
            Users must not misuse the platform, attempt to disrupt its
            operation or access accounts and information without permission.
          </p>

          <h3>2. User Accounts</h3>
          <p>
            Users are responsible for keeping their login details secure and
            for activities carried out through their accounts.
          </p>

          <h3>3. Educational Materials</h3>
          <p>
            Materials must only be uploaded or shared when the uploader has
            the necessary rights or permission to distribute them.
          </p>

          <h3>4. Copyright</h3>
          <p>
            Users must respect copyright and intellectual property rights.
            Materials that are shared without permission may be removed.
          </p>

          <h3>5. Website Availability</h3>
          <p>
            We may update, modify or temporarily suspend parts of the website
            when necessary.
          </p>

          <h3>6. Disclaimer</h3>
          <p>
            Bowen Study Hub is an independent educational project. It is not
            an official Bowen University website.
          </p>

          <h3>7. Changes to These Terms</h3>
          <p>
            These terms may be updated when necessary. Continued use of the
            website after changes means you accept the updated terms.
          </p>
        </>
      ),
    },

    contact: {
      title: "Contact Us",
      content: (
        <>
          <p>
            Have a question, suggestion or issue with Bowen Study Hub?
            We welcome feedback that can help improve the platform.
          </p>

          <h3>What You Can Contact Us About</h3>
          <ul>
            <li>Problems accessing your account.</li>
            <li>Issues with course materials.</li>
            <li>Incorrect or outdated educational resources.</li>
            <li>Copyright or content removal requests.</li>
            <li>Suggestions for new features.</li>
          </ul>

          <p>
            Reach us @<a href="mailto:mekemebassey13@gmail.com">mekemebassey13@gmail.com</a>
          </p>
        </>
      ),
    },
  };

  const isPublicPage = Object.prototype.hasOwnProperty.call(
    publicPages,
    page
  );

  return (
    <div className="app">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #080d18;
          color: #f5f7fb;
        }

        button, input, select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .navbar {
          min-height: 76px;
          padding: 14px 7%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          background: #101827;
          border-bottom: 1px solid #263247;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 20px;
          font-weight: 800;
          color: white;
        }

        .brand img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          border-radius: 8px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .nav-links button {
          border: none;
          background: transparent;
          color: #cbd5e1;
          font-size: 14px;
          font-weight: 600;
        }

        .nav-links button:hover {
          color: #ff8b3d;
        }

        .primary-button {
          background: #f47732 !important;
          color: white !important;
          border: none;
          border-radius: 8px;
          padding: 12px 19px;
          font-weight: 700;
        }

        .secondary-button {
          background: #1d2a40;
          color: white;
          border: 1px solid #35445d;
          border-radius: 8px;
          padding: 11px 18px;
        }

        .hero {
          padding: 100px 7%;
          text-align: center;
          background:
            radial-gradient(circle at top, #1c2b45 0%, #080d18 65%);
        }

        .hero h1 {
          max-width: 850px;
          margin: 0 auto 20px;
          font-size: clamp(38px, 6vw, 64px);
          line-height: 1.1;
        }

        .hero h1 span {
          color: #ff873e;
        }

        .hero p {
          max-width: 650px;
          margin: 0 auto 30px;
          color: #b8c4d8;
          font-size: 17px;
          line-height: 1.8;
        }

        .hero-actions {
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .section {
          padding: 65px 7%;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 35px;
        }

        .section-heading h2 {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .section-heading p {
          color: #aab7ca;
          line-height: 1.7;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 20px;
          max-width: 1050px;
          margin: auto;
        }

        .feature-card {
          background: #111c2d;
          border: 1px solid #27364d;
          border-radius: 14px;
          padding: 27px;
        }

        .feature-card h3 {
          color: #ff873e;
          margin-top: 0;
        }

        .feature-card p {
          color: #b8c4d8;
          line-height: 1.7;
        }

        .content-area {
          width: min(900px, 90%);
          margin: 55px auto;
          flex: 1;
        }

        .public-page {
          background: #111c2d;
          border: 1px solid #29384f;
          border-radius: 15px;
          padding: 35px;
        }

        .public-page h1 {
          color: #ff873e;
          margin-top: 0;
        }

        .public-page h3 {
          margin-top: 28px;
          color: #f6a16c;
        }

        .public-page p,
        .public-page li {
          color: #c2ccda;
          line-height: 1.85;
        }

        .public-page ul {
          padding-left: 22px;
        }

        .auth-container {
          width: min(440px, 90%);
          margin: 65px auto;
          padding: 32px;
          background: #111c2d;
          border: 1px solid #29384f;
          border-radius: 15px;
        }

        .auth-container h1 {
          margin-top: 0;
          text-align: center;
        }

        .auth-container > p {
          color: #aebbd0;
          text-align: center;
          line-height: 1.6;
        }

        .form-group {
          margin-bottom: 17px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #dce4ef;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 13px;
          border-radius: 8px;
          border: 1px solid #35445d;
          background: #0b1423;
          color: white;
          outline: none;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: #f47732;
        }

        .submit-button {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 8px;
          background: #f47732;
          color: white;
          font-weight: 700;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-switch {
          margin-top: 20px;
          text-align: center;
          color: #b8c4d8;
          font-size: 14px;
        }

        .form-switch button {
          border: none;
          background: none;
          color: #ff873e;
          font-weight: 700;
        }

        .message {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          line-height: 1.5;
          font-size: 14px;
        }

        .error-message {
          background: #431d27;
          color: #ffc1c1;
        }

        .success-message {
          background: #123b2d;
          color: #a8f0c8;
        }

        .dashboard {
          width: min(1100px, 90%);
          margin: 45px auto;
          flex: 1;
        }

        .dashboard-header {
          background: #111c2d;
          border: 1px solid #29384f;
          border-radius: 14px;
          padding: 28px;
          margin-bottom: 25px;
        }

        .dashboard-header h1 {
          margin-top: 0;
        }

        .dashboard-header p {
          color: #b8c4d8;
        }

        .dashboard-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .loading-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 15px;
          background: #080d18;
          color: white;
        }

        .loading-spinner {
          width: 38px;
          height: 38px;
          border: 4px solid #35445d;
          border-top-color: #f47732;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .site-footer {
          margin-top: auto;
          padding: 30px 7%;
          background: #101827;
          border-top: 1px solid #263247;
          text-align: center;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 22px;
          margin-bottom: 17px;
        }

        .footer-links button {
          background: none;
          border: none;
          color: #cbd5e1;
          font-size: 13px;
        }

        .footer-links button:hover {
          color: #ff873e;
        }

        .site-footer p {
          color: #8290a5;
          font-size: 12px;
          line-height: 1.7;
        }

        @media (max-width: 700px) {
          .navbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .nav-links {
            gap: 14px;
          }

          .hero {
            padding: 75px 6%;
          }

          .section {
            padding: 45px 6%;
          }

          .public-page {
            padding: 23px;
          }

          .auth-container {
            padding: 24px;
          }
        }
      `}</style>

      {/* NAVIGATION */}
      <header className="navbar">
        <div className="brand" onClick={() => openPage(user ? "dashboard" : "about")}>
          <img src="/bulogo.jpg" alt="Bowen University logo" />
          <span>Bowen Study Hub</span>
        </div>

        <nav className="nav-links">
          {user ? (
            <>
              <button onClick={() => openPage("dashboard")}>Dashboard</button>
              <button onClick={() => openPage("materials")}>
                Course Materials
              </button>
              <button onClick={() => openPage("quiz")}>AI Quiz Generator</button>
              <button onClick={() => openPage("about")}>About</button>
              <button onClick={() => openPage("resources")}>
                Study Resources
              </button>
              <button onClick={() => openPage("privacy")}>Privacy</button>
              <button onClick={() => openPage("terms")}>Terms</button>
              <button onClick={() => openPage("contact")}>Contact</button>
              <button onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <button onClick={() => openPage("about")}>About</button>
              <button onClick={() => openPage("resources")}>
  Study Resources
</button>
              <button onClick={() => openPage("privacy")}>Privacy</button>
              <button onClick={() => openPage("terms")}>Terms</button>
              <button onClick={() => openPage("contact")}>Contact</button>
              <button onClick={() => openPage("login")}>Log in</button>
              <button
                className="primary-button"
                onClick={() => openPage("signup")}
              >
                Get started
              </button>
            </>
          )}
        </nav>
      </header>

      {/* PUBLIC ABOUT PAGE */}
      {!user && page === "about" && (
        <main>
          <section className="hero">
            <h1>
              Your studies.
              <br />
              <span>Made simpler.</span>
            </h1>

            <p>
              A learning platform designed to help Bowen University students
              organise their academic resources, access course materials and
              improve their study experience.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() => openPage("signup")}
              >
                Create an account
              </button>

              <button
                className="secondary-button"
                onClick={() => openPage("login")}
              >
                Log in
              </button>
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <h2>Everything you need to study smarter</h2>
              <p>
                Useful academic resources and tools in one organised place.
              </p>
            </div>

            <div className="feature-grid">
              <div className="feature-card">
                <h3>📚 Course Materials</h3>
                <p>
                  Find organised course resources and educational PDF
                  materials to support your learning.
                </p>
              </div>

              <div className="feature-card">
                <h3>🧠 AI Quiz Generator</h3>
                <p>
                  A planned learning feature designed to help students
                  practise and test their understanding.
                </p>
              </div>

              <div className="feature-card">
                <h3>🎓 Student-focused</h3>
                <p>
                  A platform designed around the academic needs of students,
                  with an emphasis on accessible learning resources.
                </p>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <h2>Start learning with Bowen Study Hub</h2>
              <p>
                Create an account to access the student area and available
                course resources.
              </p>

              <button
                className="primary-button"
                onClick={() => openPage("signup")}
              >
                Join Bowen Study Hub
              </button>
            </div>
          </section>
        </main>
      )}

      {/* PUBLIC INFORMATION PAGES - AVAILABLE TO EVERYONE */}
      {isPublicPage && page !== "about" && (
        <main className="content-area">
          <article className="public-page">
            <h1>{publicPages[page].title}</h1>
            {publicPages[page].content}
          </article>
        </main>
      )}

      {/* ABOUT PAGE FOR LOGGED-IN STUDENTS */}
      {user && page === "about" && (
        <main className="content-area">
          <article className="public-page">
            <h1>{publicPages.about.title}</h1>
            {publicPages.about.content}
          </article>
        </main>
      )}

      {/* SIGN UP PAGE */}
      {!user && page === "signup" && (
        <main className="auth-container">
          <h1>Create your account</h1>
          <p>Join Bowen Study Hub and access your student dashboard.</p>

          {authError && (
            <div className="message error-message">{authError}</div>
          )}

          {authMessage && (
            <div className="message success-message">{authMessage}</div>
          )}

          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label>Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                minLength="6"
                required
              />
            </div>

            <button className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="form-switch">
            Already have an account?{" "}
            <button onClick={() => openPage("login")}>Log in</button>
          </div>
        </main>
      )}

      {/* LOGIN PAGE */}
      {!user && page === "login" && (
        <main className="auth-container">
          <h1>Welcome back</h1>
          <p>Log in to continue to Bowen Study Hub.</p>

          {authError && (
            <div className="message error-message">{authError}</div>
          )}

          {authMessage && (
            <div className="message success-message">{authMessage}</div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="form-switch">
            Don't have an account?{" "}
            <button onClick={() => openPage("signup")}>Sign up</button>
          </div>
        </main>
      )}

      {/* PROTECTED DASHBOARD */}
      {user && page === "dashboard" && (
        <main className="dashboard">
          <section className="dashboard-header">
            <h1>
              Welcome,{" "}
              {user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                "Student"}
              !
            </h1>

            <p>
              Your Bowen Study Hub dashboard is ready. Choose a section to
              continue.
            </p>

            <div className="dashboard-actions">
              <button
                className="primary-button"
                onClick={() => openPage("materials")}
              >
                Explore Course Materials
              </button>

              <button
                className="secondary-button"
                onClick={() => openPage("quiz")}
              >
                🧠 AI Quiz Generator
              </button>

              <button
                className="secondary-button"
                onClick={() => openPage("about")}
              >
                About the platform
              </button>
            </div>
          </section>
        </main>
      )}

      {/* PROTECTED COURSE MATERIALS */}
      {user && page === "materials" && (
        <main className="dashboard">
          <div className="dashboard-header">
            <h1>Course Materials</h1>
            <p>
              Browse the available academic resources for your courses.
            </p>

            <button
              className="secondary-button"
              onClick={() => openPage("dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>

          <CourseMaterial user={user} />
        </main>
      )}

      {/* PROTECTED AI QUIZ GENERATOR */}
      {user && page === "quiz" && (
        <main className="dashboard">
          <div className="dashboard-header">
            <h1>AI Quiz Generator</h1>
            <p>Generate practice questions from your course materials.</p>
            <button
              className="secondary-button"
              onClick={() => openPage("dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
          <AIQuizGenerator />
        </main>
      )}

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-links">
          <button onClick={() => openPage("about")}>About</button>
          <button onClick={() => openPage("privacy")}>Privacy Policy</button>
          <button onClick={() => openPage("terms")}>Terms of Use</button>
          <button onClick={() => openPage("contact")}>Contact</button>
        </div>

        <p>
          © {new Date().getFullYear()} Bowen Study Hub. All rights reserved.
        </p>

        <p>
          An independent educational project. Not an official Bowen
          University website.
        </p>
      </footer>
    </div>
  );
}

export default App;