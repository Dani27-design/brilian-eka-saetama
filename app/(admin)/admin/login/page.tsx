"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/db/firebase/firebaseConfig";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setError("Invalid login credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-blacksection">
      <div className="w-full max-w-md rounded-lg border border-stroke bg-white p-8 shadow-md dark:border-strokedark dark:bg-black">
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/logo/logo-light.svg"
            alt="Logo"
            width={150}
            height={50}
            className="dark:hidden"
          />
          <Image
            src="/images/logo/logo-dark.svg"
            alt="Logo"
            width={150}
            height={50}
            className="hidden dark:block"
          />
        </div>
        <h1 className="mb-6 text-center text-2xl font-bold text-black dark:text-white">
          Admin Login
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              className="mb-2.5 block font-medium text-black dark:text-white"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input w-full rounded-lg border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary disabled:cursor-default dark:focus:border-primary"
            />
          </div>

          <div className="mb-6">
            <label
              className="mb-2.5 block font-medium text-black dark:text-white"
              htmlFor="password"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input w-full rounded-lg border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary disabled:cursor-default dark:focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-primary px-10 py-3 text-white transition hover:bg-opacity-90 disabled:bg-opacity-70"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
