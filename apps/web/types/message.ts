export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    profilePhoto: string;
  };
}

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    profilePhoto: string;
  };
  lastMessage?: Message;
  unreadCount: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  profilePhoto: string;
}
