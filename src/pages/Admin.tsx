import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import ProfileLayout from "@/components/ProfileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface SuggestionRow {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  created_at: string;
}

interface PollRow {
  id: string;
  question: string;
  created_at: string;
  is_active: boolean;
}

interface PollResultRow {
  poll_id: string;
  poll_option_id: string;
  option_text: string;
  vote_count: number;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Admin() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [polls, setPolls] = useState<PollRow[]>([]);
  const [pollResults, setPollResults] = useState<Record<string, PollResultRow[]>>({});
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [newPollOpen, setNewPollOpen] = useState(false);
  const [savingPoll, setSavingPoll] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newCloseDate, setNewCloseDate] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);

  const selectedPollResults = useMemo(() => {
    if (!selectedPollId) return [];
    return pollResults[selectedPollId] || [];
  }, [pollResults, selectedPollId]);

  const loadSuggestions = useCallback(async () => {
    try {
      setLoadingSuggestions(true);
      const { data, error } = await supabase
        .from("suggestions" as never)
        .select("id, user_id, subject, message, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as unknown as SuggestionRow[];
      setSuggestions(rows);

      const userIds = Array.from(new Set(rows.map((item) => item.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", userIds);

        const mapped = (profilesData ?? []).reduce<Record<string, string>>((acc, profile) => {
          const email = profile.email ?? "";
          if (profile.user_id) {
            acc[profile.user_id] = email;
          }
          return acc;
        }, {});

        setUserEmails(mapped);
      }
    } catch (error) {
      console.error("Error loading suggestions:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar sugestões",
        description: "Não foi possível carregar a lista de sugestões.",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  }, [toast]);

  const loadPolls = useCallback(async () => {
    try {
      setLoadingPolls(true);
      const { data, error } = await supabase
        .from("polls" as never)
        .select("id, question, created_at, is_active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPolls((data ?? []) as unknown as PollRow[]);
    } catch (error) {
      console.error("Error loading polls:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar enquetes",
        description: "Não foi possível carregar as enquetes.",
      });
    } finally {
      setLoadingPolls(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSuggestions();
    void loadPolls();
  }, [loadPolls, loadSuggestions]);

  const loadPollResults = async (pollId: string) => {
    try {
      setSelectedPollId(pollId);
      const { data, error } = await supabase
        .from("poll_results" as never)
        .select("poll_id, poll_option_id, option_text, vote_count")
        .eq("poll_id", pollId)
        .order("vote_count", { ascending: false });

      if (error) throw error;

      setPollResults((current) => ({
        ...current,
        [pollId]: (data ?? []) as unknown as PollResultRow[],
      }));
    } catch (error) {
      console.error("Error loading poll results:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar resultados",
        description: "Não foi possível carregar o resultado desta enquete.",
      });
    }
  };

  const handleCreatePoll = async (event: FormEvent) => {
    event.preventDefault();

    const question = newQuestion.trim();
    const options = newOptions.map((value) => value.trim()).filter(Boolean);

    if (!question || options.length < 2) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Preencha a pergunta e pelo menos 2 opções.",
      });
      return;
    }

    try {
      setSavingPoll(true);

      const pollPayload: Record<string, unknown> = {
        question,
        is_active: true,
      };

      if (newCloseDate) {
        pollPayload.ends_at = new Date(`${newCloseDate}T23:59:59`).toISOString();
      }

      const { data: pollData, error: pollError } = await supabase
        .from("polls" as never)
        .insert(pollPayload as never)
        .select("id")
        .single();

      if (pollError) throw pollError;

      const pollId = (pollData as { id: string }).id;
      const optionsPayload = options.map((optionText) => ({
        poll_id: pollId,
        option_text: optionText,
      }));

      const { error: optionsError } = await supabase
        .from("poll_options" as never)
        .insert(optionsPayload as never);

      if (optionsError) throw optionsError;

      toast({
        title: "Enquete criada",
        description: "A nova enquete foi salva com sucesso.",
      });

      setNewQuestion("");
      setNewCloseDate("");
      setNewOptions(["", ""]);
      setNewPollOpen(false);
      await loadPolls();
    } catch (error) {
      console.error("Error creating poll:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar enquete",
        description: "Não foi possível criar a enquete. Tente novamente.",
      });
    } finally {
      setSavingPoll(false);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      const { error } = await supabase
        .from("polls" as never)
        .update({ is_active: false } as never)
        .eq("id", pollId);

      if (error) throw error;

      toast({
        title: "Enquete encerrada",
        description: "A enquete foi marcada como encerrada.",
      });

      await loadPolls();
    } catch (error) {
      console.error("Error closing poll:", error);
      toast({
        variant: "destructive",
        title: "Erro ao encerrar enquete",
        description: "Não foi possível encerrar a enquete selecionada.",
      });
    }
  };

  const addOptionField = () => {
    setNewOptions((current) => {
      if (current.length >= 6) return current;
      return [...current, ""];
    });
  };

  const removeOptionField = (index: number) => {
    setNewOptions((current) => {
      if (current.length <= 2) return current;
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  return (
    <ProfileLayout title="Admin" subtitle="Painel administrativo de sugestões e enquetes.">
      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
          <TabsTrigger value="polls">Enquetes</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions">
          <Card className="border-[#1e1e1e] bg-[#111111]">
            <CardHeader>
              <CardTitle className="text-white">Sugestões recebidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-[#1e1e1e]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingSuggestions ? (
                      <TableRow>
                        <TableCell colSpan={4}>Carregando...</TableCell>
                      </TableRow>
                    ) : suggestions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>Nenhuma sugestão encontrada.</TableCell>
                      </TableRow>
                    ) : (
                      suggestions.map((suggestion) => (
                        <TableRow key={suggestion.id}>
                          <TableCell className="max-w-[220px] truncate">{suggestion.subject}</TableCell>
                          <TableCell className="max-w-[420px] whitespace-pre-wrap break-words">{suggestion.message}</TableCell>
                          <TableCell>{formatDateTime(suggestion.created_at)}</TableCell>
                          <TableCell>{userEmails[suggestion.user_id] || suggestion.user_id}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="polls" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={newPollOpen} onOpenChange={setNewPollOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Enquete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Enquete</DialogTitle>
                  <DialogDescription>Crie uma nova enquete para os usuários votarem.</DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={handleCreatePoll}>
                  <div className="space-y-2">
                    <label className="text-sm">Pergunta</label>
                    <Textarea
                      value={newQuestion}
                      onChange={(event) => setNewQuestion(event.target.value)}
                      placeholder="Digite a pergunta da enquete"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">Data de encerramento (opcional)</label>
                    <Input
                      type="date"
                      value={newCloseDate}
                      onChange={(event) => setNewCloseDate(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Opções de resposta</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOptionField}
                        disabled={newOptions.length >= 6}
                      >
                        + Adicionar opção
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {newOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={(event) => {
                              const next = [...newOptions];
                              next[index] = event.target.value;
                              setNewOptions(next);
                            }}
                            placeholder={`Opção ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOptionField(index)}
                            disabled={newOptions.length <= 2}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={savingPoll}>
                      {savingPoll ? "Salvando..." : "Salvar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-[#1e1e1e] bg-[#111111]">
            <CardHeader>
              <CardTitle className="text-white">Enquetes existentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-[#1e1e1e]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pergunta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPolls ? (
                      <TableRow>
                        <TableCell colSpan={4}>Carregando...</TableCell>
                      </TableRow>
                    ) : polls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>Nenhuma enquete cadastrada.</TableCell>
                      </TableRow>
                    ) : (
                      polls.map((poll) => (
                        <TableRow key={poll.id} onClick={() => void loadPollResults(poll.id)} className="cursor-pointer">
                          <TableCell className="max-w-[420px] whitespace-pre-wrap break-words">{poll.question}</TableCell>
                          <TableCell>{poll.is_active ? "Ativa" : "Encerrada"}</TableCell>
                          <TableCell>{formatDateTime(poll.created_at)}</TableCell>
                          <TableCell className="text-right">
                            {poll.is_active && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleClosePoll(poll.id);
                                }}
                              >
                                Encerrar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {selectedPollId && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-white font-medium">Resultado da enquete</h3>
                  {selectedPollResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem votos até o momento.</p>
                  ) : (
                    (() => {
                      const totalVotes = selectedPollResults.reduce((sum, row) => sum + (row.vote_count || 0), 0);

                      return (
                        <div className="space-y-3">
                          {selectedPollResults.map((row) => {
                            const percent = totalVotes > 0 ? (row.vote_count / totalVotes) * 100 : 0;

                            return (
                              <div key={row.poll_option_id} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span>{row.option_text}</span>
                                  <span>{percent.toFixed(1)}% ({row.vote_count})</span>
                                </div>
                                <Progress value={percent} />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ProfileLayout>
  );
}
