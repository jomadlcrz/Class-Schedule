"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import CourseModal from "./CourseModal";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSignOutAlt,
  FaSortAmountDown,
} from "react-icons/fa";
import "../styles/Dashboard.css";
import DeleteConfirmationModal from "./DeleteConfirmationModal"; // Import the new component
import logo from "../assets/logo.png";
import { motion } from "framer-motion";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Configure axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add a hook to get window width
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
  const [sortConfig, setSortConfig] = useState(() => {
    const savedSort = localStorage.getItem("sortConfig");
    return savedSort ? JSON.parse(savedSort) : { key: "time", direction: "asc" };
  });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [error, setError] = useState(null);

  const width = useWindowWidth();

  // Memoize the formatTime function
  const formatTime = useCallback((timeStr) => {
    if (!timeStr) return "";
    const [start, end] = timeStr.split(" - ").map((t) => t.trim());
    if (!start || !end) return timeStr;

    const formatSingleTime = (time) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour.toString().padStart(2, "0")}:${minutes} ${period}`;
    };

    return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
  }, []);

  // Memoize the sortCourses function
  const sortCourses = useCallback((coursesToSort) => {
    return [...coursesToSort].sort((a, b) => {
      if (sortConfig.key === "time") {
        const [aStart] = a.time.split(" - ").map((t) => t.trim());
        const [bStart] = b.time.split(" - ").map((t) => t.trim());
        return sortConfig.direction === "asc"
          ? aStart.localeCompare(bStart)
          : bStart.localeCompare(aStart);
      }

      const aValue = a[sortConfig.key]?.toLowerCase() || "";
      const bValue = b[sortConfig.key]?.toLowerCase() || "";

      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [sortConfig]);

  // Memoize the sorted courses
  const sortedCourses = useMemo(() => sortCourses(courses), [courses, sortCourses]);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/courses`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        timeout: 5000,
      });
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(error.response.data.message || "Failed to fetch courses. Please try again.");
      } else if (error.request) {
        // The request was made but no response was received
        setError("No response from server. Please check your internet connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError("An error occurred while fetching courses.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [user.token]);

  // Add error boundary
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Optimize initial data fetch
  useEffect(() => {
    const controller = new AbortController();
    fetchCourses();
    return () => controller.abort();
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
      await axiosInstance.delete(`/courses/${courseToDeleteId}`, {
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
        const response = await axiosInstance.put(
          `/courses/${course._id}`,
          course,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        if (response.data) {
          fetchCourses();
        }
      } else {
        // Add new course
        const response = await axiosInstance.post(`/courses`, course, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        if (response.data) {
          fetchCourses();
        }
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        throw error; // This will be caught by CourseModal's handleSubmit
      } else {
        throw new Error("An error occurred while saving the course");
      }
    }
  };

  const toggleLogout = () => {
    setShowLogout(!showLogout);
  };

  // Function to handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    // Save to localStorage
    localStorage.setItem("sortConfig", JSON.stringify(newSortConfig));
    setShowSortMenu(false);
  };

  return (
    <div className="dashboard-container">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <header className="dashboard-header">
        <div
          className="header-left nav-refresh"
          onClick={() => window.location.reload()}
          style={{ cursor: "pointer" }}
        >
          <img
            src={window.preloadedImages?.logo || logo}
            alt="Logo"
            className="header-logo"
            style={{
              opacity: 1,
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
              pointerEvents: "none",
            }}
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
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                opacity: 1,
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
              }}
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

        <div className="table-controls">
          <div className="sort-container">
            <button
              className="sort-button"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <FaSortAmountDown />
              <span className="action-tooltip">Sort</span>
            </button>
            {showSortMenu && (
              <div className="sort-menu">
                <button
                  onClick={() => handleSort("courseCode")}
                  className={sortConfig.key === "courseCode" ? "active" : ""}
                >
                  Course Code
                </button>
                <button
                  onClick={() => handleSort("title")}
                  className={sortConfig.key === "title" ? "active" : ""}
                >
                  Title
                </button>
                <button
                  onClick={() => handleSort("units")}
                  className={sortConfig.key === "units" ? "active" : ""}
                >
                  Units
                </button>
                <button
                  onClick={() => handleSort("days")}
                  className={sortConfig.key === "days" ? "active" : ""}
                >
                  Days
                </button>
                <button
                  onClick={() => handleSort("time")}
                  className={sortConfig.key === "time" ? "active" : ""}
                >
                  Time
                </button>
                <button
                  onClick={() => handleSort("room")}
                  className={sortConfig.key === "room" ? "active" : ""}
                >
                  Room
                </button>
                <button
                  onClick={() => handleSort("instructor")}
                  className={sortConfig.key === "instructor" ? "active" : ""}
                >
                  Instructor
                </button>
              </div>
            )}
          </div>
        </div>

        {width <= 768 ? (
          <motion.div
            className="mobile-courses-list"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {isLoading ? (
              <div className="loading-message">Loading...</div>
            ) : sortedCourses.length === 0 ? (
              <div className="empty-message">
                No courses found. Add a course to get started.
              </div>
            ) : (
              sortedCourses.map((course) => (
                <motion.div
                  className="course-card"
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="course-card-header">
                    <div>
                      <span className="course-card-code">
                        {course.courseCode}
                      </span>
                      <div className="course-card-title">{course.title}</div>
                    </div>
                    <div className="course-card-actions">
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
                  </div>
                  <div className="course-card-detail">
                    <b>Units:</b> {course.units}
                  </div>
                  <div className="course-card-detail">
                    <b>Days:</b> {course.days}
                  </div>
                  <div className="course-card-detail">
                    <b>Time:</b> {formatTime(course.time)}
                  </div>
                  <div className="course-card-detail">
                    <b>Room:</b> {course.room}
                  </div>
                  <div className="course-card-detail">
                    <b>Instructor:</b>{" "}
                    <span className="course-card-instructor">
                      {course.instructor}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
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
                ) : sortedCourses.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-message">
                      No courses found. Add a course to get started.
                    </td>
                  </tr>
                ) : (
                  sortedCourses.map((course) => (
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
                      <td>{formatTime(course.time)}</td>
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
