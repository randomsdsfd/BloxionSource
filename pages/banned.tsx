// pages/banned.tsx
import { NextPage } from "next";
import Router from "next/router";

const Banned: NextPage = () => {
  const logout = () => {
    // remove session cookie and redirect
    document.cookie = "iron-session=; Max-Age=0; path=/";
    Router.push("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-red-100 via-red-200 to-red-300 dark:from-red-900 dark:via-red-800 dark:to-red-700 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
        <h1 className="text-4xl font-extrabold text-red-600 dark:text-red-400 mb-4">
          Account Suspended
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
          Your account has been suspended and cannot access Bloxion.
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          If you believe this is a mistake, please contact support.
        </p>
        <button
          onClick={logout}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition duration-300 ease-in-out font-semibold text-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Banned;
