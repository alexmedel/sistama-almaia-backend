import { Student } from './Student';

export class RecentAlert {
  student: Student;
  alertType: string;
  date: string;

  constructor() {
    this.student = new Student();
    this.alertType = '';
    this.date = '';
  }
}
