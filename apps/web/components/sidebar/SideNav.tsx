'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, useDisclosure } from '@heroui/react';
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  PenSquare,
  Twitter,
} from 'lucide-react';

import { CreateTweet } from '@/components/tweet/CreateTweet';
import { useAuthStore } from '@/stores/useAuthStore';

const menuItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Explore', href: '/search' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: Mail, label: 'Messages', href: '/messages' },
  { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
  { icon: User, label: 'Profile', href: '/user/profile' },
];

interface SideNavProps {
  onItemClick?: () => void;
}

export const SideNav = ({ onItemClick }: SideNavProps) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <div className="px-4 flex flex-col justify-between sticky h-full pb-14">
        <div className="flex flex-col flex-1 py-4">
          <div className="flex items-center gap-2 ml-4 my-4">
            <Twitter className="w-7 h-7" fill="currentColor" height={32} />
          </div>
          <nav className="flex-1 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const href =
                item.href === '/profile' && user
                  ? `/${user.username}`
                  : item.href;
              const isActive = pathname === href;

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
          <Button
            className="rounded-full text-lg font-bold"
            color="primary"
            size="lg"
            startContent={<PenSquare className="w-5 h-5" />}
            onPress={onOpen}
          >
            Tweet
          </Button>
          {/* <div className="mt-auto">
            <Button
              className="w-full justify-start gap-4 p-3 rounded-full"
              startContent={<Settings className="w-7 h-7" />}
              variant="light"
            >
              Settings
            </Button>
          </div> */}
        </div>
      </div>

      <CreateTweet isOpen={isOpen} onClose={onClose} />
    </>
  );
};
