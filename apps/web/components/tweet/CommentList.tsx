import React from 'react';
import { Avatar, Card, CardBody } from '@heroui/react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

import { Comment } from '@/types/tweet';

interface CommentListProps {
  comments: Comment[];
}

export const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  return (
    <div className="space-y-4 mt-4">
      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardBody className="py-2">
            <div className="flex gap-3">
              <Link href={`/${comment.user.username}`}>
                <Avatar
                  alt={comment.user.username}
                  size="sm"
                  src={comment.user.profilePhoto}
                  className="cursor-pointer"
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/${comment.user.username}`}
                    className="font-semibold hover:underline"
                  >
                    {comment.user.displayName || comment.user.username}
                  </Link>
                  <span className="text-small text-default-500">
                    @{comment.user.username}
                  </span>
                  <span className="text-small text-default-500">·</span>
                  <span className="text-small text-default-500">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="mt-1">{comment.content}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
