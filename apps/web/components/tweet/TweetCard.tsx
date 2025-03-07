import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Avatar,
  Button,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  addToast,
  Image,
} from '@heroui/react';
import {
  Heart,
  MessageCircle,
  Repeat,
  Share,
  MoreVertical,
  Trash,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { ImagePreview } from '../common/ImagePreview';

import { CommentModal } from './CommentModal';
import { PollDisplay } from './PollDisplay';

import { Tweet } from '@/types/tweet';
import { likeTweet, retweet, deleteTweet } from '@/api/tweets';
import { useAuthStore } from '@/stores/useAuthStore';

interface TweetCardProps {
  tweet: Tweet & { comments?: any[] };
  onSuccess: () => void;
  showComments?: boolean;
}

export const TweetCard: React.FC<TweetCardProps> = ({
  tweet,
  onSuccess,
  showComments = false,
}) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isImagePreviewOpen,
    onOpen: onImagePreviewOpen,
    onClose: onImagePreviewClose,
  } = useDisclosure();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { user } = useAuthStore();

  // 格式化推文内容，高亮标签和提及
  const formatContent = (content: string) => {
    // 替换hashtags为链接
    const withHashtags = content.replace(
      /#(\w+)/g,
      '<span class="text-primary font-semibold cursor-pointer hover:underline" data-hashtag="$1">#$1</span>',
    );

    // 替换mentions为链接
    const withMentions = withHashtags.replace(
      /@(\w+)/g,
      '<span class="text-primary font-semibold cursor-pointer hover:underline" data-mention="$1">@$1</span>',
    );

    return withMentions;
  };

  // 处理内容点击事件，检查是否点击了hashtag或mention
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

  const handleLike = async () => {
    try {
      await likeTweet(tweet.id);
      setIsLiked(!isLiked);
      onSuccess();
    } catch (error) {
      console.error('Failed to like tweet:', error);
    }
  };

  const handleRetweet = async () => {
    try {
      await retweet(tweet.id);
      setIsRetweeted(!isRetweeted);
      onSuccess();
    } catch (error) {
      console.error('Failed to retweet:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Share Tweet',
        text: tweet.content,
        url: `${window.location.origin}/tweet/${tweet.id}`,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTweet(tweet.id);
      addToast({
        title: 'Success',
        description: 'Tweet deleted successfully',
        color: 'success',
        timeout: 2000,
      });
      onSuccess();
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete tweet',
        color: 'danger',
        timeout: 2000,
      });
    }
  };

  if (!tweet) {
    return null;
  }

  return (
    <>
      <Card
        className="w-full mb-4 hover:bg-default-50 border border-divider/10"
        shadow="none"
      >
        <CardHeader className="flex gap-4">
          <Link href={`/${tweet.user.username}`}>
            <Avatar
              alt={tweet.user.username}
              className="cursor-pointer"
              src={tweet.user.profilePhoto || ''}
            />
          </Link>
          <div className="flex flex-1 justify-between items-start">
            <Link className="cursor-pointer" href={`/tweet/${tweet.id}`}>
              <div className="flex flex-col">
                <p className="text-md font-semibold">
                  {tweet.user.displayName || tweet.user.username}
                </p>
                <p className="text-small text-default-500">
                  {formatDistanceToNow(new Date(tweet.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </Link>
            {user?.id === tweet.user.id && (
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    startContent={<Trash className="w-4 h-4" />}
                    onClick={handleDelete}
                  >
                    Delete
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        </CardHeader>
        <CardBody className="p-4">
          {/* 使用dangerouslySetInnerHTML渲染格式化后的内容 */}
          <div
            dangerouslySetInnerHTML={{ __html: formatContent(tweet.content) }}
            className="mb-3 whitespace-pre-wrap break-words"
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

          {tweet.poll && (
            <div className="mt-4 max-w-md">
              <PollDisplay
                poll={{
                  id: tweet.poll.id,
                  question: tweet.poll.question,
                  options: tweet.poll.options.map((opt) => ({
                    id: opt.id,
                    text: opt.text,
                    votes: opt._count.votes,
                  })),
                  expiresAt: tweet.poll.expiresAt,
                }}
                tweetId={tweet.id}
              />
            </div>
          )}
          {tweet.hasMedia && tweet.mediaUrls && tweet.mediaUrls.length > 0 && (
            <div
              className={`mt-3 grid gap-2 ${getMediaGridClass(tweet.mediaUrls.length)}`}
            >
              {tweet.mediaUrls.map((url, index) => {
                const isVideo = url.match(/\.(mp4|webm|ogg|mov)($|\?)/i);

                if (!url) {
                  return null;
                }

                return isVideo ? (
                  <div
                    key={index}
                    className={`rounded-xl overflow-hidden ${getMediaItemClass(tweet.mediaUrls.length, index)}`}
                  >
                    <video
                      controls
                      className="w-full h-full object-cover"
                      preload="metadata"
                      src={url}
                    >
                      <source src={url} type={`video/${isVideo[1]}`} />
                      <track kind="captions" label="中文" src="" />
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                ) : (
                  <button
                    key={index}
                    className={`rounded-xl overflow-hidden ${getMediaItemClass(tweet.mediaUrls.length, index)}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(index);
                      onImagePreviewOpen();
                    }}
                  >
                    <Image
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                      src={url || ''}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </CardBody>
        <CardFooter className="gap-3">
          <Button
            isIconOnly
            className={`${
              isLiked ? 'text-danger' : 'text-default-900/60'
            } data-[hover]:bg-default-100`}
            radius="full"
            variant="light"
            onClick={handleLike}
          >
            <Heart
              className="w-5 h-5"
              fill={isLiked ? 'currentColor' : 'none'}
            />
            <span className="ml-1">{tweet._count.likes}</span>
          </Button>
          <Button
            isIconOnly
            className={`${
              isRetweeted ? 'text-success' : 'text-default-900/60'
            } data-[hover]:bg-default-100`}
            radius="full"
            variant="light"
            onClick={handleRetweet}
          >
            <Repeat className="w-5 h-5" />
            <span className="ml-1">{tweet._count.retweets}</span>
          </Button>
          <Button
            isIconOnly
            className="text-default-900/60 data-[hover]:bg-default-100"
            radius="full"
            variant="light"
            onClick={onOpen}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="ml-1">{tweet._count.comments}</span>
          </Button>
          <Button
            isIconOnly
            className="text-default-900/60 data-[hover]:bg-default-100"
            radius="full"
            variant="light"
            onClick={handleShare}
          >
            <Share className="w-5 h-5" />
          </Button>
        </CardFooter>
      </Card>

      {showComments && tweet.comments && tweet.comments.length > 0 && (
        <div className="pl-12 space-y-4">
          {tweet.comments.map((comment) => (
            <div
              key={comment.id || `comment-${Math.random()}`}
              className="flex gap-3"
            >
              <Link href={`/${comment.user.username}`}>
                <Avatar
                  alt={comment.user.username}
                  className="cursor-pointer"
                  size="sm"
                  src={comment.user.profilePhoto || ''}
                />
              </Link>
              <div>
                <div className="flex gap-2 items-center">
                  <Link
                    className="font-semibold hover:underline"
                    href={`/${comment.user.username}`}
                  >
                    {comment.user.displayName || comment.user.username}
                  </Link>
                  <span className="text-small text-default-500">
                    {comment.createdAt &&
                      formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                  </span>
                </div>
                {comment.content && (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatContent(comment.content),
                    }}
                    className="whitespace-pre-wrap break-words"
                    role="button"
                    tabIndex={0}
                    onClick={handleContentClick}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CommentModal
        isOpen={isOpen}
        tweet={tweet}
        onClose={onClose}
        onSuccess={onSuccess}
      />
      {isImagePreviewOpen && (
        <ImagePreview
          images={tweet.mediaUrls || []}
          initialIndex={selectedImageIndex}
          isOpen={isImagePreviewOpen}
          onClose={onImagePreviewClose}
        />
      )}
    </>
  );
};

function getMediaGridClass(count: number): string {
  switch (count) {
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'grid-cols-2';
    case 3:
      return 'grid-cols-2';
    case 4:
    default:
      return 'grid-cols-2';
  }
}

function getMediaItemClass(count: number, index: number): string {
  switch (count) {
    case 1:
      return 'aspect-[16/9]';
    case 2:
      return 'aspect-square';
    case 3:
      return index === 0 ? 'aspect-square col-span-2' : 'aspect-square';
    case 4:
    default:
      return 'aspect-square';
  }
}
