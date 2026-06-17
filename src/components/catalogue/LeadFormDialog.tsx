import React, { useState, useEffect } from 'react';
import { TutorProfile } from '@/types/tutor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { catalogueApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { hasGuestConsented, recordGuestConsent } from '@/lib/consentUtils';
import { MessageSquare, Phone, User, Banknote, Loader2, Calendar, Mail } from 'lucide-react';

interface LeadFormDialogProps {
  tutor: TutorProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'contact' | 'offer';
}

export default function LeadFormDialog({ tutor, open, onOpenChange, type }: LeadFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [formData, setFormData] = useState({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    message: '',
    offerAmount: '',
  });

  // Auto-check consent if previously given for this email
  useEffect(() => {
    if (formData.parentEmail && hasGuestConsented(formData.parentEmail)) {
      setConsent(true);
    }
  }, [formData.parentEmail]);

  if (!tutor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parentName || !formData.parentEmail || !formData.parentPhone) {
      toast({
        title: "Missing fields",
        description: "Please provide your name, email, and phone number.",
        variant: "destructive",
      });
      return;
    }
    if (!consent) {
      toast({
        title: "Consent required",
        description: "Please agree to the Privacy Policy to proceed.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await catalogueApi.submitLead({
        tutorId: tutor.id,
        tutorName: `${tutor.firstName} ${tutor.lastName}`,
        ...formData
      });
      
      // Persist consent so it's not asked again for this email
      recordGuestConsent(formData.parentEmail);

      toast({
        title: "Offer Sent!",
        description: "We've received your inquiry and will get back to you shortly.",
      });
      
      onOpenChange(false);
      setFormData({ parentName: '', parentEmail: '', parentPhone: '', message: '', offerAmount: '' });
      setConsent(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send your offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'offer' ? <Banknote className="w-5 h-5 text-emerald-600" /> : <Calendar className="w-5 h-5 text-primary" />}
            {type === 'offer' ? 'Make an Offer' : 'Book Session'}
          </DialogTitle>
          <DialogDescription>
            {type === 'offer' 
              ? `Propose a rate to ${tutor.firstName} ${tutor.lastName}`
              : `Request a booking for ${tutor.firstName} ${tutor.lastName}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="parentName">Your Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="parentName"
                placeholder="John Doe"
                className="pl-9"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentEmail">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="parentEmail"
                type="email"
                placeholder="john@example.com"
                className="pl-9"
                value={formData.parentEmail}
                onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentPhone">Phone Number (WhatsApp preferred)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="parentPhone"
                placeholder="08012345678"
                className="pl-9"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
              />
            </div>
          </div>

          {type === 'offer' && (
            <div className="space-y-2">
              <Label htmlFor="offerAmount">Proposed Hourly Rate (₦)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-medium text-muted-foreground">₦</span>
                <Input
                  id="offerAmount"
                  type="number"
                  placeholder={tutor.hourlyRate.toString()}
                  className="pl-7"
                  value={formData.offerAmount}
                  onChange={(e) => setFormData({ ...formData, offerAmount: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">{type === 'offer' ? 'Your Message' : 'Booking Details (Subject, Child\'s Level, etc.)'}</Label>
            <Textarea
              id="message"
              placeholder={type === 'offer' 
                ? "I'd like to book sessions for my child..." 
                : "I need a Mathematics tutor for my daughter in JSS3. We prefer weekends..."
              }
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          {/* Privacy Consent */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(!!checked)}
              className="mt-0.5"
            />
            <Label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              I consent to Zane Tutors collecting and processing my personal data (name, email, phone, and inquiry details) for the purpose of responding to my booking request. I have read and agree to the{' '}
              <Link to="/privacy" target="_blank" className="text-primary underline">Privacy Policy</Link>.
            </Label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" className="w-full" disabled={loading || !consent}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === 'offer' ? 'Send Offer' : 'Request Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}