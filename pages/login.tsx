"use client";

import { NextPage } from "next";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import React, { useEffect, useState, useRef } from "react";
import { useRecoilState } from "recoil";
import { loginState } from "@/state";
import Button from "@/components/button";
import Router from "next/router";
import axios from "axios";
import Input from "@/components/input";
import Link from "next/link";
import { useTheme } from "next-themes";
import ThemeToggle from "@/components/ThemeToggle";
import { Dialog } from "@headlessui/react";
import { IconX } from "@tabler/icons-react";
import { OAuthAvailable } from "@/hooks/useOAuth";

type LoginForm = { username: string; password: string };
type SignupForm = { username: string; password: string; verifypassword: string };

const Login: NextPage = () => {
  const [login, setLogin] = useRecoilState(loginState);
  const { isAvailable: isOAuth } = OAuthAvailable();

  const loginMethods = useForm<LoginForm>();
  const signupMethods = useForm<SignupForm>();

  const { register: regLogin, handleSubmit: submitLogin, setError: setErrLogin } = loginMethods;
  const { register: regSignup, handleSubmit: submitSignup, setError: setErrSignup, getValues: getSignupValues } = signupMethods;

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signupStep, setSignupStep] = useState<0 | 1 | 2>(0);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCopyright, setShowCopyright] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // background gradient animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const style = getComputedStyle(document.documentElement);
    const colors = [
      style.getPropertyValue("--gradient-color-1").trim() || "#00d0bc",
      style.getPropertyValue("--gradient-color-2").trim() || "#005253",
      style.getPropertyValue("--gradient-color-3").trim() || "#6529ff",
      style.getPropertyValue("--gradient-color-4").trim() || "#822eff",
    ];

    let width = window.innerWidth, height = window.innerHeight, angle = 0;
    canvas.width = width;
    canvas.height = height;

    const animate = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      angle += 0.002;
      const x = Math.cos(angle) * width;
      const y = Math.sin(angle) * height;

      const grad = ctx.createLinearGradient(0, 0, x, y);
      colors.forEach((color, i) => grad.addColorStop(i / (colors.length - 1), color));

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      requestAnimationFrame(animate);
    };

    animate();
    const resize = () => (canvas.width = window.innerWidth, canvas.height = window.innerHeight);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    loginMethods.reset();
    signupMethods.reset();
    setVerificationError(false);
    setLoading(false);
  }, [mode]);

  const onSubmitLogin: SubmitHandler<LoginForm> = async (data) => {
    setLoading(true);
    try {
      let req;
      try {
        req = await axios.post("/api/auth/login", data);
      } catch (e: any) {
        setLoading(false);
        if (e.response.status === 404) {
          setErrLogin("username", { type: "custom", message: e.response.data.error });
          return;
        }
        if (e.response.status === 401) {
          setErrLogin("password", { type: "custom", message: e.response.data.error });
          return;
        }
        setErrLogin("username", { type: "custom", message: "Something went wrong" });
        setErrLogin("password", { type: "custom", message: "Something went wrong" });
        return;
      }
      const { data: res } = req;
      setLogin({ ...res.user, workspaces: res.workspaces });
      Router.push("/");
    } catch (e: any) {
      const msg = e.response?.data?.error || "Something went wrong";
      const status = e.response?.status;

      if (status === 404 || status === 401) {
        setErrLogin("username", { type: "custom", message: msg });
        if (status === 401) setErrLogin("password", { type: "custom", message: msg });
      } else {
        setErrLogin("username", { type: "custom", message: msg });
        setErrLogin("password", { type: "custom", message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSignup: SubmitHandler<SignupForm> = async ({ username, password, verifypassword }) => {
    if (password !== verifypassword) {
      setErrSignup("verifypassword", { type: "validate", message: "Passwords must match" });
      return;
    }
    setLoading(true);
    setVerificationError(false);
    try {
      const { data } = await axios.post("/api/auth/signup/start", { username });
      setVerificationCode(data.code);
      setSignupStep(2);
    } catch (e: any) {
      setErrSignup("username", {
        type: "custom",
        message: e.response?.data?.error || "Unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyAgain = async () => {
    setLoading(true);
    setVerificationError(false);

    const { password } = getSignupValues();

    try {
      const { data } = await axios.post("/api/auth/signup/finish", { password, code: verificationCode });
      if (data.success) Router.push("/");
      else setVerificationError(true);
    } catch {
      setVerificationError(true);
    } finally {
      setLoading(false);
    }
  };

  const { theme } = useTheme();

  return (
    <>
      <div className="relative flex items-center justify-center h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.4)] p-10 text-center transition-all duration-300 hover:shadow-[0_12px_60px_rgba(0,0,0,0.45)]">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>

          <div className="flex justify-center space-x-8 mb-8">
            {["login", "signup"].map(m => {
              const isActive = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m as any)}
                  type="button"
                  disabled={loading}
                  className={`pb-2 text-lg font-semibold transition-all ${
                    isActive
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 border-b-2 border-emerald-400"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {m === "login" ? "Login" : "Sign Up"}
                </button>
              );
            })}
          </div>

          {/* LOGIN */}
          {mode === "login" && (
            <>
              <h1 className="text-3xl font-semibold text-white/90 mb-2">
                👋 Welcome to <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Orbit</span>
              </h1>
              <p className="text-zinc-400 mb-8">Login to your account to continue</p>

              <FormProvider {...loginMethods}>
                <form onSubmit={submitLogin(onSubmitLogin)} className="space-y-6">
                  <Input label="Username" placeholder="Username" id="username" {...regLogin("username", { required: "Required" })} />
                  <Input label="Password" placeholder="Password" type={showPassword ? "text" : "password"} id="password" {...regLogin("password", { required: "Required" })} />

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-zinc-400 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={() => setShowPassword(v => !v)}
                        className="mr-2 accent-emerald-400 bg-zinc-700 border-zinc-600 rounded"
                      />
                      Show password
                    </label>
                    <Link href="/forgot-password" className="text-emerald-400 hover:underline">Forgot?</Link>
                  </div>

                  <Button type="submit" loading={loading} disabled={loading} classoverride="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-90 text-white shadow-[0_0_25px_rgba(0,255,200,0.4)]">
                    Login
                  </Button>

                  {isOAuth && (
                    <div className="mt-6">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-zinc-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-transparent px-2 text-zinc-500">Or</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.location.href = "/api/auth/roblox/start"}
                        disabled={loading}
                        className="w-full py-3 rounded-xl border border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700 flex items-center justify-center transition-all"
                      >
                        <img src="/roblox.svg" alt="Roblox" className="w-5 h-5 mr-2" />
                        Continue with Roblox
                      </button>
                    </div>
                  )}
                </form>
              </FormProvider>
            </>
          )}

          {/* SIGNUP */}
          {mode === "signup" && (
            <>
              {signupStep === 0 && (
                <>
                  <h1 className="text-3xl font-semibold text-white/90 mb-2">🔨 Create an account</h1>
                  <p className="text-zinc-400 mb-8">Set up your new Orbit account</p>
                  <FormProvider {...signupMethods}>
                    <form onSubmit={e => { e.preventDefault(); setSignupStep(1); }} className="space-y-6">
                      <Input label="Username" placeholder="Username" id="signup-username" {...regSignup("username", { required: "Required" })} />
                      <Button type="submit" classoverride="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-white hover:opacity-90 shadow-[0_0_25px_rgba(0,255,200,0.4)]">
                        Continue
                      </Button>
                    </form>
                  </FormProvider>

                  {isOAuth && (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => window.location.href = "/api/auth/roblox/start"}
                        disabled={loading}
                        className="w-full py-3 rounded-xl border border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700 flex items-center justify-center transition-all"
                      >
                        <img src="/roblox.svg" alt="Roblox" className="w-5 h-5 mr-2" />
                        Sign up with Roblox
                      </button>
                    </div>
                  )}
                </>
              )}

              {signupStep === 1 && (
                <>
                  <h1 className="text-3xl font-semibold text-white/90 mb-2">🔒 Secure your account</h1>
                  <p className="text-zinc-400 mb-8">Choose a password to continue</p>

                  <FormProvider {...signupMethods}>
                    <form onSubmit={submitSignup(onSubmitSignup)} className="space-y-6">
                      <Input label="Password" type="password" id="signup-password" {...regSignup("password", { required: "Required" })} />
                      <Input label="Verify Password" type="password" id="signup-verify-password" {...regSignup("verifypassword", { required: "Required" })} />
                      <div className="flex gap-3">
                        <Button type="button" onPress={() => setSignupStep(0)} classoverride="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl">Back</Button>
                        <Button type="submit" loading={loading} disabled={loading} classoverride="flex-1 py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-white rounded-xl hover:opacity-90">Continue</Button>
                      </div>
                    </form>
                  </FormProvider>
                </>
              )}

              {signupStep === 2 && (
                <>
                  <h1 className="text-3xl font-semibold text-white/90 mb-2">✅ Verify account</h1>
                  <p className="text-zinc-400 mb-4">Paste this code into your Roblox profile bio:</p>
                  <p className="font-mono text-white bg-zinc-800 py-3 rounded-lg select-all mb-4">{verificationCode}</p>
                  {verificationError && <p className="text-red-400 mb-4">Verification failed, please try again.</p>}
                  <div className="flex gap-3">
                    <Button onPress={() => setSignupStep(1)} classoverride="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl">Back</Button>
                    <Button onPress={onVerifyAgain} loading={loading} disabled={loading} classoverride="flex-1 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-90 text-white rounded-xl">Verify</Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="fixed bottom-4 left-4 text-xs text-white/40 hover:text-emerald-400 cursor-pointer z-40" onClick={() => setShowCopyright(true)}>
          © Copyright Notices
        </div>
      </div>

      <Dialog open={showCopyright} onClose={() => setShowCopyright(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-white/10 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-xl p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-white">Copyright Notices</Dialog.Title>
              <button onClick={() => setShowCopyright(false)} className="p-1 rounded-lg hover:bg-white/10">
                <IconX className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <div className="space-y-3 text-white/80 text-sm">
              <div>
                <h3 className="font-medium">Orbit features & enhancements</h3>
                <p className="text-white/50">© 2025 Planetary. All rights reserved.</p>
              </div>
              <div>
                <h3 className="font-medium">Original Tovy code</h3>
                <p className="text-white/50">© 2022 Tovy. All rights reserved.</p>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default Login;
