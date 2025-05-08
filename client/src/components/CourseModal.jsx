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
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (course) {
      setFormData(course);
      if (course.time && course.time.includes("-")) {
        const [start, end] = course.time.split("-").map(s => s.trim());
        setStartTime(start ? start.padStart(5, '0').slice(0,5) : "");
        setEndTime(end ? end.padStart(5, '0').slice(0,5) : "");
      } else {
        setStartTime("");
        setEndTime("");
      }
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
      setStartTime("");
      setEndTime("");
    }
  }, [course, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const timeString = startTime && endTime ? `${startTime} - ${endTime}` : "";
    onSave({ ...formData, time: timeString });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
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
              type="number"
              id="units"
              name="units"
              value={formData.units}
              onChange={e => {
                // Only allow up to 2 digits
                let value = e.target.value.replace(/[^0-9]/g, '').slice(0,2);
                setFormData(prev => ({ ...prev, units: value }));
              }}
              min={1}
              max={99}
              required
              inputMode="numeric"
              pattern="[0-9]*"
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
              />
              <span>-</span>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
              />
            </div>
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
