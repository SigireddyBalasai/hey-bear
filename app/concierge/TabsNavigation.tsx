"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  Search, 
  Plus, 
  Trash2, 
  Loader2, 
  ArrowRight, 
  UserCircle, 
  LogOut,
  LayoutGrid,
  LayoutList,
  ChevronRight,
  Settings,
  Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type TabsNavigationProps = {
    selectedTab: string;
    setSelectedTab: (tab: string) => void;
  };
  
  export function TabsNavigation({ selectedTab, setSelectedTab }: TabsNavigationProps) {
    return (
      <Tabs defaultValue="all" className="mb-6" onValueChange={setSelectedTab} value={selectedTab}>
        <TabsList>
          <TabsTrigger value="all">All concierge</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>
      </Tabs>
    );
  }