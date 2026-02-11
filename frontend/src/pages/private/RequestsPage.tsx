import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useRequests } from '@/hooks/useRequests';
import { formatCost, formatNumber, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ApiRequest } from '@/types';

export default function RequestsPage() {
  const currentProjectId = useAppStore((s) => s.currentProjectId);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modelFilter, setModelFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ApiRequest | null>(null);

  const { data, isLoading } = useRequests(currentProjectId, {
    page,
    limit: 25,
    search: search || undefined,
    status: statusFilter || undefined,
    model: modelFilter || undefined,
  });

  const requests = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request Log</h1>
        <p className="text-muted-foreground">
          Browse and search all logged AI API requests
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by model, endpoint, session..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
            <Input
              placeholder="Filter by model"
              value={modelFilter}
              onChange={(e) => {
                setModelFilter(e.target.value);
                setPage(1);
              }}
              className="sm:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requests</CardTitle>
          {pagination && (
            <CardDescription>
              Showing {requests.length} of {formatNumber(pagination.total)} requests
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No requests found"
              description="No requests match your current filters. Try adjusting your search criteria."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Time</th>
                      <th className="pb-3 font-medium text-muted-foreground">Model</th>
                      <th className="pb-3 font-medium text-muted-foreground">Tokens</th>
                      <th className="pb-3 font-medium text-muted-foreground">Cost</th>
                      <th className="pb-3 font-medium text-muted-foreground">Latency</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr
                        key={req.id}
                        className={cn(
                          'border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors',
                          selectedRequest?.id === req.id && 'bg-muted/50'
                        )}
                        onClick={() =>
                          setSelectedRequest(
                            selectedRequest?.id === req.id ? null : req
                          )
                        }
                      >
                        <td className="py-3 whitespace-nowrap">{formatDate(req.timestamp)}</td>
                        <td className="py-3">
                          <Badge variant="secondary">{req.model}</Badge>
                        </td>
                        <td className="py-3">
                          <span title={`Prompt: ${req.promptTokens} / Completion: ${req.completionTokens}`}>
                            {formatNumber(req.totalTokens)}
                          </span>
                        </td>
                        <td className="py-3">{formatCost(req.totalCost)}</td>
                        <td className="py-3">{req.latencyMs}ms</td>
                        <td className="py-3">
                          <Badge variant={req.status === 'success' ? 'success' : 'destructive'}>
                            {req.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Request Detail Panel */}
              {selectedRequest && (
                <div className="mt-4 border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Request Detail</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedRequest(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Provider</p>
                      <p className="text-sm font-medium">{selectedRequest.provider}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Model</p>
                      <p className="text-sm font-medium">{selectedRequest.model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Endpoint</p>
                      <p className="text-sm font-medium">{selectedRequest.endpoint || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Session ID</p>
                      <p className="text-sm font-medium font-mono truncate">
                        {selectedRequest.sessionId || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Prompt Tokens</p>
                      <p className="text-sm font-medium">{formatNumber(selectedRequest.promptTokens)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Completion Tokens</p>
                      <p className="text-sm font-medium">{formatNumber(selectedRequest.completionTokens)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                      <p className="text-sm font-medium">{formatCost(selectedRequest.totalCost)}</p>
                    </div>
                  </div>

                  {selectedRequest.prompt && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Prompt</p>
                      <pre className="text-sm bg-background border rounded-md p-3 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {selectedRequest.prompt}
                      </pre>
                    </div>
                  )}

                  {selectedRequest.response && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Response</p>
                      <pre className="text-sm bg-background border rounded-md p-3 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {selectedRequest.response}
                      </pre>
                    </div>
                  )}

                  {selectedRequest.errorMessage && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Error</p>
                      <div className="text-sm bg-destructive/10 border border-destructive/20 rounded-md p-3">
                        <p className="font-medium text-destructive">{selectedRequest.errorType}</p>
                        <p className="text-destructive/80 mt-1">{selectedRequest.errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.toolCalls && selectedRequest.toolCalls.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Tool Calls ({selectedRequest.toolCalls.length})
                      </p>
                      <div className="space-y-2">
                        {selectedRequest.toolCalls.map((tool) => (
                          <div
                            key={tool.id}
                            className="bg-background border rounded-md p-3 text-sm"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{tool.toolName}</span>
                              <Badge
                                variant={tool.status === 'success' ? 'success' : 'destructive'}
                              >
                                {tool.status}
                              </Badge>
                              {tool.latencyMs && (
                                <span className="text-xs text-muted-foreground">
                                  {tool.latencyMs}ms
                                </span>
                              )}
                            </div>
                            {tool.toolInput && (
                              <pre className="text-xs bg-muted rounded p-2 mt-1 overflow-x-auto">
                                {tool.toolInput}
                              </pre>
                            )}
                            {tool.toolOutput && (
                              <pre className="text-xs bg-muted rounded p-2 mt-1 overflow-x-auto max-h-32 overflow-y-auto">
                                {tool.toolOutput}
                              </pre>
                            )}
                            {tool.errorMessage && (
                              <p className="text-xs text-destructive mt-1">{tool.errorMessage}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRequest.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedRequest.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
