import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Copy, RotateCcw, ChevronLeft, ChevronRight, Star } from "lucide-react";
import ProfileLayout from "@/components/ProfileLayout";
import { toast } from "sonner";
import { usePromptHistory, PromptHistoryItem } from "@/hooks/usePromptHistory";

const renderTypes = [
  "Todos",
  "Render Externo", 
  "Render Interno", 
  "Render Aéreo", 
  "Render de Detalhe", 
  "Render de Corte", 
  "Planta Humanizada"
];

export default function History() {
  const navigate = useNavigate();
  const { prompts, loading, error, toggleFavorite } = usePromptHistory();
  const [filteredPrompts, setFilteredPrompts] = useState<PromptHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState<"geral" | "favoritos">("geral");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    filterPrompts();
  }, [prompts, searchTerm, activeFilter, activeSection]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const getConfig = (p: PromptHistoryItem) =>
    p.render_config && typeof p.render_config === 'object' && !Array.isArray(p.render_config)
      ? (p.render_config as any)
      : {};
  const toStr = (v: any) => (typeof v === 'string' ? v : '');
  const toArr = (v: any) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

  const filterPrompts = () => {
    let filtered = prompts;

    if (activeSection === "favoritos") {
      filtered = filtered.filter((p) => Boolean(p.is_favorite));
    }

    if (activeFilter !== "Todos") {
      filtered = filtered.filter(p => toStr(getConfig(p).renderType) === activeFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.prompt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPrompts(filtered);
    setCurrentPage(1);
  };

  const copyPrompt = async (prompt: string, id: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      toast.success('Prompt copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar prompt');
    }
  };

  const regeneratePrompt = (promptData: PromptHistoryItem) => {
    sessionStorage.setItem('regenerateConfig', JSON.stringify(getConfig(promptData)));
    navigate('/');
  };

  const handleToggleFavorite = async (promptData: PromptHistoryItem) => {
    try {
      await toggleFavorite(promptData.id, Boolean(promptData.is_favorite));
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast.error("Erro ao atualizar favorito");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRenderType = (p: PromptHistoryItem) => toStr(getConfig(p).renderType) || 'Render Externo';
  const getLighting = (p: PromptHistoryItem) => toStr(getConfig(p).lighting) || 'Diurno';
  const getEnvironments = (p: PromptHistoryItem) => toArr(getConfig(p).environments);
  const getSurroundings = (p: PromptHistoryItem) => toArr(getConfig(p).surroundings);

  // Pagination
  const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrompts = filteredPrompts.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <ProfileLayout title="Histórico de Prompts" subtitle="Todos os prompts gerados na sua conta">
        <div className="space-y-6">
          {/* Skeleton Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {renderTypes.map((type, index) => (
              <div key={index} className="h-8 w-24 rounded-full" style={{ background: "#1a1a1a" }} />
            ))}
          </div>
          
          {/* Skeleton Search */}
          <div className="h-10 w-full rounded-lg" style={{ background: "#0d0d0d" }} />
          
          {/* Skeleton Prompts */}
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg" style={{ background: "#1a1a1a" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded" style={{ background: "#1a1a1a" }} />
                    <div className="h-3 w-64 rounded" style={{ background: "#1a1a1a" }} />
                    <div className="h-3 w-full rounded" style={{ background: "#1a1a1a" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout title="Histórico de Prompts" subtitle="Todos os prompts gerados na sua conta">
      <div className="space-y-6">
        {/* Counter */}
        <div className="flex items-center justify-between">
          <div className="inline-block px-3 py-1 rounded-full font-mono text-xs"
            style={{ background: "#111111", border: "1px solid #1e1e1e", color: "#888888" }}>
            {filteredPrompts.length} prompts no total
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection("geral")}
            className="px-4 py-2 rounded-full font-mono text-xs transition-colors duration-200"
            style={{
              background: activeSection === "geral" ? "#1a1400" : "#111111",
              border: activeSection === "geral" ? "1px solid #C9A84C" : "1px solid #1e1e1e",
              color: activeSection === "geral" ? "#C9A84C" : "#888888",
            }}
          >
            Geral
          </button>
          <button
            onClick={() => setActiveSection("favoritos")}
            className="px-4 py-2 rounded-full font-mono text-xs transition-colors duration-200"
            style={{
              background: activeSection === "favoritos" ? "#1a1400" : "#111111",
              border: activeSection === "favoritos" ? "1px solid #C9A84C" : "1px solid #1e1e1e",
              color: activeSection === "favoritos" ? "#C9A84C" : "#888888",
            }}
          >
            Favoritos
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {renderTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className="px-4 py-2 rounded-full font-mono text-xs whitespace-nowrap transition-colors duration-200"
              style={{
                background: activeFilter === type ? "#1a1400" : "#111111",
                border: activeFilter === type ? "1px solid #C9A84C" : "1px solid #1e1e1e",
                color: activeFilter === type ? "#C9A84C" : "#888888"
              }}
              onMouseEnter={(e) => {
                if (activeFilter !== type) {
                  e.currentTarget.style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== type) {
                  e.currentTarget.style.color = "#888888";
                }
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar nos prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200"
            style={{ 
              background: "#0d0d0d", 
              border: "1px solid #1e1e1e",
              color: "#FFFFFF"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#C9A84C";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#1e1e1e";
            }}
          />
        </div>

        {/* Results */}
        {paginatedPrompts.length > 0 ? (
          <div className="space-y-4">
            {paginatedPrompts.map((prompt) => (
              <div key={prompt.id} className="p-6 rounded-xl border transition-all duration-200"
                style={{ background: "#111111", borderColor: "#1e1e1e" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#141414";
                  e.currentTarget.style.borderColor = "#2a2a2a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#111111";
                  e.currentTarget.style.borderColor = "#1e1e1e";
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#1a1a1a" }}>
                    <div className="w-5 h-5" style={{ background: "#C9A84C", transform: "rotate(45deg)" }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-mono text-sm text-white font-bold mb-1">
                          {getRenderType(prompt)}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground mb-2">
                          {getLighting(prompt)}
                          {getEnvironments(prompt).length > 0 && ` · ${getEnvironments(prompt).slice(0, 2).join(' · ')}`}
                          {getSurroundings(prompt).length > 0 && ` · ${getSurroundings(prompt)[0]}`}
                        </div>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground text-right">
                        {formatDate(prompt.created_at)}
                        {!prompt.is_favorite && typeof prompt.days_remaining === "number" && (
                          <div>Expira em {prompt.days_remaining} dia(s)</div>
                        )}
                        {prompt.is_favorite && (
                          <div>Favorito · não expira</div>
                        )}
                      </div>
                    </div>

                    {/* Prompt Preview */}
                    <div className="font-mono text-xs text-muted-foreground mb-4 line-clamp-3">
                      {prompt.prompt}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleFavorite(prompt)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs transition-colors duration-200"
                        style={{
                          border: "1px solid #1e1e1e",
                          color: prompt.is_favorite ? "#C9A84C" : "#888888",
                        }}
                      >
                        <Star className="w-3 h-3" fill={prompt.is_favorite ? "#C9A84C" : "none"} />
                        {prompt.is_favorite ? "Favorito" : "Favoritar"}
                      </button>
                      <button
                        onClick={() => copyPrompt(prompt.prompt, prompt.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs transition-colors duration-200"
                        style={{ 
                          border: "1px solid #1e1e1e", 
                          color: copiedId === prompt.id ? "#4caf50" : "#888888"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#C9A84C";
                          if (copiedId !== prompt.id) {
                            e.currentTarget.style.color = "#C9A84C";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#1e1e1e";
                          if (copiedId !== prompt.id) {
                            e.currentTarget.style.color = "#888888";
                          }
                        }}
                      >
                        <Copy className="w-3 h-3" />
                        {copiedId === prompt.id ? 'Copiado!' : 'Copiar Prompt'}
                      </button>
                      
                      <button
                        onClick={() => regeneratePrompt(prompt)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs transition-colors duration-200"
                        style={{ border: "1px solid #C9A84C", color: "#C9A84C" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1a1400";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Gerar Novamente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ background: "#1a1a1a" }}>
              <div className="w-8 h-8" style={{ background: "#C9A84C", transform: "rotate(45deg)" }} />
            </div>
            <div className="font-display text-xl text-white mb-2">
              {searchTerm || activeFilter !== "Todos" ? 'Nenhum prompt encontrado' : 'Nenhum prompt gerado ainda'}
            </div>
            <div className="font-mono text-sm text-muted-foreground mb-6">
              {searchTerm || activeFilter !== "Todos" 
                ? 'Tente ajustar os filtros ou o termo de busca'
                : 'Gere seu primeiro prompt para vê-lo aqui'
              }
            </div>
            {!searchTerm && activeFilter === "Todos" && (
              <button 
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-lg font-mono text-sm transition-colors duration-200"
                style={{ border: "1px solid #C9A84C", color: "#C9A84C" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1a1400";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Gerar meu primeiro prompt →
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs transition-colors duration-200"
              style={{
                color: currentPage === 1 ? "#444444" : "#888888",
                opacity: currentPage === 1 ? 0.3 : 1
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.color = "#888888";
                }
              }}
            >
              <ChevronLeft className="w-3 h-3" />
              Anterior
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className="px-3 py-2 rounded-lg font-mono text-xs transition-colors duration-200"
                  style={{
                    color: page === currentPage ? "#C9A84C" : "#888888",
                    textDecoration: page === currentPage ? "underline" : "none"
                  }}
                  onMouseEnter={(e) => {
                    if (page !== currentPage) {
                      e.currentTarget.style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (page !== currentPage) {
                      e.currentTarget.style.color = "#888888";
                    }
                  }}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs transition-colors duration-200"
              style={{
                color: currentPage === totalPages ? "#444444" : "#888888",
                opacity: currentPage === totalPages ? 0.3 : 1
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.color = "#888888";
                }
              }}
            >
              Próximo
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
