'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input, Tabs, Tab, Card, CardBody, Spinner } from '@heroui/react';
import { Search } from 'lucide-react';
import Link from 'next/link';

import { AppLayout } from '@/components/layouts/AppLayout';
import { UserCard } from '@/components/user/UserCard';
import { TweetCard } from '@/components/tweet/TweetCard';
import { searchUsers } from '@/api/users';
import { searchTweets, searchHashtags } from '@/api/tweets';
import { search } from '@/api/search';

interface _SearchResult<T> {
  users?: T[];
  tweets?: T[];
  hashtags?: T[];
  [key: string]: any;
}

// 使用useSearchParams的组件
function SearchParamsReader({
  onQueryChange,
}: {
  onQueryChange: (query: string) => void;
}) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  // 当URL参数变化时通知父组件
  useEffect(() => {
    onQueryChange(query);
  }, [query, onQueryChange]);

  return null; // 这个组件不渲染任何内容，只是读取URL参数
}

export function SearchClient() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tweets');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [tweets, setTweets] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 使用useCallback包装handleQueryChange以避免无限循环
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      if (newQuery && isInitialLoad) {
        setIsInitialLoad(false);
        performSearch(newQuery);
      }
    },
    [isInitialLoad],
  );

  // 执行搜索
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasError(false);

    try {
      // 尝试使用统一搜索接口
      try {
        const searchResult = await search(searchQuery);

        if (searchResult) {
          if (Array.isArray(searchResult.users)) {
            setUsers(searchResult.users);
          }
          if (Array.isArray(searchResult.tweets)) {
            setTweets(searchResult.tweets);
          }

          return; // 如果统一搜索成功，直接返回
        }
      } catch (error) {
        console.log(
          'Unified search interface failed, trying separate search interface',
          error,
        );
      }

      // 根据当前活动标签执行相应的搜索
      if (activeTab === 'users' || activeTab === 'all') {
        try {
          // 修正搜索用户的API调用，直接使用query参数而不是对象
          const usersResult = await searchUsers({ query: searchQuery });

          if (usersResult && usersResult.users) {
            setUsers(usersResult.users as any[]);
          } else if (Array.isArray(usersResult)) {
            setUsers(usersResult);
          } else {
            setUsers([]);
          }
        } catch (error) {
          console.error('User search failed:', error);
          setUsers([]);
        }
      }

      if (activeTab === 'tweets' || activeTab === 'all') {
        try {
          const tweetsResult = await searchTweets({ query: searchQuery });

          if (tweetsResult) {
            // The backend returns the tweets array directly, not wrapped in an object
            setTweets(Array.isArray(tweetsResult) ? tweetsResult : []);
          } else {
            setTweets([]);
          }
        } catch (error) {
          console.error('Tweet search failed:', error);
          setTweets([]);
        }
      }

      if (activeTab === 'hashtags' || activeTab === 'all') {
        try {
          const hashtagsResult = await searchHashtags(searchQuery);

          if (hashtagsResult && hashtagsResult.hashtags) {
            setHashtags(hashtagsResult.hashtags as any[]);
          } else if (Array.isArray(hashtagsResult)) {
            setHashtags(hashtagsResult);
          } else {
            setHashtags([]);
          }
        } catch (error) {
          console.error('Hashtag search failed:', error);
          setHashtags([]);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 当标签变化时执行搜索，但只在有查询词时执行
  useEffect(() => {
    if (query && !isInitialLoad) {
      performSearch(query);
    }
  }, [activeTab, query, isInitialLoad]);

  // 处理搜索表单提交
  const handleSearch = (e: any) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const searchQuery = data.q as string;

    if (searchQuery) {
      setQuery(searchQuery);
      performSearch(searchQuery);

      // 更新URL，但不刷新页面
      const url = new URL(window.location.href);

      url.searchParams.set('q', searchQuery);
      window.history.pushState({}, '', url.toString());
    }
  };

  // 处理搜索结果刷新
  const handleRefresh = () => {
    if (query) {
      performSearch(query);
    }
  };

  return (
    <AppLayout>
      {/* 使用Suspense包裹useSearchParams */}
      <Suspense fallback={null}>
        <SearchParamsReader onQueryChange={handleQueryChange} />
      </Suspense>

      <div className="max-w-3xl mx-auto">
        <div className="sticky top-0 bg-background z-10 p-4 border-b border-divider">
          <form className="mb-4" onSubmit={handleSearch}>
            <Input
              className="w-full"
              defaultValue={query}
              name="q"
              placeholder="Search users, tweets, or hashtags..."
              startContent={<Search className="text-default-400" />}
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
          ) : hasError ? (
            <div className="text-center my-12">
              <p className="text-xl text-danger">
                Search error, please try again later
              </p>
              <button
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
                onClick={handleRefresh}
              >
                Retry
              </button>
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

              {query &&
                !isInitialLoad &&
                ((activeTab === 'users' && users.length === 0) ||
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
