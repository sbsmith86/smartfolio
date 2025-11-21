// Default user hook for no-auth mode
// Replace session usage with this hook

export function useDefaultUser() {
  // Use a hardcoded default user ID
  // In a real app without auth, you'd get this from URL params or local storage
  const defaultUser = {
    id: "cm3kdkud20000uvu2q2hk54pl", // Shae's user ID from your database
    email: "shae@example.com",
    name: "Shae Smith",
    firstName: "Shae",
    lastName: "Smith",
  };

  return {
    data: { user: defaultUser },
    status: "authenticated" as const,
  };
}
