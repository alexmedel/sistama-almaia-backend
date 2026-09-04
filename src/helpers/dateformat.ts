import moment from "moment";

export const formatDate = (date: Date | string, format = 'YYYY-MM-DD'): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return moment(date).format(format);
}

export const validateDate = (date: Date | string): boolean => {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  return moment(date).isValid();
}