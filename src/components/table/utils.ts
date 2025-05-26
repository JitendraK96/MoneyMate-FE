/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

const IGNORE_PATTERNS: RegExp[] = [
  /id/i,
  /user_id/i,
  /created_at/i,
  /updated_at/i,
  /updatedtime/i,
];

export const searchFilter = ({ rows, term }: any) => {
  return rows.filter((row: any) => {
    return Object.entries(row)
      .filter(([key]) => !IGNORE_PATTERNS.some((pattern) => pattern.test(key)))
      .some(([_, val]) => {
        return val?.toString().toLowerCase().includes(term);
      });
  });
};
