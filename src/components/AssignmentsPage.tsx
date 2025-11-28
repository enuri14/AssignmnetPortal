import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Assignment, Course } from "../types";
import { fetchAssignments, fetchCourses } from "../api";

const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [coursesData, assignmentsData] = await Promise.all([
          fetchCourses(),
          fetchAssignments(),
        ]);

        setCourses(coursesData);
        setAssignments(assignmentsData);
      } catch (err) {
        console.error(err);
        setError("Could not load assignments.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredAssignments = useMemo(() => {
    let list = assignments;
    if (selectedCourseId !== "all") list = list.filter((a) => a.courseId === selectedCourseId);
    if (search.trim() !== "") {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => (a.title + " " + (a.shortDescription ?? "")).toLowerCase().includes(q));
    }
    return list;
  }, [assignments, selectedCourseId, search]);

  // Group by intakeLabel 
  const groups = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    filteredAssignments.forEach((a) => {
      const key = a.intakeLabel;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return Array.from(map.entries());
  }, [filteredAssignments]);

  function dueWithinWeek(a: Assignment) {
    const now = Date.now();
    const due = new Date(a.dueDate).getTime();
    const diff = due - now;
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }

  function formatRemaining(a: Assignment) {
    const due = new Date(a.dueDate).getTime();
    let diff = Math.max(0, due - Date.now());
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    diff -= days * 24 * 60 * 60 * 1000;
    const hours = Math.floor(diff / (60 * 60 * 1000));
    diff -= hours * 60 * 60 * 1000;
    const minutes = Math.floor(diff / (60 * 1000));
    diff -= minutes * 60 * 1000;
    const seconds = Math.floor(diff / 1000);
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (!parts.length) parts.push(`${seconds}s`);
    return parts.join(" ");
  }

  return (
    <section className="assignments-page">
      <div className="page-header">
        <h1>My assignments</h1>
        <p className="page-subtitle">
          View all released, downloaded, and submitted assignments in one place.
        </p>
      </div>

      <div className="filters-row">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label>
            Course:
            <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
              <option value="all">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} – {c.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display:'flex', alignItems:'center' }}>
            <input
              className="search-input"
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginLeft: 8 }}
            />
          </label>

          
        </div>
      </div>

      {loading && <div className="info-box">Loading assignments…</div>}
      {error && <div className="info-box error">{error}</div>}

      {!loading && !error && groups.length === 0 && (
        <div className="info-box">No assignments found for this filter.</div>
      )}

      {!loading && !error &&
        groups.map(([intakeLabel, list]) => (
          <div key={intakeLabel} className="intake-group">
            <h2 className="intake-heading">{intakeLabel}</h2>

            <div className="table-wrapper">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Short info</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((a) => (
                    <tr
                      key={a.id}
                      className="clickable-row"
                      onClick={() => navigate(`/assignments/${a.id}`)}
                    >
                      <td>{a.title}</td>
                      <td>
                        {a.courseCode ? `${a.courseCode} – ` : ""}
                        {a.courseName ?? ""}
                      </td>
                      <td>
                        <span className={`status-pill status-${a.status.toLowerCase()}`}>
                          {a.status === "Downloaded" ? "⬇️ " : a.status === "Submitted" ? "✅ " : "📤 "}
                          {a.status}
                        </span>
                      </td>
                      <td>
                        {dueWithinWeek(a) ? (
                          <span className="badge-due-urgent">Due in {formatRemaining(a)}</span>
                        ) : (
                          new Date(a.dueDate).toLocaleDateString()
                        )}
                      </td>
                      <td className="short-desc-cell">{a.shortDescription}</td>
                      <td>
                        {a.feedback ? <span className="badge-feedback">Feedback available</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </section>
  );
};

export default AssignmentsPage;
