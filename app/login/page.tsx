import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="h-8 w-48 rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
