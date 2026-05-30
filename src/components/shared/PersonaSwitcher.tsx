import { UserRound } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePersonaStore } from "@/store";
import type { PersonaID } from "@/types";

export function PersonaSwitcher() {
  const personas = usePersonaStore((state) => state.personas);
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);
  const switchPersona = usePersonaStore((state) => state.switchPersona);
  const activePersona =
    personas.find((persona) => persona.id === activePersonaId) ?? personas[0];

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8 border">
        <AvatarFallback className="bg-nova/10 text-xs font-semibold text-nova">
          {activePersona?.avatarInitials ?? <UserRound className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <Select
        value={activePersonaId}
        onValueChange={(value) => switchPersona(value as PersonaID)}
      >
        <SelectTrigger className="h-9 w-[240px]">
          <SelectValue placeholder="Select persona" />
        </SelectTrigger>
        <SelectContent>
          {personas.map((persona) => (
            <SelectItem key={persona.id} value={persona.id}>
              <div className="flex flex-col">
                <span className="font-medium">{persona.displayName}</span>
                <span className="text-xs text-muted-foreground">{persona.role}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

