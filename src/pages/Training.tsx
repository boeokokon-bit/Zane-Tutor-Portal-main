import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/Logo';
import { toast } from 'sonner';
import {
  GraduationCap, LogOut, BookOpen, Video, FileText, ExternalLink,
  Play, Users, Clock, ArrowLeft, Plus, Pencil, Trash2, Upload, Link as LinkIcon, Laptop
} from 'lucide-react';

interface TrainingItem {
  title: string;
  type: 'video' | 'doc';
  url: string;
}

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  items: TrainingItem[];
}

const DEFAULT_MODULES: TrainingModule[] = [
  {
    id: 'welcome', title: 'Welcome to Zane Tutors',
    description: 'Learn about our mission, values, and what makes a great Zane Tutor.',
    duration: '10 min read',
    items: [
      { title: 'Our Story & Mission', type: 'doc', url: '#' },
      { title: 'Meet the Team', type: 'video', url: '#' },
      { title: 'Tutor Code of Conduct', type: 'doc', url: '#' },
    ],
  },
  {
    id: 'class-delivery', title: 'Class Delivery Standards',
    description: 'How we expect classes to be conducted — online and in-person.',
    duration: '25 min',
    items: [
      { title: 'Setting Up Your Teaching Space', type: 'video', url: '#' },
      { title: 'Online Class Best Practices', type: 'video', url: '#' },
      { title: 'In-Person Class Guidelines', type: 'doc', url: '#' },
      { title: 'Hybrid Class Setup', type: 'doc', url: '#' },
    ],
  },
  {
    id: 'curriculum', title: 'Curriculum & Lesson Planning',
    description: 'Resources, templates, and guides for structuring your lessons.',
    duration: '20 min',
    items: [
      { title: 'Lesson Plan Template', type: 'doc', url: '#' },
      { title: 'Sample Lesson Plans by Subject', type: 'doc', url: '#' },
      { title: 'Assessment & Progress Tracking', type: 'doc', url: '#' },
      { title: 'Recommended Teaching Resources', type: 'doc', url: '#' },
    ],
  },
  {
    id: 'communication', title: 'Parent & Student Communication',
    description: 'How to maintain professional relationships and handle feedback.',
    duration: '15 min',
    items: [
      { title: 'Communication Guidelines', type: 'doc', url: '#' },
      { title: 'Handling Difficult Situations', type: 'video', url: '#' },
      { title: 'Progress Report Templates', type: 'doc', url: '#' },
    ],
  },
  {
    id: 'tools', title: 'Tools & Resources',
    description: 'Software, apps, and resources to enhance your teaching.',
    duration: '10 min',
    items: [
      { title: 'Recommended Apps & Software', type: 'doc', url: '#' },
      { title: 'Free Teaching Resources Library', type: 'doc', url: '#' },
      { title: 'Scheduling & Calendar Setup', type: 'video', url: '#' },
    ],
  },
];

export default function Training() {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState<TrainingModule[]>(() => {
    const saved = localStorage.getItem('zane_training_modules');
    return saved ? JSON.parse(saved) : DEFAULT_MODULES;
  });

  // Admin state
  const [moduleDialog, setModuleDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', duration: '' });
  const [itemDialog, setItemDialog] = useState<string | null>(null); // module id
  const [itemForm, setItemForm] = useState<TrainingItem>({ title: '', type: 'doc', url: '' });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const saveModules = (updated: TrainingModule[]) => {
    setModules(updated);
    localStorage.setItem('zane_training_modules', JSON.stringify(updated));
  };

  // Module CRUD
  const openAddModule = () => {
    setEditingModule(null);
    setModuleForm({ title: '', description: '', duration: '' });
    setModuleDialog(true);
  };

  const openEditModule = (mod: TrainingModule) => {
    setEditingModule(mod);
    setModuleForm({ title: mod.title, description: mod.description, duration: mod.duration });
    setModuleDialog(true);
  };

  const saveModule = () => {
    if (!moduleForm.title.trim()) { toast.error('Title is required'); return; }
    if (editingModule) {
      const updated = modules.map(m => m.id === editingModule.id
        ? { ...m, title: moduleForm.title, description: moduleForm.description, duration: moduleForm.duration }
        : m
      );
      saveModules(updated);
      toast.success('Module updated');
    } else {
      const newMod: TrainingModule = {
        id: Date.now().toString(),
        title: moduleForm.title,
        description: moduleForm.description,
        duration: moduleForm.duration || '—',
        items: [],
      };
      saveModules([...modules, newMod]);
      toast.success('Module added');
    }
    setModuleDialog(false);
  };

  const deleteModule = (id: string) => {
    saveModules(modules.filter(m => m.id !== id));
    toast.success('Module deleted');
  };

  // Item CRUD
  const openAddItem = (moduleId: string) => {
    setItemDialog(moduleId);
    setEditingItemIndex(null);
    setItemForm({ title: '', type: 'doc', url: '' });
  };

  const openEditItem = (moduleId: string, index: number) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    setItemDialog(moduleId);
    setEditingItemIndex(index);
    setItemForm(mod.items[index]);
  };

  const saveItem = () => {
    if (!itemDialog || !itemForm.title.trim()) { toast.error('Title is required'); return; }
    const updated = modules.map(m => {
      if (m.id !== itemDialog) return m;
      const items = [...m.items];
      if (editingItemIndex !== null) {
        items[editingItemIndex] = itemForm;
      } else {
        items.push(itemForm);
      }
      return { ...m, items };
    });
    saveModules(updated);
    toast.success(editingItemIndex !== null ? 'Resource updated' : 'Resource added');
    setItemDialog(null);
  };

  const deleteItem = (moduleId: string, index: number) => {
    const updated = modules.map(m => {
      if (m.id !== moduleId) return m;
      return { ...m, items: m.items.filter((_, i) => i !== index) };
    });
    saveModules(updated);
    toast.success('Resource removed');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const completedModules = 0;
  const totalModules = modules.length;
  const progress = totalModules ? Math.round((completedModules / totalModules) * 100) : 0;

  const iconForType = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4 text-primary" />;
      case 'doc': return <FileText className="w-4 h-4 text-blue-500" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo variant="chrome" imgClassName="w-8 h-8" textClassName="font-bold text-lg" />
            {isAdmin && <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>}
          </Link>
          <div className="flex items-center gap-3">
            {user && <span className="text-sm hidden sm:block">Hi, {user.firstName}!</span>}
            <Button variant="outline" size="sm" onClick={() => window.open('https://classes.zanetutors.com.ng', '_blank')} className="gap-1.5 hidden md:flex text-primary bg-background/90 hover:bg-background border-primary/20">
              <Laptop className="w-4 h-4" /> Go to LMS
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/login'); }} className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-2">
          <Link to={isAdmin ? '/admin' : '/tutor'} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {isAdmin ? 'Admin Dashboard' : 'Portal'}
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tutor Training Hub</h1>
            <p className="text-muted-foreground">Everything you need to deliver excellent classes as a Zane Tutor</p>
          </div>
          {isAdmin && (
            <Button onClick={openAddModule} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Module
            </Button>
          )}
        </div>

        {/* Progress Overview (tutor view) */}
        {!isAdmin && (
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="py-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">Your Training Progress</h3>
                  <p className="text-sm text-muted-foreground">{completedModules} of {totalModules} modules completed</p>
                </div>
                <Badge variant={progress === 100 ? 'default' : 'secondary'}>
                  {progress === 100 ? '✅ Complete' : `${progress}%`}
                </Badge>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Admin stats summary */}
        {isAdmin && (
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Content Overview</h3>
                  <p className="text-sm text-muted-foreground">Manage training modules and resources for all tutors</p>
                </div>
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold">{modules.length}</p>
                    <p className="text-xs text-muted-foreground">Modules</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{modules.reduce((a, m) => a + m.items.filter(i => i.type === 'video').length, 0)}</p>
                    <p className="text-xs text-muted-foreground">Videos</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{modules.reduce((a, m) => a + m.items.filter(i => i.type === 'doc').length, 0)}</p>
                    <p className="text-xs text-muted-foreground">Docs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats (tutor view) */}
        {!isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: BookOpen, label: 'Modules', value: totalModules.toString() },
              { icon: Video, label: 'Videos', value: modules.reduce((acc, m) => acc + m.items.filter(i => i.type === 'video').length, 0).toString() },
              { icon: FileText, label: 'Documents', value: modules.reduce((acc, m) => acc + m.items.filter(i => i.type === 'doc').length, 0).toString() },
              { icon: Clock, label: 'Total Time', value: '~80 min' },
            ].map((stat, i) => (
              <Card key={i} className="border-0 shadow">
                <CardContent className="py-4 text-center">
                  <stat.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Training Modules */}
        <div className="space-y-4">
          {modules.map((module, moduleIndex) => (
            <Card key={module.id} className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {moduleIndex + 1}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" /> {module.duration}
                    </Badge>
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModule(module)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteModule(module.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value={module.id} className="border-0">
                    <AccordionTrigger className="text-sm py-2">
                      View {module.items.length} resources
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {module.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <div className="flex items-center gap-3">
                              {iconForType(item.type)}
                              <span className="text-sm">{item.title}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {item.type === 'video' ? 'Video' : 'Doc'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              {item.url && item.url !== '#' ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                                    {item.type === 'video' ? <><Play className="w-3 h-3 mr-1" /> Watch</> : <><ExternalLink className="w-3 h-3 mr-1" /> Open</>}
                                  </Button>
                                </a>
                              ) : (
                                <Button variant="ghost" size="sm" className="h-7 text-xs" disabled>
                                  {item.type === 'video' ? <><Play className="w-3 h-3 mr-1" /> Watch</> : <><ExternalLink className="w-3 h-3 mr-1" /> Open</>}
                                </Button>
                              )}
                              {isAdmin && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditItem(module.id, i)}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem(module.id, i)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        {isAdmin && (
                          <Button variant="outline" size="sm" className="w-full mt-2 gap-1.5" onClick={() => openAddItem(module.id)}>
                            <Plus className="w-3.5 h-3.5" /> Add Resource
                          </Button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <Card className="border-0 shadow-lg mt-8">
          <CardContent className="py-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Have questions about training or class delivery? Reach out to our tutor support team.
            </p>
            <Button variant="outline">Contact Support</Button>
          </CardContent>
        </Card>
      </main>

      {/* ── Add/Edit Module Dialog ── */}
      <Dialog open={moduleDialog} onOpenChange={setModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Edit Module' : 'Add Training Module'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Module Title</Label>
              <Input value={moduleForm.title} onChange={e => setModuleForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Class Delivery Standards" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={moduleForm.description} onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of this module" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Estimated Duration</Label>
              <Input value={moduleForm.duration} onChange={e => setModuleForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 20 min" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialog(false)}>Cancel</Button>
            <Button onClick={saveModule}>{editingModule ? 'Save Changes' : 'Add Module'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add/Edit Resource Item Dialog ── */}
      <Dialog open={!!itemDialog} onOpenChange={(open) => !open && setItemDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItemIndex !== null ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resource Title</Label>
              <Input value={itemForm.title} onChange={e => setItemForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Online Class Best Practices" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={itemForm.type} onValueChange={(v: 'video' | 'doc') => setItemForm(p => ({ ...p, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video"><div className="flex items-center gap-2"><Video className="w-4 h-4" /> Video</div></SelectItem>
                  <SelectItem value="doc"><div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Document</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL / Link</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input value={itemForm.url} onChange={e => setItemForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." />
              </div>
              <p className="text-xs text-muted-foreground">Paste a link to a YouTube video, Google Doc, PDF, or any web resource</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog(null)}>Cancel</Button>
            <Button onClick={saveItem}>{editingItemIndex !== null ? 'Save Changes' : 'Add Resource'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}