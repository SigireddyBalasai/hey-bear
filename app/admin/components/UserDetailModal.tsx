"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Line, Doughnut } from "react-chartjs-2";
import { 
  MessageSquare, 
  Clock, 
  Zap, 
  User, 
  Mail, 
  Calendar, 
  FileSpreadsheet, 
  Shield,
  Trash2,
  MoveRight,
  ListFilter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
}

export function UserDetailModal({ isOpen, onClose, userData }: UserDetailModalProps) {
  if (!userData) return null;

  // Format date nicely
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get initials for avatar
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'UN';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt={userData.users?.full_name || "User"} />
              <AvatarFallback>{getInitials(userData.users?.full_name)}</AvatarFallback>
            </Avatar>
            {userData.users?.full_name || "User"} 
            <Badge variant="outline" className="ml-2">User</Badge>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {userData.users?.email || "No email"}
            <span className="mx-2">•</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Member since {formatDate(userData.users?.created_at || userData.date)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardDescription>Messages Sent</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{userData.message_count || 0}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardDescription>Token Usage</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{userData.token_usage?.toLocaleString() || 0}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-purple-500" />
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardDescription>Cost Estimate</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  ${userData.cost_estimate?.toFixed(2) || "0.00"}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="summary">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="summary">Usage Summary</TabsTrigger>
            <TabsTrigger value="concierge">concierge</TabsTrigger>
            <TabsTrigger value="history">Activity History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Usage Summary</CardTitle>
                <CardDescription>
                  Detailed breakdown of user activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Total Messages</TableCell>
                      <TableCell>{userData.message_count || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Token Usage</TableCell>
                      <TableCell>{userData.token_usage?.toLocaleString() || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Cost Estimate</TableCell>
                      <TableCell>${userData.cost_estimate?.toFixed(2) || "0.00"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Date</TableCell>
                      <TableCell>{formatDate(userData.date)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="concierge">
            <Card>
              <CardHeader>
                <CardTitle>User's concierges</CardTitle>
                <CardDescription>
                concierges created by this user
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-10">
                <Shield className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium">No concierges data available</p>
                <p className="text-sm text-muted-foreground mt-1">
                concierge usage data will appear here when available
                </p>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" size="sm" className="ml-auto">
                  View All concierges
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>
                  Recent user activities and events
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-10">
                <Clock className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium">No activity history available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  User activity history will appear here when available
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between mt-6 border-t pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <div className="flex gap-2">
            <Button variant="outline" className="text-blue-600 border-blue-600">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button>
              <User className="mr-2 h-4 w-4" />
              View Full Profile
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
