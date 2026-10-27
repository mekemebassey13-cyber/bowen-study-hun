
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './AIQuizGenerator.css'

const QUESTION_COUNTS = [5, 10, 15, 20, 30, 50]

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`
}

export default function AIQuizGenerator() {
  const [courses, setCourses] = useState([])
  const [courseCode, setCourseCode] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')

  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(600)

  const [loadingCourses, setLoadingCourses] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true)
    setError('')

    const { data, error: loadError } = await supabase
      .from('course_materials')
      .select('course_code, course_title')
      .order('course_code')

    if (loadError) {
      setError(`Could not load courses: ${loadError.message}`)
      setCourses([])
      setLoadingCourses(false)
      return
    }

    // Show each course only once, even when it has multiple PDFs.
    const uniqueCourses = Array.from(
      new Map(
        (data || []).map((item) => [
          item.course_code,
          {
            code: item.course_code,
            title: item.course_title,
          },
        ])
      ).values()
    )

    setCourses(uniqueCourses)

    if (uniqueCourses.length > 0) {
      setCourseCode((current) =>
        uniqueCourses.some((course) => course.code === current)
          ? current
          : uniqueCourses[0].code
      )
    }

    setLoadingCourses(false)
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  // One minute per question.
  useEffect(() => {
    if (!quizStarted || submitted || timeLeft <= 0) return

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [quizStarted, submitted, timeLeft])

  useEffect(() => {
    if (quizStarted && timeLeft === 0 && !submitted) {
      setSubmitted(true)
      setMessage("Time's up! Here are your results.")
    }
  }, [quizStarted, timeLeft, submitted])

  async function handleGenerate(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!courseCode) {
      setError('Please choose a course that has uploaded PDF materials.')
      return
    }

    setGenerating(true)

    try {
      // This Edge Function will be created in the next setup stage.
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-quiz',
        {
          body: {
            courseCode,
            questionCount,
            difficulty,
          },
        }
      )

      if (functionError) {
        throw new Error(
          functionError.message || 'The quiz generator could not be reached.'
        )
      }

      if (!data?.questions || !Array.isArray(data.questions)) {
        throw new Error(
          data?.error || 'The AI returned an invalid quiz. Please try again.'
        )
      }

      if (data.questions.length !== questionCount) {
        throw new Error(
          `The AI returned ${data.questions.length} questions instead of ${questionCount}. Please try again.`
        )
      }

      const validQuiz = data.questions.every(
        (question) =>
          typeof question.question === 'string' &&
          Array.isArray(question.options) &&
          question.options.length === 4 &&
          Number.isInteger(question.answerIndex) &&
          question.answerIndex >= 0 &&
          question.answerIndex < 4
      )

      if (!validQuiz) {
        throw new Error(
          'The AI returned questions in an unexpected format. Please try again.'
        )
      }

      setQuiz(data.questions)
      setAnswers({})
      setTimeLeft(questionCount * 60)
      setSubmitted(false)
      setQuizStarted(false)
      setMessage('Your quiz is ready! Start when you are prepared.')
    } catch (generationError) {
      setError(
        generationError.message || 'Could not generate the quiz.'
      )
    } finally {
      setGenerating(false)
    }
  }

  function startQuiz() {
    setTimeLeft(quiz.length * 60)
    setQuizStarted(true)
    setSubmitted(false)
    setMessage('')
    setError('')
  }

  function submitQuiz() {
    setSubmitted(true)
    setQuizStarted(false)
    setMessage('Quiz submitted. Check your results below.')
  }

  function restartQuiz() {
    setQuiz([])
    setAnswers({})
    setQuizStarted(false)
    setSubmitted(false)
    setTimeLeft(questionCount * 60)
    setMessage('')
    setError('')
  }

  const score = quiz.reduce((total, question, index) => {
    return total + (
      answers[index] === question.answerIndex ? 1 : 0
    )
  }, 0)

  const answeredCount = Object.keys(answers).length

  return (
    <main className="ai-quiz-page">
      <header className="ai-quiz-header">
        <span className="ai-quiz-eyebrow">BOWEN STUDY HUB</span>
        <h1>AI Quiz Generator</h1>
        <p>
          Turn your course materials into a practice quiz.
          Choose a course, set your difficulty, and test your knowledge.
        </p>
      </header>

      {!quiz.length && (
        <section className="ai-quiz-setup">
          <div className="ai-quiz-section-heading">
            <span className="ai-quiz-icon">✦</span>
            <div>
              <h2>Create your quiz</h2>
              <p>Questions will be based on PDFs uploaded for your course.</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="ai-quiz-form">
            <label htmlFor="quiz-course">Choose a course</label>
            <select
              id="quiz-course"
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
              disabled={loadingCourses || generating || quizStarted}
              required
            >
              {loadingCourses && <option value="">Loading courses...</option>}

              {!loadingCourses && courses.length === 0 && (
                <option value="">No courses with PDFs found</option>
              )}

              {courses.map((course) => (
                <option key={course.code} value={course.code}>
                  {course.code} — {course.title}
                </option>
              ))}
            </select>

            <label htmlFor="quiz-count">Number of questions</label>
            <select
              id="quiz-count"
              value={questionCount}
              onChange={(event) =>
                setQuestionCount(Number(event.target.value))
              }
              disabled={generating}
            >
              {QUESTION_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count} questions · {count} minutes
                </option>
              ))}
            </select>

            <label htmlFor="quiz-difficulty">Difficulty</label>
            <select
              id="quiz-difficulty"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              disabled={generating}
            >
              <option value="easy">Easy — build confidence</option>
              <option value="medium">Medium — test understanding</option>
              <option value="hard">Hard — challenge yourself</option>
            </select>

            <div className="ai-quiz-time-preview">
              <span>Time limit</span>
              <strong>{questionCount} minutes</strong>
              <small>One minute per question</small>
            </div>

            <button
              className="ai-quiz-primary"
              type="submit"
              disabled={
                loadingCourses ||
                generating ||
                courses.length === 0
              }
            >
              {generating ? 'Generating your quiz...' : 'Generate quiz'}
            </button>
          </form>

          {generating && (
            <p className="ai-quiz-loading">
              <span className="ai-quiz-spinner" />
              Reading course materials and preparing questions...
            </p>
          )}
        </section>
      )}

      {error && <p className="ai-quiz-error" role="alert">{error}</p>}
      {message && <p className="ai-quiz-message" role="status">{message}</p>}

      {quiz.length > 0 && !quizStarted && !submitted && (
        <section className="ai-quiz-ready">
          <span className="ai-quiz-icon">✓</span>
          <h2>Your quiz is ready</h2>
          <p>
            {courseCode} · {quiz.length} questions · {quiz.length} minutes
          </p>
          <p>
            Once you start, the timer will count down. Your results
            and explanations will appear when you submit.
          </p>
          <button className="ai-quiz-primary" onClick={startQuiz}>
            Start quiz
          </button>
          <button className="ai-quiz-secondary" onClick={restartQuiz}>
            Choose another quiz
          </button>
        </section>
      )}

      {quiz.length > 0 && (quizStarted || submitted) && (
        <section className="ai-quiz-test">
          <div className="ai-quiz-test-bar">
            <div>
              <span className="ai-quiz-eyebrow">{courseCode}</span>
              <h2>Practice quiz</h2>
              <small>{answeredCount} of {quiz.length} answered</small>
            </div>

            <div
              className={`ai-quiz-countdown ${
                timeLeft <= 60 && !submitted ? 'urgent' : ''
              }`}
              aria-live="polite"
            >
              <span>Time left</span>
              <strong>{formatTime(timeLeft)}</strong>
            </div>
          </div>

          <div className="ai-quiz-progress">
            <span
              style={{
                width: `${(answeredCount / quiz.length) * 100}%`,
              }}
            />
          </div>

          {quiz.map((question, index) => (
            <article className="ai-quiz-question" key={index}>
              <span className="ai-quiz-question-number">
                QUESTION {index + 1} OF {quiz.length}
              </span>
              <h3>{question.question}</h3>

              <div className="ai-quiz-options">
                {question.options.map((option, optionIndex) => {
                  const isSelected = answers[index] === optionIndex
                  const isCorrect = question.answerIndex === optionIndex

                  let optionClass = ''
                  if (submitted && isCorrect) optionClass = 'correct'
                  else if (submitted && isSelected && !isCorrect) {
                    optionClass = 'incorrect'
                  } else if (isSelected) {
                    optionClass = 'selected'
                  }

                  return (
                    <button
                      type="button"
                      key={optionIndex}
                      className={`ai-quiz-option ${optionClass}`}
                      disabled={submitted || !quizStarted}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [index]: optionIndex,
                        }))
                      }
                    >
                      <span className="ai-quiz-option-letter">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span>{option}</span>
                    </button>
                  )
                })}
              </div>

              {submitted && (
                <div className="ai-quiz-explanation">
                  <strong>
                    {answers[index] === question.answerIndex
                      ? 'Correct answer!'
                      : 'Review this answer'}
                  </strong>
                  <p>
                    Correct answer: {question.options[question.answerIndex]}
                  </p>
                  {question.explanation && <p>{question.explanation}</p>}
                </div>
              )}
            </article>
          ))}

          {!submitted ? (
            <button className="ai-quiz-primary" onClick={submitQuiz}>
              Submit quiz
            </button>
          ) : (
            <div className="ai-quiz-results">
              <span className="ai-quiz-eyebrow">QUIZ COMPLETE</span>
              <h2>Your score</h2>
              <strong className="ai-quiz-score">
                {score} / {quiz.length}
              </strong>
              <p>
                {Math.round((score / quiz.length) * 100)}% correct
              </p>
              <button className="ai-quiz-primary" onClick={restartQuiz}>
                Generate another quiz
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
