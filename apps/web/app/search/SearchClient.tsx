'use client';

import React, {
  useState,
  useEffect,
  Suspense,
  useCallback,
  useRef,
} from 'react';
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

// the component that uses useSearchParams
function SearchParamsReader({
  onQueryChange,
}: {
  onQueryChange: (query: string) => void;
}) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  // notify the parent component when the URL parameters change
  useEffect(() => {
    onQueryChange(query);
  }, [query, onQueryChange]);

  return null; // this component does not render any content, only reads the URL parameters
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

  // define a performSearch function that does not depend on isLoading to avoid circular dependency
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      // prevent triggering again when loading
      if (isLoading) return;

      setIsLoading(true);
      setHasError(false);

      try {
        // try to use the unified search interface - only use it when the "all" tab is selected
        if (activeTab === 'all') {
          try {
            const searchResult = await search(searchQuery);

            if (searchResult) {
              if (Array.isArray(searchResult.users)) {
                setUsers(searchResult.users);
              }
              if (Array.isArray(searchResult.tweets)) {
                setTweets(searchResult.tweets);
              }
              if (Array.isArray(searchResult.hashtags)) {
                setHashtags(searchResult.hashtags);
              }

              setIsLoading(false); // end loading state early

              return; // if the unified search is successful, return immediately
            }
          } catch (error) {
            console.log(
              'Unified search interface failed, trying separate search interface',
              error,
            );
          }
        }

        // use exact match, ensure only search the content of the current active tab
        switch (activeTab) {
          case 'users':
            try {
              // search users
              const usersResult = await searchUsers({ query: searchQuery });

              if (usersResult && usersResult.users) {
                setUsers(usersResult.users as any[]);
              } else if (Array.isArray(usersResult)) {
                setUsers(usersResult);
              } else {
                setUsers([]);
              }
              // clear other results
              setTweets([]);
              setHashtags([]);
            } catch (error) {
              console.error('User search failed:', error);
              setUsers([]);
            }
            break;

          case 'tweets':
            try {
              // search tweets
              const tweetsResult = await searchTweets({ query: searchQuery });

              if (tweetsResult) {
                // The backend returns the tweets array directly, not wrapped in an object
                setTweets(Array.isArray(tweetsResult) ? tweetsResult : []);
              } else {
                setTweets([]);
              }
              // 清空其他结果
              setUsers([]);
              setHashtags([]);
            } catch (error) {
              console.error('Tweet search failed:', error);
              setTweets([]);
            }
            break;

          case 'hashtags':
            try {
              // search hashtags
              const hashtagsResult = await searchHashtags(searchQuery, 10);

              if (hashtagsResult && hashtagsResult.hashtags) {
                setHashtags(hashtagsResult.hashtags as any[]);
              } else if (Array.isArray(hashtagsResult)) {
                setHashtags(hashtagsResult);
              } else {
                setHashtags([]);
              }
              // clear other results
              setUsers([]);
              setTweets([]);
            } catch (error) {
              console.error('Hashtag search failed:', error);
              setHashtags([]);
            }
            break;

          case 'all':
            // if the unified search failed, search all types separately
            try {
              // search users
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

            try {
              // search tweets
              const tweetsResult = await searchTweets({ query: searchQuery });

              if (tweetsResult) {
                setTweets(Array.isArray(tweetsResult) ? tweetsResult : []);
              } else {
                setTweets([]);
              }
            } catch (error) {
              console.error('Tweet search failed:', error);
              setTweets([]);
            }

            try {
              // 搜索标签
              const hashtagsResult = await searchHashtags(searchQuery, 10);

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
            break;
        }
      } catch (error) {
        console.error('Search failed:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab], // 只依赖activeTab，不依赖isLoading
  );

  // 使用useCallback包装handleQueryChange以避免无限循环
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      // 只在查询真正变化时才更新状态和触发搜索
      if (newQuery !== query) {
        setQuery(newQuery);
        // 只在初始加载时直接触发搜索，否则会由useEffect处理
        if (newQuery && isInitialLoad) {
          setIsInitialLoad(false);
          performSearch(newQuery);
        }
      }
    },
    [isInitialLoad, performSearch, query],
  );

  // 使用useRef创建一个标志，表示是否应该执行搜索
  const shouldSearchRef = useRef(false);

  // 监听查询和标签变化，设置shouldSearch标志
  useEffect(() => {
    // 如果不是初始加载且有查询，则标记应该搜索
    if (query && !isInitialLoad) {
      shouldSearchRef.current = true;
    }
  }, [query, activeTab, isInitialLoad]);

  // 单独的useEffect用于执行搜索，只依赖isLoading
  useEffect(() => {
    // 只有当不在加载中且应该搜索时执行
    if (!isLoading && shouldSearchRef.current) {
      shouldSearchRef.current = false; // 重置标志
      performSearch(query);
    }
  }, [isLoading, performSearch, query]);

  // 处理搜索表单提交
  const handleSearch = (e: any) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const searchQuery = data.q as string;

    if (searchQuery) {
      // 只有在查询与当前查询不同时才更新状态和执行搜索
      if (searchQuery !== query) {
        setQuery(searchQuery);
        setIsInitialLoad(false);
        // 不直接调用performSearch，而是通过标志和useEffect触发
        shouldSearchRef.current = true;

        // 更新URL，但不刷新页面
        const url = new URL(window.location.href);

        url.searchParams.set('q', searchQuery);
        window.history.pushState({}, '', url.toString());
      }
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
