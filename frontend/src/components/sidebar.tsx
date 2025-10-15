"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Ícones SVG minimalistas (sem libs) */
function IconBase({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
      aria-hidden
    >
      {children}
    </svg>
  );
}

const Icons = {
  dashboard: () => (
    <IconBase>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </IconBase>
  ),
  package: () => (
    <IconBase>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </IconBase>
  ),
  boxes: () => (
    <IconBase>
      <path d="M3 7h8v6H3z" />
      <path d="M13 11h8v6h-8z" />
      <path d="M8 13v7h8v-4" />
    </IconBase>
  ),
  truck: () => (
    <IconBase>
      <path d="M3 7v9h12V7z" />
      <path d="M15 10h4l2 3v3h-6" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </IconBase>
  ),
  arrows: () => (
    <IconBase>
      <path d="M7 7h10" />
      <path d="M7 7l3-3" />
      <path d="M7 7l3 3" />
      <path d="M17 17H7" />
      <path d="M17 17l-3-3" />
      <path d="M17 17l-3 3" />
    </IconBase>
  ),
  settings: () => (
    <IconBase>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v0a2 2 0 0 1-4 0v0a1.7 1.7 0 0 0-.4-1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 4 14a1.7 1.7 0 0 0-1-.4h0a2 2 0 0 1 0-4h0a1.7 1.7 0 0 0 1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 0 1 5 2.84l.06.06A1.7 1.7 0 0 0 7 4.6 1.7 1.7 0 0 0 8 5c.37 0 .72-.14 1-.4.26-.25.44-.6.52-.96v0a2 2 0 0 1 4 0v0c.08.36.26.71.52.96.28.26.63.4 1 .4.37 0 .72-.14 1-.4A1.7 1.7 0 0 0 17 4.6l.06-.06A2 2 0 1 1 19.9 7.4l-.06.06c-.48.5-.6 1.25-.34 1.87.14.35.37.66.66.9.3.24.67.37 1.05.37h0a2 2 0 0 1 0 4h0c-.38 0-.75.13-1.05.37-.29.24-.52.55-.66.9Z" />
    </IconBase>
  ),
  users: () => (
    <IconBase>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M2 20a6 6 0 0 1 12 0" />
      <path d="M14 20a4.5 4.5 0 0 1 8 0" />
    </IconBase>
  ),
};

type Item = {
  label: string;
  href: string;
  icon: keyof typeof Icons;
  section?: "main" | "config";
};

const ITEMS: Item[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", section: "main" },
  { label: "Produtos", href: "/produtos", icon: "package", section: "main" },
  { label: "Estoque", href: "/estoque", icon: "boxes", section: "main" },
  { label: "Fornecedores", href: "/fornecedores", icon: "truck", section: "main" },
  { label: "Movimentações", href: "/movimentacoes", icon: "arrows", section: "main" },
  { label: "Sistema", href: "/sistema", icon: "settings", section: "config" },
  { label: "Usuários", href: "/usuarios", icon: "users", section: "config" },
];

function NavItem({ item, active }: { item: Item; active: boolean }) {
  const Icon = Icons[item.icon];
  return (
    <Link
      href={item.href}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
        active
          ? "bg-slate-200/70 text-slate-900"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}
    >
      <Icon />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const main = ITEMS.filter((i) => i.section === "main");
  const config = ITEMS.filter((i) => i.section === "config");

  return (
    <aside
      className="
        sticky top-0 h-screen w-64 shrink-0 border-r border-slate-600 bg-White/90
        backdrop-blur supports-[backdrop-filter]:bg-White/60 px-4 py-5
      "
    >
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
            <h1 className="text-xl font-bold tracking-tight">
                <span className="text-slate-900">Estoque</span>
            </h1>
            <p className="text-xs text-slate-500">
                Controle de Estoque Inteligente
            </p>
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

      {/* usuário (placeholder) */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-slate-300" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">Henrique Holanda</p>
            <p className="truncate text-xs text-slate-500">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
