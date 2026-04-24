import { FormEvent, useState } from "react";
import ProfileLayout from "@/components/ProfileLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Suggestions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Sessão inválida",
        description: "Faça login novamente para enviar sua sugestão.",
      });
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha o assunto e a sugestão antes de enviar.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("suggestions" as never).insert({
        user_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
      } as never);

      if (error) throw error;

      toast({
        title: "Sugestão enviada",
        description: "Obrigado! Sua sugestão foi registrada com sucesso.",
      });

      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: "Não foi possível registrar sua sugestão. Tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProfileLayout title="Sugestões" subtitle="Envie ideias para melhorar o produto.">
      <Card className="border-[#1e1e1e] bg-[#111111]">
        <CardHeader>
          <CardTitle className="text-white">Nova sugestão</CardTitle>
          <CardDescription>
            Este envio é salvo no painel administrativo para análise da equipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground">Assunto</label>
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value.slice(0, 100))}
                maxLength={100}
                placeholder="Resumo da sugestão"
              />
              <p className="text-xs text-muted-foreground text-right">{subject.length}/100</p>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground">Sugestão</label>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value.slice(0, 1000))}
                maxLength={1000}
                placeholder="Descreva sua ideia com o máximo de contexto possível"
                className="min-h-36"
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar Sugestão"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </ProfileLayout>
  );
}
