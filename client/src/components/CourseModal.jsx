"use client";

import { useState, useEffect } from "react";
import "../styles/CourseModal.css";

function CourseModal({ isOpen, onClose, onSave, course }) {
  const [formData, setFormData] = useState({
    courseCode: "",
    title: "",
    units: "",
    days: "",
    time: "",
    room: "",
    instructor: "",
  });

  useEffect(() => {
    if (course) {
      setFormData(course);
    } else {
      setFormData({
        courseCode: "",
        title: "",
        units: "",
        days: "",
        time: "",
        room: "",
        instructor: "",
      });
    }
  }, [course, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{course ? "Edit Course" : "Add New Course"}</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="courseCode">Course Code</label>
            <input
              type="text"
              id="courseCode"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="title">Descriptive Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="units">Units</label>
            <input
              type="text"
              id="units"
              name="units"
              value={formData.units}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="days">Days</label>
            <input
              type="text"
              id="days"
              name="days"
              value={formData.days}
              onChange={handleChange}
              required
              placeholder="e.g., MWF, TTh"
            />
          </div>
          <div className="form-group">
            <label htmlFor="time">Time</label>
            <input
              type="text"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              placeholder="e.g., 9:00 AM - 10:30 AM"
            />
          </div>
          <div className="form-group">
            <label htmlFor="room">Room</label>
            <input
              type="text"
              id="room"
              name="room"
              value={formData.room}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="instructor">Instructor</label>
            <input
              type="text"
              id="instructor"
              name="instructor"
              value={formData.instructor}
              onChange={handleChange}
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              {course ? "Update" : "Add"} Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CourseModal;
