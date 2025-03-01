'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Avatar,
  Badge,
  Input,
  Button,
  Tabs,
  Tab,
  Card,
  ScrollShadow,
  Spinner,
  addToast,
} from '@heroui/react';
import { Send, ArrowLeft } from 'lucide-react';

import { useAuthStore } from '@/stores/useAuthStore';
import { useWebSocket } from '@/contexts/WebSocketContext';
import {
  getConversations,
  getMessages,
  sendMessage,
  getFollowingUsers,
} from '@/api/message';
import { Message, Conversation, User } from '@/types/message';
import { formatDistanceToNow } from '@/utils/date';

export default function MessagesPage() {
  const { user, getUser } = useAuthStore();
  const ws = useWebSocket();

  const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedUser) {
      const userInfo =
        activeTab === 'chats'
          ? conversations.find((c) => c.otherUser.id === selectedUser)
              ?.otherUser
          : followingUsers.find((u) => u.id === selectedUser);

      if (userInfo) {
        setSelectedUserInfo(userInfo);
      }
    }
  }, [selectedUser, conversations, followingUsers, activeTab]);

  useEffect(() => {
    fetchConversations();
    fetchFollowingUsers();
    getUser();

    const unsubscribe = ws.subscribe(
      'message',
      (event: { type: string; data: Message }) => {
        if (event.type !== 'new') return;

        if (event.data.senderId === selectedUser) {
          setMessages((prev) => [...prev, event.data]);
        }
        fetchConversations();
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await getConversations();

      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchFollowingUsers = async () => {
    try {
      const data = await getFollowingUsers();

      setFollowingUsers(data);
    } catch (error) {
      console.error('Failed to fetch following users:', error);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      setIsLoadingMessages(true);
      const data = await getMessages(userId);

      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    setIsLoading(true);
    try {
      const message = await sendMessage(selectedUser, newMessage);

      setMessages((prev) => [...prev, message]);
      setNewMessage('');

      if (!conversations.find((c) => c.otherUser.id === selectedUser)) {
        fetchConversations();
      }
      addToast({
        title: 'Success',
        description: 'Message sent successfully',
        color: 'success',
        timeout: 2000,
      });
    } catch (error: any) {
      addToast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        color: 'danger',
        timeout: 2000,
      });
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-1 px-0 md:px-5 max-w-5xl mx-auto"
      style={{ minHeight: 'calc(100vh - 100px)' }}
    >
      {/* Left Sidebar */}
      <div
        className={`${
          isMobile && selectedUser ? 'hidden' : 'block'
        } md:w-72 border-r border-divider space-x-4`}
      >
        <div className="p-4 border-b border-divider">
          <h1 className="text-xl font-bold mb-2">Messages</h1>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as 'chats' | 'users')}
          >
            <Tab key="chats" title="Chats" />
            <Tab key="users" title="Users" />
          </Tabs>
        </div>

        <ScrollShadow className="h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] p-4 !m-0 flex flex-col gap-2">
          {activeTab === 'chats'
            ? // Conversations List
              conversations.map((conversation) => (
                <div
                  key={conversation.id!}
                  className={`p-4 hover:bg-default-100 rounded-xl cursor-pointer ${
                    selectedUser === conversation.otherUser.id
                      ? 'bg-default-100'
                      : ''
                  }`}
                  onClick={() => handleUserSelect(conversation.otherUser.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={conversation.otherUser.displayName}
                      src={conversation.otherUser.profilePhoto}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">
                          {conversation.otherUser.displayName ||
                            conversation.otherUser.username}
                        </p>
                        {conversation.lastMessage && (
                          <span className="text-sm text-default-500 whitespace-nowrap">
                            {formatDistanceToNow(
                              conversation.lastMessage.createdAt,
                            )}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-default-500 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge color="primary">conversation.unreadCount</Badge>
                    )}
                  </div>
                </div>
              ))
            : // Following Users List
              followingUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 hover:bg-default-100 rounded-xl cursor-pointer ${
                    selectedUser === user.id ? 'bg-default-100' : ''
                  }`}
                  onClick={() => handleUserSelect(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={user.displayName} src={user.profilePhoto} />
                    <div className="flex-1">
                      <p className="font-semibold">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-sm text-default-500">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
        </ScrollShadow>
      </div>

      {/* Messages Area */}
      <div
        className={`${
          isMobile && !selectedUser ? 'hidden' : 'block'
        } flex-1 flex flex-col`}
      >
        {selectedUser ? (
          <>
            {/* Selected User Header */}
            <div className="p-4 border-b border-divider">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button
                    isIconOnly
                    className="mr-2"
                    variant="light"
                    onPress={() => setSelectedUser(null)}
                  >
                    <ArrowLeft />
                  </Button>
                )}
                <Avatar
                  name={selectedUserInfo?.displayName}
                  src={selectedUserInfo?.profilePhoto}
                />
                <div>
                  <p className="font-semibold">
                    {selectedUserInfo?.displayName ||
                      selectedUserInfo?.username}
                  </p>
                  <p className="text-sm text-default-500">
                    @{selectedUserInfo?.username}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollShadow
              ref={messagesEndRef}
              hideScrollBar
              className="flex-1 p-2 md:p-4 space-y-4"
            >
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.id
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <Card
                      className={`max-w-[85%] md:max-w-[70%] p-3 ${
                        message.senderId === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-default-50'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {formatDistanceToNow(message.createdAt)}
                      </p>
                    </Card>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </ScrollShadow>

            {/* Message Input */}
            <div className="p-2 md:p-4 border-t border-divider">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Input
                  fullWidth
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button
                  isIconOnly
                  color="primary"
                  isLoading={isLoading}
                  type="submit"
                >
                  <Send />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-default-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
