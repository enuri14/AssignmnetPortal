import type { Assignment, Course } from "./types";
import { URLExt } from "@jupyterlab/coreutils";
import { ServerConnection } from "@jupyterlab/services";


export async function requestAPI<T>(
  endPoint: string = "",
  init: RequestInit = {}
): Promise<T> {

  const settings = ServerConnection.makeSettings();

  
  const requestUrl = URLExt.join(settings.baseUrl, endPoint);

  // Send request using Jupyter's internal request handler
  const response = await ServerConnection.makeRequest(
    requestUrl,
    init,
    settings
  );

 
  const data = await response.json();

  // Throw error if request failed
  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message);
  }

  return data;
}

/* 
   Fetch all assignments (from all courses)
    */
export async function fetchAssignments(): Promise<Assignment[]> {
  try {
    //  Fetch available courses from nbgrader
    const coursesResponse = await requestAPI<any>("courses");

    if (!coursesResponse.success || !Array.isArray(coursesResponse.value)) {
      return [];
    }

    // Map used to remove duplicate assignments
    const assignmentMap = new Map<string, Assignment>();

    // Status priority (higher value = more advanced state)
    const STATUS_PRIORITY: Record<Assignment["status"], number> = {
      Released: 1,
      Downloaded: 2,
      Submitted: 3
    };

    // Map nbgrader status → UI-friendly status
    const STATUS_MAP: Record<string, Assignment["status"]> = {
      released: "Released",
      fetched: "Downloaded",
      submitted: "Submitted"
    };

    //  Fetch assignments for each course
    for (const courseId of coursesResponse.value) {
      // Build query parameters using dictionary
      const queryParams = new URLSearchParams({ course_id: courseId });

      const assignmentsResponse = await requestAPI<any>(
        `assignments?${queryParams.toString()}`
      );

      if (!assignmentsResponse.success || !Array.isArray(assignmentsResponse.value)) {
        continue;
      }

      //  Process each assignment record
      for (const rawAssignment of assignmentsResponse.value) {
        const assignmentStatus =
          STATUS_MAP[rawAssignment.status] ?? "Released";

        // Unique key per course + assignment
        const assignmentKey = `${rawAssignment.course_id}::${rawAssignment.assignment_id}`;
        const existingAssignment = assignmentMap.get(assignmentKey);

        // Keep the assignment with the most advanced status
        if (
          !existingAssignment ||
          STATUS_PRIORITY[assignmentStatus] >
            STATUS_PRIORITY[existingAssignment.status]
        ) {
          assignmentMap.set(assignmentKey, {
            id: rawAssignment.assignment_id,
            title: rawAssignment.assignment_id,
            shortDescription: "Released assignment",

            status: assignmentStatus,

            courseId: rawAssignment.course_id,
            courseCode: rawAssignment.course_id,
            courseName: rawAssignment.course_id,

            intakeLabel: rawAssignment.course_id,
            intakeOrder: 1,

            releaseDate: rawAssignment.release_date ?? "",
            dueDate: rawAssignment.due_date ?? "",

            notebooks: rawAssignment.notebooks ?? [],

            submittedDate:
              rawAssignment.submissions?.length > 0
                ? rawAssignment.submissions[0].timestamp
                : undefined,

            feedback:
              rawAssignment.has_exchange_feedback ||
              rawAssignment.has_local_feedback
                ? "Feedback available"
                : undefined,

            marks: rawAssignment.score ?? undefined
          });
        }
      }
    }

    // Convert Map → Array for UI consumption
    return Array.from(assignmentMap.values());
  } catch (error) {
    console.error("Failed to fetch assignments", error);
    return [];
  }
}

/* 
   Fetch assignment by ID
   */
export async function fetchAssignmentById(
  assignmentId: string
): Promise<Assignment | null> {
  const assignments = await fetchAssignments();
  return assignments.find(a => a.id === assignmentId) ?? null;
}

/* 
   Fetch courses
   */
export async function fetchCourses(): Promise<Course[]> {
  try {
    const coursesResponse = await requestAPI<any>("courses");

    if (!coursesResponse.success || !Array.isArray(coursesResponse.value)) {
      return [];
    }

    // Convert course IDs into Course objects
    return coursesResponse.value.map((courseId: string) => ({
      id: courseId,
      code: courseId,
      name: courseId,
      intakeLabel: courseId,
      intakeOrder: 1
    }));
  } catch {
    return [];
  }
}