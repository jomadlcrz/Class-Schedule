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
  const [error, setError] = useState("");
  const [originalData, setOriginalData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate time options from 7:00 AM to 9:00 PM
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 7; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        const time = `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
        // Store 24-hour format as value but display 12-hour format
        const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push({ value, time });
      }
    }
    // Sort options by their 24-hour value
    return options.sort((a, b) => a.value.localeCompare(b.value));
  };

  const timeOptions = generateTimeOptions();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleStartTimeChange = (e) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    // If end time is earlier than new start time, reset it
    if (endTime && newStartTime > endTime) {
      setEndTime("");
    }
  };

  const handleEndTimeChange = (e) => {
    const newEndTime = e.target.value;
    if (!startTime) {
      setError("Please select start time first");
      return;
    }
    if (newEndTime <= startTime) {
      setError("End time must be later than start time");
      return;
    }
    setEndTime(newEndTime);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!startTime || !endTime) {
      setError("Please select both start and end times");
      return;
    }
    const timeString = `${startTime} - ${endTime}`;
    setIsSubmitting(true);
    try {
      await onSave({ ...formData, time: timeString });
      onClose();
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("An error occurred while saving the course");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (course) {
      const newFormData = { ...course };
      setFormData(newFormData);
      let startTimeValue = "";
      let endTimeValue = "";
      
      if (course.time && course.time.includes("-")) {
        const [start, end] = course.time.split("-").map(s => s.trim());
        startTimeValue = start ? start.padStart(5, '0').slice(0,5) : "";
        endTimeValue = end ? end.padStart(5, '0').slice(0,5) : "";
        setStartTime(startTimeValue);
        setEndTime(endTimeValue);
      } else {
        setStartTime("");
        setEndTime("");
      }
      // Store original data for edit mode
      setOriginalData({
        ...newFormData,
        startTime: startTimeValue,
        endTime: endTimeValue
      });
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
      setOriginalData(null);
    }
    setError("");
  }, [course, isOpen]);

  const hasChanges = () => {
    if (!course) return false; // For new course, always consider as changed
    if (!originalData) return true;
    
    return formData.courseCode !== originalData.courseCode ||
           formData.title !== originalData.title ||
           formData.units !== originalData.units ||
           formData.days !== originalData.days ||
           formData.room !== originalData.room ||
           formData.instructor !== originalData.instructor ||
           startTime !== originalData.startTime ||
           endTime !== originalData.endTime;
  };

  const hasAnyValue = () => {
    return formData.courseCode || 
           formData.title || 
           formData.units || 
           formData.days || 
           startTime || 
           endTime || 
           formData.room || 
           formData.instructor;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => {
      // For add form: prevent closing if any field has value
      // For edit form: prevent closing if there are changes
      if (e.target === e.currentTarget) {
        if (!course && hasAnyValue()) {
          return; // Don't close if any field has value in add form
        }
        if (course && hasChanges()) {
          return; // Don't close if there are changes in edit form
        }
        onClose();
      }
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{course ? "Edit Course" : "Add New Course"}</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
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
              <select
                id="startTime"
                name="startTime"
                value={startTime}
                onChange={handleStartTimeChange}
                required
                className="time-select"
              >
                <option value="">Select start time</option>
                {timeOptions.map(({ value, time }) => (
                  <option key={`start-${value}`} value={value}>
                    {time}
                  </option>
                ))}
              </select>
              <span>-</span>
              <select
                id="endTime"
                name="endTime"
                value={endTime}
                onChange={handleEndTimeChange}
                required
                className="time-select"
                disabled={!startTime}
              >
                <option value="">Select end time</option>
                {timeOptions
                  .filter(({ value }) => !startTime || value > startTime)
                  .map(({ value, time }) => (
                    <option key={`end-${value}`} value={value}>
                      {time}
                    </option>
                  ))}
              </select>
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
            <button type="submit" className="save-button" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : (course ? "Update" : "Add") + " Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CourseModal;
