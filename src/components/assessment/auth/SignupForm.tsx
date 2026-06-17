import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SignupForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { signup } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      await signup({
        email: form.email,
        password: form.password,
        firstName: form.first_name,
        lastName: form.last_name,
        phone: '',
        location: '',
        accountType: 'academic',
      } as any);
      toast.success('Account created! Welcome aboard.');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="signup-first">First Name</Label>
          <Input id="signup-first" placeholder="First name" value={form.first_name} onChange={e => update('first_name', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-last">Last Name</Label>
          <Input id="signup-last" placeholder="Last name" value={form.last_name} onChange={e => update('last_name', e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input id="signup-password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
      </div>
      <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={isLoading}>
        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account...</> : 'Create Account'}
      </Button>
    </form>
  );
};

export default SignupForm;
