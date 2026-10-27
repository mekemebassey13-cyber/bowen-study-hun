
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import './CourseMaterial.css'

const BUCKET = 'course-pdfs'
const MAX_FILE_SIZE = 20 * 1024 * 1024

const COURSES = [
  { code: 'COS 101', title: 'COS-101: Introduction to Computing', department: 'Computing' },
  { code: 'PHY 101', title: 'PHY-101: General Physics I', department: 'Science' },
  { code: 'GST 111', title: 'GST-111: Use of English', department: 'General Studies' },
  { code: 'MTH 101', title: 'MTH-101: General Mathematics I', department: 'Mathematics' },
  { code: 'BUI-GEL 101', title: 'BUI-GEL-101: Godliness and Excellence living', department: 'General Studies' },
  { code: 'BUI-LIB 101', title: 'BUI-LIB-101: Use of Library', department: 'General Studies' },
  { code: 'BUI-CSC 101', title: 'CSC-101: Introduction to Web Development', department: 'Computing' },
  { code: 'STA 111', title: 'STA-111: Statistics I', department: 'General Studies' },
]

function CourseMaterial({ user }) {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [search, setSearch] = useState('')
  const [materials, setMaterials] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [openingId, setOpeningId] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadMaterials = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('course_materials')
      .select(
        'id, course_code, course_title, department, title, file_path, uploaded_by, created_at'
      )
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    setMaterials(data ?? [])
  }, [])

  useEffect(() => {
    let active = true

    async function initialise() {
      setLoading(true)
      setError('')

      if (!user?.id) {
        setIsAdmin(false)
        setMaterials([])
        setError('Please log in to view course materials.')
        setLoading(false)
        return
      }

      try {
        const { data, error: adminError } = await supabase
          .from('study_hub_admins')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (adminError) throw adminError

        if (active) setIsAdmin(Boolean(data))
      } catch (err) {
        if (active) {
          setIsAdmin(false)
          setError(
            `Could not verify admin status: ${err?.message || 'Unknown error'}`
          )
        }
      }

      try {
        await loadMaterials()
      } catch (err) {
        if (active) {
          setError(
            `Could not load course materials: ${err?.message || 'Unknown error'}`
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    initialise()

    return () => {
      active = false
    }
  }, [user?.id, loadMaterials])

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return COURSES

    return COURSES.filter((course) =>
      `${course.code} ${course.title} ${course.department}`
        .toLowerCase()
        .includes(term)
    )
  }, [search])

  const courseMaterials = useMemo(() => {
    if (!selectedCourse) return []

    const term = search.trim().toLowerCase()

    return materials.filter((material) => {
      const belongsToCourse =
        material.course_code === selectedCourse.code

      const matchesSearch =
        !term ||
        `${material.title} ${material.course_code} ${material.course_title}`
          .toLowerCase()
          .includes(term)

      return belongsToCourse && matchesSearch
    })
  }, [materials, selectedCourse, search])

  async function handleUpload(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!user?.id) {
      setError('Please sign in before uploading.')
      return
    }

    if (!isAdmin) {
      setError('Your account is not authorised to upload PDFs.')
      return
    }

    if (!selectedCourse) {
      setError('Select a course before uploading.')
      return
    }

    if (!file) {
      setError('Please choose a PDF file.')
      return
    }

    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setError('Only PDF files are allowed.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('The PDF must be 20 MB or smaller.')
      return
    }

    setUploading(true)

    const safeName = file.name
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-120)

    const filePath =
      `${selectedCourse.code.replace(/\s+/g, '-')}/` +
      `${crypto.randomUUID()}-${safeName}`

    let storageUploaded = false

    try {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (storageError) throw storageError

      storageUploaded = true

      const { error: insertError } = await supabase
        .from('course_materials')
        .insert({
          course_code: selectedCourse.code,
          course_title: selectedCourse.title,
          department: selectedCourse.department,
          title: title.trim() || file.name.replace(/\.pdf$/i, ''),
          file_path: filePath,
          uploaded_by: user.id,
        })

      if (insertError) throw insertError

      setTitle('')
      setFile(null)

      const input = document.getElementById('course-pdf-file')
      if (input) input.value = ''

      setMessage('PDF uploaded successfully!')
      await loadMaterials()
    } catch (err) {
      if (storageUploaded) {
        const { error: cleanupError } = await supabase.storage
          .from(BUCKET)
          .remove([filePath])

        if (cleanupError) {
          setError(
            `The upload record failed: ${err?.message}. The uploaded file may still remain in storage.`
          )
        } else {
          setError(err?.message || 'Could not save the PDF record.')
        }
      } else {
        setError(err?.message || 'PDF upload failed.')
      }
    } finally {
      setUploading(false)
    }
  }

  function getPdfUrl(material) {
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(material.file_path)

    if (!data?.publicUrl) {
      throw new Error('Could not create the public PDF link.')
    }

    return data.publicUrl
  }

  async function handleViewPdf(material) {
    setError('')
    setMessage('')
    setOpeningId(material.id)

    try {
      const url = getPdfUrl(material)
      const newWindow = window.open(
        url,
        '_blank',
        'noopener,noreferrer'
      )

      if (!newWindow) {
        setMessage(
          'Your browser may have blocked the new tab. Allow pop-ups and try again.'
        )
      }
    } catch (err) {
      setError(err?.message || 'Could not open this PDF.')
    } finally {
      setOpeningId(null)
    }
  }

  async function handleDownloadPdf(material) {
    setError('')
    setMessage('')
    setDownloadingId(material.id)

    try {
      const { data, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(material.file_path)

      if (downloadError) throw downloadError
      if (!data) throw new Error('The PDF file was empty or unavailable.')

      const objectUrl = URL.createObjectURL(data)
      const link = document.createElement('a')

      link.href = objectUrl
      link.download = `${material.title || 'lecture-material'}.pdf`

      document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (err) {
      setError(
        err?.message ||
          'Could not download the PDF. Check the bucket and storage permissions.'
      )
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDelete(material) {
    if (!isAdmin) {
      setError('Only authorised admins can delete course materials.')
      return
    }

    const confirmed = window.confirm(
      `Delete "${material.title}"? Students will no longer see this material.`
    )

    if (!confirmed) return

    setError('')
    setMessage('')
    setDeletingId(material.id)

    try {
      const { error: deleteError } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', material.id)

      if (deleteError) throw deleteError

      setMaterials((current) =>
        current.filter((item) => item.id !== material.id)
      )

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([material.file_path])

      if (storageError) {
        setMessage(
          'The record was deleted, but the file remains in storage. Check storage permissions.'
        )
      } else {
        setMessage('Course material deleted successfully.')
      }
    } catch (err) {
      setError(err?.message || 'Could not delete this material.')

      try {
        await loadMaterials()
      } catch {
        // Keep the original error visible.
      }
    } finally {
      setDeletingId(null)
    }
  }

  function returnToCourses() {
    setSelectedCourse(null)
    setSearch('')
    setError('')
    setMessage('')
  }

  return (
    <section className="course-materials-page">
      <header className="course-materials-heading">
        <span className="eyebrow">BOWEN STUDY HUB</span>
        <h1>Course Materials</h1>
        <p>
          Find lecture notes, handouts and PDF resources for your courses.
        </p>
      </header>

      <div className="course-search-wrapper">
        <label className="course-search-label" htmlFor="course-search">
          Search courses or PDFs
        </label>
        <input
          id="course-search"
          className="course-search"
          type="search"
          placeholder="e.g. PHY 101 or lecture notes"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && (
        <p className="course-status course-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="course-status course-success" role="status">
          {message}
        </p>
      )}

      {loading && materials.length === 0 ? (
        <p className="course-loading" role="status">
          Loading course materials...
        </p>
      ) : !selectedCourse ? (
        <>
          <div className="course-section-heading">
            <div>
              <h2 className="course-section-title">Available courses</h2>
              <p>Choose a course to view its lecture materials.</p>
            </div>
            <span className="course-total-count">
              {filteredCourses.length} courses
            </span>
          </div>

          <div className="course-grid">
            {filteredCourses.map((course) => {
              const count = materials.filter(
                (material) => material.course_code === course.code
              ).length

              return (
                <button
                  type="button"
                  className="course-card"
                  key={course.code}
                  onClick={() => {
                    setSelectedCourse(course)
                    setError('')
                    setMessage('')
                  }}
                >
                  <span className="course-code">{course.code}</span>
                  <h3>{course.title}</h3>
                  <p>{course.department}</p>
                  <span className="course-material-count">
                    {count} PDF{count === 1 ? '' : 's'} · View materials →
                  </span>
                </button>
              )
            })}
          </div>

          {filteredCourses.length === 0 && (
            <p className="course-empty-state">
              No courses match your search.
            </p>
          )}
        </>
      ) : (
        <div className="selected-course-panel">
          <button
            type="button"
            className="course-back-button"
            onClick={returnToCourses}
          >
            ← All courses
          </button>

          <div className="selected-course-heading">
            <span className="course-code">{selectedCourse.code}</span>
            <h2>{selectedCourse.title}</h2>
            <p>{selectedCourse.department}</p>
          </div>

          {isAdmin && (
            <form className="course-upload-form" onSubmit={handleUpload}>
              <h3>Upload lecture material</h3>
              <p>Add a PDF for the selected course.</p>

              <label htmlFor="pdf-title">PDF title (optional)</label>
              <input
                id="pdf-title"
                type="text"
                maxLength={150}
                placeholder="e.g. Week 1 lecture notes"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />

              <label htmlFor="course-pdf-file">
                Choose PDF (maximum 20 MB)
              </label>
              <input
                id="course-pdf-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) =>
                  setFile(event.target.files?.[0] ?? null)
                }
                required
              />

              <button
                className="primary-btn"
                type="submit"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </button>
            </form>
          )}

          <div className="course-section-heading lecture-list-heading">
            <div>
              <h3 className="course-section-title">Lecture materials</h3>
              <p>Open a PDF to read it or download a copy.</p>
            </div>
            <span className="course-total-count">
              {courseMaterials.length} files
            </span>
          </div>

          {loading ? (
            <p className="course-loading">Loading lecture materials...</p>
          ) : courseMaterials.length === 0 ? (
            <div className="course-empty-state">
              <span className="course-empty-icon" aria-hidden="true">
                PDF
              </span>
              <h3>No lecture PDFs yet</h3>
              <p>
                Materials for this course will appear here once they have
                been uploaded.
              </p>
            </div>
          ) : (
            <div className="course-pdf-list">
              {courseMaterials.map((material) => (
                <article className="course-pdf-item" key={material.id}>
                  <div className="course-pdf-icon" aria-hidden="true">
                    PDF
                  </div>

                  <div className="course-pdf-info">
                    <h3>{material.title}</h3>
                    <p>
                      {material.course_code} ·{' '}
                      {material.created_at
                        ? new Date(
                            material.created_at
                          ).toLocaleDateString()
                        : 'Date unavailable'}
                    </p>
                  </div>

                  <div className="course-pdf-actions">
                    <button
                      type="button"
                      className="course-open-button"
                      onClick={() => handleViewPdf(material)}
                      disabled={openingId === material.id}
                    >
                      {openingId === material.id
                        ? 'Opening...'
                        : 'View PDF ↗'}
                    </button>

                    <button
                      type="button"
                      className="course-download-button"
                      onClick={() => handleDownloadPdf(material)}
                      disabled={downloadingId === material.id}
                    >
                      {downloadingId === material.id
                        ? 'Downloading...'
                        : '↓ Download'}
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        className="course-delete-button"
                        disabled={deletingId === material.id}
                        onClick={() => handleDelete(material)}
                      >
                        {deletingId === material.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default CourseMaterial
