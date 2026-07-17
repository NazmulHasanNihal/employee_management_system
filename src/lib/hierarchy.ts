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
