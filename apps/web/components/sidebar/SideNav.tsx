'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  useDisclosure,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  Twitter,
  LogOut,
  LogIn,
  Edit,
} from 'lucide-react';

import { CreateTweet } from '../tweet/CreateTweet';

import { useAuthStore } from '@/stores/useAuthStore';

const menuItems = [
  { icon: Home, label: 'Home', href: '/', public: true },
  { icon: Search, label: 'Explore', href: '/search', public: true },
  { icon: Bell, label: 'Notifications', href: '/notifications', public: false },
  { icon: Mail, label: 'Messages', href: '/messages', public: false },
  { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks', public: false },
  { icon: User, label: 'Profile', href: '/user/profile', public: false },
];

interface SideNavProps {
  onItemClick?: () => void;
}

export const SideNav = ({ onItemClick }: SideNavProps) => {
  const pathname = usePathname();
  const { user, logout, getUser, isLoading } = useAuthStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      getUser();
    }
    setIsLoaded(true);
  }, []);

  return (
    <>
      <div className="px-4 flex flex-col justify-between sticky h-full pb-14">
        <div className="flex flex-col flex-1 py-4">
          <Link
            className={`mb-3 flex items-center gap-4 p-3 rounded-full text-xl transition-colors`}
            href={'/'}
            style={{
              fontFamily: 'fantasy, sans-serif, pingfang, microsoft yahei',
            }}
            onClick={onItemClick}
          >
            <Twitter
              className="w-7 h-7"
              color="#006fee"
              fill="#006fee"
              height={32}
            />
            <span>Twitter</span>
          </Link>
          <nav className="flex-1 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const href =
                item.href === '/profile' && user
                  ? `/${user.username}`
                  : item.href;
              const isActive = pathname === href;
              const isPublic = item.public;

              if (!isPublic && !user) {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  className={`mb-3 flex items-center gap-4 p-3 hover:bg-default-100 rounded-full text-xl transition-colors ${
                    isActive ? 'font-bold' : ''
                  }`}
                  href={href}
                  onClick={onItemClick}
                >
                  <Icon className="w-7 h-7" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {isLoaded && (
            <>
              {user && (
                <Button
                  className="rounded-full text-lg font-bold mb-4"
                  color="primary"
                  isLoading={isLoading}
                  size="lg"
                  startContent={<Edit className="w-5 h-5" />}
                  onPress={onOpen}
                >
                  Tweet
                </Button>
              )}
              <Button
                className="rounded-full text-lg font-bold"
                color={user ? 'danger' : 'primary'}
                isLoading={isLoading}
                size="lg"
                startContent={
                  user ? (
                    <LogOut className="w-5 h-5" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )
                }
                onPress={() => {
                  if (user) {
                    // confirm logout
                    setIsConfirmingLogout(true);
                  } else {
                    router.push('/auth/login');
                  }
                }}
              >
                {user ? 'Logout' : 'Login'}
              </Button>
            </>
          )}
          {/* <div className="mt-auto">
            <Button
              className="w-full justify-start gap-4 p-3 rounded-full"
              startContent={<Settings className="w-7 h-7" />}
              variant="light"
            >
              Settings
            </Button>
          </div>
          {/* */}
        </div>
      </div>
      <CreateTweet isOpen={isOpen} onClose={onClose} />
      <Modal
        isOpen={isConfirmingLogout}
        onClose={() => setIsConfirmingLogout(false)}
      >
        <ModalContent>
          <ModalHeader>Logout</ModalHeader>
          <ModalBody>Are you sure you want to logout?</ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              variant="light"
              onPress={() => setIsConfirmingLogout(false)}
            >
              Cancel
            </Button>
            <Button color="danger" onPress={logout}>
              Logout
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
