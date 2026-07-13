import AppLayout from "@/components/Layout";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Bypassing auth for local dev
  const mockUser = {
    id: "cmri3jxi700041mmgjct8xyss",
    name: "Nazmul Admin",
    email: "nazmulhas36@gmail.com",
    role: "Admin",
    department: "Engineering",
    designation: "CTO"
  };

  return (
    <AppLayout user={mockUser as any}>
      {children}
    </AppLayout>
  );
}
