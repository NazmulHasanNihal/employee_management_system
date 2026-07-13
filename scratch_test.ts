import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: null as any,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log(`Verification URL for ${user.email}: ${url}`);
    }
  }
});
