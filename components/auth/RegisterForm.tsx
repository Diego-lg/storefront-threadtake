"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { signIn } from "next-auth/react"; // Removed unused signIn import
import { Button } from "@/components/ui/button"; // Corrected to named import
import toast from "react-hot-toast";

const RegisterForm = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendRegisterUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/register`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(backendRegisterUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name || undefined, // Send name only if provided
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle errors from the backend (e.g., email taken, validation errors)
        setError(data.message || `Registration failed: ${response.statusText}`);
        toast.error(
          data.message || `Registration failed: ${response.statusText}`
        );
        setIsLoading(false);
        return;
      }

      // Registration successful!
      toast.success("Registration successful! Please log in.");

      // Option 1: Redirect to login page
      router.push("/login");

      // Option 2: Attempt to automatically log the user in (more complex error handling needed)
      /*
      const signInResult = await signIn('credentials', {
        redirect: false,
        email: email,
        password: password,
      });

      setIsLoading(false);

      if (signInResult?.error) {
        // Handle potential sign-in errors even after successful registration
        setError(`Registration successful, but auto-login failed: ${signInResult.error}. Please log in manually.`);
        toast.error(`Registration successful, but auto-login failed. Please log in manually.`);
        router.push('/login'); // Redirect to login even if auto-login fails
      } else if (signInResult?.ok) {
        toast.success('Logged in successfully!');
        router.push('/'); // Redirect to home page after successful auto-login
        router.refresh();
      }
      */
    } catch (err) {
      setIsLoading(false);
      console.error("Registration Submit Catch:", err);
      setError("An unexpected error occurred during registration.");
      toast.error("An unexpected error occurred during registration.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-center text-sm font-medium text-red-600 bg-red-100 p-2 rounded">
          {error}
        </p>
      )}
      <div className="space-y-1">
        <label
          htmlFor="name"
          className="text-sm font-light uppercase tracking-widest text-white"
        >
          Name (Optional)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="text-sm font-light uppercase tracking-widest text-white"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="text-sm font-light uppercase tracking-widest text-white"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Registering..." : "Register"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Login here
        </a>
      </p>
    </form>
  );
};

export default RegisterForm;
