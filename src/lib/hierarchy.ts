export function getUserRank(role?: string, designation?: string): number {
  const desigLower = (designation || '').toLowerCase();
  
  if (desigLower.includes('ceo') || desigLower.includes('founder')) {
    return 1;
  }
  
  switch (role) {
    case 'Admin':
      return 2;
    case 'HR Manager':
      return 3;
    case 'Manager':
      return 4;
    default:
      return 5;
  }
}

export function canModifyUser(currentUser: { role?: string, designation?: string }, targetUser: { role?: string, designation?: string }): boolean {
  const currentRank = getUserRank(currentUser.role, currentUser.designation);
  const targetRank = getUserRank(targetUser.role, targetUser.designation);
  
  // A user can only modify someone with a higher numerical rank (meaning lower power)
  return currentRank < targetRank;
}
