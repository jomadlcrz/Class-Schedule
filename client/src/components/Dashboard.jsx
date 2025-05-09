"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import CourseModal from "./CourseModal";
import { FaPlus, FaEdit, FaTrash, FaSignOutAlt } from "react-icons/fa";
import "../styles/Dashboard.css";
import DeleteConfirmationModal from './DeleteConfirmationModal'; // Import the new component
import logo from "../assets/logo.png";
import { motion } from "framer-motion";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Add a hook to get window width
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
}

function Dashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [courseToDeleteId, setCourseToDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const [isProfileImageLoaded, setIsProfileImageLoaded] = useState(false);

  const width = useWindowWidth();

  useEffect(() => {
    // Check if images were previously loaded
    const previouslyLoaded = localStorage.getItem('imagesLoaded') === 'true';
    if (previouslyLoaded) {
      setIsLogoLoaded(true);
      setIsProfileImageLoaded(true);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/courses`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.token]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleAddCourse = () => {
    setCurrentCourse(null);
    setIsModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setCurrentCourse(course);
    setIsModalOpen(true);
  };

  const handleDeleteCourse = (id) => {
    setCourseToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCourse = async () => {
    try {
      await axios.delete(`${API_URL}/courses/${courseToDeleteId}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setCourseToDeleteId(null);
    }
  };

  const cancelDeleteCourse = () => {
    setIsDeleteModalOpen(false);
    setCourseToDeleteId(null);
  };

  const handleSaveCourse = async (course) => {
    try {
      if (course._id) {
        // Update existing course
        await axios.put(`${API_URL}/courses/${course._id}`, course, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      } else {
        // Add new course
        await axios.post(`${API_URL}/courses`, course, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      throw error; // Propagate the error to be handled by the modal
    }
  };

  const toggleLogout = () => {
    setShowLogout(!showLogout);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left nav-refresh" onClick={() => window.location.reload()} style={{cursor: 'pointer'}}>
          <img 
            src={window.preloadedImages?.logo || logo} 
            alt="Logo" 
            className="header-logo"
            style={{ opacity: 1 }}
          />
          <h1>CLASS SCHEDULE</h1>
        </div>
        <div className="header-right">
          <div className="user-menu">
            <img 
              src={user.imageUrl} 
              alt="Profile" 
              className="user-icon"
              onClick={toggleLogout}
              style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', opacity: 1 }}
            />
            {showLogout && (
              <div className="logout-dropdown">
                <p className="user-name">{user.name}</p>
                <p className="user-email">{user.email}</p>
                <button className="logout-button" onClick={onLogout}>
                  <FaSignOutAlt className="logout-icon" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <motion.div
          className="actions-bar"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="program-info">
            <p>B.S. INFORMATION TECHNOLOGY</p>
          </div>
          <button className="add-button" onClick={handleAddCourse}>
            <FaPlus /> Add Course
          </button>
        </motion.div>

        {width <= 768 ? (
          <div className="mobile-courses-list">
            {isLoading ? (
              <div className="loading-message">Loading...</div>
            ) : courses.length === 0 ? (
              <div className="empty-message">No courses found. Add a course to get started.</div>
            ) : (
              courses.map((course) => (
                <motion.div
                  className="course-card"
                  key={course._id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="course-card-header">
                    <div>
                      <span className="course-card-code">{course.courseCode}</span>
                      <div className="course-card-title">{course.title}</div>
                    </div>
                    <div className="course-card-actions">
                      <button className="edit-button" onClick={() => handleEditCourse(course)}><FaEdit /></button>
                      <button className="delete-button" onClick={() => handleDeleteCourse(course._id)}><FaTrash /></button>
                    </div>
                  </div>
                  <div className="course-card-detail"><b>Units:</b> {course.units}</div>
                  <div className="course-card-detail"><b>Days:</b> {course.days}</div>
                  <div className="course-card-detail"><b>Time:</b> {course.time}</div>
                  <div className="course-card-detail"><b>Room:</b> {course.room}</div>
                  <div className="course-card-detail"><b>Instructor:</b> <span className="course-card-instructor">{course.instructor}</span></div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <motion.div
            className="table-container"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Descriptive Title</th>
                  <th>Units</th>
                  <th>Days</th>
                  <th>Time</th>
                  <th>Room</th>
                  <th>Instructor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="loading-message">
                      Loading...
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-message">
                      No courses found. Add a course to get started.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <motion.tr
                      key={course._id}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <td>{course.courseCode}</td>
                      <td>{course.title}</td>
                      <td>{course.units}</td>
                      <td>{course.days}</td>
                      <td>{course.time}</td>
                      <td>{course.room}</td>
                      <td>{course.instructor}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() => handleEditCourse(course)}
                          >
                            <FaEdit />
                            <span className="action-tooltip">Edit</span>
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteCourse(course._id)}
                          >
                            <FaTrash />
                            <span className="action-tooltip">Delete</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </main>

      {isModalOpen && (
        <CourseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCourse}
          course={currentCourse}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDeleteCourse}
        onCancel={cancelDeleteCourse}
        courseId={courseToDeleteId}
      />
    </div>
  );
}

export default Dashboard;

