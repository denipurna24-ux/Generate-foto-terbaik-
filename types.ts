
export enum Tab {
  GENERATE = 'Generate',
  EDIT = 'Edit',
  CHAT = 'Chat',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
