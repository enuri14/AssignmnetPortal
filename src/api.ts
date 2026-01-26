import type { Assignment, Course } from "./types";


export async function fetchAssignments(): Promise<Assignment[]> {
  /* ---------- nbgrader API ---------- */
  try {
    const res = await fetch("/nbgrader/api/assignments");

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((a: any) => ({
          id: a.assignment_id,
          title: a.assignment_id,
          shortDescription: "Released assignment",
          status: a.submitted
            ? "Submitted"
            : a.downloaded
            ? "Downloaded"
            : "Released",

          courseId: a.course_id,
          courseCode: a.course_id,
          courseName: a.course_id,

          intakeLabel: a.course_id,
          intakeOrder: 1,

          releaseDate: a.release_date ?? "",
          dueDate: a.due_date ?? "",

          notebooks: [],

          submittedDate: a.submission_timestamp ?? undefined,
          feedback: a.feedback_available ? "Feedback available" : undefined,
          marks: a.score ?? undefined
        }));
      }
    }
  } catch {
    
  }

  /* ---------- Fallback: released folders ---------- */
  const res = await fetch("/api/contents/release?content=1");

  if (!res.ok) {
    console.error("Failed to fetch release directory", res.status);
    return [];
  }

  const data = await res.json();

  return (data.content || [])
    .filter((x: any) => x.type === "directory")
    .map((x: any) => ({
      id: x.name,
      title: x.name,
      shortDescription: "Released assignment",
      status: "Released",

      courseId: "default",
      courseCode: "MyCourse",
      courseName: "MyCourse",

      intakeLabel: "Default",
      intakeOrder: 1,

      releaseDate: "",
      dueDate: "",

      notebooks: []
    }));
}

export async function fetchAssignmentById(id: string) {
  const list = await fetchAssignments();
  return list.find(a => a.id === id) ?? null;
}

export async function fetchCourses(): Promise<Course[]> {
  return [
    {
      id: "default",
      code: "MyCourse",
      name: "MyCourse",
      intakeLabel: "Default",
      intakeOrder: 1
    }
  ];
}

/* Tries nbgrader API first, falls back to file system if it fails. */