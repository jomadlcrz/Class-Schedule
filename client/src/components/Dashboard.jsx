"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import CourseModal from "./CourseModal";
import { FaPlus, FaEdit, FaTrash, FaSignOutAlt } from "react-icons/fa";
import "../styles/Dashboard.css";
import DeleteConfirmationModal from './DeleteConfirmationModal'; // Import the new component

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function Dashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [courseToDeleteId, setCourseToDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
    }
  };

  const toggleLogout = () => {
    setShowLogout(!showLogout);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>CLASS SCHEDULE</h1>
          <p>B.S. INFORMATION TECHNOLOGY</p>
        </div>
        <div className="header-right">
          <div className="user-menu">
            <img 
              src={user.imageUrl} 
              alt="Profile" 
              className="user-icon" 
              onClick={toggleLogout}
              style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}
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
        <div className="actions-bar">
          <button className="add-button " onClick={handleAddCourse}>
            <FaPlus /> Add Course
          </button>
        </div>

        <div className="table-container">
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
                  <tr key={course._id}>
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
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteCourse(course._id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

