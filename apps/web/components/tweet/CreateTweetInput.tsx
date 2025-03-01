'use client';

import React, { useState, useRef, useEffect } from 'react';
import { addToast, Avatar, Button, Textarea } from '@heroui/react';
import { Image, Hash } from 'lucide-react';
import { MdHowToVote } from 'react-icons/md';

import { MediaUpload } from './MediaUpload';
import { CreatePoll } from './CreatePoll';

import { useAuthStore } from '@/stores/useAuthStore';
import { createTweet, createTweetWithPoll } from '@/api/tweets';
import { searchUsers } from '@/api/users';
import { searchHashtags } from '@/api/tweets';

interface CreateTweetInputProps {
  onSuccess: () => void;
}

// 定义用户和标签的接口
interface UserSuggestion {
  id: string;
  username: string;
  displayName?: string;
  profilePhoto?: string;
}

interface HashtagSuggestion {
  id: string;
  name: string;
  count: number;
}

interface SearchUsersResponse {
  users: UserSuggestion[];
}

interface SearchHashtagsResponse {
  hashtags: HashtagSuggestion[];
}

export const CreateTweetInput: React.FC<CreateTweetInputProps> = ({
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 提及和标签相关状态
  const [mentionSearch, setMentionSearch] = useState('');
  const [hashtagSearch, setHashtagSearch] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<
    UserSuggestion[]
  >([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<
    HashtagSuggestion[]
  >([]);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [hashtagPosition, setHashtagPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);

  // 监听内容变化，检测@和#
  useEffect(() => {
    if (!content) return;

    const cursorPos = textareaRef.current?.selectionStart || 0;

    setCursorPosition(cursorPos);

    // 检测@提及
    const mentionRegex = /@(\w*)$/;
    const contentBeforeCursor = content.slice(0, cursorPos);
    const mentionMatch = contentBeforeCursor.match(mentionRegex);

    if (mentionMatch) {
      const searchTerm = mentionMatch[1];

      setMentionSearch(searchTerm);
      setShowMentionSuggestions(true);
      setShowHashtagSuggestions(false);

      // 计算提及建议的位置
      if (textareaRef.current) {
        const { top, left, height } =
          textareaRef.current.getBoundingClientRect();

        // 这里的位置计算是简化的，实际应用中可能需要更复杂的计算
        setMentionPosition({
          top: top + height + window.scrollY,
          left: left + window.scrollX,
        });
      }

      // 搜索用户
      if (searchTerm.length > 0) {
        searchUsers({ query: searchTerm, limit: 5 })
          .then((res: any) => {
            if (res && res.users) {
              setMentionSuggestions(res.users);
            }
          })
          .catch((err) => {
            console.error('Failed to search users:', err);
          });
      } else {
        setMentionSuggestions([]);
      }
    } else {
      setShowMentionSuggestions(false);
    }

    // 检测#标签
    const hashtagRegex = /#(\w*)$/;
    const hashtagMatch = contentBeforeCursor.match(hashtagRegex);

    if (hashtagMatch) {
      const searchTerm = hashtagMatch[1];

      setHashtagSearch(searchTerm);
      setShowHashtagSuggestions(true);
      setShowMentionSuggestions(false);

      // 计算标签建议的位置
      if (textareaRef.current) {
        const { top, left, height } =
          textareaRef.current.getBoundingClientRect();

        setHashtagPosition({
          top: top + height + window.scrollY,
          left: left + window.scrollX,
        });
      }

      // 搜索标签
      if (searchTerm.length > 0) {
        searchHashtags(searchTerm, 5)
          .then((res: any) => {
            if (res && res.hashtags) {
              setHashtagSuggestions(res.hashtags);
            }
          })
          .catch((err) => {
            console.error('Failed to search hashtags:', err);
          });
      } else {
        setHashtagSuggestions([]);
      }
    } else {
      setShowHashtagSuggestions(false);
    }
  }, [content, cursorPosition]);

  const handleSelectMention = (username: string) => {
    const beforeMention = content.slice(0, cursorPosition).replace(/@\w*$/, '');
    const afterMention = content.slice(cursorPosition);

    setContent(beforeMention + '@' + username + ' ' + afterMention);
    setShowMentionSuggestions(false);

    // 聚焦回文本框并设置光标位置
    if (textareaRef.current) {
      const newCursorPos = beforeMention.length + username.length + 2; // +2 for @ and space

      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleSelectHashtag = (hashtag: string) => {
    const beforeHashtag = content.slice(0, cursorPosition).replace(/#\w*$/, '');
    const afterHashtag = content.slice(cursorPosition);

    setContent(beforeHashtag + '#' + hashtag + ' ' + afterHashtag);
    setShowHashtagSuggestions(false);

    // 聚焦回文本框并设置光标位置
    if (textareaRef.current) {
      const newCursorPos = beforeHashtag.length + hashtag.length + 2; // +2 for # and space

      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handlePollSubmit = async (pollData: {
    question: string;
    options: string[];
    expiresAt: Date;
  }) => {
    if (!content.trim()) return;

    try {
      setIsLoading(true);
      await createTweetWithPoll({ content }, pollData);
      setContent('');
      setShowPoll(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create tweet with poll:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaUrls.length === 0) return;

    try {
      setIsLoading(true);
      if (showPoll) {
        return;
      }

      // 提取标签
      const hashtags = extractHashtags(content);

      // 使用 mediaUrls 而不是 mediaFiles
      await createTweet({ content, mediaUrls, hashtags });
      setContent('');
      setMediaFiles([]);
      setMediaUrls([]);
      setShowPoll(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create tweet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 提取标签函数
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);

    if (!matches) return [];

    return matches.map((tag) => tag.slice(1)); // 移除#符号
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();

      formData.append('file', file);
      formData.append('upload_preset', 'twitter'); // 使用你的 Upload Preset 名称

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/djczyvsih/upload',
        {
          method: 'POST',
          body: formData,
        },
      );

      const data = await response.json();

      if (data.secure_url) {
        setMediaUrls((prev) => [...prev, data.secure_url]);

        return data.secure_url;
      }

      return null;
    } catch (error) {
      console.error('Failed to upload file:', error);

      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

    // 过滤掉超过大小限制的文件
    const validFiles = files.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        addToast({
          title: '文件过大',
          description: `文件 ${file.name} 超过15MB大小限制`,
          color: 'danger',
          timeout: 3000,
        });

        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      // 保存文件对象用于预览
      setMediaFiles((prev) => [...prev, ...validFiles].slice(0, 4)); // 最多4个文件

      // 立即上传文件到 Cloudinary
      for (const file of validFiles) {
        await uploadFile(file);
      }
    }

    // 清空input的value,这样可以重复选择同一个文件
    e.target.value = '';
  };

  const togglePoll = () => {
    if (mediaFiles.length === 0) {
      setShowPoll(!showPoll);
    }
  };

  // 格式化显示内容，高亮标签和提及
  const formatContent = (text: string) => {
    return text
      .replace(/#(\w+)/g, '<span class="text-primary">#$1</span>')
      .replace(/@(\w+)/g, '<span class="text-primary">@$1</span>');
  };

  return (
    <div className="flex gap-4 relative">
      <Avatar name={user?.username} src={user?.profilePhoto!} />
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          className="border-none text-lg"
          minRows={2}
          placeholder="What's happening?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onClick={() =>
            setCursorPosition(textareaRef.current?.selectionStart || 0)
          }
          onKeyUp={() =>
            setCursorPosition(textareaRef.current?.selectionStart || 0)
          }
        />

        {/* 提及建议下拉框 */}
        {showMentionSuggestions && mentionSuggestions.length > 0 && (
          <div
            className="absolute top-0 left-0 z-10 bg-white shadow-lg rounded-lg p-2 w-64 max-h-60 overflow-y-auto"
            style={{ top: mentionPosition.top, left: mentionPosition.left }}
          >
            {mentionSuggestions.map((user) => (
              <button
                key={user.id}
                className="flex items-center gap-2 p-2 hover:bg-default-100 cursor-pointer rounded-md w-full text-left"
                role="option"
                onClick={() => handleSelectMention(user.username)}
              >
                <Avatar
                  name={user.username}
                  size="sm"
                  src={user.profilePhoto}
                />
                <div>
                  <p className="font-semibold">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-small text-default-500">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 标签建议下拉框 */}
        {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
          <div
            className="absolute z-10 bg-white shadow-lg rounded-lg p-2 w-64 max-h-60 overflow-y-auto"
            role="listbox"
          >
            {hashtagSuggestions.map((hashtag) => (
              <button
                key={hashtag.id}
                className="flex items-center gap-2 p-2 hover:bg-default-100 cursor-pointer rounded-md w-full text-left"
                role="option"
                onClick={() => handleSelectHashtag(hashtag.name)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">#{hashtag.name}</p>
                  <p className="text-small text-default-500">
                    {hashtag.count} tweets
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showPoll ? (
          <CreatePoll onSubmit={handlePollSubmit} />
        ) : (
          mediaFiles.length > 0 && (
            <MediaUpload
              files={mediaFiles}
              onFilesChange={(files) => {
                setMediaFiles(files);
                // 如果删除了文件，也需要删除对应的URL
                if (files.length < mediaUrls.length) {
                  setMediaUrls((prev) => prev.slice(0, files.length));
                }
              }}
            />
          )
        )}
        <div className="flex justify-between items-center mt-4 border-t border-divider pt-4">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              multiple
              accept="image/*,video/*"
              className="hidden"
              type="file"
              onChange={handleFileChange}
            />
            <Button
              isIconOnly
              isDisabled={showPoll || isUploading}
              variant="light"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="w-5 h-5" />
            </Button>
            <Button
              isIconOnly
              isDisabled={mediaFiles.length > 0}
              variant="light"
              onClick={togglePoll}
            >
              <MdHowToVote className="w-5 h-5" />
            </Button>
            <Button
              isIconOnly
              variant="light"
              onClick={() => {
                if (textareaRef.current) {
                  const curPos =
                    textareaRef.current.selectionStart ||
                    textareaRef.current.value.length;
                  const textBefore = content.substring(0, curPos);
                  const textAfter = content.substring(curPos);

                  setContent(textBefore + '#' + textAfter);

                  // 设置光标位置在#后面
                  setTimeout(() => {
                    if (textareaRef.current) {
                      const newPos = curPos + 1;

                      textareaRef.current.focus();
                      textareaRef.current.setSelectionRange(newPos, newPos);
                    }
                  }, 0);
                }
              }}
            >
              <Hash className="w-5 h-5" />
            </Button>
          </div>
          <Button
            color="primary"
            isDisabled={
              (!content.trim() && mediaUrls.length === 0) || isUploading
            }
            isLoading={isLoading || isUploading}
            size="sm"
            onClick={showPoll ? undefined : handleSubmit}
          >
            Tweet
          </Button>
        </div>
      </div>
    </div>
  );
};
