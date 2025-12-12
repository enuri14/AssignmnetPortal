import type { Assignment, Course } from "./types";
const BASE_URL = "https://6918a71f21a963594870c7d7.mockapi.io";

export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch(`${BASE_URL}/courses`);
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const res = await fetch(`${BASE_URL}/assignments`);
  if (!res.ok) throw new Error("Failed to fetch assignments");
  const data: Assignment[] = await res.json();

  // Filter out non-assignment items (e.g., user records, invalid data)
  const validAssignments = data.filter(
    (item) => item.status && item.courseId && item.intakeLabel && item.dueDate
  );
  
  return validAssignments.sort((a, b) => {
    // by intake (order), then by due date
    if (a.intakeOrder !== b.intakeOrder) {
      return a.intakeOrder - b.intakeOrder;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export async function fetchAssignmentById(id: string): Promise<Assignment> {
  const res = await fetch(`${BASE_URL}/assignments/${id}`);
  if (!res.ok) throw new Error("Failed to fetch assignment");
  return res.json();
}
