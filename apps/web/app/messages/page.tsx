'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import {
  getConversations,
  getMessages,
  sendMessage,
  getFollowingUsers,
  markAsRead,
  getUnreadMessages,
  getUnreadCount,
} from '@/api/message';
import { Message, Conversation, User } from '@/types/message';
import { formatDistanceToNow } from '@/utils/date';

export default function MessagesPage() {
  const { user, getUser } = useAuthStore();

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

  // 添加新的状态
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [activeChats, setActiveChats] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 添加轮询相关状态
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalMs = 3000; // 轮询间隔，3秒
  const globalPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const globalPollingIntervalMs = 10000; // 全局轮询间隔，10秒

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

  // 替换WebSocket事件监听为轮询机制
  useEffect(() => {
    fetchConversations();
    fetchFollowingUsers();
    getUser();

    // 启动全局轮询，定期检查所有对话的未读消息
    startGlobalPolling();

    return () => {
      // 清理轮询定时器
      stopPolling();
      stopGlobalPolling();
    };
  }, []);

  // 当选择用户变化时，启动针对该用户的轮询
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);

      // 启动轮询获取未读消息
      startPolling();

      // 如果是从对话列表选择的用户，找到对应的对话并标记为已读
      if (activeTab === 'chats') {
        const conversation = conversations.find(
          (c) => c.otherUser.id === selectedUser,
        );

        if (conversation && conversation.unreadCount > 0) {
          markAsRead(conversation.id)
            .then(() => {
              // 更新本地对话列表中的未读计数
              setConversations((prevConversations) =>
                prevConversations.map((c) =>
                  c.id === conversation.id ? { ...c, unreadCount: 0 } : c,
                ),
              );
            })
            .catch((error) => {
              console.error('Failed to mark messages as read:', error);
            });
        }
      }
    }

    return () => {
      // 清理轮询定时器
      stopPolling();
    };
  }, [selectedUser]);

  // 启动针对选中用户的轮询
  const startPolling = useCallback(() => {
    // 先清除可能存在的轮询
    stopPolling();

    if (!selectedUser) return;

    console.log(`[MessagesPage] 启动轮询获取与用户 ${selectedUser} 的未读消息`);

    // 设置轮询定时器
    pollingIntervalRef.current = setInterval(() => {
      if (selectedUser) {
        pollUnreadMessages(selectedUser);
      }
    }, pollingIntervalMs);
  }, [selectedUser]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('[MessagesPage] 停止轮询未读消息');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // 启动全局轮询，检查所有对话的未读消息
  const startGlobalPolling = useCallback(() => {
    // 先清除可能存在的轮询
    stopGlobalPolling();

    console.log('[MessagesPage] 启动全局轮询获取所有未读消息数量');

    // 立即执行一次
    pollUnreadCount();

    // 设置轮询定时器
    globalPollingIntervalRef.current = setInterval(() => {
      pollUnreadCount();
    }, globalPollingIntervalMs);
  }, []);

  // 停止全局轮询
  const stopGlobalPolling = useCallback(() => {
    if (globalPollingIntervalRef.current) {
      console.log('[MessagesPage] 停止全局轮询');
      clearInterval(globalPollingIntervalRef.current);
      globalPollingIntervalRef.current = null;
    }
  }, []);

  // 轮询获取与特定用户的未读消息
  const pollUnreadMessages = async (userId: string) => {
    try {
      console.log(`[MessagesPage] 轮询获取与用户 ${userId} 的未读消息`);
      const response = await getUnreadMessages(
        userId,
        lastMessageId || undefined,
      );

      if (Array.isArray(response) && response.length > 0) {
        console.log(`[MessagesPage] 收到 ${response.length} 条新消息`);

        // 更新最后一条消息的ID
        setLastMessageId(response[response.length - 1].id);

        // 添加新消息到消息列表
        setMessages((prev) => [...prev, ...response]);

        // 播放提示音或显示通知
        playMessageSound();
      }
    } catch (error) {
      console.error('轮询未读消息失败:', error);
    }
  };

  // 轮询获取所有未读消息数量
  const pollUnreadCount = async () => {
    try {
      console.log('[MessagesPage] 轮询获取所有未读消息数量');
      const response = await getUnreadCount();

      if (
        response &&
        typeof response.total === 'number' &&
        response.total > 0
      ) {
        console.log(`[MessagesPage] 总共有 ${response.total} 条未读消息`);

        // 更新对话列表中的未读计数
        setConversations((prevConversations) => {
          return prevConversations.map((conv) => {
            // 使用可选链和类型守卫确保类型安全
            const unreadInfo = Array.isArray(response.conversations)
              ? response.conversations.find((c) => c.conversationId === conv.id)
              : undefined;

            if (unreadInfo && typeof unreadInfo.count === 'number') {
              return {
                ...conv,
                unreadCount: unreadInfo.count,
              };
            }

            return conv;
          });
        });

        // 如果有新消息且不是当前选中的用户，可以显示通知
        if (!selectedUser) {
          // 播放提示音或显示通知
          playMessageSound();
        }
      }
    } catch (error) {
      console.error('轮询未读消息数量失败:', error);
    }
  };

  // 播放消息提示音
  const playMessageSound = () => {
    try {
      const audio = new Audio('/sounds/message.mp3');

      audio.play();
    } catch (error) {
      console.error('播放提示音失败:', error);
    }
  };

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

  // 处理输入状态
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setNewMessage(value);

    // 移除WebSocket相关的输入状态处理
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await getConversations();

      if (Array.isArray(response)) {
        setConversations(response);

        // 更新在线用户状态
        const online = new Set<string>();

        response.forEach((conv) => {
          if (conv.isOnline) {
            online.add(conv.otherUser.id);
          }
        });
        setOnlineUsers(online);

        // 更新活跃聊天状态
        const active = new Set<string>();

        response.forEach((conv) => {
          if (conv.isInChat) {
            active.add(conv.otherUser.id);
          }
        });
        setActiveChats(active);
      } else {
        console.error('Unexpected response format for conversations');
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchFollowingUsers = async () => {
    try {
      const response = await getFollowingUsers();

      if (Array.isArray(response)) {
        setFollowingUsers(response);
      } else {
        console.error('Unexpected response format for following users');
      }
    } catch (error) {
      console.error('Failed to fetch following users:', error);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await getMessages(userId);

      if (Array.isArray(response)) {
        setMessages(response);

        // 如果有消息，更新最后一条消息的ID用于轮询
        if (response.length > 0) {
          setLastMessageId(response[response.length - 1].id);
        } else {
          setLastMessageId(null);
        }
      } else {
        console.error('Unexpected response format for messages');
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);

    // 如果是从对话列表选择的用户，找到对应的对话并标记为已读
    if (activeTab === 'chats') {
      const conversation = conversations.find((c) => c.otherUser.id === userId);

      if (conversation && conversation.unreadCount > 0) {
        markAsRead(conversation.id)
          .then(() => {
            // 更新本地对话列表中的未读计数
            setConversations((prevConversations) =>
              prevConversations.map((c) =>
                c.id === conversation.id ? { ...c, unreadCount: 0 } : c,
              ),
            );
          })
          .catch((error) => {
            console.error('Failed to mark messages as read:', error);
          });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    console.log(
      `[MessagesPage] 发送消息: 接收者=${selectedUser}, 内容=${newMessage}`,
    );
    setIsLoading(true);
    try {
      const response = await sendMessage(selectedUser, newMessage);

      console.log('[MessagesPage] 发送消息响应:', response);

      // 确保响应是一个有效的消息对象
      if (response && typeof response === 'object' && 'id' in response) {
        // 使用类型断言确保类型安全
        const messageObj = response as unknown as Message;

        console.log('[MessagesPage] 添加消息到本地列表:', messageObj);

        setMessages((prev) => [...prev, messageObj]);
        setNewMessage('');

        // 更新最后一条消息的ID用于轮询
        setLastMessageId(messageObj.id);

        if (!conversations.find((c) => c.otherUser.id === selectedUser)) {
          console.log('[MessagesPage] 未找到现有对话，刷新对话列表');
          fetchConversations();
        }
        addToast({
          title: 'Success',
          description: 'Message sent successfully',
          color: 'success',
          timeout: 2000,
        });
      } else {
        console.error('[MessagesPage] 消息响应格式异常:', response);
        addToast({
          title: 'Warning',
          description: 'Message sent but response format unexpected',
          color: 'warning',
          timeout: 2000,
        });
      }
    } catch (error: any) {
      console.error('[MessagesPage] 发送消息失败:', error);
      addToast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        color: 'danger',
        timeout: 2000,
      });
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
                <button
                  key={conversation.id!}
                  className={`w-full text-left p-4 hover:bg-default-100 rounded-xl cursor-pointer ${
                    selectedUser === conversation.otherUser.id
                      ? 'bg-default-100'
                      : ''
                  }`}
                  onClick={() => handleUserSelect(conversation.otherUser.id)}
                >
                  <div className="flex items-center gap-3">
                    {conversation.unreadCount > 0 ? (
                      <Badge color="primary" content={conversation.unreadCount}>
                        <Avatar
                          className={
                            onlineUsers.has(conversation.otherUser.id)
                              ? 'ring-2 ring-success'
                              : ''
                          }
                          name={conversation.otherUser.displayName}
                          src={conversation.otherUser.profilePhoto}
                        />
                      </Badge>
                    ) : (
                      <Avatar
                        className={
                          onlineUsers.has(conversation.otherUser.id)
                            ? 'ring-2 ring-success'
                            : ''
                        }
                        name={conversation.otherUser.displayName}
                        src={conversation.otherUser.profilePhoto}
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">
                          {conversation.otherUser.displayName ||
                            conversation.otherUser.username ||
                            'User'}
                          {onlineUsers.has(conversation.otherUser.id) && (
                            <span className="ml-1 text-success text-xs">●</span>
                          )}
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
                  </div>
                </button>
              ))
            : // Following Users List
              followingUsers.map((user) => (
                <button
                  key={user.id}
                  className={`w-full text-left p-4 hover:bg-default-100 rounded-xl cursor-pointer ${
                    selectedUser === user.id ? 'bg-default-100' : ''
                  }`}
                  onClick={() => handleUserSelect(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      className={
                        onlineUsers.has(user.id) ? 'ring-2 ring-success' : ''
                      }
                      name={user.displayName}
                      src={user.profilePhoto}
                    />
                    <div className="flex-1">
                      <p className="font-semibold">
                        {user.displayName || user.username}
                        {onlineUsers.has(user.id) && (
                          <span className="ml-1 text-success text-xs">●</span>
                        )}
                      </p>
                      <p className="text-sm text-default-500">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </button>
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
                  className={
                    onlineUsers.has(selectedUser) ? 'ring-2 ring-success' : ''
                  }
                  name={selectedUserInfo?.displayName}
                  src={selectedUserInfo?.profilePhoto}
                />
                <div>
                  <p className="font-semibold flex items-center">
                    {selectedUserInfo?.displayName ||
                      selectedUserInfo?.username}
                    {onlineUsers.has(selectedUser) && (
                      <span className="ml-1 text-success text-xs">●</span>
                    )}
                  </p>
                  <p className="text-sm text-default-500">
                    @{selectedUserInfo?.username}
                    {activeChats.has(selectedUser) && (
                      <span className="ml-2 text-xs text-success">
                        正在聊天
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollShadow hideScrollBar className="flex-1 p-2 md:p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <>
                  {messages.map((message) => (
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
                  ))}

                  {/* 显示对方正在输入的状态 */}
                  {typingUsers.has(selectedUser) && (
                    <div className="flex justify-start">
                      <div className="bg-default-100 px-3 py-2 rounded-full">
                        <span className="text-sm text-default-600">
                          正在输入...
                        </span>
                      </div>
                    </div>
                  )}
                </>
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
                  onChange={handleInputChange}
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
