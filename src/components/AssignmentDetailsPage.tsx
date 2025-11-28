import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import type { Assignment, Notebook } from "../types";
import { fetchAssignmentById } from "../api";

const AssignmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<Assignment["status"] | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const assignmentId = id as string;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchAssignmentById(assignmentId);
        setAssignment(data);
        setLocalStatus(data.status);
      } catch (err) {
        console.error(err);
        setError("Could not load assignment.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleViewNotebook = (nb: Notebook) => {
    window.open(nb.viewUrl, "_blank", "noopener,noreferrer");
  };


  const handleDownloadAll = () => {
    if (!assignment) return;
    assignment.notebooks.forEach((nb) => window.open(nb.downloadUrl, "_blank", "noopener,noreferrer"));
    setLocalStatus("Downloaded");
  };

  const handleDownloadAssignment = () => {
    if (!assignment) return;
    // If there are notebooks, download them allwith the assignment
    if (assignment.notebooks && assignment.notebooks.length > 0) {
  
      const url = `/api/assignments/${assignment.id}/package`;
      try {
        window.open(url, "_blank", "noopener,noreferrer");
        setLocalStatus("Downloaded");
      } catch (err) {
        console.warn("Package download not available, falling back.", err);
        handleDownloadAll();
      }
      return;
    }

    const url = `/api/assignments/${assignment.id}/download`;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
      setLocalStatus("Downloaded");
    } catch (err) {
      console.warn("Download not available, simulating download.", err);
      alert("Downloading assignment (simulated).");
      setLocalStatus("Downloaded");
    }
  };

  const handleDownloadFeedback = () => {
    if (!assignment) return;
    const url = (assignment as any).feedbackUrl ?? null;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      alert("Feedback download not available.");
    }
  };

  const handleDownloadSubmittedPackage = () => {
    if (!assignment) return;
    const url = (assignment as any).submittedPackageUrl ?? null;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      alert("Submitted package not available.");
    }
  };

  const handleSubmitAssignment = () => {
    if (!assignment) return;
    const now = new Date().toISOString();
    
    setAssignment({ ...assignment, submittedDate: now });
    setLocalStatus("Submitted");
    alert("Assignment submitted (simulated).");
  };

  if (loading) return <div className="info-box">Loading assignment…</div>;
  if (error || !assignment)
    return (
      <div className="info-box error">
        {error ?? "Assignment not found."}
        <div style={{ marginTop: 8 }}>
          <button className="primary-btn" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </div>
    );

  return (
    <section className="assignment-details notebook assignment-details-large">
      <div className="breadcrumbs">
        <Link to="/" className="back-link" aria-label="Back to assignments">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Back to assignments</span>
        </Link>
      </div>

      <header className="details-header">
        <h1>{assignment.title}</h1>
        <span className={`status-pill status-${(localStatus ?? assignment.status).toLowerCase()}`}>
          {localStatus ?? assignment.status}
        </span>
      </header>

      <div className="details-actions" style={{ marginTop: 12, marginBottom: 12 }}>
      
        {
          (() => {
            const hasFeedbackUrl = Boolean((assignment as any).feedbackUrl);
            const hasFeedback = Boolean(assignment.feedback);
            
            // Only offer feedback download when feedback is available 
            const canDownloadFeedback = hasFeedbackUrl || hasFeedback;

            return canDownloadFeedback ? (
              <div style={{ display: 'inline-flex', gap: 8 }}>
                <button className="download-feedback-btn" onClick={handleDownloadFeedback}>Download feedback</button>
                {(assignment as any).submittedDate ? (
                  <button className="redownload-btn" onClick={handleDownloadSubmittedPackage}>Download submitted</button>
                ) : null}
              </div>
            ) : null;
          })()
        }
      </div>

      <div className="meta-band">
        <div className="meta-item">
          <div className="meta-label">Status</div>
          <div className="meta-value">
            <span className={`status-pill status-${(localStatus ?? assignment.status).toLowerCase()}`}>
              {localStatus ?? assignment.status}
            </span>
          </div>
        </div>

        <div className="meta-item">
          <div className="meta-label">Submitted</div>
          <div className="meta-value">{(assignment as any).submittedDate ? new Date((assignment as any).submittedDate).toLocaleString() : "—"}</div>
        </div>

        <div className="meta-item">
          <div className="meta-label">Release</div>
          <div className="meta-value">{new Date(assignment.releaseDate).toLocaleString()}</div>
        </div>

        <div className="meta-item">
          <div className="meta-label">Due</div>
          <div className="meta-value">{new Date(assignment.dueDate).toLocaleString()}</div>
        </div>
      </div>

      <section className="details-section nb-cell markdown-cell overview-card">
        <h2>Overview</h2>
        <p>{assignment.shortDescription}</p>
      </section>

      <section className="details-section allocated-box">
        <h2 className="allocated-title">Allocated notebooks</h2>

        <div style={{ marginBottom: 10 }}>
          {localStatus === "Downloaded" ? (
            <button className="redownload-btn" onClick={handleDownloadAssignment} style={{ padding: '10px 14px' }}>
              Redownload package + notebooks
            </button>
          ) : (
            <button className="download-all-btn" onClick={handleDownloadAssignment} style={{ padding: '10px 14px' }}>
              Download package + notebooks
            </button>
          )}
        </div>

        {assignment.notebooks.length === 0 ? (
          <div className="empty-state">
            <div style={{ marginBottom: 8 }}>No notebooks allocated for this assignment.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="notebook-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignment.notebooks.map((nb) => (
                  <tr key={nb.id}>
                    <td>{nb.name}</td>
                    <td>{nb.type}</td>
                    <td>
                      <button className="view-btn" onClick={() => handleViewNotebook(nb)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </section>

      <section className="details-section submit-action">
        <h2>Submit assignment</h2>
        { (assignment as any).submittedDate ? (
          <div>
            <div className="muted">Already submitted on {new Date((assignment as any).submittedDate).toLocaleString()}</div>
          </div>
        ) : (
          <div>
            <p className="muted">When you are ready, submit your assignment here.</p>
            {localStatus === "Downloaded" ? (
              <div style={{ marginTop: 10 }}>
                <button className="primary-btn" onClick={handleSubmitAssignment}>Submit assignment</button>
              </div>
            ) : (
              <div style={{ marginTop: 10 }}><p className="muted">Download the package to enable submission.</p></div>
            )}
          </div>
        )}
      </section>

      <section className="details-section nb-cell submission-card">
        <h2>Submission & Feedback</h2>
        {(assignment as any).submittedDate ? (
          <div className="submission-row">
            <div>
              <div className="submission-label">Submitted</div>
              <div className="submission-value">{new Date((assignment as any).submittedDate).toLocaleString()}</div>
            </div>
            {(assignment as any).marks ? <div className="marks-pill">{(assignment as any).marks}</div> : null}
          </div>
        ) : (
          <p className="muted">Not submitted yet.</p>
        )}

        {(assignment as any).feedback ? <div className="feedback-text">{(assignment as any).feedback}</div> : null}
      </section>
    </section>
  );
};

export default AssignmentDetailsPage;
