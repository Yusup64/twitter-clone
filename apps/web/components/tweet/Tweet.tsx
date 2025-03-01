import React from 'react';
import { useRouter } from 'next/navigation';

// 定义Tweet接口
interface TweetUser {
  id: string;
  username: string;
  displayName?: string;
  profilePhoto?: string;
}

interface TweetData {
  id: string;
  content: string;
  createdAt: string;
  user: TweetUser;
  mediaUrls?: string[];
  _count?: {
    likes: number;
    retweets: number;
    comments: number;
  };
  // 其他可能的字段
}

interface TweetProps {
  tweet: TweetData;
  onActionComplete?: () => void;
}

export const Tweet: React.FC<TweetProps> = ({ tweet, onActionComplete }) => {
  const router = useRouter();

  // 格式化推文内容，高亮标签和提及
  const formatContent = (content: string) => {
    // 替换hashtags为链接
    const withHashtags = content.replace(
      /#(\w+)/g,
      '<span class="text-primary cursor-pointer hover:underline" data-hashtag="$1">#$1</span>',
    );

    // 替换mentions为链接
    const withMentions = withHashtags.replace(
      /@(\w+)/g,
      '<span class="text-primary cursor-pointer hover:underline" data-mention="$1">@$1</span>',
    );

    return withMentions;
  };

  // 处理点击事件，检查是否点击了hashtag或mention
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 检查是否点击了hashtag
    const hashtag = target.getAttribute('data-hashtag');

    if (hashtag) {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/hashtag/${hashtag}`);

      return;
    }

    // 检查是否点击了mention
    const mention = target.getAttribute('data-mention');

    if (mention) {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/user/${mention}`);

      return;
    }
  };

  return (
    <div className="border-b border-divider p-4 hover:bg-default-50 transition-colors cursor-pointer">
      <div className="flex gap-3">
        {/* ... existing avatar code ... */}
        <div className="flex-1">
          {/* ... existing user info code ... */}

          {/* 推文内容 - 添加点击事件处理 */}
          <div
            dangerouslySetInnerHTML={{ __html: formatContent(tweet.content) }}
            className="mt-2 text-default-900 whitespace-pre-wrap break-words"
            role="button"
            tabIndex={0}
            onClick={handleContentClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleContentClick(
                  e as unknown as React.MouseEvent<HTMLDivElement>,
                );
              }
            }}
          />

          {/* ... existing media, poll, actions code ... */}
        </div>
      </div>
    </div>
  );
};
