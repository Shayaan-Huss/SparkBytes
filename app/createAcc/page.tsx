'use client'
import Link from "next/link";
export default function CreateAcc() {
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
  
  }
  return (
    <div className="flex flex-col justify-center items-center min-h-screen text-white bg-buGray">
      <div className="bg-buRed p-6 rounded-lg shadow-lg w-96">
        <h1 className="mb-4 text-center">Create an account for SparkBytes!</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type = "text" placeholder="Username" required className="p-2 border-b-1 border-buGray" />
          <input type="email" placeholder="Email" required className="p-2 border-b-1 border-buGray" />
          <input type="password" placeholder="Password" required className="p-2 border-b-1 border-buGray" />
        </form>
        <button type="submit" className="mt-4 bg-white text-buRed font-bold py-2 px-4 rounded-3xl hover:bg-gray-200 min-w-full">
          Create Account
        </button>
        <div className="text-center mt-4 min-w-full">
          {/* TODO: MAKE THIS LEAD TO LOGIN PAGE ONCE IMPLEMENTED */}
          <Link href="/signin">Already have an Account? Sign in</Link>
        </div>
      </div> 
    </div>
  );
}
  