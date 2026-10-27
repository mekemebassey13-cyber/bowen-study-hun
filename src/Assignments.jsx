
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './Assignments.css'

const BUCKET = 'course-pdfs'
const MAX_FILE_SIZE = 20 * 1024 * 1024

const COURSES = [
  { code: 'COS 101', title: 'Introduction to Computing' },
  { code: 'PHY 101', title: 'General Physics I' },
  { code: 'PHY 107', title: 'Practical Physics' },
  { code: 'GST 111', title: 'Use of English' },
  { code: 'MTH 101', title: 'General Mathematics I' },
  { code: 'BUI-GEL 101', title: 'Godliness and Excellence Living' },
  { code: 'BUI-LIB 101', title: 'Use of Library' },
  { code: 'BUI-CSC 101', title: 'Introduction to Web Development' },
  { code: 'STA 111', title: 'Statistics I' },
]

export default function Assignments({ user }) {
  const [assignments, setAssignments] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [title, setTitle] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [instructions, setInstructions] = useState('')
  const [file, setFile] = useState(null)

  const checkAdmin = useCallback(async () => {
    if (!user?.id) {
      setIsAdmin(false)
      return
    }

    const { data, error } = await supabase
      .from('study_hub_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Admin check failed:', error.message)
      setIsAdmin(false)
      return
    }

    setIsAdmin(Boolean(data))
  }, [user?.id])

  const loadAssignments = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(`Could not load assignments: ${error.message}`)
      setAssignments([])
    } else {
      setAssignments(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    checkAdmin()
  }, [checkAdmin])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  const handleUpload = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!user?.id) {
      setError('Please log in before uploading.')
      return
    }

    if (!isAdmin) {
      setError('Only an approved admin can upload assignments.')
      return
    }

    if (!title.trim() || !courseCode || !file) {
      setError('Enter the title, select a course, and choose a PDF.')
      return
    }

    if (file.type !== 'application/pdf' &&
        !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('The PDF must be 20 MB or smaller.')
      return
    }

    const course = COURSES.find((item) => item.code === courseCode)

    if (!course) {
      setError('Please select a valid course.')
      return
    }

    setUploading(true)

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `assignments/${user.id}/${Date.now()}-${safeFileName}`

    try {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (storageError) throw storageError

      const { error: databaseError } = await supabase
        .from('assignments')
        .insert({
          title: title.trim(),
          course_code: course.code,
          instructions: instructions.trim(),
          file_path: filePath,
          uploaded_by: user.id,
        })

      if (databaseError) {
        // Remove the uploaded file if saving its record fails.
        await supabase.storage.from(BUCKET).remove([filePath])
        throw databaseError
      }

      setTitle('')
      setCourseCode('')
      setInstructions('')
      setFile(null)

      const fileInput = document.getElementById('assignment-pdf')
      if (fileInput) fileInput.value = ''

      setMessage('Assignment uploaded successfully!')
      await loadAssignments()
    } catch (uploadError) {
      setError(uploadError.message || 'The assignment could not be uploaded.')
    } finally {
      setUploading(false)
    }
  }

  const handleView = (filePath) => {
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath)

    window.open(data.publicUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDownload = async (assignment) => {
    setError('')

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .download(assignment.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `${assignment.course_code}-${assignment.title}`
        .replace(/[^a-zA-Z0-9._-]/g, '_') + '.pdf'

      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      setError(`Download failed: ${downloadError.message}`)
    }
  }

  const handleDelete = async (assignment) => {
    const confirmed = window.confirm(
      `Delete "${assignment.title}"? This cannot easily be undone.`
    )

    if (!confirmed) return

    setError('')
    setMessage('')

    try {
      const { error: databaseError } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignment.id)

      if (databaseError) throw databaseError

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([assignment.file_path])

      if (storageError) {
        setError(
          'The assignment record was deleted, but the PDF could not be removed. ' +
          storageError.message
        )
        await loadAssignments()
        return
      }

      setMessage('Assignment deleted.')
      await loadAssignments()
    } catch (deleteError) {
      setError(`Could not delete assignment: ${deleteError.message}`)
    }
  }

  const filteredAssignments = assignments.filter((assignment) => {
    const query = search.toLowerCase()

    return (
      assignment.title?.toLowerCase().includes(query) ||
      assignment.course_code?.toLowerCase().includes(query) ||
      assignment.instructions?.toLowerCase().includes(query)
    )
  })

  return (
    <main className="assignments-page">
      <header className="assignments-header">
        <p className="assignments-label">BOWEN STUDY HUB</p>
        <h1>Assignments</h1>
        <p>
          Find your course assignments, read the instructions,
          and download the PDFs you need.
        </p>
      </header>

      <section className="assignments-content">
      <p>
  Admin status: {isAdmin ? 'Admin detected' : 'Not detected'}
</p>
        {isAdmin && (
          <form className="assignment-upload" onSubmit={handleUpload}>
            <h2>Upload an assignment</h2>
            <p>Only approved administrators can add assignments.</p>

            <label htmlFor="assignment-title">Assignment title</label>
            <input
              id="assignment-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Assignment 1"
              required
            />

            <label htmlFor="assignment-course">Course</label>
            <select
              id="assignment-course"
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
              required
            >
              <option value="">Select a course</option>
              {COURSES.map((course) => (
                <option key={course.code} value={course.code}>
                  {course.code} — {course.title}
                </option>
              ))}
            </select>

            <label htmlFor="assignment-instructions">
              Instructions (optional)
            </label>
            <textarea
              id="assignment-instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Add a deadline or other instructions"
              rows={4}
            />

            <label htmlFor="assignment-pdf">Assignment PDF (max 20 MB)</label>
            <input
              id="assignment-pdf"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              required
            />

            <button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload assignment'}
            </button>
          </form>
        )}

        {error && <p className="assignment-error" role="alert">{error}</p>}
        {message && <p className="assignment-message" role="status">{message}</p>}

        <div className="assignments-toolbar">
          <h2>Available assignments</h2>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assignments..."
            aria-label="Search assignments"
          />
        </div>

        {loading ? (
          <div className="assignments-empty">
            <p>Loading assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="assignments-empty">
            <div className="assignments-icon">📄</div>
            <h3>No assignments found</h3>
            <p>
              {search
                ? 'Try another search.'
                : 'Assignments uploaded by the admin will appear here.'}
            </p>
          </div>
        ) : (
          <div className="assignments-list">
            {filteredAssignments.map((assignment) => (
              <article className="assignment-card" key={assignment.id}>
                <span className="assignment-course">
                  {assignment.course_code}
                </span>

                <h3>{assignment.title}</h3>

                {assignment.instructions && <p>{assignment.instructions}</p>}

                <p className="assignment-date">
                  Added {new Date(assignment.created_at).toLocaleDateString()}
                </p>

                <div className="assignment-actions">
                  <button
                    type="button"
                    onClick={() => handleView(assignment.file_path)}
                  >
                    View PDF
                  </button>

                  <button
                    type="button"
                    className="assignment-download"
                    onClick={() => handleDownload(assignment)}
                  >
                    Download
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      className="assignment-delete"
                      onClick={() => handleDelete(assignment)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
