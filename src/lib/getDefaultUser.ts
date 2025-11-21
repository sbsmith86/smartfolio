// Server-side helper for getting default user
// Since we removed authentication, all API requests use this hardcoded user

export function getDefaultUser() {
  return {
    user: {
      id: "cm3kdkud20000uvu2q2hk54pl", // Shae's user ID
      email: "shae@example.com",
      name: "Shae Smith",
    },
  };
}
