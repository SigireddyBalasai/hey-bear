import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { Interaction } from './models';

interface InteractionLogProps {
  isLoading: boolean;
  interactions: Interaction[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  startIndex: number;
  endIndex: number;
  allInteractions: Interaction[];
  currentPage: number;
  totalPages: number;
  changePage: (page: number) => void;
  getPaginationNumbers: () => (number | string)[];
}

const InteractionLog: React.FC<InteractionLogProps> = ({ 
  isLoading, 
  interactions, 
  activeTab, 
  setActiveTab, 
  startIndex, 
  endIndex, 
  allInteractions, 
  currentPage, 
  totalPages, 
  changePage, 
  getPaginationNumbers 
}) => {
  // Only show loading state inside the table body/conversation view
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Interaction Log</CardTitle>
            <CardDescription>Detailed insights into how your No-show is interacting with others</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {/* Optional loading overlay for a more elegant loading experience */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
            <div className="animate-pulse text-sm text-gray-500">Loading interactions...</div>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="table" className="m-0 p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Message/Request</TableHead>
                    <TableHead>No-Show Response</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Response Time</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  interactions.map((interaction: Interaction, index: number) => (
                    <TableRow key={interaction.id} className={index > 0 && interaction.date !== interactions[index-1].date ? "border-t-4 border-gray-200" : ""}>
                      <TableCell className="font-medium">{interaction.id}</TableCell>
                      <TableCell>{interaction.date}</TableCell>
                      <TableCell>{interaction.phoneNumber}</TableCell>
                      <TableCell className="max-w-xs truncate">{interaction.message}</TableCell>
                      <TableCell className="max-w-xs truncate">{interaction.response}</TableCell>
                      <TableCell>
                        {interaction.type.split(', ').map((type: string, i: number) => (
                          <Badge key={i} variant={type === 'Inbound' ? 'secondary' : 'default'} className="mr-1">
                            {type}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell>{interaction.responseTime}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="conversation" className="m-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-md">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Get unique dates from interactions */}
                {Array.from(new Set(interactions.map(i => i.date))).map((date, idx) => (
                  <div key={idx} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px bg-gray-200 flex-grow"></div>
                      <p className="text-sm font-medium text-gray-500">{date}</p>
                      <div className="h-px bg-gray-200 flex-grow"></div>
                    </div>
                    
                    {/* Group interactions by phone number */}
                    {Array.from(new Set(interactions.filter(i => i.date === date).map(i => i.phoneNumber))).map((phone, phoneIdx) => (
                      <div key={phoneIdx} className="mb-4 border rounded-md p-3">
                        <div className="flex items-center gap-2 mb-2 text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-medium">{phone}</p>
                        </div>
                        
                        <div className="space-y-3">
                          {interactions
                            .filter(i => i.date === date && i.phoneNumber === phone)
                            .map((interaction, idx) => (
                              <div key={idx} className="space-y-2">
                                {interaction.message !== '-' && (
                                  <div className="flex justify-start">
                                    <div className="bg-gray-100 p-3 rounded-lg max-w-md">
                                      <p>{interaction.message}</p>
                                      <p className="text-xs text-right text-gray-500 mt-1">
                                        {date}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {interaction.response !== '-' && (
                                  <div className="flex justify-end">
                                    <div className="bg-indigo-100 p-3 rounded-lg max-w-md">
                                      <p>{interaction.response}</p>
                                      <p className="text-xs text-right text-gray-500 mt-1">
                                        {interaction.responseTime} response time
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div>
          {allInteractions.length > 0 ? 
            `Showing ${startIndex + 1}-${endIndex} of ${allInteractions.length}` : 
            "No results found"
          }
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          {getPaginationNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <Button 
                key={index}
                variant={page === currentPage ? "default" : "outline"} 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => changePage(page as number)}
                disabled={isLoading}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-1">...</span>
            )
          ))}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default InteractionLog;