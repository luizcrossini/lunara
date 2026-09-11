import { supabase } from "@/lib/supabase";

export async function uploadAvatar(userId: string, uri: string) {
  try {
    if (!userId) {
      throw new Error("Usuário não identificado.");
    }

    if (!uri) {
      throw new Error("Imagem não selecionada.");
    }

    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error("Não foi possível ler a imagem.");
    }

    const arrayBuffer = await response.arrayBuffer();

    const filePath = `${userId}/avatar-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("❌ Erro no upload do avatar:", uploadError);

      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Não foi possível obter a URL da imagem.");
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("❌ uploadAvatar:", error);

    throw error;
  }
}
