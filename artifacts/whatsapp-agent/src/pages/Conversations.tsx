import { useState, useRef, useEffect } from "react";
import { useGetConversations, useGetConversation, useUpdateConversationMode, getGetConversationsQueryKey, getGetConversationQueryKey } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Search, Send, Bot, User, Phone, MessageSquare, RefreshCw, Zap, ZapOff, Brain, ArrowLeft, Zap as ZapIcon, ChevronDown, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Template = { id: number; title: string; content: string; category: string; shortcut?: string | null; agentId?: number | null };

function TemplatesPanel({ onInsert }: { onInsert: (content: string) => void }) {
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const groups = templates.reduce<Record<string, Template[]>>((acc, t) => {
    const cat = t.category || "Autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const toggleCat = (cat: string) => setOpenCats(prev => {
    const next = new Set(prev);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    return next;
  });

  if (isLoading) return (
    <div className="p-4 space-y-2">
      {[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
    </div>
  );

  if (templates.length === 0) return (
    <div className="p-4 text-center text-muted-foreground">
      <ZapIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
      <p className="text-xs">Aucun template.<br />Créez-en dans la section Templates.</p>
    </div>
  );

  return (
    <div className="p-3 space-y-2">
      {Object.entries(groups).map(([cat, items]) => {
        const open = openCats.has(cat);
        return (
          <div key={cat} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCat(cat)}
              className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 hover:bg-muted text-xs font-semibold text-left transition-colors"
            >
              <span>{cat}</span>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground font-normal">{items.length}</span>
                {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </div>
            </button>
            {open && (
              <div className="divide-y">
                {items.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onInsert(t.content)}
                    className="w-full text-left px-3 py-2.5 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{t.title}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{t.content}</p>
                      </div>
                      {t.shortcut && (
                        <span className="text-[10px] bg-muted rounded px-1 py-0.5 font-mono shrink-0 mt-0.5">{t.shortcut}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Conversations() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [savingSummary, setSavingSummary] = useState(false);
  const [rightTab, setRightTab] = useState<"memory" | "templates">("memory");
  const [listView, setListView] = useState<"conversations" | "summaries">("conversations");
  const [mobilePanel, setMobilePanel] = useState<"list" | "chat">("list");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: convsLoading } = useGetConversations({
    query: { queryKey: getGetConversationsQueryKey(), refetchInterval: 3000 }
  });
  const { data: activeConversation, isLoading: detailLoading } = useGetConversation(activeId!, {
    query: { enabled: !!activeId, queryKey: getGetConversationQueryKey(activeId!), refetchInterval: 3000 }
  });

  const updateMode = useUpdateConversationMode();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  useEffect(() => {
    if (activeConversation) {
      setSummaryDraft((activeConversation as { conversationSummary?: string | null }).conversationSummary ?? "");
      setEditingSummary(false);
    }
  }, [activeId, activeConversation?.id]);

  const filteredConvs = conversations?.filter(c =>
    c.contactName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPhone.includes(search)
  ) || [];

  const handleSelectConv = (id: number) => {
    setActiveId(id);
    setMobilePanel("chat");
  };

  const handleModeToggle = (checked: boolean) => {
    if (!activeId) return;
    const newMode = checked ? 'automatic' : 'manual';
    updateMode.mutate({ id: activeId, data: { mode: newMode } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(activeId) });
        queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
      }
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeId || sending) return;

    const content = message.trim();
    setMessage("");
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${activeId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(activeId) });
        queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
      }
    } finally {
      setSending(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!activeId) return;
    setSavingSummary(true);
    try {
      await fetch(`/api/conversations/${activeId}/summary`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationSummary: summaryDraft }),
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(activeId) });
      setEditingSummary(false);
    } finally {
      setSavingSummary(false);
    }
  };

  const handleClearSummary = async () => {
    if (!activeId) return;
    setSavingSummary(true);
    try {
      await fetch(`/api/conversations/${activeId}/summary`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationSummary: "" }),
        credentials: "include",
      });
      setSummaryDraft("");
      queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(activeId) });
      setEditingSummary(false);
    } finally {
      setSavingSummary(false);
    }
  };

  const handleInsertTemplate = (content: string) => {
    setMessage(content);
    setRightTab("memory");
  };

  const roleStyle = (role: string) => {
    if (role === "assistant") return {
      container: "ml-auto items-end",
      bubble: "bg-green-500 text-white rounded-tr-sm",
      label: <><Bot className="w-3 h-3 text-green-600" /><span className="text-xs text-muted-foreground">Agent IA</span></>
    };
    if (role === "human") return {
      container: "ml-auto items-end",
      bubble: "bg-blue-600 text-white rounded-tr-sm",
      label: <><User className="w-3 h-3 text-blue-600" /><span className="text-xs text-muted-foreground">Vous</span></>
    };
    return {
      container: "items-start",
      bubble: "bg-card border shadow-sm rounded-tl-sm text-foreground",
      label: <><User className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Client</span></>
    };
  };

  const isAutomatic = activeConversation?.mode === 'automatic';
  const currentSummary = (activeConversation as { conversationSummary?: string | null } | undefined)?.conversationSummary ?? "";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen bg-background overflow-hidden">
      {/* ── List Panel ── */}
      <div className={`${mobilePanel === "chat" ? "hidden" : "flex"} md:flex w-full md:w-[300px] border-r flex-col shrink-0`}>
        <div className="p-3 md:p-4 border-b space-y-3">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Conversations</h1>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex border-b gap-0">
            <button
              onClick={() => setListView("conversations")}
              className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${listView === "conversations" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Conversations
            </button>
            <button
              onClick={() => setListView("summaries")}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold border-b-2 transition-colors ${listView === "summaries" ? "border-purple-500 text-purple-700" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Brain className="w-3 h-3" /> Résumés
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {listView === "conversations" ? (
            convsLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                Aucune conversation.<br />Les messages WhatsApp apparaîtront ici automatiquement.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConvs.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
                    className={`p-3 md:p-4 cursor-pointer hover:bg-muted/50 transition-colors ${activeId === conv.id ? 'bg-muted' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold truncate pr-2 text-sm">{conv.contactName}</div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mb-2">{conv.lastMessage || 'Aucun message'}</div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={conv.mode === 'automatic' ? 'default' : 'secondary'}
                        className={`text-[10px] px-1.5 py-0 h-4 ${conv.mode === 'automatic' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                      >
                        {conv.mode === 'automatic' ? '🤖 IA Active' : '👤 Manuel'}
                      </Badge>
                      {(conv as { conversationSummary?: string | null }).conversationSummary && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-purple-300 text-purple-700">
                          <Brain className="w-2.5 h-2.5 mr-1" />Mémoire
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            (() => {
              const withSummary = (conversations ?? [])
                .filter(c => (c as { conversationSummary?: string | null }).conversationSummary)
                .sort((a, b) => ((b as { messageCount?: number }).messageCount ?? 0) - ((a as { messageCount?: number }).messageCount ?? 0));
              if (convsLoading) return (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}
                </div>
              );
              if (withSummary.length === 0) return (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  Aucune mémoire enregistrée.<br />
                  <span className="text-xs">Ouvrez une conversation et ajoutez des faits clients.</span>
                </div>
              );
              return (
                <div className="divide-y divide-border">
                  {withSummary.map((conv, idx) => {
                    const summary = (conv as { conversationSummary?: string | null }).conversationSummary ?? "";
                    const msgCount = (conv as { messageCount?: number }).messageCount ?? 0;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => { handleSelectConv(conv.id); setListView("conversations"); }}
                        className="p-3 cursor-pointer hover:bg-purple-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] bg-purple-100 text-purple-700 rounded-full w-4 h-4 flex items-center justify-center font-bold shrink-0">{idx + 1}</span>
                          <span className="font-medium text-xs truncate">{conv.contactName}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{msgCount} msg</span>
                        </div>
                        <div className="space-y-0.5">
                          {summary.split("\n").filter(Boolean).slice(0, 3).map((line, i) => (
                            <p key={i} className="text-[11px] text-purple-900 bg-purple-50 border border-purple-100 rounded px-2 py-0.5 truncate">{line}</p>
                          ))}
                          {summary.split("\n").filter(Boolean).length > 3 && (
                            <p className="text-[10px] text-muted-foreground pl-2">+{summary.split("\n").filter(Boolean).length - 3} ligne(s)…</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </ScrollArea>
      </div>

      {/* ── Detail Panel ── */}
      <div className={`${mobilePanel === "list" ? "hidden" : "flex"} md:flex flex-1 flex-col min-w-0 bg-muted/10`}>
        {!activeId ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6 gap-4">
            <MessageSquare className="w-14 h-14 opacity-10" />
            <div>
              <p className="font-medium text-foreground mb-1">Sélectionnez une conversation</p>
              <p className="text-sm">Choisissez un contact dans la liste pour voir les messages.</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : activeConversation ? (
          <div className="flex flex-1 min-h-0">
            {/* Chat Column */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Chat Header */}
              <div className="h-14 md:h-16 border-b bg-card flex items-center justify-between px-3 md:px-6 shrink-0 gap-2">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                  {/* Mobile back button */}
                  <button
                    className="md:hidden p-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
                    onClick={() => setMobilePanel("list")}
                    aria-label="Retour"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm md:text-base truncate">{activeConversation.contactName}</h2>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Phone className="w-3 h-3 shrink-0" /> {activeConversation.contactPhone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium transition-colors ${isAutomatic ? 'bg-green-50 border-green-200 text-green-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                    {isAutomatic ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                    <Label htmlFor="mode-switch" className="cursor-pointer hidden sm:block">
                      {isAutomatic ? 'IA Active' : 'Manuel'}
                    </Label>
                    <Switch
                      id="mode-switch"
                      checked={isAutomatic}
                      onCheckedChange={handleModeToggle}
                      disabled={updateMode.isPending}
                    />
                  </div>
                </div>
              </div>

              {/* AI takeover banner */}
              {!isAutomatic && (
                <div className="px-3 md:px-6 py-2 bg-orange-50 border-b border-orange-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-orange-800 flex items-center gap-1.5 min-w-0">
                    <ZapOff className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">L'IA est désactivée. Vous contrôlez cette conversation.</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-orange-300 text-orange-800 hover:bg-orange-100 shrink-0"
                    onClick={() => handleModeToggle(true)}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Réactiver l'IA
                  </Button>
                </div>
              )}

              {/* Chat Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-6">
                <div className="space-y-4 max-w-2xl mx-auto">
                  {activeConversation.messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-12">
                      Aucun message dans cette conversation.
                    </div>
                  ) : activeConversation.messages.map((msg) => {
                    const style = roleStyle(msg.role);
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[85%] md:max-w-[75%] ${style.container}`}>
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          {style.label}
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`px-3 py-2 md:px-4 rounded-2xl text-sm ${style.bubble}`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 md:p-4 bg-card border-t shrink-0">
                {isAutomatic && (
                  <div className="mb-2 px-3 py-2 bg-green-50 text-green-800 text-xs rounded-lg border border-green-100 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0"><Bot className="w-3.5 h-3.5 shrink-0" /><span className="truncate">L'agent IA gère cette conversation automatiquement.</span></span>
                    <Button variant="outline" size="sm" className="h-7 text-xs bg-white border-green-200 shrink-0" onClick={() => handleModeToggle(false)}>
                      Prendre le contrôle
                    </Button>
                  </div>
                )}
                {!isAutomatic && (
                  <div className="mb-2 flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 text-amber-700 border-amber-200 hover:bg-amber-50"
                      onClick={() => setRightTab(t => t === "templates" ? "memory" : "templates")}
                    >
                      <ZapIcon className="w-3 h-3" />
                      Réponses rapides
                    </Button>
                  </div>
                )}
                <form onSubmit={handleSend} className="flex gap-2">
                  <Textarea
                    placeholder={isAutomatic ? "Désactivez l'IA pour envoyer..." : "Tapez votre message..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isAutomatic || sending}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e as unknown as React.FormEvent);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim() || isAutomatic || sending}
                    className="shrink-0 self-end"
                  >
                    {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
                <p className="text-[10px] text-muted-foreground mt-1">Entrée pour envoyer · Maj+Entrée pour sauter une ligne</p>
              </div>
            </div>

            {/* Right Panel — Memory + Templates — hidden on mobile/tablet */}
            <div className="hidden lg:flex w-[280px] border-l bg-card flex-col shrink-0">
              <div className="flex border-b">
                <button
                  onClick={() => setRightTab("memory")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors ${rightTab === "memory" ? "border-purple-500 text-purple-700" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <Brain className="w-3.5 h-3.5" /> Mémoire
                </button>
                <button
                  onClick={() => setRightTab("templates")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors ${rightTab === "templates" ? "border-amber-500 text-amber-700" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <ZapIcon className="w-3.5 h-3.5" /> Templates
                </button>
              </div>
              <ScrollArea className="flex-1">
                {rightTab === "memory" ? (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" />Mémoire client</p>
                      {!editingSummary ? (
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setEditingSummary(true)}>
                          Modifier
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-destructive" onClick={handleClearSummary} disabled={savingSummary}>Effacer</Button>
                          <Button size="sm" className="h-6 text-xs px-2" onClick={handleSaveSummary} disabled={savingSummary}>Sauver</Button>
                        </div>
                      )}
                    </div>
                    {editingSummary ? (
                      <Textarea
                        value={summaryDraft}
                        onChange={e => setSummaryDraft(e.target.value)}
                        placeholder="Faits clés sur ce client : budget, besoins, préférences..."
                        className="text-xs min-h-[120px] resize-none"
                        rows={6}
                        autoFocus
                      />
                    ) : currentSummary ? (
                      <div className="space-y-1.5">
                        {currentSummary.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} className="text-xs bg-purple-50 border border-purple-100 rounded px-2 py-1.5 text-purple-900 leading-relaxed">{line}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">Aucune mémoire.<br />Cliquez sur "Modifier" pour ajouter des faits sur ce client.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <TemplatesPanel onInsert={handleInsertTemplate} />
                )}
              </ScrollArea>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
