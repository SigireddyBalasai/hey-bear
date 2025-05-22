"use client";


import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TabsNavigationProps = {
    selectedTab: string;
    setSelectedTab: (tab: string) => void;
  };
  
  export function TabsNavigation({ selectedTab, setSelectedTab }: TabsNavigationProps) {
    return (
      <Tabs defaultValue="all" className="mb-6" onValueChange={setSelectedTab} value={selectedTab}>
        <TabsList>
          <TabsTrigger value="all">All no-shows </TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>
      </Tabs>
    );
  }