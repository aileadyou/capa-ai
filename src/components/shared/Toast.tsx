import { toast } from "sonner";

export function showMockToast(title: string, description?: string) {
  toast(title, {
    description,
  });
}

