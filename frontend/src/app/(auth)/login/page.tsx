"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (e) {
      setErr("Falha no login. Verifique e-mail e senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh w-full bg-radial-[at_50%_75%] from-slate-600 via-slate-800 to-slate-900 to-90% flex items-center justify-center p-4">
      {/* Card */}
      <div className="mx-auto flex w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Left - Image */}
        <div className="hidden w-[40%] md:flex items-center justify-center">
          <Image
            src="/logo_parque.png"
            alt="Logo do sistema de estoque"
            width={260}          // 🔹 controla o tamanho
            height={260}
            className="object-contain"  // 🔹 mantém proporção
            priority
          />
        </div>

        {/* Right - Form */}
        <div className="w-full md:w-[56%] p-6 sm:p-8">
            {/* Logo / Brand */}
            <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-900">
                {/* Ícone cubo simples */}
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white">
                    <path
                    fill="currentColor"
                    d="M12 2 3 6.5v11L12 22l9-4.5v-11L12 2Zm0 2.3 6.5 3.25L12 10.8 5.5 7.55 12 4.3Zm-7 5.7 6 3v6.7l-6-3v-6.7Zm8 9.7v-6.7l6-3v6.7l-6 3Z"
                    />
                </svg>
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    <span className="text-slate-900">Estoque</span>
                </h1>
                <p className="text-sm text-slate-500">
                    Controle de Estoque Inteligente
                </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                <label
                  
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700"
                >
                    E-mail
                </label>
                <input
                    id="email"
                    type="email"
                    name = 'email'
                    required
                    placeholder="seu@email.com"
                    className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
                <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
                >
                    Senha
                </label>
                <div className="relative">
                    <input
                    id="password"
                    name = "password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    />

                    <button
                    type="button"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600"
                    >
                        {/* Olho/olho-riscado */}
                        {showPassword ? (
                            <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            >
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.02-2.87 3.07-5.14 5.61-6.43" />
                            <path d="M1 1l22 22" />
                            <path d="M9.53 9.53a3.5 3.5 0 0 0 4.95 4.95" />
                            <path d="M14.47 14.47L9.53 9.53" />
                            </svg>
                            ) : (
                                <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
                                <circle cx="12" cy="12" r="3" />
                                </svg>
                            )
                        }
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <label className="inline-flex select-none items-center gap-2">
                    <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
                    />
                    <span className="text-sm text-slate-600">Lembrar-me</span>
                </label>

                <Link
                    href="#"
                    className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
                >
                    Esqueceu a senha?
                </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            {/* Divider */}
            <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                </div>
            </div>

            {/* Link cadastro */}
            <p className="text-center text-sm text-slate-500">
              Não tem uma conta?{" "}
              <Link
                href="/cadastro"
                className="font-semibold text-slate-700 hover:text-slate-900"
              >
                Cadastre-se
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

