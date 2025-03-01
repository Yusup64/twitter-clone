'use client';

import React from 'react';
import { Button, Avatar, Spacer, Switch, Link } from '@heroui/react';
import {
  Calendar,
  Bookmark,
  Wallet,
  Moon,
  LogOut,
  Globe,
  Bell,
  Shield,
  HelpCircle,
  Edit,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/useAuthStore';

const UserHome = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <div className="max-w-lg mx-auto bg-transparent px-5">
      {/* Profile Header */}
      <div className="flex items-center mb-8">
        <Avatar
          alt="User Avatar"
          size="lg"
          src="https://i.pravatar.cc/150?u=a04258114e29026708c"
        />
        <div className="ml-4">
          <h1 className="text-xl font-bold">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-500">{user?.phone}</p>
        </div>
        <Button
          isIconOnly
          className="ml-auto"
          size="sm"
          variant="flat"
          onPress={() => router.push('/user/profile')}
        >
          <Edit size={20} />
        </Button>
      </div>

      {/* General Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
          General
        </h2>
        <div className="mt-4">
          <Link className="block w-full" color="foreground" href="#">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calendar />
                <span>Appointment</span>
              </div>
              <ChevronRight />
            </div>
          </Link>
          <Spacer y={4} />
          <Link className="block w-full" color="foreground" href="#">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Bookmark />
                <span>My Booking</span>
              </div>
              <ChevronRight />
            </div>
          </Link>
        </div>
      </section>

      {/* Account Setting Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
          Account Setting
        </h2>
        <div className="mt-4">
          <Link
            className="block w-full"
            color="foreground"
            href="/user/profile"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Wallet />
                <span>Payment Methods</span>
              </div>
              <ChevronRight />
            </div>
          </Link>
          <Spacer y={4} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Moon />
              <span>Dark Mode</span>
            </div>
            <Switch />
          </div>
          <Spacer y={4} />
          <Link
            className="block w-full"
            color="foreground"
            onPress={() => {
              logout();
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <LogOut />
                <span>Logout</span>
              </div>
              <ChevronRight />
            </div>
          </Link>
        </div>
      </section>

      {/* App Setting Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
          App Setting
        </h2>
        <div className="mt-4">
          <Link className="block w-full" color="foreground" href="#">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Globe />
                <span>Language</span>
              </div>
              <ChevronRight />
            </div>
          </Link>
          <Spacer y={4} />
          <Link className="block w-full" color="foreground" href="#">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Bell />
                <span>Notification</span>
              </div>
              <ChevronRight />
            </div>
          </Link>
          <Spacer y={4} />
          <Link className="block w-full" color="foreground" href="#">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield />
                <span>Security</span>
              </div>
              <ChevronRight />
            </div>
          </Link>
        </div>
      </section>

      {/* Support Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
          Support
        </h2>
        <div className="mt-4">
          <Link className="block w-full" color="foreground" href="#">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <HelpCircle />
                <span>Help Center</span>
              </div>
              <ChevronRight />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default UserHome;
