"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  LayoutGrid,
  Package,
  Boxes,
  Truck,
  ArrowLeftRight,
  Settings,
  Users,
  LogOut,              // <- novo ícone
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext"; // <- usa o contexto de auth
type Lucide = ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<
  "dashboard" | "package" | "boxes" | "truck" | "arrows" | "settings" | "users",
  Lucide
> = {
  dashboard: LayoutGrid,
  package: Package,
  boxes: Boxes,
  truck: Truck,
  arrows: ArrowLeftRight,
  settings: Settings,
  users: Users,
};

type Item = {
  label: string;
  href: string;
  icon: keyof typeof ICONS;
  section?: "main" | "config";
};

const ITEMS: Item[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", section: "main" },
  { label: "Itens", href: "/itens", icon: "package", section: "main" },
  { label: "Pedidos", href: "/pedidos", icon: "boxes", section: "main" },
  { label: "Fornecedores", href: "/fornecedores", icon: "truck", section: "main" },
  { label: "Movimentações", href: "/movimentacoes", icon: "arrows", section: "main" },
  { label: "Sistema", href: "/sistema", icon: "settings", section: "config" },
  { label: "Usuários", href: "/usuarios", icon: "users", section: "config" },
];

function NavItem({ item, active }: { item: Item; active: boolean }) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
        active
          ? "bg-slate-200/70 text-slate-900"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" aria-hidden />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();           // <- pega logout do contexto
  const [leaving, setLeaving] = useState(false);

  const main = ITEMS.filter((i) => i.section === "main");
  const config = ITEMS.filter((i) => i.section === "config");

  async function handleLogout() {
    try {
      setLeaving(true);
      await logout();                     // chama /api/auth/logout e limpa token no contexto
      router.replace("/login");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <aside
      className="
        sticky top-0 h-screen w-64 shrink-0 border-r border-slate-200 bg-white/90
        backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 py-5
      "
    >
      {/* Logo / Brand */}
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-900">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" aria-hidden>
            <path
              fill="currentColor"
              d="M12 2 3 6.5v11L12 22l9-4.5v-11L12 2Zm0 2.3 6.5 3.25L12 10.8 5.5 7.55 12 4.3Zm-7 5.7 6 3v6.7l-6-3v-6.7Zm8 9.7v-6.7l6-3v6.7l-6 3Z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-slate-900">Estoque</span>
          </h1>
          <p className="text-xs text-slate-500">Controle de Estoque Inteligente</p>
        </div>
      </div>

      <nav className="space-y-6">
        <div>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu principal
          </p>
          <div className="space-y-1">
            {main.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                active={pathname === item.href || pathname?.startsWith(item.href + "/")}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Configurações
          </p>
          <div className="space-y-1">
            {config.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                active={pathname === item.href || pathname?.startsWith(item.href + "/")}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Usuário + Logout */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-5 space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-slate-300" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">Henrique</p>
            <p className="truncate text-xs text-slate-500">Admin</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={leaving}
          className={[
            "flex w-full items-center justify-center gap-2 rounded-xl",
            "border border-slate-200 bg-white px-3 py-2 text-sm font-medium",
            "text-slate-700 shadow-sm transition hover:bg-slate-50",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
          aria-label="Sair da conta"
          title="Sair"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {leaving ? "Saindo..." : "Sair"}
        </button>
      </div>
    </aside>
  );
}


