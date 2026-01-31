import { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  StatusBadge,
  Avatar,
  AvatarGroup,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Tabs,
  TabPanel,
  useToast,
  ToastContainer,
  Input,
  Progress,
} from '@kupuri/ui';
import { motion } from 'motion/react';

// Platform icons
const PlatformIcon = ({ platform }: { platform: string }) => {
  const icons: Record<string, JSX.Element> = {
    twitter: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    instagram: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    linkedin: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  };
  return icons[platform] || null;
};

function App() {
  const [activeTab, setActiveTab] = useState('queue');
  const { toasts, toast } = useToast();

  const scheduledPosts = [
    {
      id: '1',
      content: 'Excited to announce our new AI video creation feature! 🎬 Create stunning videos in minutes with JAAZ. #AI #VideoCreation',
      platforms: ['twitter', 'linkedin'],
      scheduledFor: 'Today, 3:00 PM',
      status: 'scheduled',
    },
    {
      id: '2',
      content: 'Behind the scenes at Kupuri Studios 🎨 Our team is working on something amazing...',
      platforms: ['instagram'],
      scheduledFor: 'Tomorrow, 10:00 AM',
      status: 'scheduled',
    },
    {
      id: '3',
      content: 'How we helped @ClientName increase their engagement by 300% using AI-powered content. Thread 🧵',
      platforms: ['twitter'],
      scheduledFor: 'Jan 20, 2:00 PM',
      status: 'draft',
    },
  ];

  const analytics = {
    totalPosts: 47,
    engagement: 12500,
    reach: 89000,
    scheduled: 12,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <span className="text-xl font-bold">POSTIZ</span>
            </div>
            <Badge variant="postiz">Beta</Badge>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              Connect Account
            </Button>
            <Button onClick={() => toast.success('Opening composer...')}>
              Create Post
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <FadeIn>
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-3xl font-bold">{analytics.totalPosts}</p>
                <p className="text-xs text-green-500">+12% this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="text-3xl font-bold">{(analytics.engagement / 1000).toFixed(1)}K</p>
                <p className="text-xs text-green-500">+24% this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Total Reach</p>
                <p className="text-3xl font-bold">{(analytics.reach / 1000).toFixed(0)}K</p>
                <p className="text-xs text-green-500">+18% this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-3xl font-bold">{analytics.scheduled}</p>
                <p className="text-xs text-muted-foreground">Next: Today 3PM</p>
              </CardContent>
            </Card>
          </div>
        </FadeIn>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'queue', label: 'Queue' },
            { id: 'drafts', label: 'Drafts' },
            { id: 'published', label: 'Published' },
            { id: 'calendar', label: 'Calendar' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
          className="mb-6"
        />

        {/* Queue Tab */}
        <TabPanel tabId="queue" activeTab={activeTab}>
          <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
            {/* Post List */}
            <StaggerContainer className="space-y-4">
              {scheduledPosts.filter(p => p.status === 'scheduled').map((post) => (
                <StaggerItem key={post.id}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {post.platforms.map((platform) => (
                              <div
                                key={platform}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-muted"
                              >
                                <PlatformIcon platform={platform} />
                              </div>
                            ))}
                            <StatusBadge status="processing" label={post.scheduledFor} />
                          </div>
                          <p className="text-sm">{post.content}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">Edit</Button>
                          <Button variant="ghost" size="sm">Delete</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Connected Accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform="twitter" />
                      <span className="text-sm">Twitter</span>
                    </div>
                    <Badge variant="success">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform="instagram" />
                      <span className="text-sm">Instagram</span>
                    </div>
                    <Badge variant="success">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform="linkedin" />
                      <span className="text-sm">LinkedIn</span>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Suggestions</CardTitle>
                  <CardDescription>
                    Optimal posting times based on your audience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-2">
                    <span className="text-sm">Best time today</span>
                    <Badge>3:00 PM</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-2">
                    <span className="text-sm">Peak engagement</span>
                    <Badge>Tue & Thu</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>

        {/* Drafts Tab */}
        <TabPanel tabId="drafts" activeTab={activeTab}>
          <StaggerContainer className="space-y-4">
            {scheduledPosts.filter(p => p.status === 'draft').map((post) => (
              <StaggerItem key={post.id}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Badge variant="warning" className="mb-2">Draft</Badge>
                        <p className="text-sm">{post.content}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button size="sm">Schedule</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </TabPanel>

        {/* Published Tab */}
        <TabPanel tabId="published" activeTab={activeTab}>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Your published posts will appear here</p>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Calendar Tab */}
        <TabPanel tabId="calendar" activeTab={activeTab}>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Calendar view coming soon...</p>
            </CardContent>
          </Card>
        </TabPanel>
      </main>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={(id) => toast.dismiss(id)} />
    </div>
  );
}

export default App;
