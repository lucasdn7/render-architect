import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Poll {
  id: string;
  question: string;
}

interface PollOption {
  id: string;
  option_text: string;
}

interface PollResult {
  poll_option_id: string;
  option_text: string;
  vote_count: number;
}

export default function PollWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [results, setResults] = useState<PollResult[]>([]);

  const totalVotes = useMemo(
    () => results.reduce((sum, item) => sum + (item.vote_count || 0), 0),
    [results],
  );

  useEffect(() => {
    const loadPoll = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: activePoll, error: pollError } = await supabase
          .from("polls" as never)
          .select("id, question")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pollError) throw pollError;

        const parsedPoll = (activePoll as Poll | null) ?? null;
        setPoll(parsedPoll);

        if (!parsedPoll) {
          setOptions([]);
          setResults([]);
          setHasVoted(false);
          return;
        }

        const { data: pollOptions, error: optionsError } = await supabase
          .from("poll_options" as never)
          .select("id, option_text")
          .eq("poll_id", parsedPoll.id)
          .order("created_at", { ascending: true });

        if (optionsError) throw optionsError;

        setOptions((pollOptions ?? []) as unknown as PollOption[]);

        const { data: existingVote, error: voteError } = await supabase
          .from("poll_votes" as never)
          .select("option_id")
          .eq("poll_id", parsedPoll.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (voteError) throw voteError;

        const voted = Boolean(existingVote);
        setHasVoted(voted);
        setSelectedOptionId((existingVote as { option_id?: string } | null)?.option_id ?? null);

        if (voted) {
          const { data: resultRows, error: resultError } = await supabase
            .from("poll_results" as never)
            .select("poll_option_id, option_text, vote_count")
            .eq("poll_id", parsedPoll.id)
            .order("vote_count", { ascending: false });

          if (resultError) throw resultError;
          setResults((resultRows ?? []) as unknown as PollResult[]);
        }
      } catch (error) {
        console.error("Error loading poll widget:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar enquete",
          description: "Não foi possível carregar a enquete ativa.",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadPoll();
  }, [toast, user?.id]);

  const handleVote = async () => {
    if (!poll?.id || !selectedOptionId || !user?.id) return;

    try {
      setSubmittingVote(true);

      const { error: insertError } = await supabase.from("poll_votes" as never).insert({
        poll_id: poll.id,
        option_id: selectedOptionId,
        user_id: user.id,
      } as never);

      if (insertError) throw insertError;

      const { data: resultRows, error: resultError } = await supabase
        .from("poll_results" as never)
        .select("poll_option_id, option_text, vote_count")
        .eq("poll_id", poll.id)
        .order("vote_count", { ascending: false });

      if (resultError) throw resultError;

      setResults((resultRows ?? []) as unknown as PollResult[]);
      setHasVoted(true);
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast({
        variant: "destructive",
        title: "Erro ao votar",
        description: "Não foi possível registrar seu voto. Tente novamente.",
      });
    } finally {
      setSubmittingVote(false);
    }
  };

  if (loading || !poll) return null;

  if (hasVoted) {
    return (
      <Card className="border-[#1e1e1e] bg-[#111111]">
        <CardHeader>
          <CardTitle className="text-white">Enquete ativa</CardTitle>
          <p className="text-sm text-muted-foreground">{poll.question}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.map((item) => {
            const percent = totalVotes > 0 ? (item.vote_count / totalVotes) * 100 : 0;
            return (
              <div key={item.poll_option_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.option_text}</span>
                  <span>{percent.toFixed(1)}% ({item.vote_count})</span>
                </div>
                <Progress value={percent} />
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">Total de votos: {totalVotes}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#1e1e1e] bg-[#111111]">
      <CardHeader>
        <CardTitle className="text-white">Enquete ativa</CardTitle>
        <p className="text-sm text-muted-foreground">{poll.question}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {options.map((option) => {
            const selected = selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedOptionId(option.id)}
                className="w-full rounded-md border px-3 py-2 text-left text-sm transition-colors"
                style={{
                  borderColor: selected ? "#C9A84C" : "#1e1e1e",
                  background: selected ? "#1a1400" : "transparent",
                  color: selected ? "#C9A84C" : "#FFFFFF",
                }}
              >
                {option.option_text}
              </button>
            );
          })}
        </div>

        <Button onClick={handleVote} disabled={!selectedOptionId || submittingVote}>
          {submittingVote ? "Enviando voto..." : "Votar"}
        </Button>
      </CardContent>
    </Card>
  );
}
