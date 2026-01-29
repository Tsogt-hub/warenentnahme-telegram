/**
 * Script zum Abrufen von Telegram User-IDs aus der Gruppe
 */
import { Bot } from "grammy";
import "dotenv/config";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// Gebharts Lager KI Group
const GROUP_CHAT_ID = -5025798709;

async function getGroupInfo() {
  try {
    console.log("🔍 Lade Gruppen-Informationen...\n");

    // Gruppen-Info
    const chat = await bot.api.getChat(GROUP_CHAT_ID);
    console.log("📋 Gruppe:", (chat as any).title || chat.id);
    console.log("   Chat-ID:", chat.id);
    console.log("");

    // Admins abrufen
    console.log("👥 Gruppen-Administratoren:");
    const admins = await bot.api.getChatAdministrators(GROUP_CHAT_ID);
    
    for (const admin of admins) {
      const user = admin.user;
      console.log(`   - ${user.first_name || ""} ${user.last_name || ""}`);
      console.log(`     Username: @${user.username || "keiner"}`);
      console.log(`     User-ID: ${user.id}`);
      console.log(`     Status: ${admin.status}`);
      console.log("");
    }

    console.log("✅ Fertig!");
    console.log("\n💡 Tipp: Normale Mitglieder können nur gefunden werden,");
    console.log("   wenn sie dem Bot eine Nachricht schicken.");
    console.log("   Die User-ID wird dann in den Transaktionen gespeichert.");

  } catch (error) {
    console.error("❌ Fehler:", error);
  }
}

getGroupInfo();
