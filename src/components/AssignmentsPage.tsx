import React, { useEffect, useState, useMemo } from "react";
import { useHistory } from "react-router-dom";
import type { Assignment, Course } from "../types";
import { fetchAssignments, fetchCourses } from "../api";



function getDueTime(a: Assignment): number | null {
  if (!a.dueDate) return null;
  const t = new Date(a.dueDate).getTime();
  return isNaN(t) ? null : t;
}

function isDueSoon(a: Assignment) {
  const due = getDueTime(a);
  if (!due) return false;
  const diff = due - Date.now();
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function isOverdue(a: Assignment) {
  const due = getDueTime(a);
  if (!due) return false;
  return due < Date.now() && a.status !== "Submitted";
}

/* ---------- component ---------- */

const AssignmentsPage: React.FC = () => {
  const history = useHistory();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [c, a] = await Promise.all([
          fetchCourses(),
          fetchAssignments()
        ]);
        setCourses(c ?? []);
        setAssignments(a ?? []);
      } catch (e) {
        console.error(e);
        setError("Could not load assignments.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------- filtering ---------- */

  const filtered = useMemo(() => {
    let list = assignments;

    if (selectedCourseId !== "all") {
      list = list.filter(a => a.courseId === selectedCourseId);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        `${a.title} ${a.shortDescription ?? ""}`.toLowerCase().includes(q)
      );
    }

    return list;
  }, [assignments, selectedCourseId, search]);

  /* ---------- grouping ---------- */

  const groups = useMemo<Array<[string, Assignment[]]>>(() => {
    const hasIntake = filtered.some(a => a.intakeLabel);
    if (!hasIntake) {
      return [["All Assignments", filtered]];
    }

    const map = new Map<string, Assignment[]>();
    filtered.forEach(a => {
      const key = a.intakeLabel ?? "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });

    return Array.from(map.entries());
  }, [filtered]);

  /* ---------- render ---------- */

  return (
    <section className="assignments-page">
      <div className="page-header">
        <h1>Assignment list</h1>
        <p className="page-subtitle">
          View all released, downloaded and submitted assignments.
        </p>
      </div>

      <div className="filters-row">
        <label>
          Course:
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
          >
            <option value="all">All courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} – {c.name}
              </option>
            ))}
          </select>
        </label>

        <input
          placeholder="Search assignments…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="info-box">Loading assignments…</div>}
      {error && <div className="info-box error">{error}</div>}

      {!loading &&
        !error &&
        groups.map(([label, list]) => (
          <div key={label} className="intake-group">
            <h2 className="intake-heading">{label}</h2>

            <div className="table-wrapper">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Info</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(a => (
                    <tr
                      key={a.id}
                      className="clickable-row"
                      onClick={() => history.push(`/assignments/${a.id}`)}
                    >
                      <td>{a.title}</td>

                      <td>
                        {a.courseCode ? `${a.courseCode} – ` : ""}
                        {a.courseName ?? ""}
                      </td>

                      <td>
                        <span
                          className={`status-pill status-${a.status.toLowerCase()}`}
                        >
                          {a.status}
                        </span>
                      </td>

                      <td>
                        {(() => {
                          const due = getDueTime(a);
                          if (!due) return "—";
                          if (isOverdue(a))
                            return (
                              <span className="badge-due-urgent">Overdue</span>
                            );
                          if (isDueSoon(a))
                            return (
                              <span className="badge-due-urgent">Due soon</span>
                            );
                          return new Date(due).toLocaleDateString();
                        })()}
                      </td>

                      <td className="short-desc-cell">
                        {a.shortDescription ?? ""}
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