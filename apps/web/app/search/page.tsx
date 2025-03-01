'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input, Tabs, Tab, Card, CardBody, Spinner } from '@heroui/react';
import { Search } from 'lucide-react';

import { AppLayout } from '@/components/layouts/AppLayout';
import { UserCard } from '@/components/user/UserCard';
import { TweetCard } from '@/components/tweet/TweetCard';
import { searchUsers } from '@/api/users';
import { searchTweets, searchHashtags } from '@/api/tweets';
import Link from 'next/link';

interface SearchResult<T> {
  users?: T[];
  tweets?: T[];
  hashtags?: T[];
  [key: string]: any;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('tweets');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [tweets, setTweets] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);

  // 执行搜索
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);

    try {
      // 根据当前活动标签执行相应的搜索
      if (activeTab === 'users' || activeTab === 'all') {
        const usersResult = await searchUsers({ query: searchQuery });

        if (usersResult && usersResult.users) {
          setUsers(usersResult.users);
        }
      }

      if (activeTab === 'tweets' || activeTab === 'all') {
        const tweetsResult = await searchTweets({ query: searchQuery });

        if (tweetsResult && tweetsResult.tweets) {
          setTweets(tweetsResult.tweets);
        }
      }

      if (activeTab === 'hashtags' || activeTab === 'all') {
        const hashtagsResult = await searchHashtags(searchQuery);

        if (hashtagsResult && hashtagsResult.hashtags) {
          setHashtags(hashtagsResult.hashtags);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 当查询或标签变化时执行搜索
  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [activeTab]);

  // 处理搜索表单提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);

    // 更新URL，但不刷新页面
    const url = new URL(window.location.href);

    url.searchParams.set('q', query);
    window.history.pushState({}, '', url.toString());
  };

  // 处理搜索结果刷新
  const handleRefresh = () => {
    performSearch(query);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="sticky top-0 bg-background z-10 p-4 border-b border-divider">
          <form className="mb-4" onSubmit={handleSearch}>
            <Input
              className="w-full"
              placeholder="Search users, tweets or hashtags..."
              startContent={<Search className="text-default-400" />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab key="tweets" title="Tweets" />
            <Tab key="users" title="Users" />
            <Tab key="hashtags" title="Hashtags" />
            <Tab key="all" title="All" />
          </Tabs>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center my-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {(activeTab === 'users' || activeTab === 'all') &&
                users.length > 0 && (
                  <div className="mb-6">
                    {activeTab === 'all' && (
                      <h2 className="text-xl font-bold mb-4">Users</h2>
                    )}
                    <div className="space-y-4">
                      {users.map((user) => (
                        <UserCard key={user.id} user={user} />
                      ))}
                    </div>
                  </div>
                )}

              {(activeTab === 'tweets' || activeTab === 'all') &&
                tweets.length > 0 && (
                  <div className="mb-6">
                    {activeTab === 'all' && (
                      <h2 className="text-xl font-bold mb-4">Tweets</h2>
                    )}
                    <div className="space-y-4">
                      {tweets.map((tweet) => (
                        <TweetCard
                          key={tweet.id}
                          tweet={tweet}
                          onSuccess={handleRefresh}
                        />
                      ))}
                    </div>
                  </div>
                )}

              {(activeTab === 'hashtags' || activeTab === 'all') &&
                hashtags.length > 0 && (
                  <div className="mb-6">
                    {activeTab === 'all' && (
                      <h2 className="text-xl font-bold mb-4">Hashtags</h2>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {hashtags.map((hashtag) => (
                        <Card
                          key={hashtag.id}
                          isPressable
                          className="hover:bg-default-100"
                        >
                          <CardBody>
                            <Link href={`/hashtag/${hashtag.name}`}>
                              <h3 className="text-lg font-bold">
                                #{hashtag.name}
                              </h3>
                              <p className="text-default-500">
                                {hashtag.count} tweets
                              </p>
                            </Link>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

              {((activeTab === 'users' && users.length === 0) ||
                (activeTab === 'tweets' && tweets.length === 0) ||
                (activeTab === 'hashtags' && hashtags.length === 0) ||
                (activeTab === 'all' &&
                  users.length === 0 &&
                  tweets.length === 0 &&
                  hashtags.length === 0)) && (
                <div className="text-center my-12">
                  <p className="text-xl text-default-500">No results found</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
