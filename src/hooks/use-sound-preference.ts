import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSoundPreference = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSoundPreference();
  }, []);

  const loadSoundPreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("sound_effects_enabled")
        .eq("id", user.id)
        .single();

      if (profile) {
        setSoundEnabled(profile.sound_effects_enabled ?? true);
      }
    } catch (error) {
      console.error("Error loading sound preference:", error);
    } finally {
      setLoading(false);
    }
  };

  return { soundEnabled, loading };
};
