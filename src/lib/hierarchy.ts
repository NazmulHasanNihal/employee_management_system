export function getUserRank(role?: string, designation?: string): number {
  // Rank is derived from the authoritative `role` field, NOT the free-text
  // `designation` (which a user can edit on their own profile). This prevents
  // privilege escalation by setting designation to "CEO".
  switch (role) {
    case 'CEO':
      return 1;
    case 'Admin':
      return 2;
    case 'HR Manager':
      return 3;
    case 'Director':
      return 4;
    case 'Manager':
      return 5;
    default:
      return 6;
  }
}

export function canModifyUser(
  currentUser: { role?: string; designation?: string; isOwner?: boolean },
  targetUser: { role?: string; designation?: string; isOwner?: boolean }
): boolean {
  // The system owner can never be modified or demoted.
  if (targetUser.isOwner) return false;

  const currentRank = getUserRank(currentUser.role, currentUser.designation);
  const targetRank = getUserRank(targetUser.role, targetUser.designation);

  // A user can only modify someone with a higher numerical rank (lower power).
  return currentRank < targetRank;
}

/**
 * CEO and top executive role are salary-exempt in the standard compensation matrix.
 * CEO sets compensation for COO/CTO and direct executive reports; lower ranks cannot set CEO salary.
 */
export function isSalaryExempt(role?: string): boolean {
  return role === 'CEO';
}

/**
 * Recursively find all employee IDs reporting directly or indirectly under a given managerId.
 */
export function getReportingChainSubordinates(
  managerId: string,
  allUsers: Array<{ id: string; managerId: string | null }>
): Set<string> {
  const subordinates = new Set<string>();
  const queue: string[] = [managerId];
  const visited = new Set<string>([managerId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const u of allUsers) {
      if (u.managerId === current && !visited.has(u.id)) {
        visited.add(u.id);
        subordinates.add(u.id);
        queue.push(u.id);
      }
    }
  }

  return subordinates;
}

/**
 * Check if targetUserId is a subordinate (direct or indirect report) of managerId.
 */
export function isSubordinate(
  managerId: string,
  targetUserId: string,
  allUsers: Array<{ id: string; managerId: string | null }>
): boolean {
  if (!managerId || !targetUserId || managerId === targetUserId) return false;
  const subs = getReportingChainSubordinates(managerId, allUsers);
  return subs.has(targetUserId);
}

