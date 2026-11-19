import React, { useState } from "react";
import "./StudyResources.css";

const courses = [
  {
    code: "COS 101",
    title: "Introduction to Computing",
    department: "Computing",
    description:
      "This course introduces students to the fundamentals of computing and the role of computers in modern society. It explores how computer systems work, how information is processed, and how computing technology is applied in different fields.",
    topics: [
      {
        name: "Introduction to Computing",
        description:
          "Understand what computing means, its history, its development, and how computers have changed the way people communicate, learn, work, and solve problems."
      },
      {
        name: "Computer Hardware",
        description:
          "Explore the physical components of a computer system, including the CPU, motherboard, memory, storage devices, and input and output devices. Learn how these components work together."
      },
      {
        name: "Computer Software",
        description:
          "Learn the difference between system software and application software, understand the purpose of operating systems, and explore how software helps users perform different tasks."
      },
      {
        name: "Data and Information",
        description:
          "Understand the difference between raw data and meaningful information, how computers represent data, and how information is processed and stored."
      }
    ]
  },
  {
    code: "PHY 101",
    title: "General Physics I",
    department: "Science",
    description:
      "This course introduces important principles of classical physics, including motion, forces, rotation, and the behaviour of physical systems. Students develop an understanding of physical laws and learn how to apply mathematical principles to explain natural phenomena.",
    topics: [
      {
        name: "Scalars and Vectors",
        description:
          "Study physical quantities that have magnitude only and those that have both magnitude and direction. Learn vector representation, addition, subtraction, resolution into components, and how vectors are used to describe motion and forces."
      },
      {
        name: "Newton's Laws of Motion",
        description:
          "Explore the three fundamental laws that explain how objects move and respond to forces. Understand inertia, acceleration, mass, and the relationship between force and motion through practical examples and calculations."
      },
      {
        name: "Circular Motion",
        description:
          "Understand how objects move along circular paths, including angular displacement, angular velocity, centripetal acceleration, and centripetal force. Explore how these principles explain the motion of planets and satellites."
      },
      {
        name: "Kepler's Laws of Planetary Motion",
        description:
          "Study the three laws that describe planetary motion around the Sun. Understand elliptical orbits, the relationship between orbital periods and distances, and how planetary motion is explained mathematically."
      },
      {
        name: "Torque and Rotational Motion",
        description:
          "Learn how forces produce turning effects around a fixed point or axis. Explore moments of force, angular motion, rotational equilibrium, and the factors that determine how easily an object rotates."
      },
      {
        name: "Gravitation",
        description:
          "Explore the gravitational attraction between objects, Newton's law of universal gravitation, gravitational fields, and the role gravity plays in the movement of planets and satellites."
      },
      {
        name: "Rotational Dynamics and Gyroscopes",
        description:
          "Understand rotational motion through concepts such as angular momentum, precession, and the behaviour of spinning objects. Examine how gyroscopes maintain their orientation and respond to external forces."
      }
    ]
  },
  {
    code: "GST 111",
    title: "Use of English",
    department: "General Studies",
    description:
      "This course develops students' ability to communicate effectively in English. It focuses on the language skills required for academic work, including reading, writing, listening, speaking, and understanding English grammar.",
    topics: [
      {
        name: "Course topics",
        description:
          "The detailed topics for this course will be added from the official GST 111 course outline."
      }
    ]
  },
  {
    code: "MTH 101",
    title: "General Mathematics I",
    department: "Mathematics",
    description:
      "This course develops mathematical knowledge and problem-solving skills needed for university-level studies. It provides a foundation for understanding mathematical concepts and applying them to scientific and technical problems.",
    topics: [
      {
        name: "Course topics",
        description:
          "The detailed topics for this course will be added from the official MTH 101 course outline."
      }
    ]
  },
  {
    code: "CHM 101",
    title: "General Chemistry I",
    department: "Science",
    description:
      "This course introduces fundamental chemical principles and the scientific study of matter. It helps students understand the composition, structure, properties, and transformations of substances.",
    topics: [
      {
        name: "Course topics",
        description:
          "The detailed topics for this course will be added from the official CHM 101 course outline."
      }
    ]
  },
  {
    code: "STA 111",
    title: "Introduction to Statistics",
    department: "Mathematics",
    description:
      "This course introduces statistical methods used to collect, organise, present, analyse, and interpret data. Students learn how statistical techniques can be applied to understand information and support decision-making.",
    topics: [
      {
        name: "Course topics",
        description:
          "The detailed topics for this course will be added from the official STA 111 course outline."
      }
    ]
  }
];

function StudyResources({ onGoToCourseMaterials }) {
  const [selectedCourse, setSelectedCourse] = useState(null);

  return (
    <div className="study-resources">
      {!selectedCourse ? (
        <>
          <div className="resources-heading">
            <span className="resources-label">LEARN AND EXPLORE</span>
            <h1>Study Resources</h1>
            <p>
              Explore your courses, understand the topics covered, and preview
              available course materials.
            </p>
          </div>

          <div className="resources-course-grid">
            {courses.map((course) => (
              <button
                className="resource-course-card"
                key={course.code}
                onClick={() => {
                  setSelectedCourse(course);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <span className="resource-course-code">{course.code}</span>
                <h2>{course.title}</h2>
                <p>{course.department}</p>
                <span className="resource-card-link">
                  Explore course →
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            className="resource-back-button"
            onClick={() => setSelectedCourse(null)}
          >
            ← Back to Courses
          </button>

          <div className="resource-course-header">
            <span className="resources-label">{selectedCourse.code}</span>
            <h1>{selectedCourse.title}</h1>
            <p>{selectedCourse.description}</p>
          </div>

          <section className="resource-topics-section">
            <h2>Topics Covered</h2>
            <p className="resource-section-intro">
              Explore the main concepts and areas of study covered in this
              course.
            </p>

            <div className="resource-topics-list">
              {selectedCourse.topics.map((topic, index) => (
                <article className="resource-topic-card" key={index}>
                  <span className="resource-topic-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{topic.name}</h3>
                    <p>{topic.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="resource-pdf-section">
            <div>
              <span className="resources-label">COURSE MATERIAL</span>
              <h2>PDF Preview</h2>
              <p>
                Ready to study? Visit Course Materials to find and access the
                full PDF resources uploaded for this course.
              </p>
            </div>

            <button
              className="resource-pdf-button"
              onClick={() => {
                if (onGoToCourseMaterials) {
                  onGoToCourseMaterials();
                }
              }}
            >
              Go to Course Materials to View Full PDF →
            </button>
          </section>
        </>
      )}
    </div>
  );
}

export default StudyResources;