"use client"

import type { NextPage } from "next"
import Head from "next/head"
import Topbar from "@/components/topbar"
import { useRouter } from "next/router"
import { loginState } from "@/state"
import { Transition, Dialog } from "@headlessui/react"
import { useState, useEffect, Fragment, useRef } from "react"
import Button from "@/components/button"
import axios from "axios"
import Input from "@/components/input"
import { useForm, FormProvider } from "react-hook-form"
import { useRecoilState } from "recoil"
import { toast } from "react-hot-toast"
import {
  IconPlus,
  IconRefresh,
  IconChevronRight,
  IconBuildingSkyscraper,
  IconSettings,
  IconX,
} from "@tabler/icons-react"

const Home: NextPage = () => {
  const [login, setLogin] = useRecoilState(loginState)
  const [loading, setLoading] = useState(false)
  const methods = useForm()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [showInstanceSettings, setShowInstanceSettings] = useState(false)
  const [robloxConfig, setRobloxConfig] = useState({
    clientId: "",
    clientSecret: "",
    redirectUri: "",
  })
  const [configLoading, setConfigLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const gotoWorkspace = (id: number) => {
    router.push(`/workspace/${id}`)
  }

  const createWorkspace = async () => {
    setLoading(true)
    const t = toast.loading("Creating workspace...")

    const request = await axios
      .post("/api/createws", {
        groupId: Number(methods.getValues("groupID")),
      })
      .catch((err) => {
        console.log(err)
        setLoading(false)

        if (err.response?.data?.error === "You are not a high enough rank") {
          methods.setError("groupID", {
            type: "custom",
            message: "You need to be rank 10+ to create a workspace",
          })
        }
        if (err.response?.data?.error === "Workspace already exists") {
          methods.setError("groupID", {
            type: "custom",
            message: "This group already has a workspace",
          })
        }
      })

    if (request) {
      toast.success("Workspace created!", { id: t })
      setIsOpen(false)
      router.push(`/workspace/${methods.getValues("groupID")}?new=true`)
    }
  }

  useEffect(() => {
    const checkLogin = async () => {
      let req
      try {
        req = await axios.get("/api/@me")
      } catch (err: any) {
        if (err.response?.data.error === "Workspace not setup") {
          if (router.pathname !== "/welcome") router.push("/welcome")
          setLoading(false)
          return
        }
        if (err.response?.data.error === "Not logged in") {
          router.push("/login")
          setLoading(false)
          return
        }
      } finally {
        if (req?.data) {
          setLogin({
            ...req.data.user,
            workspaces: req.data.workspaces,
          })
        }
        setLoading(false)
      }
    }

    const checkOwnerStatus = async () => {
      try {
        const response = await axios.get("/api/auth/checkOwner")
        if (response.data.success) setIsOwner(response.data.isOwner)
      } catch (error: any) {
        if (error.response?.status !== 401)
          console.error("Failed to check owner status:", error)
      }
    }

    checkLogin()
    checkOwnerStatus()
  }, [])

  const checkRoles = async () => {
    const request = axios
      .post("/api/auth/checkRoles", {})
      .then(() => router.reload())
      .catch(console.error)

    toast.promise(request, {
      loading: "Checking roles...",
      success: "Roles checked!",
      error: "An error occurred",
    })
  }

  useEffect(() => {
    if (showInstanceSettings && isOwner) loadRobloxConfig()
  }, [showInstanceSettings, isOwner])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentOrigin = window.location.origin
      const autoRedirectUri = `${currentOrigin}/api/auth/roblox/callback`
      setRobloxConfig((prev) => ({ ...prev, redirectUri: autoRedirectUri }))
    }
  }, [])

  const loadRobloxConfig = async () => {
    try {
      const response = await axios.get("/api/admin/instance-config")
      const { robloxClientId, robloxClientSecret } = response.data
      const currentOrigin =
        typeof window !== "undefined" ? window.location.origin : ""
      const autoRedirectUri = `${currentOrigin}/api/auth/roblox/callback`

      setRobloxConfig({
        clientId: robloxClientId || "",
        clientSecret: robloxClientSecret || "",
        redirectUri: autoRedirectUri,
      })
    } catch (error) {
      console.error("Failed to load OAuth config:", error)
    }
  }

  const saveRobloxConfig = async () => {
    setConfigLoading(true)
    setSaveMessage("")
    try {
      await axios.post("/api/admin/instance-config", {
        robloxClientId: robloxConfig.clientId,
        robloxClientSecret: robloxConfig.clientSecret,
        robloxRedirectUri: robloxConfig.redirectUri,
      })
      setSaveMessage("Settings saved successfully!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error("Failed to save OAuth config:", error)
      setSaveMessage("Failed to save settings. Please try again.")
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setConfigLoading(false)
    }
  }

  // Liquid gradient background animation (reuse from login)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const colors = ["#00d0bc", "#005253", "#6529ff", "#822eff"]
    let w = window.innerWidth,
      h = window.innerHeight,
      a = 0
    canvas.width = w
    canvas.height = h

    const animate = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
      a += 0.0018
      const x = Math.cos(a) * w
      const y = Math.sin(a) * h
      const grad = ctx.createLinearGradient(0, 0, x, y)
      colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c))
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      requestAnimationFrame(animate)
    }

    animate()
    const resize = () => ((canvas.width = window.innerWidth), (canvas.height = window.innerHeight))
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <Head>
        <title>Bloxion Workspaces</title>
        <meta name="description" content="Manage your Roblox workspaces with Bloxion" />
      </Head>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl" />

      <Topbar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
          <h1 className="text-4xl font-semibold text-white/90 mb-6 sm:mb-0">
            Your Workspaces
          </h1>
          <div className="flex gap-3">
            {isOwner && (
              <Button
                onClick={() => setIsOpen(true)}
                classoverride="flex items-center bg-gradient-to-r from-cyan-400 to-emerald-400 text-white hover:opacity-90 px-5 py-2 rounded-xl shadow-[0_0_20px_rgba(0,255,200,0.4)]"
              >
                <IconPlus className="mr-2 h-5 w-5" /> New Workspace
              </Button>
            )}
            <Button
              onClick={checkRoles}
              classoverride="flex items-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-2 rounded-xl"
            >
              <IconRefresh className="mr-2 h-5 w-5" /> Check Roles
            </Button>
            {isOwner && (
              <Button
                onClick={() => setShowInstanceSettings(true)}
                classoverride="flex items-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3"
              >
                <IconSettings className="h-5 w-5 text-white" />
              </Button>
            )}
          </div>
        </div>

        {login.workspaces?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {login.workspaces.map((workspace, i) => (
              <div
                key={i}
                onClick={() => gotoWorkspace(workspace.groupId)}
                className="cursor-pointer rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_4px_40px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_60px_rgba(0,0,0,0.35)] hover:scale-[1.02] transition-all overflow-hidden"
              >
                <div
                  className="h-40 bg-cover bg-center opacity-90"
                  style={{ backgroundImage: `url(${workspace.groupThumbnail})` }}
                />
                <div className="p-5 flex items-center justify-between">
                  <h3 className="text-lg font-medium truncate text-white/90">
                    {workspace.groupName}
                  </h3>
                  <IconChevronRight className="h-5 w-5 text-white/60" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-12 flex flex-col items-center text-center text-white/80 shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
            <div className="bg-white/10 rounded-full p-4 mb-5">
              <IconBuildingSkyscraper className="h-12 w-12 text-white/50" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">
              No Workspaces Available
            </h3>
            <p className="text-white/60 mb-6">
              {isOwner
                ? "Create a new workspace to get started"
                : "You don’t have permission to create workspaces"}
            </p>
            {isOwner && (
              <Button
                onClick={() => setIsOpen(true)}
                classoverride="bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-90 text-white rounded-xl px-6 py-3 shadow-[0_0_25px_rgba(0,255,200,0.4)]"
              >
                <IconPlus className="mr-2 h-5 w-5" /> Create Workspace
              </Button>
            )}
          </div>
        )}
      </main>

      {/* --- CREATE WORKSPACE DIALOG --- */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.4)] p-8 text-left">
              <Dialog.Title className="text-2xl font-semibold text-white mb-6">
                Create New Workspace
              </Dialog.Title>
              <FormProvider {...methods}>
                <form>
                  <Input
                    label="Group ID"
                    placeholder="Enter your Roblox group ID"
                    {...methods.register("groupID", {
                      required: "This field is required",
                      pattern: { value: /^[a-zA-Z0-9-.]*$/, message: "Invalid characters" },
                      maxLength: { value: 10, message: "Max length 10" },
                    })}
                  />
                </form>
              </FormProvider>
              <div className="mt-8 flex justify-end gap-3">
                <Button
                  onClick={() => setIsOpen(false)}
                  classoverride="bg-white/10 hover:bg-white/20 text-white rounded-xl px-5 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={methods.handleSubmit(createWorkspace)}
                  loading={loading}
                  classoverride="bg-gradient-to-r from-cyan-400 to-emerald-400 text-white rounded-xl px-5 py-2 hover:opacity-90"
                >
                  Create
                </Button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* --- INSTANCE SETTINGS DIALOG --- */}
      <Transition appear show={showInstanceSettings} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowInstanceSettings(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.4)] p-8 text-left">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-lg font-semibold text-white">
                  Instance Settings
                </Dialog.Title>
                <button
                  onClick={() => setShowInstanceSettings(false)}
                  className="p-1 rounded-lg hover:bg-white/10"
                >
                  <IconX className="w-5 h-5 text-white/70" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-medium text-white/90 mb-3">
                    Roblox OAuth Configuration
                  </h3>

                  <label className="block text-sm text-white/70 mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={robloxConfig.clientId}
                    onChange={(e) =>
                      setRobloxConfig((prev) => ({
                        ...prev,
                        clientId: e.target.value,
                      }))
                    }
                    placeholder="e.g. 23748326747865334"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />

                  <label className="block text-sm text-white/70 mt-4 mb-1">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={robloxConfig.clientSecret}
                    onChange={(e) =>
                      setRobloxConfig((prev) => ({
                        ...prev,
                        clientSecret: e.target.value,
                      }))
                    }
                    placeholder="e.g. JHJD_NMIRHNSD$ER$6dj38"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  />

                  <label className="block text-sm text-white/70 mt-4 mb-1">
                    Redirect URI <span className="text-xs text-white/50">(auto-generated)</span>
                  </label>
                  <input
                    type="url"
                    value={robloxConfig.redirectUri}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white/60 cursor-not-allowed"
                  />
                </div>

                {saveMessage && (
                  <div
                    className={`mt-4 p-3 rounded-md text-sm ${
                      saveMessage.includes("successfully")
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    onClick={() => setShowInstanceSettings(false)}
                    disabled={configLoading}
                    classoverride="bg-white/10 hover:bg-white/20 text-white rounded-xl px-5 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveRobloxConfig}
                    loading={configLoading}
                    disabled={configLoading}
                    classoverride="bg-gradient-to-r from-cyan-400 to-emerald-400 text-white rounded-xl px-5 py-2 hover:opacity-90"
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

export default Home
