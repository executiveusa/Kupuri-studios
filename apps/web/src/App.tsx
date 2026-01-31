import { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  EcosystemPanel,
  BubbleSwitcher,
  defaultBubbles,
  UserMenu,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  useToast,
  ToastContainer,
  Modal,
  Tabs,
  TabPanel,
  Badge,
  Progress,
} from '@kupuri/ui';
import { motion } from 'motion/react';

function App() {
  const [currentBubble, setCurrentBubble] = useState('jaaz');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const { toasts, toast } = useToast();

  const mockUser = {
    id: '1',
    name: 'Creative Director',
    email: 'director@kupuri.studio',
    tokenBalance: 7500,
    plan: 'pro' as const,
  };

  const mockUsage = {
    jaaz: 2500,
    postiz: 1200,
    designer: 300,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500" />
              <span className="text-xl font-bold">Kupuri Studios</span>
            </motion.div>
            <BubbleSwitcher
              bubbles={defaultBubbles}
              currentBubble={currentBubble}
              onBubbleChange={setCurrentBubble}
            />
          </div>
          <UserMenu
            user={mockUser}
            onLogout={() => toast.info('Logging out...', 'Goodbye!')}
            onSettings={() => setShowModal(true)}
            onBilling={() => toast.info('Opening billing...')}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <EcosystemPanel
              currentBubble={currentBubble}
              tokenBalance={mockUser.tokenBalance}
              tokenUsage={mockUsage}
              onBubbleChange={setCurrentBubble}
              onRecharge={() => toast.info('Opening token store...')}
            />
          </aside>

          {/* Main Panel */}
          <div className="space-y-8">
            {/* Welcome Section */}
            <FadeIn>
              <div className="rounded-xl bg-kupuri-radial border p-8">
                <h1 className="text-3xl font-bold">
                  Welcome to {currentBubble === 'jaaz' ? 'JAAZ' : currentBubble.toUpperCase()}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {currentBubble === 'jaaz' && 'Create stunning AI-powered videos in minutes'}
                  {currentBubble === 'postiz' && 'Automate your social media presence'}
                  {currentBubble === 'designer' && 'Design beautiful graphics with AI'}
                  {currentBubble === 'analytics' && 'Track and analyze your performance'}
                </p>
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="kupuri"
                    onClick={() => toast.success('Creating new project!')}
                  >
                    New Project
                  </Button>
                  <Button variant="outline">
                    View Templates
                  </Button>
                </div>
              </div>
            </FadeIn>

            {/* Tabs Navigation */}
            <Tabs
              tabs={[
                { id: 'projects', label: 'Projects' },
                { id: 'recent', label: 'Recent' },
                { id: 'templates', label: 'Templates' },
                { id: 'analytics', label: 'Analytics' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="underline"
            />

            {/* Tab Content */}
            <TabPanel tabId="projects" activeTab={activeTab}>
              <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <StaggerItem key={i}>
                    <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant={i === 1 ? 'jaaz' : i === 2 ? 'postiz' : 'default'}>
                            {i === 1 ? 'JAAZ' : i === 2 ? 'POSTIZ' : 'Draft'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">2 days ago</span>
                        </div>
                        <CardTitle className="mt-2">Project {i}</CardTitle>
                        <CardDescription>
                          A creative project showcasing the power of AI
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span>{i * 15}%</span>
                          </div>
                          <Progress value={i * 15} variant="gradient" />
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </TabPanel>

            <TabPanel tabId="recent" activeTab={activeTab}>
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Your recent activity will appear here</p>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel tabId="templates" activeTab={activeTab}>
              <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {['Product Demo', 'Social Reel', 'Explainer', 'Testimonial'].map((template, i) => (
                  <StaggerItem key={i}>
                    <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="aspect-video rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 mb-4" />
                        <h3 className="font-medium">{template}</h3>
                        <p className="text-sm text-muted-foreground">
                          Quick start template
                        </p>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </TabPanel>

            <TabPanel tabId="analytics" activeTab={activeTab}>
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Your ecosystem metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Total Projects</p>
                      <p className="text-3xl font-bold">24</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Tokens Used</p>
                      <p className="text-3xl font-bold">4,200</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Active Agents</p>
                      <p className="text-3xl font-bold">3</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabPanel>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Settings"
        description="Manage your Kupuri Studios preferences"
        size="lg"
      >
        <div className="space-y-4">
          <p>Settings panel coming soon...</p>
          <Button onClick={() => setShowModal(false)}>Close</Button>
        </div>
      </Modal>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={(id) => toast.dismiss(id)} />
    </div>
  );
}

export default App;
