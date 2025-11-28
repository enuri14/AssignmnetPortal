export type AssignmentStatus = "Released" | "Downloaded" | "Submitted";

export interface Notebook {
  id: string;
  name: string;
  type: string;
  viewUrl: string;
  downloadUrl: string;
}

export interface Assignment {
  id: string;
  title: string;
  shortDescription: string;
  status: AssignmentStatus;
  courseId: string;
  courseCode?: string;  
  courseName?: string;   
  intakeLabel: string;  
  intakeOrder: number;   
  releaseDate: string;   
  dueDate: string;       
  notebooks: Notebook[];

  //  for submissions/feedback
  submittedDate?: string;
  feedback?: string;
  marks?: string | number;
  feedbackUrl?: string;
  submittedPackageUrl?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  intakeLabel: string;
  intakeOrder: number;
}
