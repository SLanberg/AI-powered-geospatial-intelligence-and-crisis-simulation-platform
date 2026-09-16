import { chatController } from "@/backend/controllers/chat.controller";

export const runtime = "nodejs";

export async function GET() {
  return chatController.getStatus();
}

export async function POST(request: Request) {
  return chatController.handleChat(request);
}