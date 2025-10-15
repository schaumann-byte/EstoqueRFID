"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent, ChangeEvent } from "react";

export default function CadastroPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);

  const hasMin = password.length >= 8;
  const hasLettersAndNumbers = /[A-Za-z]/.test(password) && /\d/.test(password);
  const passOk = hasMin && hasLettersAndNumbers && password === confirm && terms;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passOk) return;
    setLoading(true);
    // TODO: implementar cadastro (chamar sua API do FastAPI)
    setTimeout(() => setLoading(false), 900);
  };

  const ranks = [
  "General",
  "Coronel",
  "Tenente-Coronel",
  "Major",
  "Capitão",
  "1º Tenente",
  "2º Tenente",
  "Subtenente",
  "1º Sgt",
  "2º Sgt",
  "3º Sgt",
  "Cabo",
  "Sd",
];

  return (



    <main
      className="
        min-h-dvh w-full
        bg-radial-[at_50%_75%] from-slate-600 via-slate-800 to-slate-900 to-90%
        flex items-center justify-center p-4
      "
    >
      {/* Card */}
      <div className="mx-auto flex w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Left - Image */}
        <div className="relative hidden w-[44%] md:block">
          <Image
            src="/warehouse-worker.jpg"
            alt="Trabalhador em armazém"
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* Right - Form */}
        <div className="w-full md:w-[56%] p-6 sm:p-8">
            <h1 className="mb-6 text-center text-3xl font-semibold text-slate-900">
                Cadastro
            </h1>
            <form onSubmit={onSubmit} className="space-y-5">
                {/* Nome de guerra */}
                <div className="space-y-1.5">
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                        Nome de Guerra:
                    </label>
                    <input
                        id="firstName"
                        type="text"
                        required
                        placeholder="João"
                        className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    />
                </div>

                {/* E-mail */}
                <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                        E-mail
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        placeholder="seu@email.com"
                        className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    />
                </div>

                {/* Posto ou graduação */}
                <div className="space-y-1.5">
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                        Posto ou Graduação:
                    </label>
                    <div className="relative">
                        <select
                            id="rank"
                            name="rank"
                            required
                            defaultValue=""
                            className="block w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200
                                text-slate-900 has-[option:checked:disabled]:text-slate-400 has-[option:checked:disabled]:italic"
                        >
                            <option value="" disabled>
                            Selecione o posto/graduação
                            </option>
                            {ranks.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                            ))}
                        </select>

                        {/* Chevron */}
                        <svg
                            aria-hidden="true"
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                            clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>

                    {/* Senha */}
                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                            Senha
                        </label>
                        <div className="relative">
                        <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                        />
                        <button
                        type="button"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600"
                        >
                        {showPassword ? (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.02-2.87 3.07-5.14 5.61-6.43" />
                            <path d="M1 1l22 22" />
                            <path d="M9.53 9.53a3.5 3.5 0 0 0 4.95 4.95" />
                            <path d="M14.47 14.47L9.53 9.53" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
                            <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                        </button>
                    </div>
                </div>

                {/* Confirmação */}
                <div className="space-y-1.5">
                    <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
                        Confirmação
                    </label>
                    <div className="relative">
                        <input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                        className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                        />
                        <button
                        type="button"
                        aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600"
                        >
                        {showConfirm ? (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.02-2.87 3.07-5.14 5.61-6.43" />
                            <path d="M1 1l22 22" />
                            <path d="M9.53 9.53a3.5 3.5 0 0 0 4.95 4.95" />
                            <path d="M14.47 14.47L9.53 9.53" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
                            <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                type="submit"
                disabled={loading || !passOk}
                className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                {loading ? "Criando conta..." : "Criar Conta"}
                </button>

                {/* Link login */}
                <p className="text-center text-sm text-slate-500">
                Já tem uma conta?{" "}
                    <Link href="/login" className="font-semibold text-slate-900 hover:text-slate-800">
                        Entrar
                    </Link>
                </p>
            </form>
        </div>
      </div>
    </main>
  );
}
