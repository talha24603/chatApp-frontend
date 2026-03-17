import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Welcome to ChatApp
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Connect and chat with friends and groups
        </p>
        <div className="space-x-4">
          <Link
            href="/signup"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Register
          </Link>
          <Link
            href="/signin"
            className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
