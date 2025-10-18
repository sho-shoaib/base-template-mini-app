"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { APP_NAME } from "~/lib/constants";

// note: dynamic import is required for components that use the Frame SDK
const Demo = dynamic(() => import("~/components/Demo"), {
  ssr: false,
});

export default function App(
  { title }: { title?: string } = { title: APP_NAME }
) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          {title}
        </h1>
        <p className="text-xl text-gray-300">
          Trade together. Invest smarter. Grow wealth.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        {/* Trader Button */}
        <Link
          href={"/trader"}
          className="flex-1 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-8 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50"
        >
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="text-6xl">📊</div>
            <h2 className="text-3xl font-bold text-white">I am a Trader</h2>
            <p className="text-purple-100">
              Create vaults, build your team, and earn performance fees
            </p>
            <div className="mt-4 flex gap-2 text-sm text-purple-200">
              <span className="bg-purple-700/50 px-3 py-1 rounded-full">
                Build Vaults
              </span>
              <span className="bg-purple-700/50 px-3 py-1 rounded-full">
                Earn Fees
              </span>
            </div>
          </div>
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-600/0 group-hover:from-purple-400/20 group-hover:to-purple-600/20 transition-all duration-300" />
        </Link>

        {/* Investor Button */}
        <button className="flex-1 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/50">
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="text-6xl">💰</div>
            <h2 className="text-3xl font-bold text-white">I want to Invest</h2>
            <p className="text-blue-100">
              Browse expert vaults, track performance, and grow your wealth
            </p>
            <div className="mt-4 flex gap-2 text-sm text-blue-200">
              <span className="bg-blue-700/50 px-3 py-1 rounded-full">
                Browse Vaults
              </span>
              <span className="bg-blue-700/50 px-3 py-1 rounded-full">
                Track Returns
              </span>
            </div>
          </div>
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/20 group-hover:to-blue-600/20 transition-all duration-300" />
        </button>
      </div>

      {/* Stats Section */}
      <div className="mt-16 grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="text-4xl font-bold text-white">$2.4M+</div>
          <div className="text-gray-400 mt-2">Total AUM</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-white">156</div>
          <div className="text-gray-400 mt-2">Active Vaults</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-white">1,200+</div>
          <div className="text-gray-400 mt-2">Investors</div>
        </div>
      </div>
    </div>
  );
}
