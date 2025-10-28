// middleware.ts (na raiz do projeto)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Rotas públicas que não precisam de autenticação
  const isPublicRoute = pathname === "/login" || pathname === "/cadastro";
  
  // Rotas de API não devem ser bloqueadas pelo middleware
  const isApiRoute = pathname.startsWith("/api/");
  
  // Arquivos estáticos e recursos do Next.js
  const isStaticFile = pathname.startsWith("/_next") || 
                       pathname.startsWith("/static") ||
                       pathname.includes(".");

  if (isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  if (isPublicRoute && refreshToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicRoute && !refreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

