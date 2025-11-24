"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, ShieldOff, Trash2, UserCheck, UserX, Search, ChevronLeft, ChevronRight } from "lucide-react";

export type UserRow = {
  id: number;
  username: string;
  email: string;
  posto_graduacao: string;
  is_active: boolean;
  is_admin: boolean;
  om_id?: number | null;
  created_at: string;
};

type UsersPage = {
  items: UserRow[];
  total: number;
  page: number;
  page_size: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

function fmtDate(val: string) {
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function UsersTable() {
  const [page, setPage] = useState<UsersPage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchUsers = useCallback(async (pageNum: number, searchTerm: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        page_size: "20",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const res = await fetch(`${API_BASE}/users?${params}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Acesso negado. Apenas administradores podem acessar esta página.");
        }
        throw new Error(`Erro ao buscar usuários: ${res.status}`);
      }

      const data: UsersPage = await res.json();
      setPage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(currentPage, search);
  }, [currentPage, search, fetchUsers]);

  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleToggleAdmin = async (userId: number, currentIsAdmin: boolean) => {
    if (
      !confirm(
        currentIsAdmin
          ? "Tem certeza que deseja remover os privilégios de administrador deste usuário?"
          : "Tem certeza que deseja promover este usuário a administrador?"
      )
    ) {
      return;
    }

    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/admin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_admin: !currentIsAdmin }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Erro ao atualizar usuário");
      }

      await fetchUsers(currentPage, search);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar usuário");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (userId: number, currentIsActive: boolean) => {
    if (
      !confirm(
        currentIsActive
          ? "Tem certeza que deseja desativar este usuário?"
          : "Tem certeza que deseja ativar este usuário?"
      )
    ) {
      return;
    }

    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentIsActive }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Erro ao atualizar usuário");
      }

      await fetchUsers(currentPage, search);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar usuário");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (
      !confirm(
        `Tem certeza que deseja DELETAR permanentemente o usuário "${username}"?\n\nEsta ação não pode ser desfeita!`
      )
    ) {
      return;
    }

    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Erro ao deletar usuário");
      }

      await fetchUsers(currentPage, search);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao deletar usuário");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = page ? Math.ceil(page.total / page.page_size) : 0;

  return (
    <div className="space-y-4">
      {/* Header com busca */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou posto..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Buscar
        </button>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading && (
          <div className="py-12 text-center text-sm text-slate-500">Carregando usuários...</div>
        )}

        {error && !loading && (
          <div className="py-12 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={() => fetchUsers(currentPage, search)}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && page && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Permissões
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-slate-200">
                  {page.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  )}

                  {page.items.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
                            <span className="text-slate-700 text-sm font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{user.username}</div>
                            <div className="text-xs text-slate-500">{user.posto_graduacao}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{user.email}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.is_active
                              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200"
                              : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-green-600" : "bg-red-500"}`} />
                          {user.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.is_admin ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-200">
                            <Shield className="h-3 w-3" />
                            Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                            Usuário
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-slate-500">{fmtDate(user.created_at)}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Admin */}
                          <button
                            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            disabled={actionLoading === user.id}
                            title={user.is_admin ? "Remover admin" : "Promover a admin"}
                            className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {user.is_admin ? (
                              <ShieldOff className="h-4 w-4" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </button>

                          {/* Toggle Active */}
                          <button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            disabled={actionLoading === user.id}
                            title={user.is_active ? "Desativar usuário" : "Ativar usuário"}
                            className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(user.id, user.username)}
                            disabled={actionLoading === user.id}
                            title="Deletar usuário"
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600">
                  Mostrando{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * page.page_size + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * page.page_size, page.total)}
                  </span>{" "}
                  de <span className="font-medium">{page.total}</span> usuários
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-600" />
                  </button>

                  <span className="text-sm text-slate-600">
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}